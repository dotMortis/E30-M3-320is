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
    replayed even without the key). We therefore add our own monotonic sequence
    inside the encrypted payload and the receiver hard-rejects anything that is
    not strictly newer than the last packet it accepted from that specific peer
    MAC. The sequence is a **(bootEpoch, counter) pair** (`shared/protocol.h`):
    `bootEpoch` is bumped once per remote wake and persisted in NVS (so it
    survives deep sleep, reboots and battery changes), while `counter` just
    numbers the packets within that one wake (PRESS=1, RELEASE=2) and lives in
    RAM. That shape buys three things over a single long-lived counter: only one
    NVS write per press cycle on a battery device instead of one per packet; a
    remote that loses power mid-sequence can never resume on a value the
    receiver already saw; and the receiver can treat its own stored epoch as
    fully consumed on boot, so a packet captured before a receiver restart
    cannot be replayed into it afterwards.
  - **Re-pairing after an NVS wipe:** wiping the *remote's* NVS (full flash
    erase, partition change, replacement board) resets its epoch to 1, which the
    receiver correctly rejects as stale - it reports `ERR
    stale-epoch-repair-needed` and stays deaf. Recovery is a physical gesture:
    **hold the receiver's BOOT button (GPIO9) while resetting/powering it up**,
    which clears the stored sequence (it acknowledges with `ERR
    replay-state-cleared`) and lets the next packet from any epoch through. This
    is deliberately not automatic - a rule like "accept a lower sequence after N
    rejections" would hand replay attacks exactly the opening the sequence
    exists to close, and physical access to the receiver is already the trust
    boundary on that side of the link.
  - USB hop (receiver -> bridge): physical access is the security boundary here
    (a real USB cable). The bridge identifies the receiver by USB VID:PID
    (Espressif's `303A:1001`) plus a banner/heartbeat string containing
    `VOICE-REMOTE-RX`, mostly to avoid misidentifying some unrelated ESP32-C3
    device rather than as a security control.
- **Power / sleep:** deep sleep on the remote (recommended over light sleep - a
  few hundred ms of wake latency from deep sleep, dominated by Wi-Fi cold-init,
  is imperceptible for "start recording," provided nothing *else* is allowed to
  sit in front of the PRESS packet. In particular `remote/src/main.cpp` must not
  wait for USB serial on a button wake: with `ARDUINO_USB_CDC_ON_BOOT=1`,
  `Serial` is HWCDC and `if (!Serial)` is permanently true on battery, so a
  `while (!Serial && ...)` grace period burns its full timeout on *every* press.
  The press path therefore goes wake cause -> ESP-NOW -> PRESS, and only a plain
  power-on/reset (the provisioning run) touches USB at all. For the same reason
  the press is derived from `esp_sleep_get_wakeup_cause() ==
  ESP_SLEEP_WAKEUP_GPIO` rather than re-reading the pin - the pin only says
  whether the button is *still* held, so a short tap would otherwise be dropped
  entirely while the chip was still booting. Battery life is dramatically better
  than light sleep:
  measured real-world ESP32-C3 SuperMini deep-sleep current is in the tens to
  low hundreds of µA depending on the board's regulator, vs. much higher in light
  sleep). Powered by 3xAA via the SuperMini's `5V`/`VIN` pin (through its onboard
  ME6211 regulator) - the `3.3V` pin only accepts a narrow 3.0-3.6V range and
  can't safely take a raw AA pack across its full discharge curve.
- **Safety nets against a lost RELEASE packet:**
  - Remote: hard 20s max-awake cutoff (`VOICE_REMOTE_MAX_AWAKE_MS` in
    `shared/protocol.h`) - forces a RELEASE regardless of the physical switch
    state, so a jammed switch can't hold a recording open indefinitely.
    Crucially, the remote then waits for the switch to actually go idle before
    re-arming deep sleep (`sleepUntilButtonIdle()`): the GPIO wake source is
    *level*-triggered, so sleeping while the pin still reads LOW satisfies the
    wake condition immediately and the chip would reboot, re-PRESS, wait out the
    cutoff and repeat forever at full power - draining the pack far faster than
    just staying awake, and spamming the plugin with 20s recordings. If the
    switch stays stuck for `VOICE_REMOTE_STUCK_WAIT_MS` the remote sleeps on a
    *timer* wake instead and re-checks every few minutes until it frees up.
  - Plugin: 30s auto-stop safety timer (`REMOTE_SAFETY_TIMEOUT_MS` in
    `.obsidian/plugins/rag-chat/src/main.ts`) - if no RELEASE ever arrives (e.g.
    the one over-the-air packet was lost and all retries failed), the recording
    is auto-stopped and sent rather than recording forever. The timer is only
    armed if a recording really started, and is cancelled whenever the recording
    ends by any other route, so it can never fire a misleading
    "automatically stopped" notice for something that already finished.
  - Plugin: every PRESS carries a sequence number, because `onPress` is async
    (it may still have to open the chat view) while `onRelease` is synchronous -
    a quick tap can therefore deliver RELEASE *first*. A press whose own release
    already arrived does not start a recording at all, instead of starting one
    that nothing is left to stop.
