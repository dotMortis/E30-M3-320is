import { listOutputDevices } from "../tts/devices";

export interface TtsDeviceOptionsDeps {
  selectEl: HTMLSelectElement;
  currentDeviceId: string;
  isClosed: () => boolean;
  isBusy: () => boolean;
  setDisabled: (disabled: boolean) => void;
}

export async function refreshTtsDeviceOptions(deps: TtsDeviceOptionsDeps): Promise<void> {
  deps.selectEl.disabled = true;
  deps.setDisabled(true);

  const devices = await listOutputDevices();
  if (deps.isClosed()) return;

  deps.selectEl.empty();
  deps.selectEl.createEl("option", { attr: { value: "" }, text: "Systemstandard" });
  const deviceIds: string[] = [];
  for (const device of devices) {
    if (!device.deviceId || device.deviceId === "default") continue;
    deviceIds.push(device.deviceId);
    deps.selectEl.createEl("option", {
      attr: { value: device.deviceId },
      text: device.label || `Gerät ${device.deviceId.slice(0, 8)}`,
    });
  }

  const hasCurrent = deps.currentDeviceId === "" || deviceIds.includes(deps.currentDeviceId);
  deps.selectEl.value = hasCurrent ? deps.currentDeviceId : "";
  deps.selectEl.disabled = deps.isBusy();
  deps.setDisabled(deps.isBusy());
}
