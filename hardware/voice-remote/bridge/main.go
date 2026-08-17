// voice-remote-bridge: a tiny, dependency-free (at runtime) sidecar that
// bridges the voice-remote receiver's USB serial link to the rag-chat
// Obsidian plugin over stdio.
//
// Why a separate static binary instead of a Node native module inside the
// plugin: this way the plugin never depends on Obsidian's bundled Electron
// ABI for serial access, so it keeps working across Obsidian updates without
// ever needing a rebuild. See ../PLAN.md "Serial bridge approach".
//
// Protocol (stdout, one JSON object per line):
//
//	{"type":"status","connected":true,"port":"/dev/ttyACM0"}
//	{"type":"status","connected":false}
//	{"type":"press"}
//	{"type":"release"}
//	{"type":"error","message":"..."}
//	{"type":"warning","message":"..."}
//
// A missing/unopenable receiver is reported as a `status` with `connected`
// false and the reason in `message`, not as an "error": an absent receiver is
// the most ordinary state this program has. "error" is reserved for genuine
// faults (port enumeration failing). "warning" carries device-level `ERR ...`
// lines forwarded from the receiver, which are not link failures at all -
// receiving one proves the link works - see ../PLAN.md's serial-protocol
// section.
//
// The process exits cleanly when its stdin is closed (parent died) or on
// SIGINT/SIGTERM. It never reads anything meaningful from stdin itself - only
// watching for EOF - communication is one-way (device -> bridge -> plugin).
//
// Usage: voice-remote-bridge [-port=/dev/ttyACM0|COM5]
// Without -port, it auto-detects the receiver by USB VID:PID (Espressif's
// native USB Serial/JTAG controller, 303A:1001) and by waiting for its
// "VOICE-REMOTE-RX" banner/heartbeat before trusting the port - see
// ../receiver/src/main.cpp's serial protocol comment.
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"go.bug.st/serial"
	"go.bug.st/serial/enumerator"
)

const (
	espressifVID = "303A"
	espressifPID = "1001"
	reopenDelay  = 1 * time.Second
	baudRate     = 115200
	// Must match VOICE_REMOTE_HEARTBEAT_MS in ../shared/protocol.h.
	heartbeatEvery = 5 * time.Second
	// The receiver prints its HELLO banner only once at boot, so in the
	// common case (receiver already running when the bridge starts) the only
	// thing left to identify it by is a heartbeat. The identify window must
	// therefore be comfortably LONGER than one heartbeat interval, or a port
	// opened just after a beat gets rejected and reopened in a loop.
	identifyTimeout = 2*heartbeatEvery + time.Second
	// Allow a few missed beats before treating the link as dead (covers the
	// odd dropped USB frame without flapping).
	staleAfter = 3 * heartbeatEvery
)

type outEvent struct {
	Type      string `json:"type"`
	Connected *bool  `json:"connected,omitempty"`
	Port      string `json:"port,omitempty"`
	Message   string `json:"message,omitempty"`
}

func boolPtr(b bool) *bool { return &b }

// emit is a variable rather than a plain func so tests can capture the event
// stream without going through stdout.
var emit = func(ev outEvent) {
	b, err := json.Marshal(ev)
	if err != nil {
		return
	}
	fmt.Println(string(b))
}

// lineReader accumulates bytes from a serial.Port (whose ReadTimeout the
// caller controls) into newline-delimited lines, distinguishing "nothing
// arrived within the read timeout" from a genuine I/O error (disconnect).
type lineReader struct {
	port serial.Port
	buf  []byte
}

func newLineReader(port serial.Port) *lineReader {
	return &lineReader{port: port}
}

