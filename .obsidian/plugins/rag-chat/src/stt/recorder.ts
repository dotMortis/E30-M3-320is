const CANDIDATE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return CANDIDATE_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

/**
 * Records microphone audio for a push-to-talk style workflow: call start(), then
 * later stop() to get the recorded clip. Safe to call stop() even if start()'s
 * getUserMedia permission prompt hasn't resolved yet (e.g. a very quick tap).
 */
export class MicRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startPromise: Promise<void> | null = null;
  private stopRequested = false;

  async start(deviceId?: string): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Mikrofonzugriff wird von dieser Umgebung nicht unterstützt.");
    }

    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    };

    this.startPromise = (async () => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.stopRequested) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      this.stream = stream;
      const mimeType = pickSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) this.chunks.push(evt.data);
      };
      this.mediaRecorder.start();
    })();

    return this.startPromise;
  }

  /** Stops recording (if started) and releases the microphone. Returns the recorded clip, or null if nothing was recorded. */
  async stop(): Promise<Blob | null> {
    this.stopRequested = true;
    if (this.startPromise) await this.startPromise.catch(() => undefined);

    const recorder = this.mediaRecorder;
    const stream = this.stream;
    this.mediaRecorder = null;
    this.stream = null;

    if (!recorder || recorder.state === "inactive") {
      if (stream) for (const track of stream.getTracks()) track.stop();
      return null;
    }

    const blob = await new Promise<Blob>((resolve) => {
      recorder.addEventListener(
        "stop",
        () => resolve(new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" })),
        { once: true },
      );
      recorder.stop();
    });

    if (stream) for (const track of stream.getTracks()) track.stop();
    return blob;
  }
}
