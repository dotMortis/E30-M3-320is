# Plan: Hardware Voice Remote for the RAG Chat Voice Recorder

## Goal

A small battery-powered wireless button that starts/stops the same voice-recording
flow as the mic button / `Ctrl+Alt+Shift+F12` hotkey in the `rag-chat` Obsidian
plugin (`.obsidian/plugins/rag-chat/`) - useful for hands-free note dictation while
working under the car.

Two ESP32-C3 boards:

- **Remote** (`remote/`) - battery-powered (3xAA), one momentary switch, deep sleep
  by default. Wakes on button press, sends an encrypted+authenticated signal, sends
  a release signal when the button is let go, goes back to sleep.
- **Receiver** (`receiver/`) - USB-powered, always on. Listens for the remote's
  signal and forwards validated press/release events to the PC over USB serial.

A small Go program (`bridge/`) on the PC reads that serial link and feeds
press/release events directly into the Obsidian plugin, which calls the exact same
`startVoiceRecording()` / `stopVoiceRecordingAndSend()` methods the physical mic
button and hotkey already use.

## Confirmed decisions

- **No BLE anywhere in this design.** ESP32-C3 cannot do native USB HID (its USB
  peripheral is a fixed-function USB-Serial/JTAG controller - CDC serial + JTAG
  only, confirmed against Espressif's docs; that requires an S2/S3/P4's USB-OTG
  peripheral instead). A BLE-HID fallback was considered and is technically
  possible on the C3, but running ESP-NOW (Wi-Fi) and BLE concurrently on the
  receiver shares one radio via time-division coexistence, and real-world reports
  show this can be flaky depending on core/IDF version and BLE state. Since the
  chosen design (direct serial IPC into the plugin) needs no HID emulation at all,
  the receiver only ever uses Wi-Fi (ESP-NOW RX) + USB serial - a well-trodden,
  reliable combination with zero radio-coexistence risk.
- **Direct serial IPC into the plugin, not keystroke emulation.** Rather than
  faking the `Ctrl+Alt+Shift+F12` keypress at the OS level, the receiver forwards
  plain `PRESS`/`RELEASE` lines over USB serial, and the plugin calls its own
  recording methods directly. More correct (no OS input-injection quirks), and it
  eliminates the BLE hop entirely (see above).
- **Serial bridge approach: a separate static Go binary, not a Node native
  module.** The end-user machine is assumed to have no dev tooling installed at
  all (not even Node/mise) - it just runs the already-built Obsidian plugin. A
  Node native serial addon bundled in the plugin would need recompiling against
  Obsidian's exact bundled Electron ABI every time Obsidian updates, silently
  breaking the feature until someone notices and rebuilds. A separate OS process
  has no such dependency: `go.bug.st/serial` cross-compiles to a fully static
  binary for both Windows and Linux with zero C toolchain and zero runtime
  dependencies, and never needs to change when Obsidian updates. The two prebuilt
  binaries are committed under `.obsidian/plugins/rag-chat/bin/`, exactly like
  `main.js` is committed for the plugin itself (same "ship what's already built"
  pattern used everywhere else in this repo - see the root `DEVELOPMENT.md`).
  Communication is one-way, newline-delimited JSON over the child process's
  stdout (no listening socket, no signal reads from the plugin).