- **Toolchain:** PlatformIO for both firmwares (Arduino framework) - a single
  `pio run -d <remote|receiver> -t upload` per board is the "easy flash tool"
  (run from this folder; `-d` takes the project *directory*, and there is no
  `platformio.ini` at this level for `-e` to find). Go (pinned via `mise.toml`)
  only for rebuilding the bridge binaries; not needed to just flash or use the
  hardware.

## Pin choice (ESP32-C3 SuperMini)

- Button: **GPIO3** on the remote, wired to GND with the internal pull-up enabled
  (idle HIGH, pressed LOW). GPIO3 is one of the C3's RTC-capable pins (GPIO0-5),
  which is a hard requirement for deep-sleep GPIO wakeup - GPIO6 and above can
  only wake the chip from *light* sleep, not deep sleep. GPIO3 also isn't a
  strapping pin (unlike GPIO2/8/9), so it doesn't interfere with boot mode
  selection.
- Onboard LED: **GPIO8** (active-low) on both boards, used for brief activity
  blinks - purely a bench-debugging aid, not required for operation. On the
  remote: 15 ms = sent and acked, 200 ms = all retries failed (out of range /
  receiver off), 600 ms = the radio never came up at all (a configuration or
  hardware fault, not a range problem). On the receiver: 30 ms at boot, 15 ms per
  accepted packet.
- Onboard BOOT button: **GPIO9** on the receiver, read (with pull-up) only
  during `setup()` as the re-pair gesture - hold it while resetting to clear the
  stored replay sequence (see "Re-pairing after an NVS wipe" above). It's a
  strapping pin, which is exactly why it's safe to reuse here: it's read after
  boot has already completed, and it's never driven.

## Provisioning (two-round flash - see `secrets.h.example`)

Both devices need to know the *other* device's MAC address, and a MAC address is
only knowable once a device has actually booted at least once. So:

1. Copy `secrets.h.example` to `secrets.h` (gitignored) in this folder. Fill in a
   fresh PMK and LMK (`openssl rand -hex 16`, twice) and the Wi-Fi channel; leave
   both MAC placeholders as-is for now.
2. Flash both boards once with these placeholders:
   `pio run -d receiver -t upload -t monitor`, then
   `pio run -d remote -t upload -t monitor`. Each prints its own MAC address on a
   plain power-on/reset (`MAC xx:xx:xx:xx:xx:xx`) - note both down. Note the
   remote prints on *reset only*, not on a button wake: a button wake takes the
   low-latency path that skips USB entirely (see "Power / sleep" above), so tap
   the board's reset button, don't press the remote button, if you don't see it.
3. Fill `VOICE_REMOTE_RECEIVER_MAC` and `VOICE_REMOTE_REMOTE_MAC` into `secrets.h`
   with the two MACs just read.
4. Re-flash **both** boards again (MACs are compile-time constants) - now they
   actually trust each other's packets. Both boards must always run the same
   `shared/protocol.h` version; the packet's magic tag (`VR02`) is bumped
   whenever the layout changes so a half-upgraded pair fails loudly instead of
   misparsing.

## Serial protocol (receiver -> bridge, 115200 8N1, one line per message)

```
HELLO VOICE-REMOTE-RX v1        - sent once, right after the receiver boots
MAC xx:xx:xx:xx:xx:xx           - sent once at boot, for provisioning
HB VOICE-REMOTE-RX v1 <millis>  - heartbeat, every 5s
PRESS                           - validated press event
RELEASE                         - validated release event
ERR <reason>                    - device-level complaint, e.g.
                                  "ERR stale-epoch-repair-needed"
```

