package main

import (
	"errors"
	"testing"
	"time"

	"go.bug.st/serial"
)

// fakePort implements the slice of serial.Port that lineReader uses. Each
// entry in `reads` is one Read() outcome, replayed in order: a non-empty
// payload, a timeout (n=0/err=nil, how go.bug.st/serial signals "read
// timeout elapsed"), or an error.
type fakeRead struct {
	data []byte
	err  error
}

type fakePort struct {
	reads []fakeRead
	idx   int
}

func (p *fakePort) Read(buf []byte) (int, error) {
	if p.idx >= len(p.reads) {
		return 0, nil // behave like an idle port: timeout forever
	}
	r := p.reads[p.idx]
	p.idx++
	if r.err != nil {
		return 0, r.err
	}
	n := copy(buf, r.data)
	return n, nil
}

func (p *fakePort) Write([]byte) (int, error)          { return 0, nil }
func (p *fakePort) Close() error                       { return nil }
func (p *fakePort) SetMode(*serial.Mode) error         { return nil }
func (p *fakePort) SetReadTimeout(time.Duration) error { return nil }
func (p *fakePort) ResetInputBuffer() error            { return nil }
func (p *fakePort) ResetOutputBuffer() error           { return nil }
func (p *fakePort) SetDTR(bool) error                  { return nil }
func (p *fakePort) SetRTS(bool) error                  { return nil }
func (p *fakePort) GetModemStatusBits() (*serial.ModemStatusBits, error) {
	return &serial.ModemStatusBits{}, nil
}
func (p *fakePort) Break(time.Duration) error { return nil }
func (p *fakePort) Drain() error              { return nil }

// captureEmit redirects emitted events into dst until the returned function
// is called.
func captureEmit(dst *[]outEvent) func() {
	original := emit
	emit = func(ev outEvent) { *dst = append(*dst, ev) }
	return func() { emit = original }
}

func TestReadLineReassemblesSplitChunks(t *testing.T) {
	lr := newLineReader(&fakePort{reads: []fakeRead{
		{data: []byte("PRE")},
		{data: []byte("SS\nRELEA")},
		{data: []byte("SE\n")},
	}})

	for _, want := range []string{"PRESS", "RELEASE"} {
		line, timedOut, err := lr.readLine()
		if err != nil || timedOut {
			t.Fatalf("readLine() = (%q, %v, %v), want a line", line, timedOut, err)
		}
		if line != want {
			t.Fatalf("readLine() = %q, want %q", line, want)
		}
	}
}

func TestReadLineStripsCarriageReturn(t *testing.T) {
	lr := newLineReader(&fakePort{reads: []fakeRead{{data: []byte("HB VOICE-REMOTE-RX v1 1234\r\n")}}})

	line, _, err := lr.readLine()
	if err != nil {
		t.Fatalf("readLine() error = %v", err)
	}
	if line != "HB VOICE-REMOTE-RX v1 1234" {
		t.Fatalf("readLine() = %q, want the line without \\r", line)
	}
}

func TestReadLineDistinguishesTimeoutFromError(t *testing.T) {
	lr := newLineReader(&fakePort{reads: []fakeRead{{}}}) // n=0, err=nil
	if _, timedOut, err := lr.readLine(); !timedOut || err != nil {
		t.Fatalf("readLine() = (timedOut=%v, err=%v), want (true, nil)", timedOut, err)
	}

	boom := errors.New("port closed")
	lr = newLineReader(&fakePort{reads: []fakeRead{{err: boom}}})
	if _, timedOut, err := lr.readLine(); timedOut || !errors.Is(err, boom) {
		t.Fatalf("readLine() = (timedOut=%v, err=%v), want (false, %v)", timedOut, err, boom)
	}
}

func TestReadLineKeepsPartialLineBuffered(t *testing.T) {
	lr := newLineReader(&fakePort{reads: []fakeRead{{data: []byte("PRESS\nRELE")}}})

	if line, _, _ := lr.readLine(); line != "PRESS" {
		t.Fatalf("first readLine() = %q, want PRESS", line)
	}
	if _, timedOut, err := lr.readLine(); !timedOut || err != nil {
		t.Fatalf("second readLine() = (timedOut=%v, err=%v), want a timeout, not a truncated line", timedOut, err)
	}
	if string(lr.buf) != "RELE" {
		t.Fatalf("buffered remainder = %q, want %q", lr.buf, "RELE")
	}
}

func TestMatchesReceiverIsCaseInsensitive(t *testing.T) {
	for _, tc := range []struct {
		vid, pid string
		want     bool
	}{
		{"303A", "1001", true},
		{"303a", "1001", true},
		{"303A", "1oo1", false},
		{"10C4", "EA60", false},
		{"", "", false},
	} {
		if got := matchesReceiver(tc.vid, tc.pid); got != tc.want {
			t.Errorf("matchesReceiver(%q, %q) = %v, want %v", tc.vid, tc.pid, got, tc.want)
		}
	}
}