- **Security:**
  - ESP-NOW hop (remote -> receiver, the only over-the-air link): AES-CCM
    encrypted via a per-project PMK/LMK (`esp_now_set_pmk` / per-peer LMK).
    ESP-NOW's *own* replay protection is a disclosed, real vulnerability
    (CVE-2024-42483 - its anti-replay cache is shared across all peers/message
    types and can be flooded/poisoned, allowing a captured encrypted packet to be
    replayed even without the key). We therefore add our own monotonic counter
    inside the encrypted payload, persisted in NVS on both ends (survives deep
    sleep *and* reboots/battery changes), and the receiver hard-rejects any
    packet whose counter is not strictly greater than the last one accepted from
    that specific peer MAC.
  - USB hop (receiver -> bridge): physical access is the security boundary here
    (a real USB cable). The bridge identifies the receiver by USB VID:PID
    (Espressif's `303A:1001`) plus a banner/heartbeat string containing
    `VOICE-REMOTE-RX`, mostly to avoid misidentifying some unrelated ESP32-C3
    device rather than as a security control.
- **Power / sleep:** deep sleep on the remote (recommended over light sleep - a
  few hundred ms of wake latency from deep sleep, dominated by Wi-Fi cold-init,
  is imperceptible for "start recording," and battery life is dramatically better:
  measured real-world ESP32-C3 SuperMini deep-sleep current is in the tens to
  low hundreds of µA depending on the board's regulator, vs. much higher in light
  sleep). Powered by 3xAA via the SuperMini's `5V`/`VIN` pin (through its onboard
  ME6211 regulator) - the `3.3V` pin only accepts a narrow 3.0-3.6V range and
  can't safely take a raw AA pack across its full discharge curve.
- **Safety nets against a lost RELEASE packet:**
  - Remote: hard 20s max-awake cutoff (`VOICE_REMOTE_MAX_AWAKE_MS` in
    `shared/protocol.h`) - forces a RELEASE + sleep regardless of the physical
    switch state, protecting the battery if the switch ever sticks.
  - Plugin: 30s auto-stop safety timer (`REMOTE_SAFETY_TIMEOUT_MS` in
    `.obsidian/plugins/rag-chat/src/main.ts`) - if no RELEASE ever arrives (e.g.
    the one over-the-air packet was lost and all retries failed), the recording
    is auto-stopped and sent rather than recording forever.
- **Toolchain:** PlatformIO for both firmwares (Arduino framework) - a single
  `pio run -e <env> -t upload` per board is the "easy flash tool." Go (pinned via
  `mise.toml`) only for rebuilding the bridge binaries; not needed to just flash
  or use the hardware.

## Pin choice (ESP32-C3 SuperMini)

- Button: **GPIO3** on the remote, wired to GND with the internal pull-up enabled
  (idle HIGH, pressed LOW). GPIO3 is one of the C3's RTC-capable pins (GPIO0-5),
  which is a hard requirement for deep-sleep GPIO wakeup - GPIO6 and above can
  only wake the chip from *light* sleep, not deep sleep. GPIO3 also isn't a
  strapping pin (unlike GPIO2/8/9), so it doesn't interfere with boot mode
  selection.
- Onboard LED: **GPIO8** (active-low) on both boards, used for brief activity
  blinks (send success/failure on the remote, packet-received/replay-rejected on
  the receiver) - purely a bench-debugging aid, not required for operation.

## Provisioning (two-round flash - see `secrets.h.example`)

Both devices need to know the *other* device's MAC address, and a MAC address is
only knowable once a device has actually booted at least once. So:

1. Copy `secrets.h.example` to `secrets.h` (gitignored) in this folder. Fill in a
   fresh PMK and LMK (`openssl rand -hex 16`, twice) and the Wi-Fi channel; leave
   both MAC placeholders as-is for now.
2. Flash both boards once with these placeholders:
   `pio run -d receiver -t upload -t monitor`, then
   `pio run -d remote -t upload -t monitor` (press the remote's button once after
   flashing so it wakes and prints). Each prints its own MAC address once at boot
   (`MAC xx:xx:xx:xx:xx:xx`) - note both down.
3. Fill `VOICE_REMOTE_RECEIVER_MAC` and `VOICE_REMOTE_REMOTE_MAC` into `secrets.h`
   with the two MACs just read.
4. Re-flash **both** boards again (MACs are compile-time constants) - now they
   actually trust each other's packets.

## Serial protocol (receiver -> bridge, 115200 8N1, one line per message)

```
HELLO VOICE-REMOTE-RX v1        - sent once, right after the receiver boots
HB VOICE-REMOTE-RX v1 <millis>  - heartbeat, every 5s
PRESS                           - validated press event
RELEASE                         - validated release event
ERR <reason>                    - e.g. "ERR replay-rejected"
```

Only lines that already passed magic-byte + device-id + replay-counter
validation on the receiver are ever printed - the bridge does not repeat any of
that logic, it just forwards these lines as JSON on its own stdout:

```json
{"type":"status","connected":true,"port":"/dev/ttyACM0"}
{"type":"status","connected":false}
{"type":"press"}
{"type":"release"}
{"type":"error","message":"..."}
```

## Repo layout

```
hardware/voice-remote/
  PLAN.md                    - this file
  secrets.h.example          - committed template (see "Provisioning" above)
  secrets.h                  - gitignored, your actual keys/MACs
  shared/protocol.h          - ESP-NOW packet struct + shared constants
  remote/                    - PlatformIO project, ESP32 #2 (battery button)
  receiver/                  - PlatformIO project, ESP32 #1 (USB receiver)
  bridge/                    - Go module for the serial<->stdout bridge
    build.sh                 - cross-compiles + copies into the plugin's bin/
.obsidian/plugins/rag-chat/
  bin/serial-bridge-win32-x64.exe   (committed prebuilt)
  bin/serial-bridge-linux-x64       (committed prebuilt)
  src/remote/bridge-client.ts       - spawns/supervises the bridge, parses events
  src/settings/sections/remote.ts  - enable toggle + port override + status
```

## Known limitations / things to validate on real hardware

- **Compiled successfully** (both `pio run -d receiver` and `pio run -d remote`)
  against the toolchain PlatformIO actually resolves for
  `platform = espressif32` / `board = esp32-c3-devkitm-1` at the time of
  writing: `espressif32 7.0.1` with `framework-arduinoespressif32 3.20017.241212`
  (an arduino-esp32 **2.x-line core, i.e. ESP-IDF 4.x underneath** - not the
  newer 3.x/IDF-5.x core). Two things had to change to match this specific core:
  - `esp_now_register_recv_cb`'s callback takes the **legacy**
    `(const uint8_t *mac_addr, const uint8_t *data, int len)` signature on this
    core, not the newer `esp_now_recv_info_t*`-based one some current examples
    show. `receiver/src/main.cpp`'s `onDataRecv` already uses the legacy form -
    if you ever upgrade to a 3.x/IDF-5.x core, you'll need to switch it back and
    read the MAC from `info->src_addr` instead of the `mac_addr` parameter.
  - ESP32-C3 does **not** expose the classic `rtc_gpio_init`/`rtc_gpio_pullup_en`
    API surface at all in this SDK (`SOC_RTCIO_INPUT_OUTPUT_SUPPORTED` is unset
    for this target - those calls don't even compile). This turned out to be
    unnecessary anyway: `esp_deep_sleep_enable_gpio_wakeup()` configures the
    pin's pull resistor itself right before sleeping, based on the wakeup mode.
    `remote/src/main.cpp`'s `armWakeSourceAndSleep()` now relies on that instead
    of any manual `rtc_gpio_*` setup.
  - If you're on a different/newer core version and hit different errors than
    these two, they're likely more API-surface drift of the same kind - check
    the actual installed headers under
    `~/.platformio/packages/framework-arduinoespressif32/tools/sdk/esp32c3/include/`
    for the exact signatures your version exposes.
- **Not yet validated:** actually flashing to real hardware (`-t upload`), the
  ESP-NOW round trip between the two boards, deep-sleep current draw, and 3xAA
  battery behavior under a Wi-Fi TX burst near end-of-life voltage - only
  compilation has been verified so far.
- Board id in both `platformio.ini` files targets the official
  `esp32-c3-devkitm-1` definition (closest official match for the SuperMini's
  ESP32-C3 module/flash size) - only the physical PCB/pin silkscreen differs, but
  worth double-checking pin numbers against your specific board's silkscreen.
- An unsigned `serial-bridge-win32-x64.exe` may trigger Windows SmartScreen on
  first run on a non-technical machine - be ready to walk through "Run anyway"
  once. Code-signing was left out of scope for a personal tool.
- 3xAA through the SuperMini's onboard ME6211 regulator is expected to work for
  the brief Wi-Fi TX bursts this design needs, but hasn't been load-tested with
  partially-discharged batteries - keep an eye out for spurious resets near
  end-of-life batteries (brownout during a TX burst) and replace batteries
  proactively if seen.