Only lines that already passed magic-byte + device-id + replay-sequence
validation on the receiver are ever printed - the bridge does not repeat any of
that logic, it just forwards these lines as JSON on its own stdout:

```json
{"type":"status","connected":true,"port":"/dev/ttyACM0"}
{"type":"status","connected":false,"message":"Kein Empfänger gefunden (kein USB-Gerät mit VID:PID 303A:1001)."}
{"type":"press"}
{"type":"release"}
{"type":"error","message":"Serielle Ports konnten nicht aufgelistet werden: ..."}
{"type":"warning","message":"ERR stale-epoch-repair-needed"}
```

Three things worth noting about that JSON, all of them there because their
absence made a non-working remote undiagnosable:

- **The bridge always says something.** It emits `{"connected":false}` with a
  reason immediately at startup, and re-emits whenever the reason changes. Stay
  silent instead and "receiver not plugged in" becomes indistinguishable from
  "bridge started but never said anything" - the plugin would sit on
  "Verbindungsaufbau…" forever with nothing to show the user, which is exactly
  the state a missing/mis-specified port used to produce.
- **A missing receiver is a `status`, not an `error`.** "No receiver attached",
  "port could not be opened", "didn't identify itself" all ride along as the
  `message` of a `connected:false` status, because an absent receiver is the most
  ordinary state this program has and the plugin paints an error state more
  alarmingly. `error` is reserved for genuine faults (port enumeration failing).
- **`warning` exists so device chatter can't masquerade as a link failure.** It
  carries a receiver-side `ERR ...` line and deliberately does not touch the
  status; otherwise one such line would latch the UI into "Fehler" indefinitely
  while the link was perfectly healthy, since status is only re-emitted on
  connect/disconnect.

Duplicate packets are dropped **silently** by the receiver: the remote re-sends
the same (epoch, counter) when an ack is lost, on purpose, so a duplicate is
expected traffic rather than something worth reporting at all.

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
    main.go                  - port detection, identification, event mapping
    main_test.go             - `go test ./...` (line reassembly, event mapping,
                               status/error emission, timing invariants)
    build.sh                 - tests, cross-compiles + copies into the plugin's bin/
.obsidian/plugins/rag-chat/
  bin/serial-bridge-win32-x64.exe   (committed prebuilt)
  bin/serial-bridge-linux-x64       (committed prebuilt)
  src/remote/bridge-client.ts       - spawns/supervises the bridge, parses events
  src/settings/sections/remote.ts  - enable toggle + port override + status
```

The prebuilt binaries are built with `-trimpath -buildvcs=false`, which makes
them byte-reproducible: re-running `bridge/build.sh` on an unchanged `main.go`
produces identical files, so a committed artifact can actually be verified
against committed source (without `-buildvcs=false`, Go stamps in the git
revision plus a `vcs.modified` flag and every rebuild differs gratuitously).

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
    `remote/src/main.cpp`'s `sleepUntilButtonIdle()` now relies on that instead
    of any manual `rtc_gpio_*` setup.
  - If you're on a different/newer core version and hit different errors than
    these two, they're likely more API-surface drift of the same kind - check
    the actual installed headers under
    `~/.platformio/packages/framework-arduinoespressif32/tools/sdk/esp32c3/include/`
    for the exact signatures your version exposes.
- **Not yet validated:** actually flashing to real hardware (`-t upload`), the
  ESP-NOW round trip between the two boards, deep-sleep current draw, and 3xAA
  battery behavior under a Wi-Fi TX burst near end-of-life voltage - only
  compilation has been verified so far. Specifically worth bench-testing after
  the latency/sleep rework, since none of it can be verified from a build:
  - A **short tap** (well under a second) must produce a PRESS at all - this is
    what the `esp_sleep_get_wakeup_cause()`-based press detection fixed, and the
    old pin-re-read version dropped such taps silently.
  - **Press-to-recording latency** should now be dominated by Wi-Fi cold-init
    (a few hundred ms), not by a USB-serial grace period.
  - **Holding the button past 20s**: expect exactly one RELEASE, then the remote
    should stay quiet (not re-PRESS in a loop) until the button is released.
  - **The BOOT-button re-pair gesture** on the receiver (`ERR
    replay-state-cleared` on the serial line, and the next press accepted).
  - **`WiFi.setSleep(false)`** on the receiver: this is the fix for the
    always-on receiver's radio dozing between beacons and dropping ESP-NOW
    frames, so watch for missed presses if it ever gets removed.
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
