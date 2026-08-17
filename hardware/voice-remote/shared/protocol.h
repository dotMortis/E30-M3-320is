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
// forces a RELEASE regardless of the physical switch state. Protects the
// battery if the switch ever sticks. Independent from (and tighter than) the
// 30s safety auto-stop timer on the plugin side.
//
// NOTE: hitting this cutoff must NOT immediately deep-sleep - see
// remote/src/main.cpp's sleepUntilButtonIdle(). Arming the level-triggered
// GPIO wake source while the button is still held wakes the chip again
// instantly, spinning it in a full-power boot loop that drains the pack far
// faster than simply staying awake would - the exact opposite of what this
// cutoff is for.
#define VOICE_REMOTE_MAX_AWAKE_MS 20000

// While waiting for a stuck/held button to be let go, poll it this often.
#define VOICE_REMOTE_STUCK_POLL_MS 50

// Give up waiting for a stuck button after this long and sleep on a *timer*
// instead of the (still-asserted) level wake, re-checking periodically.
#define VOICE_REMOTE_STUCK_WAIT_MS 10000

// How long to sleep before re-checking a button that never went HIGH. Long
// enough to be effectively idle current, short enough that the remote
// recovers by itself once the switch frees up.
#define VOICE_REMOTE_STUCK_RECHECK_US (5ULL * 60ULL * 1000000ULL)

// How often the receiver announces itself over USB serial while idle, so the
// PC-side bridge can (re)identify the port at any time, not just at boot.
// The bridge derives its identify window from this - keep them in sync
// (bridge/main.go's heartbeatEvery).
#define VOICE_REMOTE_HEARTBEAT_MS 5000

enum VoiceRemoteEvent : uint8_t {
  VOICE_REMOTE_EVENT_PRESS = 1,
  VOICE_REMOTE_EVENT_RELEASE = 2,
};

// Wire struct sent as the ESP-NOW payload (esp_now's own PMK/LMK AES-CCM
// encryption wraps this whole struct - see secrets.h.example).
//
// Replay protection is a two-part sequence: `bootEpoch` is bumped once per
// remote wake and persisted in NVS, and `counter` numbers the packets within
// that one wake (PRESS=1, RELEASE=2) and lives in RAM only. The receiver
// accepts a packet only if (bootEpoch, counter) is strictly greater than the
// last pair it accepted. This is our defense against ESP-NOW's own
// weak/known-vulnerable replay protection (see PLAN.md's "Security" section).
//
// Why an epoch rather than one long-lived counter:
//   - The remote no longer has to persist anything per packet, only once per
//     wake, halving NVS wear on a battery device.
//   - A remote that loses power mid-sequence cannot resume with a counter the
//     receiver has already seen, because its epoch is always fresh.
//   - The receiver can treat its own stored epoch as fully consumed on boot
//     (see receiver/src/main.cpp), so a packet captured before a receiver
//     restart can never be replayed into it afterwards.
// Wiping the *remote's* NVS still resets its epoch to 1, which the receiver
// rejects by design - recovery is the receiver's explicit BOOT-button reset
// gesture, not an automatic "accept a lower sequence" rule (that would hand
// replay attacks exactly the opening the counter exists to close). See
// PLAN.md "Re-pairing after an NVS wipe".
typedef struct __attribute__((packed)) {
  uint8_t magic[4];    // {'V','R','0','2'} - protocol/version tag
  uint32_t bootEpoch;  // bumped once per wake, persisted in NVS on the remote
  uint32_t counter;    // packet number within this epoch (RAM only)
  uint8_t deviceId;    // which physical remote (future-proofing for >1 remote)
  uint8_t event;       // VoiceRemoteEvent
} voice_remote_packet_t;

// Bumped from 'VR01' to 'VR02' when bootEpoch was added: a VR01 remote's
// packets have a different length and layout, so they must be rejected
// outright rather than silently misparsed. Reflash BOTH boards together.
#define VOICE_REMOTE_MAGIC_0 'V'
#define VOICE_REMOTE_MAGIC_1 'R'
#define VOICE_REMOTE_MAGIC_2 '0'
#define VOICE_REMOTE_MAGIC_3 '2'

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

// True when (epoch, counter) is strictly newer than (lastEpoch, lastCounter).
inline bool voiceRemoteIsNewer(uint32_t lastEpoch, uint32_t lastCounter, uint32_t epoch, uint32_t counter) {
  if (epoch != lastEpoch) return epoch > lastEpoch;
  return counter > lastCounter;
}
