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
//
// Only PRESS/RELEASE lines that passed magic + device-id + replay-counter
// validation are ever printed - the PC-side bridge does not need to repeat
// any of that logic, it just forwards these lines verbatim.

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

static const uint8_t LED_PIN = 8;      // onboard LED on the SuperMini, active-low
static const uint8_t REMOTE_MAC[6] = VOICE_REMOTE_REMOTE_MAC;
static const uint8_t PMK[16] = VOICE_REMOTE_PMK;
static const uint8_t LMK[16] = VOICE_REMOTE_LMK;

static Preferences prefs;
static uint32_t lastCounter = 0;
static unsigned long lastHeartbeatMs = 0;

struct QueueItem {
  uint8_t event;
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
  item.counter = pkt.counter;
  item.macMatch = mac_addr != nullptr && memcmp(mac_addr, REMOTE_MAC, 6) == 0;
  xQueueSend(eventQueue, &item, 0);
}

static void setupEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
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
  lastCounter = prefs.getUInt("lastCtr", 0);

  eventQueue = xQueueCreate(8, sizeof(QueueItem));

  setupEspNow();

  Serial.println("HELLO VOICE-REMOTE-RX v1");
  Serial.print("MAC ");
  Serial.println(WiFi.macAddress());
  lastHeartbeatMs = millis();
  blinkLed(30);
}

void loop() {
  QueueItem item;
  if (xQueueReceive(eventQueue, &item, 0) == pdTRUE) {
    if (!item.macMatch) {
      // Not our paired remote's MAC - ignore silently (could be noise, a
      // misconfigured device, or a spoofing attempt; either way, dropping
      // it is the correct behavior).
    } else if (item.counter <= lastCounter) {
      Serial.println("ERR replay-rejected");
    } else {
      lastCounter = item.counter;
      prefs.putUInt("lastCtr", lastCounter);
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
