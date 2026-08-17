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
	espressifVID    = "303A"
	espressifPID    = "1001"
	identifyTimeout = 3 * time.Second
	reopenDelay     = 1 * time.Second
	baudRate        = 115200
	heartbeatEvery  = 5 * time.Second
	// Receiver heartbeats every 5s; allow a few missed beats before treating
	// the link as dead (covers the odd dropped USB frame without flapping).
	staleAfter = 15 * time.Second
)

type outEvent struct {
	Type      string `json:"type"`
	Connected *bool  `json:"connected,omitempty"`
	Port      string `json:"port,omitempty"`
	Message   string `json:"message,omitempty"`
}

func boolPtr(b bool) *bool { return &b }

func emit(ev outEvent) {
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

func findPort(override string) (string, error) {
	if override != "" {
		return override, nil
	}
	ports, err := enumerator.GetDetailedPortsList(matchesReceiver)
	if err != nil {
		return "", err
	}
	for _, p := range ports {
		if p.IsUSB && matchesReceiver(p.VID, p.PID) {
			return p.Name, nil
		}
	}
	return "", nil
}

// identify waits for the receiver's banner/heartbeat line so we don't
// mistake some unrelated ESP32-C3 device (or noise) for our receiver.
func identify(port serial.Port) bool {
	_ = port.SetReadTimeout(300 * time.Millisecond)
	lr := newLineReader(port)
	deadline := time.Now().Add(identifyTimeout)
	for time.Now().Before(deadline) {
		line, timedOut, err := lr.readLine()
		if err != nil {
			return false
		}
		if timedOut {
			continue
		}
		if strings.Contains(line, "VOICE-REMOTE-RX") {
			return true
		}
	}
	return false
}

func readLoop(port serial.Port) {
	_ = port.SetReadTimeout(1 * time.Second)
	lr := newLineReader(port)
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
		switch {
		case line == "PRESS":
			emit(outEvent{Type: "press"})
		case line == "RELEASE":
			emit(outEvent{Type: "release"})
		case strings.HasPrefix(line, "ERR "):
			emit(outEvent{Type: "error", Message: line})
		default:
			// HB/HELLO lines and anything else: identification/liveness only.
		}
	}
}

func runLoop(portOverride string, stop <-chan struct{}) {
	wasConnected := false
	for {
		select {
		case <-stop:
			return
		default:
		}

		portName, err := findPort(portOverride)
		if err != nil || portName == "" {
			if wasConnected {
				emit(outEvent{Type: "status", Connected: boolPtr(false)})
				wasConnected = false
			}
			sleepOrStop(reopenDelay, stop)
			continue
		}

		port, err := serial.Open(portName, &serial.Mode{BaudRate: baudRate})
		if err != nil {
			sleepOrStop(reopenDelay, stop)
			continue
		}

		if !identify(port) {
			_ = port.Close()
			sleepOrStop(reopenDelay, stop)
			continue
		}

		emit(outEvent{Type: "status", Connected: boolPtr(true), Port: portName})
		wasConnected = true
		readLoop(port)
		_ = port.Close()
		emit(outEvent{Type: "status", Connected: boolPtr(false)})
		wasConnected = false
		sleepOrStop(reopenDelay, stop)
	}
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
