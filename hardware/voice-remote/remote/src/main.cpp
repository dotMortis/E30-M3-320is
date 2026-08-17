// Voice-remote REMOTE (ESP32 #2)
//
// Battery-powered (3xAA via the SuperMini's 5V/VIN pin). Deep sleep by
// default; wakes only when the momentary switch on GPIO3 is pressed, sends
// an encrypted+authenticated ESP-NOW PRESS, waits (debounced) for release,
// sends RELEASE, and goes straight back to sleep. See ../PLAN.md.
//
// Wiring: momentary switch between GPIO3 and GND. GPIO3 is one of the C3's
// RTC-capable pins (GPIO0-5) required for deep-sleep GPIO wakeup, and is not
// a strapping pin (unlike GPIO2/8/9) - see PLAN.md "Pin choice".
//
// Latency matters here: everything between the wake and the PRESS packet is
// time the user is already talking into a recorder that hasn't started yet.
// So the ordering in setup() is deliberately: read the wake cause -> bring up
// ESP-NOW -> send PRESS -> only then bother with USB serial (which is purely
// a bench/provisioning convenience and is skipped entirely on a GPIO wake).
//
// Safety cutoff: if the switch is ever stuck/debris-jammed, the remote sends
// RELEASE after VOICE_REMOTE_MAX_AWAKE_MS and then waits for the switch to
// actually go idle before re-arming the level-triggered wake source - see
// sleepUntilButtonIdle() for why sleeping while it is still held would be
// actively harmful.

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_sleep.h>
#include <Preferences.h>

#include "protocol.h"
#include "secrets.h"

#if defined(VOICE_REMOTE_WIFI_CHANNEL_OVERRIDE)
#undef VOICE_REMOTE_WIFI_CHANNEL
#define VOICE_REMOTE_WIFI_CHANNEL VOICE_REMOTE_WIFI_CHANNEL_OVERRIDE
#endif

static const gpio_num_t BUTTON_PIN = GPIO_NUM_3;
static const uint8_t LED_PIN = 8;  // onboard LED on the SuperMini, active-low
static const uint8_t RECEIVER_MAC[6] = VOICE_REMOTE_RECEIVER_MAC;
static const uint8_t PMK[16] = VOICE_REMOTE_PMK;
static const uint8_t LMK[16] = VOICE_REMOTE_LMK;

static Preferences prefs;
static uint32_t bootEpoch = 0;
// Packet number within this wake only - PRESS is 1, RELEASE is 2. Never
// persisted: the epoch above is what makes the sequence globally monotonic.
static uint32_t counter = 0;
static bool espNowReady = false;

static volatile bool sendCbFired = false;
static volatile bool sendCbSuccess = false;

static void ledOn() { digitalWrite(LED_PIN, LOW); }
static void ledOff() { digitalWrite(LED_PIN, HIGH); }
static void blinkLed(uint16_t ms) {
  ledOn();
  delay(ms);
  ledOff();
}

static void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  (void)mac_addr;
  sendCbSuccess = (status == ESP_NOW_SEND_SUCCESS);
  sendCbFired = true;
}

// Returns false if the radio could not be brought up at all, so a hardware or
// configuration failure is distinguishable from "receiver out of range"
// instead of both just looking like a failed send.
static bool setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(VOICE_REMOTE_WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) return false;
  if (esp_now_set_pmk(PMK) != ESP_OK) return false;
  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, RECEIVER_MAC, 6);
  peer.channel = VOICE_REMOTE_WIFI_CHANNEL;
  peer.ifidx = WIFI_IF_STA;
  peer.encrypt = true;
  memcpy(peer.lmk, LMK, 16);
  if (esp_now_add_peer(&peer) != ESP_OK) return false;
  return true;
}

static void teardownEspNow() {
  if (!espNowReady) return;
  esp_now_deinit();
  WiFi.mode(WIFI_OFF);
}

// Same logical event (fixed counter) is retried as-is on failure - retries
// must NOT bump the counter, or a single lost ack would burn through several
// counter values and could look like a gap/replay downstream.
static bool sendWithRetry(const voice_remote_packet_t &pkt, uint8_t maxAttempts, uint16_t attemptTimeoutMs) {
  for (uint8_t attempt = 0; attempt < maxAttempts; attempt++) {
    sendCbFired = false;
    sendCbSuccess = false;
    esp_now_send(RECEIVER_MAC, reinterpret_cast<const uint8_t *>(&pkt), sizeof(pkt));
    unsigned long start = millis();
    while (!sendCbFired && millis() - start < attemptTimeoutMs) delay(2);
    if (sendCbFired && sendCbSuccess) return true;
  }
  return false;
}

