// Voice-remote RECEIVER (ESP32 #1)
//
// Always on, USB-powered. Never sleeps. Only uses Wi-Fi (ESP-NOW RX, fixed
// channel, no AP association) + native USB CDC serial - deliberately no BLE
// at all, so there is no radio-coexistence risk on this device (see
// ../PLAN.md "Why no BLE" for the full reasoning).
//
// Serial protocol (one line per message, "\n"-terminated, 115200 8N1):
//   HELLO VOICE-REMOTE-RX v1        - sent once, right after boot
//   HB VOICE-REMOTE-RX v1 <millis>  - heartbeat, every VOICE_REMOTE_HEARTBEAT_MS
//   PRESS                           - validated press event from the remote
//   RELEASE                         - validated release event from the remote
//   ERR <reason>                    - device-level complaint (NOT a link error;
//                                     the bridge forwards these as "warning")
//
// Only PRESS/RELEASE lines that passed magic + device-id + replay-sequence
// validation are ever printed - the PC-side bridge does not need to repeat
// any of that logic, it just forwards these lines verbatim.
//
// Re-pairing: hold the BOOT button (GPIO9) while powering up / resetting this
// board to clear the stored replay sequence. That is the recovery path for a
// remote whose NVS was wiped (its epoch restarts at 1, which is correctly
// rejected as a replay otherwise) - see ../PLAN.md "Re-pairing after an NVS
// wipe". Physical access to the receiver is already the trust boundary here,
// so a physical gesture is the right shape for this; automatically accepting a
// lower sequence would reopen the replay hole the sequence exists to close.

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <Preferences.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

#include "protocol.h"
#include "secrets.h"

#if defined(VOICE_REMOTE_WIFI_CHANNEL_OVERRIDE)
#undef VOICE_REMOTE_WIFI_CHANNEL
#define VOICE_REMOTE_WIFI_CHANNEL VOICE_REMOTE_WIFI_CHANNEL_OVERRIDE
#endif

static const uint8_t LED_PIN = 8;    // onboard LED on the SuperMini, active-low
static const uint8_t BOOT_PIN = 9;   // onboard BOOT button, used as the re-pair gesture
static const uint8_t REMOTE_MAC[6] = VOICE_REMOTE_REMOTE_MAC;
static const uint8_t PMK[16] = VOICE_REMOTE_PMK;
static const uint8_t LMK[16] = VOICE_REMOTE_LMK;

static Preferences prefs;
static uint32_t lastEpoch = 0;
// Deliberately starts at "everything in lastEpoch is already used up": on our
// own reboot we must not accept a packet from an epoch we previously served,
// or a packet captured before the reboot could be replayed into us afterwards.
// The remote bumps its epoch on every wake, so the very next real press passes
// this anyway.
static uint32_t lastCounter = UINT32_MAX;
static unsigned long lastHeartbeatMs = 0;

struct QueueItem {
  uint8_t event;
  uint32_t bootEpoch;
  uint32_t counter;
  bool macMatch;
};

static QueueHandle_t eventQueue;

static void ledOn() { digitalWrite(LED_PIN, LOW); }
static void ledOff() { digitalWrite(LED_PIN, HIGH); }

static void blinkLed(uint16_t ms) {
  ledOn();
  delay(ms);
  ledOff();
}

// Runs on the Wi-Fi/ESP-NOW task, not the main loop - keep this fast and
// push everything else (Serial output, NVS writes) to loop() via the queue.
//
// NOTE: this is the legacy (mac_addr, data, len) callback signature used by
// arduino-esp32 2.x cores (ESP-IDF 4.x underneath) - the ESP-NOW receive
// callback signature changed to take an esp_now_recv_info_t* on newer
// arduino-esp32 3.x cores (ESP-IDF 5.x underneath). If you're on a 3.x core,
// switch this to `const esp_now_recv_info_t *info` and use `info->src_addr`
// instead of `mac_addr` below.
static void onDataRecv(const uint8_t *mac_addr, const uint8_t *data, int len) {
  if (len != sizeof(voice_remote_packet_t)) return;
  voice_remote_packet_t pkt;
  memcpy(&pkt, data, sizeof(pkt));
  if (!voiceRemoteMagicValid(pkt)) return;
  if (pkt.deviceId != VOICE_REMOTE_DEVICE_ID) return;

  QueueItem item;
  item.event = pkt.event;
  item.bootEpoch = pkt.bootEpoch;
  item.counter = pkt.counter;
  item.macMatch = mac_addr != nullptr && memcmp(mac_addr, REMOTE_MAC, 6) == 0;
  if (eventQueue != nullptr) xQueueSend(eventQueue, &item, 0);
}