func (lr *lineReader) readLine() (line string, timedOut bool, err error) {
	for {
		if idx := bytes.IndexByte(lr.buf, '\n'); idx >= 0 {
			line = strings.TrimRight(string(lr.buf[:idx]), "\r\n")
			lr.buf = lr.buf[idx+1:]
			return line, false, nil
		}
		tmp := make([]byte, 256)
		n, readErr := lr.port.Read(tmp)
		if n > 0 {
			lr.buf = append(lr.buf, tmp[:n]...)
			continue
		}
		if readErr != nil {
			return "", false, readErr
		}
		// n == 0, err == nil: go.bug.st/serial's way of signaling that
		// SetReadTimeout's duration elapsed with nothing received.
		return "", true, nil
	}
}

func matchesReceiver(vid, pid string) bool {
	return strings.EqualFold(vid, espressifVID) && strings.EqualFold(pid, espressifPID)
}

// classifyLine maps one receiver serial line to the event that should be
// emitted for it, or ok=false for lines that carry no event (HELLO/HB, which
// only serve identification and liveness).
func classifyLine(line string) (ev outEvent, ok bool) {
	switch {
	case line == "PRESS":
		return outEvent{Type: "press"}, true
	case line == "RELEASE":
		return outEvent{Type: "release"}, true
	case strings.HasPrefix(line, "ERR "):
		// Device-level complaint (e.g. "ERR stale-epoch-repair-needed"), not a
		// link failure - see the package doc.
		return outEvent{Type: "warning", Message: line}, true
	default:
		return outEvent{}, false
	}
}

// findPorts returns every candidate port the receiver might be on, most
// likely first. All candidates are tried per pass so a second Espressif
// device (e.g. the remote plugged in for flashing) can't wedge detection by
// permanently occupying the first slot.
func findPorts(override string) ([]string, error) {
	if override != "" {
		return []string{override}, nil
	}
	ports, err := enumerator.GetDetailedPortsList(matchesReceiver)
	if err != nil {
		return nil, err
	}
	var names []string
	for _, p := range ports {
		if p.IsUSB && matchesReceiver(p.VID, p.PID) {
			names = append(names, p.Name)
		}
	}
	return names, nil
}

// identify waits for the receiver's banner/heartbeat line so we don't
// mistake some unrelated ESP32-C3 device (or noise) for our receiver. The
// reader is returned so already-buffered bytes (e.g. a PRESS that arrived in
// the same read as the heartbeat) are not thrown away by the caller.
func identify(port serial.Port) (*lineReader, bool) {
	_ = port.SetReadTimeout(300 * time.Millisecond)
	lr := newLineReader(port)
	deadline := time.Now().Add(identifyTimeout)
	for time.Now().Before(deadline) {
		line, timedOut, err := lr.readLine()
		if err != nil {
			return nil, false
		}
		if timedOut {
			continue
		}
		if strings.Contains(line, "VOICE-REMOTE-RX") {
			return lr, true
		}
	}
	return nil, false
}

func readLoop(port serial.Port, lr *lineReader) {
	_ = port.SetReadTimeout(1 * time.Second)
	if lr == nil {
		lr = newLineReader(port)
	}
	lastSeen := time.Now()
	for {
		line, timedOut, err := lr.readLine()
		if err != nil {
			return
		}
		if timedOut {
			if time.Since(lastSeen) > staleAfter {
				return
			}
			continue
		}
		lastSeen = time.Now()
		if ev, ok := classifyLine(line); ok {
			emit(ev)
		}
	}
}

// statusReporter emits connect/disconnect status while suppressing repeats, so
// a receiver that is simply unplugged produces one clear "disconnected"
// carrying the concrete reason, instead of either silence or a 1 Hz flood.
//
// Note "not plugged in" is reported as a *disconnect with a reason*, not as an
// "error": the plugin paints an error state differently (and more alarmingly)
// than a plain disconnect, and an absent receiver is the most ordinary state
// this program has. "error" is reserved for genuine faults - see linkError.
type statusReporter struct {
	connected    bool
	everReported bool
	lastReason   string
	lastError    string
}

func (r *statusReporter) connect(port string) {
	if r.connected && r.everReported {
		return
	}
	r.connected = true
	r.everReported = true
	r.lastReason = ""
	r.lastError = ""
	emit(outEvent{Type: "status", Connected: boolPtr(true), Port: port})
}