static void sendEvent(uint8_t event) {
  if (!espNowReady) {
    blinkLed(600);  // long solid flash: radio never came up (not a range problem)
    return;
  }
  voice_remote_packet_t pkt = {};
  voiceRemoteSetMagic(pkt);
  pkt.deviceId = VOICE_REMOTE_DEVICE_ID;
  pkt.event = event;
  pkt.bootEpoch = bootEpoch;
  pkt.counter = ++counter;

  bool ok = sendWithRetry(pkt, 5, 40);
  blinkLed(ok ? 15 : 200);  // a long flash on total failure is a deliberate bench-debugging signal
}

static bool buttonPressed() { return digitalRead(BUTTON_PIN) == LOW; }

/**
 * Deep-sleeps, but only once the button is actually idle.
 *
 * esp_deep_sleep_enable_gpio_wakeup() arms a *level* trigger, so entering deep
 * sleep while the pin still reads LOW satisfies the wake condition
 * immediately: the chip reboots, sends another PRESS, waits out the 20s
 * cutoff, and repeats forever at full power. A stuck switch would therefore
 * drain the pack continuously and spam the plugin with recordings - so wait
 * for a debounced HIGH first, and if it never comes, sleep on a timer instead
 * and re-check later.
 */
static void sleepUntilButtonIdle() {
  unsigned long waitStart = millis();
  uint8_t stableHighCount = 0;
  while (millis() - waitStart < VOICE_REMOTE_STUCK_WAIT_MS) {
    if (!buttonPressed()) {
      if (++stableHighCount >= 3) {
        esp_deep_sleep_enable_gpio_wakeup(1ULL << BUTTON_PIN, ESP_GPIO_WAKEUP_GPIO_LOW);
        esp_deep_sleep_start();
        return;  // unreachable - deep sleep resets the chip
      }
    } else {
      stableHighCount = 0;
    }
    delay(VOICE_REMOTE_STUCK_POLL_MS);
  }

  // Still held: a level wake would fire instantly, so use a timer wake and
  // re-evaluate after a long nap. On the next boot the button either got
  // released (normal wake path resumes) or we land right back here.
  esp_sleep_enable_timer_wakeup(VOICE_REMOTE_STUCK_RECHECK_US);
  esp_deep_sleep_start();
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  ledOff();
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  const esp_sleep_wakeup_cause_t wakeCause = esp_sleep_get_wakeup_cause();
  // A GPIO wake *is* the press: the only thing wired to that wake source is
  // the button. Do not re-read the pin to decide - the pin says nothing about
  // whether a press happened, only whether it is still held right now, so a
  // short tap would be dropped entirely while we were still booting.
  const bool pressed = (wakeCause == ESP_SLEEP_WAKEUP_GPIO) || buttonPressed();
  // Only a real power-on/reset is a provisioning run. A timer wake (the
  // stuck-button recheck below) must not pay the USB-serial wait either.
  const bool coldBoot = wakeCause != ESP_SLEEP_WAKEUP_GPIO && wakeCause != ESP_SLEEP_WAKEUP_TIMER;

  prefs.begin("vremote-tx", false);
  // One NVS write per wake (instead of one per packet): the in-epoch counter
  // lives in RAM, so this is the only thing that has to survive a power cut.
  bootEpoch = prefs.getUInt("epoch", 0) + 1;
  prefs.putUInt("epoch", bootEpoch);

  espNowReady = setupEspNow();

  if (pressed) {
    // Send first, talk to USB later - see the file header on latency.
    sendEvent(VOICE_REMOTE_EVENT_PRESS);

    unsigned long awakeSince = millis();
    uint8_t stableHighCount = 0;
    while (millis() - awakeSince < VOICE_REMOTE_MAX_AWAKE_MS) {
      if (!buttonPressed()) {
        stableHighCount++;
        if (stableHighCount >= 3) break;  // debounced release
      } else {
        stableHighCount = 0;
      }
      delay(15);
    }

    sendEvent(VOICE_REMOTE_EVENT_RELEASE);
  } else if (coldBoot) {
    // Provisioning run: no press to report, but this is exactly when someone
    // is watching the serial monitor for the MAC address, so it is worth
    // waiting for a USB host here (and only here).
    Serial.begin(115200);
    unsigned long serialWaitStart = millis();
    while (!Serial && millis() - serialWaitStart < 1500) delay(10);
    Serial.print("MAC ");
    Serial.println(WiFi.macAddress());
    Serial.print("EPOCH ");
    Serial.println(bootEpoch);
    if (!espNowReady) Serial.println("ERR esp_now setup failed");
    delay(50);  // let the CDC buffer drain before the chip resets into sleep
  }

  teardownEspNow();
  sleepUntilButtonIdle();
}

void loop() {
  // Never reached: setup() always ends in deep sleep, which resets the chip.
}