static void setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  // Modem sleep would let the radio doze between beacons and silently drop
  // ESP-NOW frames aimed at us; this device is mains-powered, so keep the
  // receiver hot.
  WiFi.setSleep(false);
  esp_wifi_set_channel(VOICE_REMOTE_WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ERR esp_now_init failed");
    return;
  }
  esp_now_set_pmk(PMK);
  esp_now_register_recv_cb(onDataRecv);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, REMOTE_MAC, 6);
  peer.channel = VOICE_REMOTE_WIFI_CHANNEL;
  peer.ifidx = WIFI_IF_STA;
  peer.encrypt = true;
  memcpy(peer.lmk, LMK, 16);
  if (esp_now_add_peer(&peer) != ESP_OK) {
    Serial.println("ERR esp_now_add_peer failed");
  }
}

// BOOT held at startup = "forget the paired remote's sequence". See the file
// header for why this is a physical gesture rather than an automatic rule.
static bool repairGestureHeld() {
  pinMode(BOOT_PIN, INPUT_PULLUP);
  for (uint8_t i = 0; i < 10; i++) {
    if (digitalRead(BOOT_PIN) != LOW) return false;
    delay(50);
  }
  return true;
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  ledOff();

  Serial.begin(115200);
  // Native USB CDC needs a short grace period to enumerate before the first
  // writes are reliably captured by a host that was already watching the
  // port; harmless if nobody's listening yet.
  unsigned long start = millis();
  while (!Serial && millis() - start < 3000) delay(10);

  prefs.begin("vremote-rx", false);
  const bool repair = repairGestureHeld();
  if (repair) {
    prefs.remove("lastEpoch");
    lastEpoch = 0;
    lastCounter = 0;  // accept the next packet from any epoch, including 1
  } else {
    lastEpoch = prefs.getUInt("lastEpoch", 0);
  }

  eventQueue = xQueueCreate(8, sizeof(QueueItem));
  if (eventQueue == nullptr) Serial.println("ERR event queue alloc failed");

  setupEspNow();

  Serial.println("HELLO VOICE-REMOTE-RX v1");
  Serial.print("MAC ");
  Serial.println(WiFi.macAddress());
  if (repair) Serial.println("ERR replay-state-cleared");
  lastHeartbeatMs = millis();
  blinkLed(30);
}

void loop() {
  QueueItem item;
  if (eventQueue != nullptr && xQueueReceive(eventQueue, &item, 0) == pdTRUE) {
    if (!item.macMatch) {
      // Not our paired remote's MAC - ignore silently (could be noise, a
      // misconfigured device, or a spoofing attempt; either way, dropping
      // it is the correct behavior).
    } else if (!voiceRemoteIsNewer(lastEpoch, lastCounter, item.bootEpoch, item.counter)) {
      // Almost always a duplicate of a packet we already accepted: the remote
      // re-sends the same (epoch, counter) when an ack is lost, on purpose.
      // That is expected traffic, so drop it silently instead of reporting an
      // error the PC side would have to interpret. Only a genuinely older
      // epoch is worth flagging, since that means the remote's NVS was wiped
      // and re-pairing is needed (BOOT button - see the file header).
      if (item.bootEpoch < lastEpoch) Serial.println("ERR stale-epoch-repair-needed");
    } else {
      const bool newEpoch = item.bootEpoch != lastEpoch;
      lastEpoch = item.bootEpoch;
      lastCounter = item.counter;
      // One NVS write per press cycle instead of one per packet: only the
      // epoch has to survive a power cut, the in-epoch counter does not.
      if (newEpoch) prefs.putUInt("lastEpoch", lastEpoch);
      if (item.event == VOICE_REMOTE_EVENT_PRESS) {
        Serial.println("PRESS");
      } else if (item.event == VOICE_REMOTE_EVENT_RELEASE) {
        Serial.println("RELEASE");
      }
      blinkLed(15);
    }
  }

  unsigned long now = millis();
  if (now - lastHeartbeatMs >= VOICE_REMOTE_HEARTBEAT_MS) {
    lastHeartbeatMs = now;
    Serial.print("HB VOICE-REMOTE-RX v1 ");
    Serial.println(now);
  }
}
