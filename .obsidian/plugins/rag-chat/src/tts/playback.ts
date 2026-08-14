import { Notice } from "obsidian";

let audioEl: HTMLAudioElement | undefined;
let onEndedCallback: (() => void) | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener("ended", () => onEndedCallback?.());
  }
  return audioEl;
}

export function setOnEnded(cb: (() => void) | null): void {
  onEndedCallback = cb;
}

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
      } catch {}
    }
  }

  await audio.play();
}

export function setVolume(v: number): void {
  if (audioEl) audioEl.volume = v;
}

export function stop(): void {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

export function isPlaying(): boolean {
  return !!audioEl && !audioEl.paused && !audioEl.ended;
}

export function dispose(): void {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.src = "";
  audioEl = undefined;
}