// disconnect reports the link as down, re-emitting when the *reason* changes
// (e.g. "no device" -> "permission denied") so the plugin can always show
// something actionable rather than sitting on "connecting..." forever.
func (r *statusReporter) disconnect(reason string) {
	if !r.connected && r.everReported && reason == r.lastReason {
		return
	}
	r.connected = false
	r.everReported = true
	r.lastReason = reason
	emit(outEvent{Type: "status", Connected: boolPtr(false), Message: reason})
}

// linkError reports a genuine fault (as opposed to "no receiver attached"),
// once per distinct message.
func (r *statusReporter) linkError(msg string) {
	if msg == "" || msg == r.lastError {
		return
	}
	r.lastError = msg
	emit(outEvent{Type: "error", Message: msg})
}

func runLoop(portOverride string, stop <-chan struct{}) {
	reporter := &statusReporter{}
	// Report the initial "not connected yet" state up front: without this the
	// plugin cannot tell "still looking for the receiver" apart from "bridge
	// started but never said anything", and its indicator would sit on
	// "starting" forever whenever no receiver is attached.
	reporter.disconnect("Suche Empfänger...")

	for {
		select {
		case <-stop:
			return
		default:
		}

		portNames, err := findPorts(portOverride)
		if err != nil {
			reporter.disconnect("Serielle Ports konnten nicht aufgelistet werden.")
			reporter.linkError(fmt.Sprintf("Serielle Ports konnten nicht aufgelistet werden: %v", err))
			sleepOrStop(reopenDelay, stop)
			continue
		}
		if len(portNames) == 0 {
			reporter.disconnect("Kein Empfänger gefunden (kein USB-Gerät mit VID:PID 303A:1001).")
			sleepOrStop(reopenDelay, stop)
			continue
		}

		if connectedOnce := tryPorts(portNames, reporter, stop); !connectedOnce {
			sleepOrStop(reopenDelay, stop)
		}
	}
}

// tryPorts walks the candidate list until one identifies as our receiver.
// Returns true if a port was served (and has since dropped), so the caller
// can retry immediately rather than waiting out the reopen delay twice.
func tryPorts(portNames []string, reporter *statusReporter, stop <-chan struct{}) bool {
	for _, portName := range portNames {
		select {
		case <-stop:
			return true
		default:
		}

		port, err := serial.Open(portName, &serial.Mode{BaudRate: baudRate})
		if err != nil {
			reporter.disconnect(fmt.Sprintf("%s konnte nicht geöffnet werden: %v", portName, err))
			continue
		}

		lr, ok := identify(port)
		if !ok {
			_ = port.Close()
			reporter.disconnect(fmt.Sprintf("%s hat sich nicht als VOICE-REMOTE-RX gemeldet.", portName))
			continue
		}

		reporter.connect(portName)
		readLoop(port, lr)
		_ = port.Close()
		reporter.disconnect("Verbindung zum Empfänger verloren.")
		return true
	}
	return false
}

func sleepOrStop(d time.Duration, stop <-chan struct{}) {
	select {
	case <-time.After(d):
	case <-stop:
	}
}

func main() {
	portOverride := flag.String("port", "", "Serial port path/COM name to use instead of auto-detecting")
	flag.Parse()

	stop := make(chan struct{})
	var stopOnce bool
	closeStop := func() {
		if !stopOnce {
			stopOnce = true
			close(stop)
		}
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	stdinClosed := make(chan struct{})
	go func() {
		buf := make([]byte, 64)
		for {
			if _, err := os.Stdin.Read(buf); err != nil {
				close(stdinClosed)
				return
			}
		}
	}()

	go runLoop(*portOverride, stop)

	select {
	case <-sigCh:
	case <-stdinClosed:
	}
	closeStop()
	// Give runLoop a brief moment to notice stop and close any open port.
	time.Sleep(50 * time.Millisecond)
}