func TestClassifyLine(t *testing.T) {
	for _, tc := range []struct {
		line     string
		wantType string
		wantOK   bool
	}{
		{"PRESS", "press", true},
		{"RELEASE", "release", true},
		// A device-level ERR must NOT become a link "error": receiving it
		// proves the link works, and status is only re-emitted on
		// connect/disconnect, so it would latch the indicator indefinitely.
		{"ERR stale-epoch-repair-needed", "warning", true},
		{"ERR esp_now_init failed", "warning", true},
		{"HELLO VOICE-REMOTE-RX v1", "", false},
		{"HB VOICE-REMOTE-RX v1 5000", "", false},
		{"MAC aa:bb:cc:dd:ee:ff", "", false},
		{"", "", false},
	} {
		ev, ok := classifyLine(tc.line)
		if ok != tc.wantOK {
			t.Errorf("classifyLine(%q) ok = %v, want %v", tc.line, ok, tc.wantOK)
			continue
		}
		if ok && ev.Type != tc.wantType {
			t.Errorf("classifyLine(%q).Type = %q, want %q", tc.line, ev.Type, tc.wantType)
		}
	}
}

func TestClassifyLineKeepsErrMessage(t *testing.T) {
	ev, ok := classifyLine("ERR stale-epoch-repair-needed")
	if !ok || ev.Message != "ERR stale-epoch-repair-needed" {
		t.Fatalf("classifyLine() = (%+v, %v), want the full line as Message", ev, ok)
	}
}

func TestIdentifyTimeoutExceedsHeartbeatInterval(t *testing.T) {
	// The receiver only prints HELLO once at boot, so identification normally
	// relies on catching a heartbeat. A window shorter than the heartbeat
	// interval rejects perfectly good ports at random.
	if identifyTimeout <= heartbeatEvery {
		t.Fatalf("identifyTimeout (%v) must exceed heartbeatEvery (%v)", identifyTimeout, heartbeatEvery)
	}
	if staleAfter <= heartbeatEvery {
		t.Fatalf("staleAfter (%v) must exceed heartbeatEvery (%v)", staleAfter, heartbeatEvery)
	}
}

func TestFindPortsHonoursOverrideWithoutEnumerating(t *testing.T) {
	names, err := findPorts("/dev/ttyACM9")
	if err != nil {
		t.Fatalf("findPorts() error = %v", err)
	}
	if len(names) != 1 || names[0] != "/dev/ttyACM9" {
		t.Fatalf("findPorts() = %v, want exactly the override", names)
	}
}

func TestStatusReporterEmitsInitialDisconnectAndSuppressesRepeats(t *testing.T) {
	var got []outEvent
	restore := captureEmit(&got)
	defer restore()

	r := &statusReporter{}
	r.disconnect("Suche Empfänger...") // initial state
	r.disconnect("Suche Empfänger...") // duplicate reason, must be suppressed
	r.disconnect("Kein Empfänger gefunden.")
	r.connect("/dev/ttyACM0")
	r.connect("/dev/ttyACM0") // duplicate, must be suppressed
	r.disconnect("Verbindung verloren.")

	if len(got) != 4 {
		t.Fatalf("emitted %d events (%+v), want 4", len(got), got)
	}
	for i, ev := range got {
		if ev.Type != "status" {
			t.Fatalf("event %d type = %q, want status (all: %+v)", i, ev.Type, got)
		}
	}
	if got[0].Connected == nil || *got[0].Connected || got[0].Message != "Suche Empfänger..." {
		t.Fatalf("first event = %+v, want connected=false with the initial reason", got[0])
	}
	// A changed reason must be re-emitted even though the connected flag did
	// not change - that string is the only diagnosis the user ever sees.
	if got[1].Message != "Kein Empfänger gefunden." {
		t.Fatalf("second event = %+v, want the updated reason", got[1])
	}
	if got[2].Connected == nil || !*got[2].Connected || got[2].Port != "/dev/ttyACM0" {
		t.Fatalf("connect event = %+v, want connected=true with the port", got[2])
	}
}

func TestStatusReporterDoesNotReportAMissingReceiverAsAnError(t *testing.T) {
	var got []outEvent
	restore := captureEmit(&got)
	defer restore()

	r := &statusReporter{}
	r.disconnect("Kein Empfänger gefunden.")
	r.disconnect("/dev/ttyACM9 konnte nicht geöffnet werden: no such file or directory")

	for _, ev := range got {
		if ev.Type == "error" {
			t.Fatalf("an absent/unopenable receiver must not be an error event, got %+v", ev)
		}
	}
}

func TestStatusReporterReportsErrorAgainAfterReconnect(t *testing.T) {
	var got []outEvent
	restore := captureEmit(&got)
	defer restore()

	r := &statusReporter{}
	r.linkError("enumeration failed")
	r.linkError("enumeration failed") // duplicate, must be suppressed
	r.connect("/dev/ttyACM0")         // clears the remembered error
	r.disconnect("lost")
	r.linkError("enumeration failed") // same text, but must be reported again

	errorCount := 0
	for _, ev := range got {
		if ev.Type == "error" {
			errorCount++
		}
	}
	if errorCount != 2 {
		t.Fatalf("got %d error events (%+v), want 2", errorCount, got)
	}
}
