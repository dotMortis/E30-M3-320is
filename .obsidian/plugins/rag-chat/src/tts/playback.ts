import { Notice } from "obsidian";

// Module-level shared <audio> element: a new clip always stops any
// currently-playing one first, so at most one TTS clip plays at a time.
let audioEl: HTMLAudioElement | undefined;
let onEndedCallback: (() => void) | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener("ended", () => onEndedCallback?.());
  }
  return audioEl;
}

/**
 * Registers a callback fired when the current clip finishes playing
 * naturally (not on an explicit `stop()`). Callers (the chat view) use this
 * to reset a per-turn "currently speaking" UI state. Only one callback is
 * kept at a time - set it again before each `play()` call.
 */
export function setOnEnded(cb: (() => void) | null): void {
  onEndedCallback = cb;
}

/**
 * Stops and clears any current playback, sets the given base64 MP3 as the
 * source, applies the requested output device and volume, and starts
 * playback. Guards `setSinkId` (unsupported browsers/Electron builds, or a
 * saved device that no longer exists) by falling back to the default sink
 * and surfacing a Notice, never a hard failure.
 */
export async function play(
  base64Mp3: string,
  opts: { deviceId: string; volume: number }
): Promise<void> {
  const audio = getAudioEl();
  stop();

  audio.src = `data:audio/mpeg;base64,${base64Mp3}`;
  audio.volume = opts.volume;

  const sinkCapableAudio = audio as HTMLAudioElement & {
    setSinkId?: (deviceId: string) => Promise<void>;
  };
  if (opts.deviceId && typeof sinkCapableAudio.setSinkId === "function") {
    try {
      await sinkCapableAudio.setSinkId(opts.deviceId);
    } catch (err) {
      new Notice(
        `RAG Chat: Audioausgabegerät konnte nicht gesetzt werden, verwende Systemstandard (${err instanceof Error ? err.message : String(err)}).`,
        6000
      );
      try {
        await sinkCapableAudio.setSinkId("default");
      } catch {
        // Nothing more we can do - just play through whatever is current.
      }
    }
  }

  await audio.play();
}

/** Live-updates the volume of the currently loaded/playing clip, if any. */
export function setVolume(v: number): void {
  if (audioEl) audioEl.volume = v;
}

/** Stops playback and rewinds, without clearing the loaded source. */
export function stop(): void {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

export function isPlaying(): boolean {
  return !!audioEl && !audioEl.paused && !audioEl.ended;
}

/** Called on plugin unload to release the underlying audio element. */
export function dispose(): void {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.src = "";
  audioEl = undefined;
}
