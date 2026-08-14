/**
 * Lists available audio output devices. Note: `navigator.mediaDevices
 * .enumerateDevices()` only returns *named* `audiooutput` devices after the
 * page has been granted microphone permission at least once (a browser
 * privacy rule) - see `unlockDeviceLabels()` below. Before that unlock, this
 * still returns entries, just with empty/generic labels.
 */
export async function listOutputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audiooutput");
}

/**
 * One-shot microphone-permission prompt, solely to unlock device *labels*
 * for the subsequent `enumerateDevices()` call - every returned track is
 * stopped immediately afterward. Nothing is ever recorded, stored, or
 * transmitted. Guarded/no-throw: permission may be denied, or the API may be
 * unavailable in this runtime.
 */
export async function unlockDeviceLabels(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
  } catch {
    // Permission denied or no mic available - device labels simply stay
    // unlabeled; callers should tolerate that.
  }
}
