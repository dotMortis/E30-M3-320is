import { Notice } from "obsidian";
import type RagChatPlugin from "../main";
import type { ChatTurn } from "../retrieval/types";
import { synthesizeSpeech } from "../tts/client";
import * as ttsPlayback from "../tts/playback";
import { buildShortAnswer } from "../tts/short-answer";
import { recordCharsUsed } from "../tts/usage";

export interface TurnSpeechHost {
  plugin: () => RagChatPlugin;
  isClosed: () => boolean;
  syncTurn: (turn: ChatTurn) => void;
  onCharCounterChanged: () => void;
}

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class TurnSpeech {
  private playingTurn: ChatTurn | null = null;
  private readonly speculativeAudio = new WeakMap<ChatTurn, Promise<string | null>>();

  constructor(private readonly host: TurnSpeechHost) {}

  isSpeaking(turn: ChatTurn): boolean {
    return this.playingTurn === turn;
  }

  stop(): void {
    ttsPlayback.stop();
    this.playingTurn = null;
  }

  beginStreamingSpeech(turn: ChatTurn, shortText: string, signal?: AbortSignal): void {
    if (!this.host.plugin().settings.ttsEnabled || !shortText) return;
    const promise = synthesizeSpeech(shortText, this.host.plugin().settings, { signal }).catch(() => null);
    this.speculativeAudio.set(turn, promise);
  }

  async handleSpeakClick(turn: ChatTurn): Promise<void> {
    if (this.playingTurn === turn) {
      ttsPlayback.stop();
      this.playingTurn = null;
      this.host.syncTurn(turn);
      return;
    }
    if (turn.ttsStatus === "generating") return;
    if (turn.ttsAudioBase64) {
      void this.playTurnAudio(turn, turn.ttsAudioBase64);
      return;
    }
    await this.synthesizeAndPlay(turn);
  }

  async synthesizeAndPlay(turn: ChatTurn, signal?: AbortSignal): Promise<void> {
    turn.ttsStatus = "generating";
    this.host.syncTurn(turn);
    try {
      const { shortText, audio } = await this.resolveSpeech(turn, signal);
      await recordCharsUsed(this.host.plugin(), shortText.length);
      if (this.host.isClosed()) return;
      turn.ttsText = shortText;
      turn.ttsAudioBase64 = audio;
      turn.ttsStatus = "ready";
      this.host.onCharCounterChanged();
      void this.playTurnAudio(turn, audio);
    } catch (err) {
      turn.ttsStatus = "error";
      if (!this.host.isClosed()) {
        this.host.syncTurn(turn);
        new Notice(`RAG Chat: Sprachausgabe fehlgeschlagen (${errText(err)}).`);
      }
    }
  }

  private async resolveSpeech(
    turn: ChatTurn,
    signal?: AbortSignal
  ): Promise<{ shortText: string; audio: string }> {
    if (turn.ttsShortAnswer) {
      const speculative = await this.speculativeAudio.get(turn);
      const audio = speculative ?? (await synthesizeSpeech(turn.ttsShortAnswer, this.host.plugin().settings, { signal }));
      return { shortText: turn.ttsShortAnswer, audio };
    }
    const shortText = await buildShortAnswer(turn.text, this.host.plugin().settings, { signal });
    const audio = await synthesizeSpeech(shortText, this.host.plugin().settings, { signal });
    return { shortText, audio };
  }

  private async playTurnAudio(turn: ChatTurn, audioBase64: string): Promise<void> {
    ttsPlayback.setOnEnded(() => {
      if (this.playingTurn !== turn) return;
      this.playingTurn = null;
      if (!this.host.isClosed()) this.host.syncTurn(turn);
    });
    this.playingTurn = turn;
    try {
      await ttsPlayback.play(audioBase64, {
        deviceId: this.host.plugin().settings.ttsOutputDeviceId,
        volume: this.host.plugin().settings.ttsVolume,
      });
    } catch (err) {
      this.playingTurn = null;
      if (!this.host.isClosed()) {
        new Notice(`RAG Chat: Wiedergabe fehlgeschlagen (${errText(err)}).`);
      }
    }
    if (!this.host.isClosed()) this.host.syncTurn(turn);
  }
}
