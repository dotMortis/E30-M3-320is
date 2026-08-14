import { describe, expect, it } from "vitest";
import { encodeWav } from "../../stt/wav-encode";

function fakeAudioBuffer(opts: { numberOfChannels: number; sampleRate: number; channels: number[][] }): AudioBuffer {
  const length = opts.channels[0]?.length ?? 0;
  return {
    numberOfChannels: opts.numberOfChannels,
    sampleRate: opts.sampleRate,
    length,
    duration: length / opts.sampleRate,
    getChannelData: (ch: number) => Float32Array.from(opts.channels[ch]),
  } as unknown as AudioBuffer;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += String.fromCharCode(view.getUint8(offset + i));
  return out;
}

describe("encodeWav", () => {
  it("writes a valid 44-byte RIFF/WAVE header describing the PCM stream", () => {
    const audioBuffer = fakeAudioBuffer({ numberOfChannels: 1, sampleRate: 16000, channels: [[0, 0.5, -0.5, 1, -1]] });
    const buffer = encodeWav(audioBuffer);
    const view = new DataView(buffer);

    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(readAscii(view, 8, 4)).toBe("WAVE");
    expect(readAscii(view, 12, 4)).toBe("fmt ");
    expect(readAscii(view, 36, 4)).toBe("data");

    expect(view.getUint16(20, true)).toBe(1); // PCM format
    expect(view.getUint16(22, true)).toBe(1); // numChannels
    expect(view.getUint32(24, true)).toBe(16000); // sampleRate
    expect(view.getUint16(34, true)).toBe(16); // bits per sample

    const dataSize = 5 * 2; // 5 frames * 1 channel * 2 bytes
    expect(view.getUint32(40, true)).toBe(dataSize);
    expect(view.getUint32(4, true)).toBe(36 + dataSize);
    expect(buffer.byteLength).toBe(44 + dataSize);
  });

  it("interleaves multi-channel samples and reports the correct block align/byte rate", () => {
    const audioBuffer = fakeAudioBuffer({
      numberOfChannels: 2,
      sampleRate: 44100,
      channels: [
        [1, -1],
        [0.5, -0.5],
      ],
    });
    const buffer = encodeWav(audioBuffer);
    const view = new DataView(buffer);

    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint16(32, true)).toBe(4); // blockAlign = 2 channels * 2 bytes
    expect(view.getUint32(28, true)).toBe(44100 * 4); // byteRate

    // Frame 0: channel 0 sample (1.0 -> 0x7fff), channel 1 sample (0.5 -> ~0x4000)
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBeCloseTo(0.5 * 0x7fff, -1);
    // Frame 1: channel 0 sample (-1.0 -> -0x8000)
    expect(view.getInt16(48, true)).toBe(-0x8000);
  });

  it("clamps out-of-range samples to the valid 16-bit PCM range", () => {
    const audioBuffer = fakeAudioBuffer({ numberOfChannels: 1, sampleRate: 8000, channels: [[2, -2]] });
    const buffer = encodeWav(audioBuffer);
    const view = new DataView(buffer);

    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });
});
