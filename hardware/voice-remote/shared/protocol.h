#pragma once
// Shared ESP-NOW wire protocol for the voice-remote project. Included by both
// remote/src/main.cpp (ESP32 #2, battery button) and receiver/src/main.cpp
// (ESP32 #1, always-on USB receiver). Keep both firmwares built from the exact
// same version of this file - the packet layout must match byte-for-byte.
//
// See ../PLAN.md for the full design rationale.

#include <stdint.h>

// Fixed Wi-Fi channel used for ESP-NOW. Both devices sit in bare WIFI_STA mode
// without ever associating to an access point, so there is no channel
// negotiation - it must simply match on both ends. Override in secrets.h if
// channel 6 is unusually congested in your environment.
#ifndef VOICE_REMOTE_WIFI_CHANNEL
#define VOICE_REMOTE_WIFI_CHANNEL 6
#endif

// Maximum time (ms) the remote stays awake after a button press before it
// forces a RELEASE + deep sleep regardless of the physical switch state.
// Protects the battery if the switch ever sticks. Independent from (and
// tighter than) the 30s safety auto-stop timer on the plugin side.
#define VOICE_REMOTE_MAX_AWAKE_MS 20000

// How often the receiver announces itself over USB serial while idle, so the
// PC-side bridge can (re)identify the port at any time, not just at boot.
#define VOICE_REMOTE_HEARTBEAT_MS 5000

enum VoiceRemoteEvent : uint8_t {
  VOICE_REMOTE_EVENT_PRESS = 1,
  VOICE_REMOTE_EVENT_RELEASE = 2,
};

// Wire struct sent as the ESP-NOW payload (esp_now's own PMK/LMK AES-CCM
// encryption wraps this whole struct - see secrets.h.example). `counter` is
// monotonic and persisted in NVS on both ends; the receiver rejects any
// packet whose counter is not strictly greater than the last one it accepted
// from that device, which is our defense against ESP-NOW's own weak/known-
// vulnerable replay protection (see PLAN.md's "Security" section).
typedef struct __attribute__((packed)) {
  uint8_t magic[4];   // {'V','R','0','1'} - protocol/version tag
  uint32_t counter;   // strictly increasing per device, persisted in NVS
  uint8_t deviceId;   // which physical remote (future-proofing for >1 remote)
  uint8_t event;      // VoiceRemoteEvent
} voice_remote_packet_t;

#define VOICE_REMOTE_MAGIC_0 'V'
#define VOICE_REMOTE_MAGIC_1 'R'
#define VOICE_REMOTE_MAGIC_2 '0'
#define VOICE_REMOTE_MAGIC_3 '1'

inline bool voiceRemoteMagicValid(const voice_remote_packet_t &pkt) {
  return pkt.magic[0] == VOICE_REMOTE_MAGIC_0 && pkt.magic[1] == VOICE_REMOTE_MAGIC_1 &&
         pkt.magic[2] == VOICE_REMOTE_MAGIC_2 && pkt.magic[3] == VOICE_REMOTE_MAGIC_3;
}

inline void voiceRemoteSetMagic(voice_remote_packet_t &pkt) {
  pkt.magic[0] = VOICE_REMOTE_MAGIC_0;
  pkt.magic[1] = VOICE_REMOTE_MAGIC_1;
  pkt.magic[2] = VOICE_REMOTE_MAGIC_2;
  pkt.magic[3] = VOICE_REMOTE_MAGIC_3;
}
