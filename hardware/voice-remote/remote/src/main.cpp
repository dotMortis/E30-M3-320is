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
// Hard safety cutoff: if the switch is ever stuck/debris-jammed, the remote
// forces a RELEASE + sleep after VOICE_REMOTE_MAX_AWAKE_MS regardless, so a
// stuck button drains the battery for at most ~20s per stuck press rather
// than indefinitely.

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
static uint32_t counter = 0;

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

static void setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(VOICE_REMOTE_WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  esp_now_init();
  esp_now_set_pmk(PMK);
  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, RECEIVER_MAC, 6);
  peer.channel = VOICE_REMOTE_WIFI_CHANNEL;
  peer.ifidx = WIFI_IF_STA;
  peer.encrypt = true;
  memcpy(peer.lmk, LMK, 16);
  esp_now_add_peer(&peer);
}

static void teardownEspNow() {
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
  voice_remote_packet_t pkt = {};
  voiceRemoteSetMagic(pkt);
  pkt.deviceId = VOICE_REMOTE_DEVICE_ID;
  pkt.event = event;
  counter++;
  pkt.counter = counter;
  prefs.putUInt("counter", counter);

  bool ok = sendWithRetry(pkt, 5, 40);
  blinkLed(ok ? 15 : 200);  // a long flash on total failure is a deliberate bench-debugging signal
}

static void armWakeSourceAndSleep() {
  // esp_deep_sleep_enable_gpio_wakeup() configures the pin's pull resistor
  // itself (internally, right before sleeping) to match the wakeup mode - no
  // manual rtc_gpio_* setup needed or even available on ESP32-C3, whose RTC
  // IO pins don't expose the classic rtc_gpio_init/rtc_gpio_pullup_en API
  // surface that original ESP32 has (SOC_RTCIO_INPUT_OUTPUT_SUPPORTED is 0
  // here - confirmed against the installed arduino-esp32 2.x/ESP-IDF 4.x
  // core; driver/rtc_io.h's functions are compiled out entirely for this
  // target).
  esp_deep_sleep_enable_gpio_wakeup(1ULL << BUTTON_PIN, ESP_GPIO_WAKEUP_GPIO_LOW);
  esp_deep_sleep_start();
  // unreachable - esp_deep_sleep_start() never returns, it resets the chip.
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  ledOff();
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Serial.begin(115200);
  // Only matters on the bench with USB attached for provisioning/debugging -
  // do not block meaningfully waiting for a host that isn't there in the field.
  unsigned long serialWaitStart = millis();
  while (!Serial && millis() - serialWaitStart < 1500) delay(10);

  prefs.begin("vremote-tx", false);
  counter = prefs.getUInt("counter", 0);

  bool pressed = digitalRead(BUTTON_PIN) == LOW;

  setupEspNow();
  Serial.print("MAC ");
  Serial.println(WiFi.macAddress());

  if (pressed) {
    sendEvent(VOICE_REMOTE_EVENT_PRESS);

    unsigned long awakeSince = millis();
    uint8_t stableHighCount = 0;
    while (millis() - awakeSince < VOICE_REMOTE_MAX_AWAKE_MS) {
      if (digitalRead(BUTTON_PIN) == HIGH) {
        stableHighCount++;
        if (stableHighCount >= 3) break;  // debounced release
      } else {
        stableHighCount = 0;
      }
      delay(15);
    }

    sendEvent(VOICE_REMOTE_EVENT_RELEASE);
  }
  // else: cold boot / spurious wake without the button actually held down -
  // nothing to send, just re-arm and sleep (still useful to have printed the
  // MAC above for provisioning).

  teardownEspNow();
  armWakeSourceAndSleep();
}

void loop() {
  // Never reached: setup() always ends in deep sleep, which resets the chip.
}
