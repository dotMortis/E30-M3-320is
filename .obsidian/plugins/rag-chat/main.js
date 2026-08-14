//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let obsidian = require("obsidian");
let node_crypto = require("node:crypto");
let node_os = require("node:os");
node_os = __toESM(node_os, 1);
let node_fs = require("node:fs");
//#region src/secure-storage.ts
var ENC_PREFIX = "enc:v1:";
var KEY_LEN = 32;
var SALT_LEN = 16;
var IV_LEN = 12;
var SCRYPT_PARAMS = {
	N: 16384,
	r: 8,
	p: 1
};
function scrypt(password, salt, keylen, options) {
	return new Promise((resolve, reject) => {
		(0, node_crypto.scrypt)(password, salt, keylen, options, (err, derivedKey) => {
			if (err) reject(err);
			else resolve(derivedKey);
		});
	});
}
function getMachineFingerprint() {
	return [
		node_os.hostname(),
		node_os.platform(),
		node_os.arch(),
		node_os.cpus()?.[0]?.model ?? "unknown-cpu",
		String(node_os.totalmem()),
		node_os.homedir()
	].join("|");
}
async function deriveKey(salt) {
	return await scrypt(getMachineFingerprint(), salt, KEY_LEN, SCRYPT_PARAMS);
}
async function encryptSecret(plain) {
	if (!plain) return "";
	const salt = (0, node_crypto.randomBytes)(SALT_LEN);
	const key = await deriveKey(salt);
	const iv = (0, node_crypto.randomBytes)(IV_LEN);
	const cipher = (0, node_crypto.createCipheriv)("aes-256-gcm", key, iv);
	const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return ENC_PREFIX + Buffer.concat([
		salt,
		iv,
		tag,
		ciphertext
	]).toString("base64");
}
async function decryptSecret(stored) {
	if (!stored) return "";
	if (!stored.startsWith(ENC_PREFIX)) throw new Error("unrecognized secret format");
	const payload = Buffer.from(stored.slice(7), "base64");
	const salt = payload.subarray(0, SALT_LEN);
	const iv = payload.subarray(SALT_LEN, 28);
	const tag = payload.subarray(28, 44);
	const ciphertext = payload.subarray(44);
	const key = await deriveKey(salt);
	const decipher = (0, node_crypto.createDecipheriv)("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
//#endregion
//#region src/settings/types.ts
var DEFAULT_SETTINGS = {
	geminiApiKey: "",
	embeddingModel: "gemini-embedding-2",
	generationModel: "gemini-3.6-flash",
	outputDim: 3072,
	topK: 8,
	similarity: .55,
	rrfK: 2,
	enableFuzzySearchLeg: true,
	maxAgentRounds: 5,
	thinkingEnabled: false,
	webSearchEnabled: false,
	ttsEnabled: false,
	ttsApiKey: "",
	ttsLanguageCode: "de-DE",
	ttsVoiceName: "de-DE-Chirp3-HD-Laomedeia",
	ttsOutputDeviceId: "",
	ttsVolume: 1,
	ttsCharCount: 0,
	micInputDeviceId: ""
};
//#endregion
//#region src/settings/settings-store.ts
var SettingsStore = class {
	constructor(plugin) {
		this.plugin = plugin;
		this.geminiKeyCache = {
			plaintext: void 0,
			ciphertext: void 0
		};
		this.ttsKeyCache = {
			plaintext: void 0,
			ciphertext: void 0
		};
	}
	async load() {
		const raw = await this.plugin.loadData() ?? {};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
		this.settings.geminiApiKey = await this.loadSecret(raw.geminiApiKey, this.geminiKeyCache, "Google API key (GEMINI_API_KEY)");
		this.settings.ttsApiKey = await this.loadSecret(raw.ttsApiKey, this.ttsKeyCache, "TTS API-Key");
	}
	async save() {
		const toPersist = { ...this.settings };
		toPersist.geminiApiKey = await this.persistSecret(this.settings.geminiApiKey, this.geminiKeyCache);
		toPersist.ttsApiKey = await this.persistSecret(this.settings.ttsApiKey, this.ttsKeyCache);
		await this.plugin.saveData(toPersist);
	}
	async loadSecret(stored, cache, label) {
		try {
			const plaintext = await decryptSecret(stored);
			cache.plaintext = plaintext;
			cache.ciphertext = stored;
			return plaintext;
		} catch {
			cache.plaintext = void 0;
			cache.ciphertext = void 0;
			if (stored) new obsidian.Notice(`RAG Chat: ${label} konnte nicht entschlüsselt werden (anderes Gerät oder beschädigte Daten?) - bitte in den Einstellungen erneut eingeben.`, 1e4);
			return "";
		}
	}
	async persistSecret(plaintext, cache) {
		if (plaintext === cache.plaintext && cache.ciphertext !== void 0) return cache.ciphertext;
		const ciphertext = await encryptSecret(plaintext);
		cache.plaintext = plaintext;
		cache.ciphertext = ciphertext;
		return ciphertext;
	}
};
//#endregion
//#region src/settings/controls/secret-text.ts
function addSecretText(containerEl, config) {
	let inputEl;
	const setting = new obsidian.Setting(containerEl).setName(config.name);
	if (config.desc) setting.setDesc(config.desc);
	setting.addText((text) => {
		text.setPlaceholder(config.placeholder ?? "AIza...").setValue(config.getValue()).onChange(async (value) => {
			await config.setValue(value.trim());
		});
		inputEl = text.inputEl;
		inputEl.type = "password";
	}).addButton((button) => {
		button.setIcon("eye").setTooltip("API-Schlüssel anzeigen/verbergen");
		button.onClick(() => {
			if (!inputEl) return;
			const revealed = inputEl.type === "text";
			inputEl.type = revealed ? "password" : "text";
			button.setIcon(revealed ? "eye" : "eye-off");
		});
	});
	return setting;
}
//#endregion
//#region src/settings/sections/api-key.ts
function renderApiKeySection(containerEl, plugin) {
	containerEl.createEl("h2", { text: "RAG Chat" });
	containerEl.createEl("p", { text: "Google (gemini-embedding-2 for embeddings, a selectable Gemini Flash model for generation) is used for both query embeddings and generation." });
	addSecretText(containerEl, {
		name: "Google API key (GEMINI_API_KEY)",
		desc: "Required for query embeddings and generation.",
		getValue: () => plugin.settings.geminiApiKey,
		setValue: async (value) => {
			plugin.settings.geminiApiKey = value;
			await plugin.saveSettings();
		}
	});
}
//#endregion
//#region src/settings/controls/number-field.ts
function addNumberField(containerEl, config) {
	const parse = config.parse ?? ((raw) => parseInt(raw, 10));
	const setting = new obsidian.Setting(containerEl).setName(config.name);
	if (config.desc) setting.setDesc(config.desc);
	setting.addText((text) => text.setValue(String(config.getValue())).onChange(async (value) => {
		const n = parse(value);
		if (!Number.isNaN(n) && config.isValid(n)) await config.onValid(n);
	}));
	return setting;
}
//#endregion
//#region src/settings/sections/agent.ts
function renderAgentSection(containerEl, plugin) {
	containerEl.createEl("h3", { text: "Agenten-Schleife (Werkzeuge & Rückfragen)" });
	containerEl.createEl("p", { text: "RAG Chat beantwortet Fragen nicht mehr nur aus dem Handbuch: das Modell kann selbst entscheiden, erneut zu suchen, eine bestimmte Seite vollständig nachzuladen, das Web zu durchsuchen oder dich um eine Klärung zu bitten - begrenzt durch ein festes Budget an Werkzeug-Runden pro Frage." });
	new obsidian.Setting(containerEl).setName("Vault-Search-Werkzeug anbieten").setDesc("Bietet dem Modell die tippfehler-/synonymtolerante Handbuchsuche (Plugin \"vault-search\") als eigenständiges Werkzeug an. Benötigt das vault-search-Plugin (aktiviert).").addToggle((toggle) => toggle.setValue(plugin.settings.enableFuzzySearchLeg).onChange(async (value) => {
		plugin.settings.enableFuzzySearchLeg = value;
		await plugin.saveSettings();
	}));
	addNumberField(containerEl, {
		name: "Max. Werkzeug-Runden",
		desc: "Hartes Limit an Werkzeug-Aufrufen (erneute Suche, Seite nachladen, Rückfrage) pro Frage, bevor das Modell gezwungen wird, direkt zu antworten. Eine Rückfrage an dich verbraucht beim Fortsetzen ebenfalls eine Runde dieses Budgets.",
		getValue: () => plugin.settings.maxAgentRounds,
		isValid: (n) => n > 0,
		onValid: async (n) => {
			plugin.settings.maxAgentRounds = n;
			await plugin.saveSettings();
		}
	});
}
//#endregion
//#region src/constants.ts
var CANDIDATE_POOL_LIMIT = 5e3;
var HTTP_RETRY_BASE_DELAY_MS = 1e3;
var HTTP_RETRY_MAX_DELAY_MS = 16e3;
var HTTP_RETRY_JITTER_RATIO = .2;
var HTTP_REQUEST_TIMEOUT_MS = 45e3;
var HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS = HTTP_REQUEST_TIMEOUT_MS;
var HTTP_STREAM_IDLE_TIMEOUT_MS = 3e4;
var HTTP_RETRY_COUNTDOWN_TICK_MS = 1e3;
var ABORT_ERROR_MESSAGE = "Anfrage abgebrochen.";
var TTS_FREE_TIER_CHAR_LIMIT = 1e6;
//#endregion
//#region src/http/backoff.ts
var RETRYABLE_STATUSES = /* @__PURE__ */ new Set([
	429,
	500,
	502,
	503,
	504
]);
function computeDelayMs(attempt, retryAfterHeader) {
	if (retryAfterHeader) {
		const seconds = Number(retryAfterHeader);
		if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1e3);
		const dateMs = Date.parse(retryAfterHeader);
		if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
	}
	const exponential = HTTP_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
	const capped = Math.min(exponential, HTTP_RETRY_MAX_DELAY_MS);
	const jitter = (Math.random() * 2 - 1) * capped * HTTP_RETRY_JITTER_RATIO;
	return Math.max(0, Math.round(capped + jitter));
}
//#endregion
//#region src/http/error-message.ts
function truncate(text) {
	const trimmed = text.trim();
	return trimmed ? trimmed.slice(0, 300) : "";
}
function extractErrorMessageFromText(text) {
	try {
		const msg = JSON.parse(text)?.error?.message;
		if (typeof msg === "string" && msg.trim()) return msg.trim();
	} catch {}
	return truncate(text) || void 0;
}
function extractResponseErrorMessage(response) {
	try {
		const jsonMsg = response.json?.error?.message;
		if (typeof jsonMsg === "string" && jsonMsg.trim()) return jsonMsg.trim();
	} catch {}
	return truncate(response.text ?? "") || void 0;
}
//#endregion
//#region src/http/request-timeout.ts
function requestWithTimeout(params, signal) {
	if (signal?.aborted) return Promise.reject(new Error(ABORT_ERROR_MESSAGE));
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (fn) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
			fn();
		};
		const onAbort = () => finish(() => reject(new Error(ABORT_ERROR_MESSAGE)));
		const timer = setTimeout(() => {
			finish(() => reject(/* @__PURE__ */ new Error(`Zeitüberschreitung nach ${HTTP_REQUEST_TIMEOUT_MS / 1e3}s`)));
		}, HTTP_REQUEST_TIMEOUT_MS);
		signal?.addEventListener("abort", onAbort, { once: true });
		(0, obsidian.requestUrl)({
			...params,
			throw: false
		}).then((response) => finish(() => resolve(response)), (err) => finish(() => reject(err)));
	});
}
//#endregion
//#region src/http/sleep.ts
function sleep(ms, signal, onTick) {
	if (signal?.aborted) return Promise.reject(new Error(ABORT_ERROR_MESSAGE));
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const emitTick = () => {
			const remainingMs = ms - (Date.now() - start);
			if (remainingMs > 0) onTick?.(Math.ceil(remainingMs / 1e3));
		};
		emitTick();
		const interval = onTick ? setInterval(emitTick, HTTP_RETRY_COUNTDOWN_TICK_MS) : void 0;
		const onAbort = () => {
			if (interval) clearInterval(interval);
			clearTimeout(timer);
			reject(new Error(ABORT_ERROR_MESSAGE));
		};
		const timer = setTimeout(() => {
			if (interval) clearInterval(interval);
			signal?.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}
//#endregion
//#region src/http/retry.ts
function retryAfterHeaderValue(response) {
	const headers = response.headers ?? {};
	return headers["retry-after"] ?? headers["Retry-After"];
}
async function backoff(attempt, delay, signal, onStatus, message) {
	await sleep(delay, signal, (seconds) => onStatus?.(message(`in ${seconds}s (${attempt}/5) …`)));
	onStatus?.(message(`(${attempt}/5) …`));
}
async function requestUrlWithRetry(params, opts) {
	const label = opts?.label ?? "Anfrage";
	const signal = opts?.signal;
	let lastResponse;
	for (let attempt = 1; attempt <= 5; attempt++) {
		if (signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
		let response;
		try {
			response = await requestWithTimeout(params, signal);
		} catch (err) {
			if (signal?.aborted) throw err;
			const message = err instanceof Error ? err.message : String(err);
			if (attempt === 5) throw new Error(`${label} fehlgeschlagen: ${message}`);
			await backoff(attempt, computeDelayMs(attempt), signal, opts?.onStatus, (suffix) => `${label} fehlgeschlagen (${message}) – erneuter Versuch ${suffix}`);
			continue;
		}
		if (response.status < 400) return response;
		lastResponse = response;
		if (!RETRYABLE_STATUSES.has(response.status) || attempt === 5) {
			const msg = extractResponseErrorMessage(response);
			throw new Error(`Request failed, status ${response.status}${msg ? `: ${msg}` : ""}`);
		}
		const delay = computeDelayMs(attempt, retryAfterHeaderValue(response));
		await backoff(attempt, delay, signal, opts?.onStatus, (suffix) => `${label} überlastet (Status ${response.status}) – erneuter Versuch ${suffix}`);
	}
	throw new Error(`Request failed, status ${lastResponse?.status ?? "unknown"}`);
}
//#endregion
//#region src/gemini/models.ts
var FLASH_NAME_PATTERN = /flash/i;
var EXCLUDED_NAME_PATTERN = /preview|tts|lite|latest/i;
var GEMINI_NAME_PATTERN = /gemini/i;
var LIST_MODELS_PAGE_SIZE = 1e3;
async function listFlashModels(apiKey, signal) {
	if (!apiKey) return [];
	const models = [];
	let pageToken;
	try {
		do {
			const json = (await requestUrlWithRetry({
				url: `https://generativelanguage.googleapis.com/v1beta/models?pageSize=${LIST_MODELS_PAGE_SIZE}` + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""),
				method: "GET",
				headers: { "x-goog-api-key": apiKey }
			}, {
				label: "Modellliste",
				signal
			})).json;
			for (const model of json.models ?? []) {
				const id = model.name.replace(/^models\//, "");
				if (!FLASH_NAME_PATTERN.test(id)) continue;
				if (EXCLUDED_NAME_PATTERN.test(id)) continue;
				if (!GEMINI_NAME_PATTERN.test(id)) continue;
				if (!model.supportedGenerationMethods?.includes("generateContent")) continue;
				models.push({
					id,
					displayName: model.displayName ?? id
				});
			}
			pageToken = json.nextPageToken;
		} while (pageToken);
	} catch {
		return [];
	}
	models.sort((a, b) => a.id > b.id ? -1 : a.id < b.id ? 1 : 0);
	return models;
}
//#endregion
//#region src/settings/sections/generation.ts
function renderGenerationModel(containerEl, plugin) {
	let modelDropdown;
	let modelRefreshButton;
	const refreshModelOptions = async () => {
		if (!modelDropdown) return;
		const currentModel = plugin.settings.generationModel;
		modelDropdown.setDisabled(true);
		modelRefreshButton?.setDisabled(true);
		const models = await listFlashModels(plugin.settings.geminiApiKey);
		const options = models.some((model) => model.id === currentModel) ? models : [{
			id: currentModel,
			displayName: currentModel
		}, ...models];
		modelDropdown.selectEl.empty();
		for (const model of options) modelDropdown.addOption(model.id, model.displayName);
		modelDropdown.setValue(currentModel);
		modelDropdown.setDisabled(false);
		modelRefreshButton?.setDisabled(false);
	};
	new obsidian.Setting(containerEl).setName("Generation model").addDropdown((dropdown) => {
		modelDropdown = dropdown;
		dropdown.addOption(plugin.settings.generationModel, plugin.settings.generationModel);
		dropdown.setValue(plugin.settings.generationModel);
		dropdown.onChange(async (value) => {
			plugin.settings.generationModel = value;
			await plugin.saveSettings();
		});
	}).addButton((button) => {
		modelRefreshButton = button;
		button.setIcon("refresh-cw").setTooltip("Modellliste aktualisieren");
		button.onClick(() => {
			refreshModelOptions();
		});
	});
	refreshModelOptions();
}
//#endregion
//#region src/stt/devices.ts
async function listInputDevices() {
	if (!navigator.mediaDevices?.enumerateDevices) return [];
	return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
}
//#endregion
//#region src/tts/devices.ts
async function listOutputDevices() {
	if (!navigator.mediaDevices?.enumerateDevices) return [];
	return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audiooutput");
}
async function unlockDeviceLabels() {
	if (!navigator.mediaDevices?.getUserMedia) return;
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		for (const track of stream.getTracks()) track.stop();
	} catch {}
}
//#endregion
//#region src/settings/sections/mic-input.ts
function renderMicInputSection(containerEl, plugin) {
	let deviceDropdown;
	const refreshDeviceOptions = async () => {
		if (!deviceDropdown) return;
		const devices = await listInputDevices();
		const current = plugin.settings.micInputDeviceId;
		deviceDropdown.selectEl.empty();
		deviceDropdown.addOption("", "Systemstandard");
		for (const device of devices) {
			if (!device.deviceId || device.deviceId === "default") continue;
			deviceDropdown.addOption(device.deviceId, device.label || `Gerät ${device.deviceId.slice(0, 8)}`);
		}
		const hasCurrent = current === "" || devices.some((d) => d.deviceId === current);
		deviceDropdown.setValue(hasCurrent ? current : "");
	};
	new obsidian.Setting(containerEl).setName("Mikrofon (Spracheingabe)").setDesc("Mikrofon für die Sprachaufnahme-Taste im Chat. \"Geräte erkennen\" fragt einmalig nach Mikrofonberechtigung, nur um Gerätenamen auszulesen - es wird nichts aufgenommen oder übertragen.").addDropdown((dropdown) => {
		deviceDropdown = dropdown;
		dropdown.addOption("", "Systemstandard");
		dropdown.onChange(async (value) => {
			plugin.settings.micInputDeviceId = value;
			await plugin.saveSettings();
		});
	}).addButton((button) => {
		button.setButtonText("Geräte erkennen");
		button.onClick(async () => {
			button.setDisabled(true);
			await unlockDeviceLabels();
			await refreshDeviceOptions();
			button.setDisabled(false);
		});
	});
	refreshDeviceOptions();
}
//#endregion
//#region src/settings/sections/retrieval.ts
function renderRetrievalSection(containerEl, plugin) {
	new obsidian.Setting(containerEl).setName("Embedding model").setDesc("Must match the model the index was built with (see rag-manifest.json). Google-only.").addText((text) => text.setValue(plugin.settings.embeddingModel).onChange(async (value) => {
		plugin.settings.embeddingModel = value.trim();
		await plugin.saveSettings();
		await plugin.revalidateManifest();
	}));
}
function renderRetrievalKnobs(containerEl, plugin) {
	addNumberField(containerEl, {
		name: "Output dimensions",
		desc: "Must match rag-manifest.json's embeddingDims (3072 - full-fidelity, no truncation).",
		getValue: () => plugin.settings.outputDim,
		isValid: (n) => n > 0,
		onValid: async (n) => {
			plugin.settings.outputDim = n;
			await plugin.saveSettings();
			await plugin.revalidateManifest();
		}
	});
	addNumberField(containerEl, {
		name: "Top K",
		desc: "Number of retrieval hits to consider (before parent-note dedup).",
		getValue: () => plugin.settings.topK,
		isValid: (n) => n > 0,
		onValid: async (n) => {
			plugin.settings.topK = n;
			await plugin.saveSettings();
		}
	});
	addNumberField(containerEl, {
		name: "Similarity threshold",
		desc: "Minimum vector similarity for the vector leg (0-1). Measured on this corpus: real natural-language queries top out around 0.60-0.75 cosine similarity even for the exact correct page — setting this above ~0.75 silently disables the vector leg entirely on most real questions. Default 0.55 is calibrated from live benchmarking, not a guess.",
		getValue: () => plugin.settings.similarity,
		parse: (raw) => parseFloat(raw),
		isValid: (n) => n >= 0 && n <= 1,
		onValid: async (n) => {
			plugin.settings.similarity = n;
			await plugin.saveSettings();
		}
	});
	addNumberField(containerEl, {
		name: "Hybrid fusion (RRF) k",
		desc: "Reciprocal Rank Fusion constant merging the BM25 and vector leg rankings. Small values (1-10) were empirically best on this corpus; the common literature default of 60 buried single-leg-exclusive top matches under documents merely mediocre on both legs.",
		getValue: () => plugin.settings.rrfK,
		isValid: (n) => n > 0,
		onValid: async (n) => {
			plugin.settings.rrfK = n;
			await plugin.saveSettings();
		}
	});
}
//#endregion
//#region src/tts/playback.ts
var audioEl;
var onEndedCallback = null;
function getAudioEl() {
	if (!audioEl) {
		audioEl = new Audio();
		audioEl.addEventListener("ended", () => onEndedCallback?.());
	}
	return audioEl;
}
function setOnEnded(cb) {
	onEndedCallback = cb;
}
async function play(base64Mp3, opts) {
	const audio = getAudioEl();
	stop();
	audio.src = `data:audio/mpeg;base64,${base64Mp3}`;
	audio.volume = opts.volume;
	const sinkCapableAudio = audio;
	if (opts.deviceId && typeof sinkCapableAudio.setSinkId === "function") try {
		await sinkCapableAudio.setSinkId(opts.deviceId);
	} catch (err) {
		new obsidian.Notice(`RAG Chat: Audioausgabegerät konnte nicht gesetzt werden, verwende Systemstandard (${err instanceof Error ? err.message : String(err)}).`, 6e3);
		try {
			await sinkCapableAudio.setSinkId("default");
		} catch {}
	}
	await audio.play();
}
function setVolume(v) {
	if (audioEl) audioEl.volume = v;
}
function stop() {
	if (!audioEl) return;
	audioEl.pause();
	audioEl.currentTime = 0;
}
function dispose() {
	if (!audioEl) return;
	audioEl.pause();
	audioEl.src = "";
	audioEl = void 0;
}
//#endregion
//#region src/view/confirm-modal.ts
var ConfirmModal = class extends obsidian.Modal {
	constructor(app, message, resolveFn) {
		super(app);
		this.resolved = false;
		this.message = message;
		this.resolveFn = resolveFn;
	}
	onOpen() {
		this.contentEl.createEl("p", { text: this.message });
		const buttonRow = this.contentEl.createDiv({ cls: "rag-chat-confirm-modal-buttons" });
		buttonRow.createEl("button", { text: "Nein" }).addEventListener("click", () => {
			this.settle(false);
			this.close();
		});
		buttonRow.createEl("button", {
			cls: "mod-warning",
			text: "Ja"
		}).addEventListener("click", () => {
			this.settle(true);
			this.close();
		});
	}
	onClose() {
		this.settle(false);
		this.contentEl.empty();
	}
	settle(value) {
		if (this.resolved) return;
		this.resolved = true;
		this.resolveFn(value);
	}
};
function confirmModal(app, message) {
	return new Promise((resolve) => {
		new ConfirmModal(app, message, resolve).open();
	});
}
//#endregion
//#region src/settings/sections/tts-audio.ts
function renderTtsAudioSection(containerEl, plugin, app) {
	renderDevicePicker(containerEl, plugin);
	new obsidian.Setting(containerEl).setName("Lautstärke").addSlider((slider) => slider.setLimits(0, 1, .01).setValue(plugin.settings.ttsVolume).onChange(async (value) => {
		setVolume(value);
		plugin.settings.ttsVolume = value;
		await plugin.saveSettings();
	}));
	renderCharCounter(containerEl, plugin, app);
}
function renderDevicePicker(containerEl, plugin) {
	let deviceDropdown;
	const refreshDeviceOptions = async () => {
		if (!deviceDropdown) return;
		const devices = await listOutputDevices();
		const current = plugin.settings.ttsOutputDeviceId;
		deviceDropdown.selectEl.empty();
		deviceDropdown.addOption("", "Systemstandard");
		for (const device of devices) {
			if (!device.deviceId || device.deviceId === "default") continue;
			deviceDropdown.addOption(device.deviceId, device.label || `Gerät ${device.deviceId.slice(0, 8)}`);
		}
		const hasCurrent = current === "" || devices.some((d) => d.deviceId === current);
		deviceDropdown.setValue(hasCurrent ? current : "");
	};
	new obsidian.Setting(containerEl).setName("Audioausgabegerät").setDesc("\"Geräte erkennen\" fragt einmalig nach Mikrofonberechtigung, nur um Gerätenamen auszulesen - es wird nichts aufgenommen oder übertragen.").addDropdown((dropdown) => {
		deviceDropdown = dropdown;
		dropdown.addOption("", "Systemstandard");
		dropdown.onChange(async (value) => {
			plugin.settings.ttsOutputDeviceId = value;
			await plugin.saveSettings();
		});
	}).addButton((button) => {
		button.setButtonText("Geräte erkennen");
		button.onClick(async () => {
			button.setDisabled(true);
			await unlockDeviceLabels();
			await refreshDeviceOptions();
			button.setDisabled(false);
		});
	});
	refreshDeviceOptions();
}
function renderCharCounter(containerEl, plugin, app) {
	const setting = new obsidian.Setting(containerEl).setName("Zeichenzähler (Chirp 3 HD)");
	const updateDesc = () => {
		const used = plugin.settings.ttsCharCount.toLocaleString("de-DE");
		const limit = TTS_FREE_TIER_CHAR_LIMIT.toLocaleString("de-DE");
		setting.setDesc(`${used} / ${limit} Zeichen (Freikontingent).`);
	};
	updateDesc();
	setting.addButton((button) => {
		button.setButtonText("Zurücksetzen").setWarning();
		button.onClick(async () => {
			if (!await confirmModal(app, "Zeichenzähler wirklich zurücksetzen?")) return;
			plugin.settings.ttsCharCount = 0;
			await plugin.saveSettings();
			updateDesc();
		});
	});
}
//#endregion
//#region src/tts/voices.ts
var CHIRP3_HD_NAME_PATTERN = /Chirp3-HD/i;
async function listChirp3Voices(apiKey, signal) {
	if (!apiKey) return [];
	try {
		const json = (await requestUrlWithRetry({
			url: "https://texttospeech.googleapis.com/v1/voices",
			method: "GET",
			headers: { "X-Goog-Api-Key": apiKey }
		}, {
			label: "Stimmenliste",
			signal
		})).json;
		const voices = [];
		for (const voice of json.voices ?? []) {
			if (!CHIRP3_HD_NAME_PATTERN.test(voice.name)) continue;
			voices.push({
				name: voice.name,
				languageCodes: voice.languageCodes ?? []
			});
		}
		voices.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
		return voices;
	} catch {
		return [];
	}
}
//#endregion
//#region src/settings/sections/tts-voice.ts
function renderTtsVoiceSection(containerEl, plugin) {
	containerEl.createEl("h3", { text: "Sprachausgabe (TTS)" });
	containerEl.createEl("p", { text: "Optional: zusätzlich zur gewohnten, zitatreichen Antwort wird eine kurze, gesprochene Zusammenfassung erzeugt und über Google Cloud Text-to-Speech (Chirp 3: HD) abgespielt - z.B. für die Werkstatt, um ein Anzugsdrehmoment vorgelesen zu bekommen." });
	new obsidian.Setting(containerEl).setName("Sprachausgabe aktivieren").setDesc("Setzt den Anfangszustand der Sprachausgabe-Checkbox im Chat (dort jederzeit umschaltbar).").addToggle((toggle) => toggle.setValue(plugin.settings.ttsEnabled).onChange(async (value) => {
		plugin.settings.ttsEnabled = value;
		await plugin.saveSettings();
	}));
	addSecretText(containerEl, {
		name: "TTS API key",
		desc: "Separater Google Cloud API-Key für Text-to-Speech (optional). Benötigt aktivierte Cloud Text-to-Speech API und Billing im zugehörigen Projekt. Leer = Sprachausgabe deaktiviert.",
		getValue: () => plugin.settings.ttsApiKey,
		setValue: async (value) => {
			plugin.settings.ttsApiKey = value;
			await plugin.saveSettings();
		}
	});
	renderVoicePickers(containerEl, plugin);
}
function renderVoicePickers(containerEl, plugin) {
	let languageDropdown;
	let voiceDropdown;
	let voiceRefreshButton;
	let voicesCache = [];
	const populateVoiceOptions = (languageCode) => {
		if (!voiceDropdown) return;
		const currentVoice = plugin.settings.ttsVoiceName;
		const names = voicesCache.filter((v) => v.languageCodes.includes(languageCode)).map((v) => v.name);
		const options = names.includes(currentVoice) ? names : [currentVoice, ...names];
		voiceDropdown.selectEl.empty();
		for (const name of options) voiceDropdown.addOption(name, name);
		voiceDropdown.setValue(currentVoice);
	};
	const refreshVoiceOptions = async () => {
		if (!languageDropdown || !voiceDropdown) return;
		languageDropdown.setDisabled(true);
		voiceDropdown.setDisabled(true);
		voiceRefreshButton?.setDisabled(true);
		voicesCache = await listChirp3Voices(plugin.settings.ttsApiKey);
		const currentLanguage = plugin.settings.ttsLanguageCode;
		const languageCodes = Array.from(new Set(voicesCache.flatMap((v) => v.languageCodes))).sort();
		const languageOptions = languageCodes.includes(currentLanguage) ? languageCodes : [currentLanguage, ...languageCodes];
		languageDropdown.selectEl.empty();
		for (const code of languageOptions) languageDropdown.addOption(code, code);
		languageDropdown.setValue(currentLanguage);
		populateVoiceOptions(currentLanguage);
		languageDropdown.setDisabled(false);
		voiceDropdown.setDisabled(false);
		voiceRefreshButton?.setDisabled(false);
	};
	new obsidian.Setting(containerEl).setName("Sprache").addDropdown((dropdown) => {
		languageDropdown = dropdown;
		dropdown.addOption(plugin.settings.ttsLanguageCode, plugin.settings.ttsLanguageCode);
		dropdown.setValue(plugin.settings.ttsLanguageCode);
		dropdown.onChange(async (value) => {
			plugin.settings.ttsLanguageCode = value;
			await plugin.saveSettings();
			populateVoiceOptions(value);
		});
	});
	new obsidian.Setting(containerEl).setName("Stimme (Chirp 3: HD)").addDropdown((dropdown) => {
		voiceDropdown = dropdown;
		dropdown.addOption(plugin.settings.ttsVoiceName, plugin.settings.ttsVoiceName);
		dropdown.setValue(plugin.settings.ttsVoiceName);
		dropdown.onChange(async (value) => {
			plugin.settings.ttsVoiceName = value;
			await plugin.saveSettings();
		});
	}).addButton((button) => {
		voiceRefreshButton = button;
		button.setIcon("refresh-cw").setTooltip("Stimmenliste aktualisieren");
		button.onClick(() => {
			refreshVoiceOptions();
		});
	});
	refreshVoiceOptions();
}
//#endregion
//#region src/settings/settings-tab.ts
var RagChatSettingTab = class extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display() {
		this.containerEl.empty();
		const { containerEl } = this;
		renderApiKeySection(containerEl, this.plugin);
		renderRetrievalSection(containerEl, this.plugin);
		renderGenerationModel(containerEl, this.plugin);
		renderRetrievalKnobs(containerEl, this.plugin);
		renderAgentSection(containerEl, this.plugin);
		renderTtsVoiceSection(containerEl, this.plugin);
		renderTtsAudioSection(containerEl, this.plugin, this.app);
		renderMicInputSection(containerEl, this.plugin);
	}
};
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/tokenizer/languages.js
var STEMMERS = {
	arabic: "ar",
	armenian: "am",
	bulgarian: "bg",
	czech: "cz",
	danish: "dk",
	dutch: "nl",
	english: "en",
	finnish: "fi",
	french: "fr",
	german: "de",
	greek: "gr",
	hungarian: "hu",
	indian: "in",
	indonesian: "id",
	irish: "ie",
	italian: "it",
	lithuanian: "lt",
	nepali: "np",
	norwegian: "no",
	portuguese: "pt",
	romanian: "ro",
	russian: "ru",
	serbian: "rs",
	slovenian: "ru",
	spanish: "es",
	swedish: "se",
	tamil: "ta",
	turkish: "tr",
	ukrainian: "uk",
	sanskrit: "sk"
};
var SPLITTERS = {
	dutch: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
	english: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
	french: /[^a-z0-9äâàéèëêïîöôùüûœç-]+/gim,
	italian: /[^A-Za-zàèéìòóù0-9_'-]+/gim,
	norwegian: /[^a-z0-9_æøåÆØÅäÄöÖüÜ]+/gim,
	portuguese: /[^a-z0-9à-úÀ-Ú]/gim,
	russian: /[^a-z0-9а-яА-ЯёЁ]+/gim,
	spanish: /[^a-z0-9A-Zá-úÁ-ÚñÑüÜ]+/gim,
	swedish: /[^a-z0-9_åÅäÄöÖüÜ-]+/gim,
	german: /[^a-z0-9A-ZäöüÄÖÜß]+/gim,
	finnish: /[^a-z0-9äöÄÖ]+/gim,
	danish: /[^a-z0-9æøåÆØÅ]+/gim,
	hungarian: /[^a-z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/gim,
	romanian: /[^a-z0-9ăâîșțĂÂÎȘȚ]+/gim,
	serbian: /[^a-z0-9čćžšđČĆŽŠĐ]+/gim,
	turkish: /[^a-z0-9çÇğĞıİöÖşŞüÜ]+/gim,
	lithuanian: /[^a-z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ]+/gim,
	arabic: /[^a-z0-9أ-ي]+/gim,
	nepali: /[^a-z0-9अ-ह]+/gim,
	irish: /[^a-z0-9áéíóúÁÉÍÓÚ]+/gim,
	indian: /[^a-z0-9अ-ह]+/gim,
	armenian: /[^a-z0-9ա-ֆ]+/gim,
	greek: /[^a-z0-9α-ωά-ώ]+/gim,
	indonesian: /[^a-z0-9]+/gim,
	ukrainian: /[^a-z0-9а-яА-ЯіїєІЇЄ]+/gim,
	slovenian: /[^a-z0-9čžšČŽŠ]+/gim,
	bulgarian: /[^a-z0-9а-яА-Я]+/gim,
	tamil: /[^a-z0-9அ-ஹ]+/gim,
	sanskrit: /[^a-z0-9A-Zāīūṛḷṃṁḥśṣṭḍṇṅñḻḹṝ]+/gim,
	czech: /[^A-Z0-9a-zěščřžýáíéúůóťďĚŠČŘŽÝÁÍÉÓÚŮŤĎ-]+/gim
};
var SUPPORTED_LANGUAGES = Object.keys(STEMMERS);
function getLocale(language) {
	return language !== void 0 && SUPPORTED_LANGUAGES.includes(language) ? STEMMERS[language] : void 0;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/utils.js
var baseId = Date.now().toString().slice(5);
var lastId = 0;
var nano = BigInt(1e3);
var milli = BigInt(1e6);
var second = BigInt(1e9);
/**
* This value can be increased up to 100_000
* But i don't know if this value change from nodejs to nodejs
* So I will keep a safer value here.
*/
var MAX_ARGUMENT_FOR_STACK = 65535;
/**
* This method is needed to used because of issues like: https://github.com/oramasearch/orama/issues/301
* that issue is caused because the array that is pushed is huge (>100k)
*
* @example
* ```ts
* safeArrayPush(myArray, [1, 2])
* ```
*/
function safeArrayPush(arr, newArr) {
	if (newArr.length < 65535) Array.prototype.push.apply(arr, newArr);
	else {
		const newArrLength = newArr.length;
		for (let i = 0; i < newArrLength; i += MAX_ARGUMENT_FOR_STACK) Array.prototype.push.apply(arr, newArr.slice(i, i + MAX_ARGUMENT_FOR_STACK));
	}
}
function sprintf(template, ...args) {
	return template.replace(/%(?:(?<position>\d+)\$)?(?<width>-?\d*\.?\d*)(?<type>[dfs])/g, function(...replaceArgs) {
		const { width: rawWidth, type, position } = replaceArgs[replaceArgs.length - 1];
		const replacement = position ? args[Number.parseInt(position) - 1] : args.shift();
		const width = rawWidth === "" ? 0 : Number.parseInt(rawWidth);
		switch (type) {
			case "d": return replacement.toString().padStart(width, "0");
			case "f": {
				let value = replacement;
				const [padding, precision] = rawWidth.split(".").map((w) => Number.parseFloat(w));
				if (typeof precision === "number" && precision >= 0) value = value.toFixed(precision);
				return typeof padding === "number" && padding >= 0 ? value.toString().padStart(width, "0") : value.toString();
			}
			case "s": return width < 0 ? replacement.toString().padEnd(-width, " ") : replacement.toString().padStart(width, " ");
			default: return replacement;
		}
	});
}
function isInsideWebWorker() {
	return typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
}
function isInsideNode() {
	return typeof process !== "undefined" && process.release && process.release.name === "node";
}
function getNanosecondTimeViaPerformance() {
	return BigInt(Math.floor(performance.now() * 1e6));
}
function formatNanoseconds(value) {
	if (typeof value === "number") value = BigInt(value);
	if (value < nano) return `${value}ns`;
	else if (value < milli) return `${value / nano}μs`;
	else if (value < second) return `${value / milli}ms`;
	return `${value / second}s`;
}
function getNanosecondsTime() {
	if (isInsideWebWorker()) return getNanosecondTimeViaPerformance();
	if (isInsideNode()) return process.hrtime.bigint();
	if (typeof process !== "undefined" && typeof process?.hrtime?.bigint === "function") return process.hrtime.bigint();
	if (typeof performance !== "undefined") return getNanosecondTimeViaPerformance();
	return BigInt(0);
}
function uniqueId() {
	return `${baseId}-${lastId++}`;
}
function getOwnProperty(object, property) {
	if (Object.hasOwn === void 0) return Object.prototype.hasOwnProperty.call(object, property) ? object[property] : void 0;
	return Object.hasOwn(object, property) ? object[property] : void 0;
}
function sortTokenScorePredicate(a, b) {
	if (b[1] === a[1]) return a[0] - b[0];
	return b[1] - a[1];
}
function intersect(arrays) {
	if (arrays.length === 0) return [];
	else if (arrays.length === 1) return arrays[0];
	for (let i = 1; i < arrays.length; i++) if (arrays[i].length < arrays[0].length) {
		const tmp = arrays[0];
		arrays[0] = arrays[i];
		arrays[i] = tmp;
	}
	const set = /* @__PURE__ */ new Map();
	for (const elem of arrays[0]) set.set(elem, 1);
	for (let i = 1; i < arrays.length; i++) {
		let found = 0;
		for (const elem of arrays[i]) {
			const count = set.get(elem);
			if (count === i) {
				set.set(elem, count + 1);
				found++;
			}
		}
		if (found === 0) return [];
	}
	return arrays[0].filter((e) => {
		const count = set.get(e);
		if (count !== void 0) set.set(e, 0);
		return count === arrays.length;
	});
}
function getDocumentProperties(doc, paths) {
	const properties = {};
	const pathsLength = paths.length;
	for (let i = 0; i < pathsLength; i++) {
		const path = paths[i];
		const pathTokens = path.split(".");
		let current = doc;
		const pathTokensLength = pathTokens.length;
		for (let j = 0; j < pathTokensLength; j++) {
			current = current[pathTokens[j]];
			if (typeof current === "object") {
				if (current !== null && "lat" in current && "lon" in current && typeof current.lat === "number" && typeof current.lon === "number") {
					current = properties[path] = current;
					break;
				} else if (!Array.isArray(current) && current !== null && j === pathTokensLength - 1) {
					current = void 0;
					break;
				}
			} else if ((current === null || typeof current !== "object") && j < pathTokensLength - 1) {
				current = void 0;
				break;
			}
		}
		if (typeof current !== "undefined") properties[path] = current;
	}
	return properties;
}
function getNested(obj, path) {
	return getDocumentProperties(obj, [path])[path];
}
var mapDistanceToMeters = {
	cm: .01,
	m: 1,
	km: 1e3,
	ft: .3048,
	yd: .9144,
	mi: 1609.344
};
function convertDistanceToMeters(distance, unit) {
	const ratio = mapDistanceToMeters[unit];
	if (ratio === void 0) throw new Error(createError("INVALID_DISTANCE_SUFFIX", distance).message);
	return distance * ratio;
}
function removeVectorsFromHits(searchResult, vectorProperties) {
	searchResult.hits = searchResult.hits.map((result) => ({
		...result,
		document: {
			...result.document,
			...vectorProperties.reduce((acc, prop) => {
				const path = prop.split(".");
				const lastKey = path.pop();
				let obj = acc;
				for (const key of path) {
					obj[key] = obj[key] ?? {};
					obj = obj[key];
				}
				obj[lastKey] = null;
				return acc;
			}, result.document)
		}
	}));
}
/**
* Checks if the provided input is an async function or if the input is an array
* containing at least one async function.
*
* @param func - A single function or an array of functions to check.
*               Non-function values are ignored.
* @returns `true` if the input is an async function or an array containing at least
*          one async function, otherwise `false`.
*/
function isAsyncFunction(func) {
	if (Array.isArray(func)) return func.some((item) => isAsyncFunction(item));
	return func?.constructor?.name === "AsyncFunction";
}
var withIntersection = "intersection" in /* @__PURE__ */ new Set();
function setIntersection(...sets) {
	if (sets.length === 0) return /* @__PURE__ */ new Set();
	if (sets.length === 1) return sets[0];
	if (sets.length === 2) {
		const set1 = sets[0];
		const set2 = sets[1];
		if (withIntersection) return set1.intersection(set2);
		const result = /* @__PURE__ */ new Set();
		const base = set1.size < set2.size ? set1 : set2;
		const other = base === set1 ? set2 : set1;
		for (const value of base) if (other.has(value)) result.add(value);
		return result;
	}
	const min = {
		index: 0,
		size: sets[0].size
	};
	for (let i = 1; i < sets.length; i++) if (sets[i].size < min.size) {
		min.index = i;
		min.size = sets[i].size;
	}
	if (withIntersection) {
		let base = sets[min.index];
		for (let i = 0; i < sets.length; i++) {
			if (i === min.index) continue;
			base = base.intersection(sets[i]);
		}
		return base;
	}
	const base = sets[min.index];
	for (let i = 0; i < sets.length; i++) {
		if (i === min.index) continue;
		const other = sets[i];
		for (const value of base) if (!other.has(value)) base.delete(value);
	}
	return base;
}
var withUnion = "union" in /* @__PURE__ */ new Set();
function setUnion(set1, set2) {
	if (withUnion) {
		if (set1) return set1.union(set2);
		return set2;
	}
	if (!set1) return new Set(set2);
	return /* @__PURE__ */ new Set([...set1, ...set2]);
}
function setDifference(set1, set2) {
	const result = /* @__PURE__ */ new Set();
	for (const value of set1) if (!set2.has(value)) result.add(value);
	return result;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/errors.js
var errors = {
	NO_LANGUAGE_WITH_CUSTOM_TOKENIZER: "Do not pass the language option to create when using a custom tokenizer.",
	LANGUAGE_NOT_SUPPORTED: `Language "%s" is not supported.\nSupported languages are:\n - ${SUPPORTED_LANGUAGES.join("\n - ")}`,
	INVALID_STEMMER_FUNCTION_TYPE: `config.stemmer property must be a function.`,
	MISSING_STEMMER: `As of version 1.0.0 @orama/orama does not ship non English stemmers by default. To solve this, please explicitly import and specify the "%s" stemmer from the package @orama/stemmers. See https://docs.orama.com/docs/orama-js/text-analysis/stemming for more information.`,
	CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY: "Custom stop words array must only contain strings.",
	UNSUPPORTED_COMPONENT: `Unsupported component "%s".`,
	COMPONENT_MUST_BE_FUNCTION: `The component "%s" must be a function.`,
	COMPONENT_MUST_BE_FUNCTION_OR_ARRAY_FUNCTIONS: `The component "%s" must be a function or an array of functions.`,
	INVALID_SCHEMA_TYPE: `Unsupported schema type "%s" at "%s". Expected "string", "boolean" or "number" or array of them.`,
	DOCUMENT_ID_MUST_BE_STRING: `Document id must be of type "string". Got "%s" instead.`,
	DOCUMENT_ALREADY_EXISTS: `A document with id "%s" already exists.`,
	DOCUMENT_DOES_NOT_EXIST: `A document with id "%s" does not exists.`,
	MISSING_DOCUMENT_PROPERTY: `Missing searchable property "%s".`,
	INVALID_DOCUMENT_PROPERTY: `Invalid document property "%s": expected "%s", got "%s"`,
	UNKNOWN_INDEX: `Invalid property name "%s". Expected a wildcard string ("*") or array containing one of the following properties: %s`,
	INVALID_BOOST_VALUE: `Boost value must be a number greater than, or less than 0.`,
	INVALID_FILTER_OPERATION: `You can only use one operation per filter, you requested %d.`,
	SCHEMA_VALIDATION_FAILURE: `Cannot insert document due schema validation failure on "%s" property.`,
	INVALID_SORT_SCHEMA_TYPE: `Unsupported sort schema type "%s" at "%s". Expected "string" or "number".`,
	CANNOT_SORT_BY_ARRAY: `Cannot configure sort for "%s" because it is an array (%s).`,
	UNABLE_TO_SORT_ON_UNKNOWN_FIELD: `Unable to sort on unknown field "%s". Allowed fields: %s`,
	SORT_DISABLED: `Sort is disabled. Please read the documentation at https://docs.orama.com/docs/orama-js for more information.`,
	UNKNOWN_GROUP_BY_PROPERTY: `Unknown groupBy property "%s".`,
	INVALID_GROUP_BY_PROPERTY: `Invalid groupBy property "%s". Allowed types: "%s", but given "%s".`,
	UNKNOWN_FILTER_PROPERTY: `Unknown filter property "%s".`,
	UNKNOWN_VECTOR_PROPERTY: `Unknown vector property "%s". Make sure the property exists in the schema and is configured as a vector.`,
	INVALID_VECTOR_SIZE: `Vector size must be a number greater than 0. Got "%s" instead.`,
	INVALID_VECTOR_VALUE: `Vector value must be a number greater than 0. Got "%s" instead.`,
	INVALID_INPUT_VECTOR: `Property "%s" was declared as a %s-dimensional vector, but got a %s-dimensional vector instead.\nInput vectors must be of the size declared in the schema, as calculating similarity between vectors of different sizes can lead to unexpected results.`,
	WRONG_SEARCH_PROPERTY_TYPE: `Property "%s" is not searchable. Only "string" properties are searchable.`,
	FACET_NOT_SUPPORTED: `Facet doens't support the type "%s".`,
	INVALID_DISTANCE_SUFFIX: `Invalid distance suffix "%s". Valid suffixes are: cm, m, km, mi, yd, ft.`,
	INVALID_SEARCH_MODE: `Invalid search mode "%s". Valid modes are: "fulltext", "vector", "hybrid".`,
	MISSING_VECTOR_AND_SECURE_PROXY: `No vector was provided and no secure proxy was configured. Please provide a vector or configure an Orama Secure Proxy to perform hybrid search.`,
	MISSING_TERM: `"term" is a required parameter when performing hybrid search. Please provide a search term.`,
	INVALID_VECTOR_INPUT: `Invalid "vector" property. Expected an object with "value" and "property" properties, but got "%s" instead.`,
	PLUGIN_CRASHED: `A plugin crashed during initialization. Please check the error message for more information:`,
	PLUGIN_SECURE_PROXY_NOT_FOUND: `Could not find '@orama/secure-proxy-plugin' installed in your Orama instance.\nPlease install it before proceeding with creating an answer session.\nRead more at https://docs.orama.com/docs/orama-js/plugins/plugin-secure-proxy#plugin-secure-proxy\n`,
	PLUGIN_SECURE_PROXY_MISSING_CHAT_MODEL: `Could not find a chat model defined in the secure proxy plugin configuration.\nPlease provide a chat model before proceeding with creating an answer session.\nRead more at https://docs.orama.com/docs/orama-js/plugins/plugin-secure-proxy#plugin-secure-proxy\n`,
	ANSWER_SESSION_LAST_MESSAGE_IS_NOT_ASSISTANT: `The last message in the session is not an assistant message. Cannot regenerate non-assistant messages.`,
	PLUGIN_COMPONENT_CONFLICT: `The component "%s" is already defined. The plugin "%s" is trying to redefine it.`
};
function createError(code, ...args) {
	const error = new Error(sprintf(errors[code] ?? `Unsupported Orama Error code: ${code}`, ...args));
	error.code = code;
	if ("captureStackTrace" in Error.prototype) Error.captureStackTrace(error);
	return error;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/defaults.js
function formatElapsedTime(n) {
	return {
		raw: Number(n),
		formatted: formatNanoseconds(n)
	};
}
function getDocumentIndexId(doc) {
	if (doc.id) {
		if (typeof doc.id !== "string") throw createError("DOCUMENT_ID_MUST_BE_STRING", typeof doc.id);
		return doc.id;
	}
	return uniqueId();
}
function validateSchema(doc, schema) {
	for (const [prop, type] of Object.entries(schema)) {
		const value = doc[prop];
		if (typeof value === "undefined") continue;
		if (type === "geopoint" && typeof value === "object" && typeof value.lon === "number" && typeof value.lat === "number") continue;
		if (type === "enum" && (typeof value === "string" || typeof value === "number")) continue;
		if (type === "enum[]" && Array.isArray(value)) {
			const valueLength = value.length;
			for (let i = 0; i < valueLength; i++) if (typeof value[i] !== "string" && typeof value[i] !== "number") return prop + "." + i;
			continue;
		}
		if (isVectorType(type)) {
			const vectorSize = getVectorSize(type);
			if (!Array.isArray(value) || value.length !== vectorSize) throw createError("INVALID_INPUT_VECTOR", prop, vectorSize, value.length);
			continue;
		}
		if (isArrayType(type)) {
			if (!Array.isArray(value)) return prop;
			const expectedType = getInnerType(type);
			const valueLength = value.length;
			for (let i = 0; i < valueLength; i++) if (typeof value[i] !== expectedType) return prop + "." + i;
			continue;
		}
		if (typeof type === "object") {
			if (!value || typeof value !== "object") return prop;
			const subProp = validateSchema(value, type);
			if (subProp) return prop + "." + subProp;
			continue;
		}
		if (typeof value !== type) return prop;
	}
}
var IS_ARRAY_TYPE = {
	string: false,
	number: false,
	boolean: false,
	enum: false,
	geopoint: false,
	"string[]": true,
	"number[]": true,
	"boolean[]": true,
	"enum[]": true
};
var INNER_TYPE = {
	"string[]": "string",
	"number[]": "number",
	"boolean[]": "boolean",
	"enum[]": "enum"
};
function isVectorType(type) {
	return typeof type === "string" && /^vector\[\d+\]$/.test(type);
}
function isArrayType(type) {
	return typeof type === "string" && IS_ARRAY_TYPE[type];
}
function getInnerType(type) {
	return INNER_TYPE[type];
}
function getVectorSize(type) {
	const size = Number(type.slice(7, -1));
	switch (true) {
		case isNaN(size): throw createError("INVALID_VECTOR_VALUE", type);
		case size <= 0: throw createError("INVALID_VECTOR_SIZE", type);
		default: return size;
	}
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/internal-document-id-store.js
function createInternalDocumentIDStore() {
	return {
		idToInternalId: /* @__PURE__ */ new Map(),
		internalIdToId: [],
		save: save$5,
		load: load$5
	};
}
function save$5(store) {
	return { internalIdToId: store.internalIdToId };
}
function load$5(orama, raw) {
	const { internalIdToId } = raw;
	orama.internalDocumentIDStore.idToInternalId.clear();
	orama.internalDocumentIDStore.internalIdToId = [];
	const internalIdToIdLength = internalIdToId.length;
	for (let i = 0; i < internalIdToIdLength; i++) {
		const internalIdItem = internalIdToId[i];
		orama.internalDocumentIDStore.idToInternalId.set(internalIdItem, i + 1);
		orama.internalDocumentIDStore.internalIdToId.push(internalIdItem);
	}
}
function getInternalDocumentId(store, id) {
	if (typeof id === "string") {
		const internalId = store.idToInternalId.get(id);
		if (internalId) return internalId;
		const currentId = store.idToInternalId.size + 1;
		store.idToInternalId.set(id, currentId);
		store.internalIdToId.push(id);
		return currentId;
	}
	if (id > store.internalIdToId.length) return getInternalDocumentId(store, id.toString());
	return id;
}
function getDocumentIdFromInternalId(store, internalId) {
	if (store.internalIdToId.length < internalId) throw new Error(`Invalid internalId ${internalId}`);
	return store.internalIdToId[internalId - 1];
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/documents-store.js
function create$4(_, sharedInternalDocumentStore) {
	return {
		sharedInternalDocumentStore,
		docs: {},
		count: 0
	};
}
function get(store, id) {
	const internalId = getInternalDocumentId(store.sharedInternalDocumentStore, id);
	return store.docs[internalId];
}
function getMultiple(store, ids) {
	const idsLength = ids.length;
	const found = Array.from({ length: idsLength });
	for (let i = 0; i < idsLength; i++) {
		const internalId = getInternalDocumentId(store.sharedInternalDocumentStore, ids[i]);
		found[i] = store.docs[internalId];
	}
	return found;
}
function getAll(store) {
	return store.docs;
}
function store(store, id, internalId, doc) {
	if (typeof store.docs[internalId] !== "undefined") return false;
	store.docs[internalId] = doc;
	store.count++;
	return true;
}
function remove$2(store, id) {
	const internalId = getInternalDocumentId(store.sharedInternalDocumentStore, id);
	if (typeof store.docs[internalId] === "undefined") return false;
	delete store.docs[internalId];
	store.count--;
	return true;
}
function count$1(store) {
	return store.count;
}
function load$4(sharedInternalDocumentStore, raw) {
	const rawDocument = raw;
	return {
		docs: rawDocument.docs,
		count: rawDocument.count,
		sharedInternalDocumentStore
	};
}
function save$4(store) {
	return {
		docs: store.docs,
		count: store.count
	};
}
function createDocumentsStore() {
	return {
		create: create$4,
		get,
		getMultiple,
		getAll,
		store,
		remove: remove$2,
		count: count$1,
		load: load$4,
		save: save$4
	};
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/plugins.js
var AVAILABLE_PLUGIN_HOOKS = [
	"beforeInsert",
	"afterInsert",
	"beforeRemove",
	"afterRemove",
	"beforeUpdate",
	"afterUpdate",
	"beforeUpsert",
	"afterUpsert",
	"beforeSearch",
	"afterSearch",
	"beforeInsertMultiple",
	"afterInsertMultiple",
	"beforeRemoveMultiple",
	"afterRemoveMultiple",
	"beforeUpdateMultiple",
	"afterUpdateMultiple",
	"beforeUpsertMultiple",
	"afterUpsertMultiple",
	"beforeLoad",
	"afterLoad",
	"afterCreate"
];
function getAllPluginsByHook(orama, hook) {
	const pluginsToRun = [];
	const pluginsLength = orama.plugins?.length;
	if (!pluginsLength) return pluginsToRun;
	for (let i = 0; i < pluginsLength; i++) try {
		const plugin = orama.plugins[i];
		if (typeof plugin[hook] === "function") pluginsToRun.push(plugin[hook]);
	} catch (error) {
		console.error("Caught error in getAllPluginsByHook:", error);
		throw createError("PLUGIN_CRASHED");
	}
	return pluginsToRun;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/hooks.js
var OBJECT_COMPONENTS = [
	"tokenizer",
	"index",
	"documentsStore",
	"sorter",
	"pinning"
];
var FUNCTION_COMPONENTS = [
	"validateSchema",
	"getDocumentIndexId",
	"getDocumentProperties",
	"formatElapsedTime"
];
function runAfterSearch(hooks, db, params, language, results) {
	if (hooks.some(isAsyncFunction)) return (async () => {
		for (const hook of hooks) await hook(db, params, language, results);
	})();
	else for (const hook of hooks) hook(db, params, language, results);
}
function runBeforeSearch(hooks, db, params, language) {
	if (hooks.some(isAsyncFunction)) return (async () => {
		for (const hook of hooks) await hook(db, params, language);
	})();
	else for (const hook of hooks) hook(db, params, language);
}
function runAfterCreate(hooks, db) {
	if (hooks.some(isAsyncFunction)) return (async () => {
		for (const hook of hooks) await hook(db);
	})();
	else for (const hook of hooks) hook(db);
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/trees/avl.js
var AVLNode = class AVLNode {
	k;
	v;
	l = null;
	r = null;
	h = 1;
	constructor(key, value) {
		this.k = key;
		this.v = new Set(value);
	}
	updateHeight() {
		this.h = Math.max(AVLNode.getHeight(this.l), AVLNode.getHeight(this.r)) + 1;
	}
	static getHeight(node) {
		return node ? node.h : 0;
	}
	getBalanceFactor() {
		return AVLNode.getHeight(this.l) - AVLNode.getHeight(this.r);
	}
	rotateLeft() {
		const newRoot = this.r;
		this.r = newRoot.l;
		newRoot.l = this;
		this.updateHeight();
		newRoot.updateHeight();
		return newRoot;
	}
	rotateRight() {
		const newRoot = this.l;
		this.l = newRoot.r;
		newRoot.r = this;
		this.updateHeight();
		newRoot.updateHeight();
		return newRoot;
	}
	toJSON() {
		return {
			k: this.k,
			v: Array.from(this.v),
			l: this.l ? this.l.toJSON() : null,
			r: this.r ? this.r.toJSON() : null,
			h: this.h
		};
	}
	static fromJSON(json) {
		const node = new AVLNode(json.k, json.v);
		node.l = json.l ? AVLNode.fromJSON(json.l) : null;
		node.r = json.r ? AVLNode.fromJSON(json.r) : null;
		node.h = json.h;
		return node;
	}
};
var AVLTree = class AVLTree {
	root = null;
	insertCount = 0;
	constructor(key, value) {
		if (key !== void 0 && value !== void 0) this.root = new AVLNode(key, value);
	}
	insert(key, value, rebalanceThreshold = 1e3) {
		this.root = this.insertNode(this.root, key, value, rebalanceThreshold);
	}
	insertMultiple(key, value, rebalanceThreshold = 1e3) {
		for (const v of value) this.insert(key, v, rebalanceThreshold);
	}
	rebalance() {
		if (this.root) this.root = this.rebalanceNode(this.root);
	}
	toJSON() {
		return {
			root: this.root ? this.root.toJSON() : null,
			insertCount: this.insertCount
		};
	}
	static fromJSON(json) {
		const tree = new AVLTree();
		tree.root = json.root ? AVLNode.fromJSON(json.root) : null;
		tree.insertCount = json.insertCount || 0;
		return tree;
	}
	insertNode(node, key, value, rebalanceThreshold) {
		if (node === null) return new AVLNode(key, [value]);
		const path = [];
		let current = node;
		let parent = null;
		while (current !== null) {
			path.push({
				parent,
				node: current
			});
			if (key < current.k) {
				if (current.l === null) {
					current.l = new AVLNode(key, [value]);
					path.push({
						parent: current,
						node: current.l
					});
					break;
				} else {
					parent = current;
					current = current.l;
				}
			} else if (key > current.k) {
				if (current.r === null) {
					current.r = new AVLNode(key, [value]);
					path.push({
						parent: current,
						node: current.r
					});
					break;
				} else {
					parent = current;
					current = current.r;
				}
			} else {
				current.v.add(value);
				return node;
			}
		}
		let needRebalance = false;
		if (this.insertCount++ % rebalanceThreshold === 0) needRebalance = true;
		for (let i = path.length - 1; i >= 0; i--) {
			const { parent, node: currentNode } = path[i];
			currentNode.updateHeight();
			if (needRebalance) {
				const rebalancedNode = this.rebalanceNode(currentNode);
				if (parent) {
					if (parent.l === currentNode) parent.l = rebalancedNode;
					else if (parent.r === currentNode) parent.r = rebalancedNode;
				} else node = rebalancedNode;
			}
		}
		return node;
	}
	rebalanceNode(node) {
		const balanceFactor = node.getBalanceFactor();
		if (balanceFactor > 1) {
			if (node.l && node.l.getBalanceFactor() >= 0) return node.rotateRight();
			else if (node.l) {
				node.l = node.l.rotateLeft();
				return node.rotateRight();
			}
		}
		if (balanceFactor < -1) {
			if (node.r && node.r.getBalanceFactor() <= 0) return node.rotateLeft();
			else if (node.r) {
				node.r = node.r.rotateRight();
				return node.rotateLeft();
			}
		}
		return node;
	}
	find(key) {
		const node = this.findNodeByKey(key);
		return node ? node.v : null;
	}
	contains(key) {
		return this.find(key) !== null;
	}
	getSize() {
		let count = 0;
		const stack = [];
		let current = this.root;
		while (current || stack.length > 0) {
			while (current) {
				stack.push(current);
				current = current.l;
			}
			current = stack.pop();
			count++;
			current = current.r;
		}
		return count;
	}
	isBalanced() {
		if (!this.root) return true;
		const stack = [this.root];
		while (stack.length > 0) {
			const node = stack.pop();
			const balanceFactor = node.getBalanceFactor();
			if (Math.abs(balanceFactor) > 1) return false;
			if (node.l) stack.push(node.l);
			if (node.r) stack.push(node.r);
		}
		return true;
	}
	remove(key) {
		this.root = this.removeNode(this.root, key);
	}
	removeDocument(key, id) {
		const node = this.findNodeByKey(key);
		if (!node) return;
		if (node.v.size === 1) this.root = this.removeNode(this.root, key);
		else node.v = new Set([...node.v.values()].filter((v) => v !== id));
	}
	findNodeByKey(key) {
		let node = this.root;
		while (node) if (key < node.k) node = node.l;
		else if (key > node.k) node = node.r;
		else return node;
		return null;
	}
	removeNode(node, key) {
		if (node === null) return null;
		const path = [];
		let current = node;
		while (current !== null && current.k !== key) {
			path.push(current);
			if (key < current.k) current = current.l;
			else current = current.r;
		}
		if (current === null) return node;
		if (current.l === null || current.r === null) {
			const child = current.l ? current.l : current.r;
			if (path.length === 0) node = child;
			else {
				const parent = path[path.length - 1];
				if (parent.l === current) parent.l = child;
				else parent.r = child;
			}
		} else {
			let successorParent = current;
			let successor = current.r;
			while (successor.l !== null) {
				successorParent = successor;
				successor = successor.l;
			}
			current.k = successor.k;
			current.v = successor.v;
			if (successorParent.l === successor) successorParent.l = successor.r;
			else successorParent.r = successor.r;
			current = successorParent;
		}
		path.push(current);
		for (let i = path.length - 1; i >= 0; i--) {
			const currentNode = path[i];
			currentNode.updateHeight();
			const rebalancedNode = this.rebalanceNode(currentNode);
			if (i > 0) {
				const parent = path[i - 1];
				if (parent.l === currentNode) parent.l = rebalancedNode;
				else if (parent.r === currentNode) parent.r = rebalancedNode;
			} else node = rebalancedNode;
		}
		return node;
	}
	rangeSearch(min, max) {
		const result = /* @__PURE__ */ new Set();
		const stack = [];
		let current = this.root;
		while (current || stack.length > 0) {
			while (current) {
				stack.push(current);
				current = current.l;
			}
			current = stack.pop();
			if (current.k >= min && current.k <= max) for (const value of current.v) result.add(value);
			if (current.k > max) break;
			current = current.r;
		}
		return result;
	}
	greaterThan(key, inclusive = false) {
		const result = /* @__PURE__ */ new Set();
		const stack = [];
		let current = this.root;
		while (current || stack.length > 0) {
			while (current) {
				stack.push(current);
				current = current.r;
			}
			current = stack.pop();
			if (inclusive && current.k >= key || !inclusive && current.k > key) for (const value of current.v) result.add(value);
			else if (current.k <= key) break;
			current = current.l;
		}
		return result;
	}
	lessThan(key, inclusive = false) {
		const result = /* @__PURE__ */ new Set();
		const stack = [];
		let current = this.root;
		while (current || stack.length > 0) {
			while (current) {
				stack.push(current);
				current = current.l;
			}
			current = stack.pop();
			if (inclusive && current.k <= key || !inclusive && current.k < key) for (const value of current.v) result.add(value);
			else if (current.k > key) break;
			current = current.r;
		}
		return result;
	}
};
//#endregion
//#region node_modules/@orama/orama/dist/browser/trees/flat.js
var FlatTree = class FlatTree {
	numberToDocumentId;
	constructor() {
		this.numberToDocumentId = /* @__PURE__ */ new Map();
	}
	insert(key, value) {
		if (this.numberToDocumentId.has(key)) this.numberToDocumentId.get(key).add(value);
		else this.numberToDocumentId.set(key, /* @__PURE__ */ new Set([value]));
	}
	find(key) {
		const idSet = this.numberToDocumentId.get(key);
		return idSet ? Array.from(idSet) : null;
	}
	remove(key) {
		this.numberToDocumentId.delete(key);
	}
	removeDocument(id, key) {
		const idSet = this.numberToDocumentId.get(key);
		if (idSet) {
			idSet.delete(id);
			if (idSet.size === 0) this.numberToDocumentId.delete(key);
		}
	}
	contains(key) {
		return this.numberToDocumentId.has(key);
	}
	getSize() {
		let size = 0;
		for (const idSet of this.numberToDocumentId.values()) size += idSet.size;
		return size;
	}
	filter(operation) {
		const operationKeys = Object.keys(operation);
		if (operationKeys.length !== 1) throw new Error("Invalid operation");
		const operationType = operationKeys[0];
		switch (operationType) {
			case "eq": {
				const value = operation[operationType];
				const idSet = this.numberToDocumentId.get(value);
				return idSet ? Array.from(idSet) : [];
			}
			case "in": {
				const values = operation[operationType];
				const resultSet = /* @__PURE__ */ new Set();
				for (const value of values) {
					const idSet = this.numberToDocumentId.get(value);
					if (idSet) for (const id of idSet) resultSet.add(id);
				}
				return Array.from(resultSet);
			}
			case "nin": {
				const excludeValues = new Set(operation[operationType]);
				const resultSet = /* @__PURE__ */ new Set();
				for (const [key, idSet] of this.numberToDocumentId.entries()) if (!excludeValues.has(key)) for (const id of idSet) resultSet.add(id);
				return Array.from(resultSet);
			}
			default: throw new Error("Invalid operation");
		}
	}
	filterArr(operation) {
		const operationKeys = Object.keys(operation);
		if (operationKeys.length !== 1) throw new Error("Invalid operation");
		const operationType = operationKeys[0];
		switch (operationType) {
			case "containsAll": {
				const idSets = operation[operationType].map((value) => this.numberToDocumentId.get(value) ?? /* @__PURE__ */ new Set());
				if (idSets.length === 0) return [];
				const intersection = idSets.reduce((prev, curr) => {
					return new Set([...prev].filter((id) => curr.has(id)));
				});
				return Array.from(intersection);
			}
			case "containsAny": {
				const idSets = operation[operationType].map((value) => this.numberToDocumentId.get(value) ?? /* @__PURE__ */ new Set());
				if (idSets.length === 0) return [];
				const union = idSets.reduce((prev, curr) => {
					return /* @__PURE__ */ new Set([...prev, ...curr]);
				});
				return Array.from(union);
			}
			default: throw new Error("Invalid operation");
		}
	}
	static fromJSON(json) {
		if (!json.numberToDocumentId) throw new Error("Invalid Flat Tree JSON");
		const tree = new FlatTree();
		for (const [key, ids] of json.numberToDocumentId) tree.numberToDocumentId.set(key, new Set(ids));
		return tree;
	}
	toJSON() {
		return { numberToDocumentId: Array.from(this.numberToDocumentId.entries()).map(([key, idSet]) => [key, Array.from(idSet)]) };
	}
};
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/levenshtein.js
/**
* Inspired by:
* https://github.com/Yomguithereal/talisman/blob/86ae55cbd040ff021d05e282e0e6c71f2dde21f8/src/metrics/levenshtein.js#L218-L340
*/
function _boundedLevenshtein(term, word, tolerance) {
	if (tolerance < 0) return -1;
	if (term === word) return 0;
	const m = term.length;
	const n = word.length;
	if (m === 0) return n <= tolerance ? n : -1;
	if (n === 0) return m <= tolerance ? m : -1;
	const diff = Math.abs(m - n);
	if (term.startsWith(word)) return diff <= tolerance ? diff : -1;
	if (word.startsWith(term)) return 0;
	if (diff > tolerance) return -1;
	const matrix = [];
	for (let i = 0; i <= m; i++) {
		matrix[i] = [i];
		for (let j = 1; j <= n; j++) matrix[i][j] = i === 0 ? j : 0;
	}
	for (let i = 1; i <= m; i++) {
		let rowMin = Infinity;
		for (let j = 1; j <= n; j++) {
			if (term[i - 1] === word[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
			else matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
			rowMin = Math.min(rowMin, matrix[i][j]);
		}
		if (rowMin > tolerance) return -1;
	}
	return matrix[m][n] <= tolerance ? matrix[m][n] : -1;
}
function syncBoundedLevenshtein(term, w, tolerance) {
	const distance = _boundedLevenshtein(term, w, tolerance);
	return {
		distance,
		isBounded: distance >= 0
	};
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/trees/radix.js
var RadixNode = class RadixNode {
	k;
	s;
	c = /* @__PURE__ */ new Map();
	d = /* @__PURE__ */ new Set();
	e;
	w = "";
	constructor(key, subWord, end) {
		this.k = key;
		this.s = subWord;
		this.e = end;
	}
	updateParent(parent) {
		this.w = parent.w + this.s;
	}
	addDocument(docID) {
		this.d.add(docID);
	}
	removeDocument(docID) {
		return this.d.delete(docID);
	}
	findAllWords(output, term, exact, tolerance) {
		const stack = [this];
		while (stack.length > 0) {
			const node = stack.pop();
			if (node.e) {
				const { w, d: docIDs } = node;
				if (exact && w !== term) continue;
				if (getOwnProperty(output, w) !== null) {
					if (tolerance) {
						if (Math.abs(term.length - w.length) <= tolerance && syncBoundedLevenshtein(term, w, tolerance).isBounded) output[w] = [];
						else continue;
					} else output[w] = [];
				}
				if (getOwnProperty(output, w) != null && docIDs.size > 0) {
					const docs = output[w];
					for (const docID of docIDs) if (!docs.includes(docID)) docs.push(docID);
				}
			}
			if (node.c.size > 0) stack.push(...node.c.values());
		}
		return output;
	}
	insert(word, docId) {
		let node = this;
		let i = 0;
		const wordLength = word.length;
		while (i < wordLength) {
			const currentCharacter = word[i];
			const childNode = node.c.get(currentCharacter);
			if (childNode) {
				const edgeLabel = childNode.s;
				const edgeLabelLength = edgeLabel.length;
				let j = 0;
				while (j < edgeLabelLength && i + j < wordLength && edgeLabel[j] === word[i + j]) j++;
				if (j === edgeLabelLength) {
					node = childNode;
					i += j;
					if (i === wordLength) {
						if (!childNode.e) childNode.e = true;
						childNode.addDocument(docId);
						return;
					}
					continue;
				}
				const commonPrefix = edgeLabel.slice(0, j);
				const newEdgeLabel = edgeLabel.slice(j);
				const newWordLabel = word.slice(i + j);
				const inbetweenNode = new RadixNode(commonPrefix[0], commonPrefix, false);
				node.c.set(commonPrefix[0], inbetweenNode);
				inbetweenNode.updateParent(node);
				childNode.s = newEdgeLabel;
				childNode.k = newEdgeLabel[0];
				inbetweenNode.c.set(newEdgeLabel[0], childNode);
				childNode.updateParent(inbetweenNode);
				if (newWordLabel) {
					const newNode = new RadixNode(newWordLabel[0], newWordLabel, true);
					newNode.addDocument(docId);
					inbetweenNode.c.set(newWordLabel[0], newNode);
					newNode.updateParent(inbetweenNode);
				} else {
					inbetweenNode.e = true;
					inbetweenNode.addDocument(docId);
				}
				return;
			} else {
				const newNode = new RadixNode(currentCharacter, word.slice(i), true);
				newNode.addDocument(docId);
				node.c.set(currentCharacter, newNode);
				newNode.updateParent(node);
				return;
			}
		}
		if (!node.e) node.e = true;
		node.addDocument(docId);
	}
	_findLevenshtein(term, index, tolerance, originalTolerance, output) {
		const stack = [{
			node: this,
			index,
			tolerance
		}];
		while (stack.length > 0) {
			const { node, index, tolerance } = stack.pop();
			if (node.w.startsWith(term)) {
				node.findAllWords(output, term, false, 0);
				continue;
			}
			if (tolerance < 0) continue;
			if (node.e) {
				const { w, d: docIDs } = node;
				if (w) {
					if (syncBoundedLevenshtein(term, w, originalTolerance).isBounded) output[w] = [];
					if (getOwnProperty(output, w) !== void 0 && docIDs.size > 0) {
						const docs = new Set(output[w]);
						for (const docID of docIDs) docs.add(docID);
						output[w] = Array.from(docs);
					}
				}
			}
			if (index >= term.length) continue;
			const currentChar = term[index];
			if (node.c.has(currentChar)) {
				const childNode = node.c.get(currentChar);
				stack.push({
					node: childNode,
					index: index + 1,
					tolerance
				});
			}
			stack.push({
				node,
				index: index + 1,
				tolerance: tolerance - 1
			});
			for (const [character, childNode] of node.c) {
				stack.push({
					node: childNode,
					index,
					tolerance: tolerance - 1
				});
				if (character !== currentChar) stack.push({
					node: childNode,
					index: index + 1,
					tolerance: tolerance - 1
				});
			}
		}
	}
	find(params) {
		const { term, exact, tolerance } = params;
		if (tolerance && !exact) {
			const output = {};
			this._findLevenshtein(term, 0, tolerance, tolerance, output);
			return output;
		} else {
			let node = this;
			let i = 0;
			const termLength = term.length;
			while (i < termLength) {
				const character = term[i];
				const childNode = node.c.get(character);
				if (childNode) {
					const edgeLabel = childNode.s;
					const edgeLabelLength = edgeLabel.length;
					let j = 0;
					while (j < edgeLabelLength && i + j < termLength && edgeLabel[j] === term[i + j]) j++;
					if (j === edgeLabelLength) {
						node = childNode;
						i += j;
					} else if (i + j === termLength) {
						if (j === termLength - i) {
							if (exact) return {};
							else {
								const output = {};
								childNode.findAllWords(output, term, exact, tolerance);
								return output;
							}
						} else return {};
					} else return {};
				} else return {};
			}
			const output = {};
			node.findAllWords(output, term, exact, tolerance);
			return output;
		}
	}
	contains(term) {
		let node = this;
		let i = 0;
		const termLength = term.length;
		while (i < termLength) {
			const character = term[i];
			const childNode = node.c.get(character);
			if (childNode) {
				const edgeLabel = childNode.s;
				const edgeLabelLength = edgeLabel.length;
				let j = 0;
				while (j < edgeLabelLength && i + j < termLength && edgeLabel[j] === term[i + j]) j++;
				if (j < edgeLabelLength) return false;
				i += edgeLabelLength;
				node = childNode;
			} else return false;
		}
		return true;
	}
	removeWord(term) {
		if (!term) return false;
		let node = this;
		const termLength = term.length;
		const stack = [];
		for (let i = 0; i < termLength; i++) {
			const character = term[i];
			if (node.c.has(character)) {
				const childNode = node.c.get(character);
				stack.push({
					parent: node,
					character
				});
				i += childNode.s.length - 1;
				node = childNode;
			} else return false;
		}
		node.d.clear();
		node.e = false;
		while (stack.length > 0 && node.c.size === 0 && !node.e && node.d.size === 0) {
			const { parent, character } = stack.pop();
			parent.c.delete(character);
			node = parent;
		}
		return true;
	}
	removeDocumentByWord(term, docID, exact = true) {
		if (!term) return true;
		let node = this;
		const termLength = term.length;
		for (let i = 0; i < termLength; i++) {
			const character = term[i];
			if (node.c.has(character)) {
				const childNode = node.c.get(character);
				i += childNode.s.length - 1;
				node = childNode;
				if (exact && node.w !== term) {} else node.removeDocument(docID);
			} else return false;
		}
		return true;
	}
	static getCommonPrefix(a, b) {
		const len = Math.min(a.length, b.length);
		let i = 0;
		while (i < len && a.charCodeAt(i) === b.charCodeAt(i)) i++;
		return a.slice(0, i);
	}
	toJSON() {
		return {
			w: this.w,
			s: this.s,
			e: this.e,
			k: this.k,
			d: Array.from(this.d),
			c: Array.from(this.c?.entries())?.map(([key, node]) => [key, node.toJSON()])
		};
	}
	static fromJSON(json) {
		const node = new RadixNode(json.k, json.s, json.e);
		node.w = json.w;
		node.d = new Set(json.d);
		node.c = new Map(json?.c?.map(([key, nodeJson]) => [key, RadixNode.fromJSON(nodeJson)]) || []);
		return node;
	}
};
var RadixTree = class RadixTree extends RadixNode {
	constructor() {
		super("", "", false);
	}
	static fromJSON(json) {
		const tree = new RadixTree();
		tree.w = json.w;
		tree.s = json.s;
		tree.e = json.e;
		tree.k = json.k;
		tree.d = new Set(json.d);
		tree.c = new Map(json?.c?.map(([key, nodeJson]) => [key, RadixNode.fromJSON(nodeJson)]) || []);
		return tree;
	}
	toJSON() {
		return super.toJSON();
	}
};
//#endregion
//#region node_modules/@orama/orama/dist/browser/trees/bkd.js
var K = 2;
var EARTH_RADIUS = 6371e3;
var BKDNode = class BKDNode {
	point;
	docIDs;
	left;
	right;
	parent;
	constructor(point, docIDs) {
		this.point = point;
		this.docIDs = new Set(docIDs);
		this.left = null;
		this.right = null;
		this.parent = null;
	}
	toJSON() {
		return {
			point: this.point,
			docIDs: Array.from(this.docIDs),
			left: this.left ? this.left.toJSON() : null,
			right: this.right ? this.right.toJSON() : null
		};
	}
	static fromJSON(json, parent = null) {
		const node = new BKDNode(json.point, json.docIDs);
		node.parent = parent;
		if (json.left) node.left = BKDNode.fromJSON(json.left, node);
		if (json.right) node.right = BKDNode.fromJSON(json.right, node);
		return node;
	}
};
var BKDTree = class BKDTree {
	root;
	nodeMap;
	constructor() {
		this.root = null;
		this.nodeMap = /* @__PURE__ */ new Map();
	}
	getPointKey(point) {
		return `${point.lon},${point.lat}`;
	}
	insert(point, docIDs) {
		const pointKey = this.getPointKey(point);
		const existingNode = this.nodeMap.get(pointKey);
		if (existingNode) {
			docIDs.forEach((id) => existingNode.docIDs.add(id));
			return;
		}
		const newNode = new BKDNode(point, docIDs);
		this.nodeMap.set(pointKey, newNode);
		if (this.root == null) {
			this.root = newNode;
			return;
		}
		let node = this.root;
		let depth = 0;
		while (true) {
			if (depth % K === 0) {
				if (point.lon < node.point.lon) {
					if (node.left == null) {
						node.left = newNode;
						newNode.parent = node;
						return;
					}
					node = node.left;
				} else {
					if (node.right == null) {
						node.right = newNode;
						newNode.parent = node;
						return;
					}
					node = node.right;
				}
			} else if (point.lat < node.point.lat) {
				if (node.left == null) {
					node.left = newNode;
					newNode.parent = node;
					return;
				}
				node = node.left;
			} else {
				if (node.right == null) {
					node.right = newNode;
					newNode.parent = node;
					return;
				}
				node = node.right;
			}
			depth++;
		}
	}
	contains(point) {
		const pointKey = this.getPointKey(point);
		return this.nodeMap.has(pointKey);
	}
	getDocIDsByCoordinates(point) {
		const pointKey = this.getPointKey(point);
		const node = this.nodeMap.get(pointKey);
		if (node) return Array.from(node.docIDs);
		return null;
	}
	removeDocByID(point, docID) {
		const pointKey = this.getPointKey(point);
		const node = this.nodeMap.get(pointKey);
		if (node) {
			node.docIDs.delete(docID);
			if (node.docIDs.size === 0) {
				this.nodeMap.delete(pointKey);
				this.deleteNode(node);
			}
		}
	}
	deleteNode(node) {
		const parent = node.parent;
		const child = node.left ? node.left : node.right;
		if (child) child.parent = parent;
		if (parent) {
			if (parent.left === node) parent.left = child;
			else if (parent.right === node) parent.right = child;
		} else {
			this.root = child;
			if (this.root) this.root.parent = null;
		}
	}
	searchByRadius(center, radius, inclusive = true, sort = "asc", highPrecision = false) {
		const distanceFn = highPrecision ? BKDTree.vincentyDistance : BKDTree.haversineDistance;
		const stack = [{
			node: this.root,
			depth: 0
		}];
		const result = [];
		while (stack.length > 0) {
			const { node, depth } = stack.pop();
			if (node == null) continue;
			const dist = distanceFn(center, node.point);
			if (inclusive ? dist <= radius : dist > radius) result.push({
				point: node.point,
				docIDs: Array.from(node.docIDs)
			});
			if (node.left != null) stack.push({
				node: node.left,
				depth: depth + 1
			});
			if (node.right != null) stack.push({
				node: node.right,
				depth: depth + 1
			});
		}
		if (sort) result.sort((a, b) => {
			const distA = distanceFn(center, a.point);
			const distB = distanceFn(center, b.point);
			return sort.toLowerCase() === "asc" ? distA - distB : distB - distA;
		});
		return result;
	}
	searchByPolygon(polygon, inclusive = true, sort = null, highPrecision = false) {
		const stack = [{
			node: this.root,
			depth: 0
		}];
		const result = [];
		while (stack.length > 0) {
			const { node, depth } = stack.pop();
			if (node == null) continue;
			if (node.left != null) stack.push({
				node: node.left,
				depth: depth + 1
			});
			if (node.right != null) stack.push({
				node: node.right,
				depth: depth + 1
			});
			const isInsidePolygon = BKDTree.isPointInPolygon(polygon, node.point);
			if (isInsidePolygon && inclusive || !isInsidePolygon && !inclusive) result.push({
				point: node.point,
				docIDs: Array.from(node.docIDs)
			});
		}
		const centroid = BKDTree.calculatePolygonCentroid(polygon);
		if (sort) {
			const distanceFn = highPrecision ? BKDTree.vincentyDistance : BKDTree.haversineDistance;
			result.sort((a, b) => {
				const distA = distanceFn(centroid, a.point);
				const distB = distanceFn(centroid, b.point);
				return sort.toLowerCase() === "asc" ? distA - distB : distB - distA;
			});
		}
		return result;
	}
	toJSON() {
		return { root: this.root ? this.root.toJSON() : null };
	}
	static fromJSON(json) {
		const tree = new BKDTree();
		if (json.root) {
			tree.root = BKDNode.fromJSON(json.root);
			tree.buildNodeMap(tree.root);
		}
		return tree;
	}
	buildNodeMap(node) {
		if (node == null) return;
		const pointKey = this.getPointKey(node.point);
		this.nodeMap.set(pointKey, node);
		if (node.left) this.buildNodeMap(node.left);
		if (node.right) this.buildNodeMap(node.right);
	}
	static calculatePolygonCentroid(polygon) {
		let totalArea = 0;
		let centroidX = 0;
		let centroidY = 0;
		const polygonLength = polygon.length;
		for (let i = 0, j = polygonLength - 1; i < polygonLength; j = i++) {
			const xi = polygon[i].lon;
			const yi = polygon[i].lat;
			const xj = polygon[j].lon;
			const yj = polygon[j].lat;
			const areaSegment = xi * yj - xj * yi;
			totalArea += areaSegment;
			centroidX += (xi + xj) * areaSegment;
			centroidY += (yi + yj) * areaSegment;
		}
		totalArea /= 2;
		const centroidCoordinate = 6 * totalArea;
		centroidX /= centroidCoordinate;
		centroidY /= centroidCoordinate;
		return {
			lon: centroidX,
			lat: centroidY
		};
	}
	static isPointInPolygon(polygon, point) {
		let isInside = false;
		const x = point.lon;
		const y = point.lat;
		const polygonLength = polygon.length;
		for (let i = 0, j = polygonLength - 1; i < polygonLength; j = i++) {
			const xi = polygon[i].lon;
			const yi = polygon[i].lat;
			const xj = polygon[j].lon;
			const yj = polygon[j].lat;
			if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) isInside = !isInside;
		}
		return isInside;
	}
	static haversineDistance(coord1, coord2) {
		const P = Math.PI / 180;
		const lat1 = coord1.lat * P;
		const lat2 = coord2.lat * P;
		const deltaLat = (coord2.lat - coord1.lat) * P;
		const deltaLon = (coord2.lon - coord1.lon) * P;
		const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
		return EARTH_RADIUS * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
	}
	static vincentyDistance(coord1, coord2) {
		const a = 6378137;
		const f = 1 / 298.257223563;
		const b = .9966471893352525 * a;
		const P = Math.PI / 180;
		const lat1 = coord1.lat * P;
		const lat2 = coord2.lat * P;
		const deltaLon = (coord2.lon - coord1.lon) * P;
		const U1 = Math.atan(.9966471893352525 * Math.tan(lat1));
		const U2 = Math.atan(.9966471893352525 * Math.tan(lat2));
		const sinU1 = Math.sin(U1);
		const cosU1 = Math.cos(U1);
		const sinU2 = Math.sin(U2);
		const cosU2 = Math.cos(U2);
		let lambda = deltaLon;
		let prevLambda;
		let iterationLimit = 1e3;
		let sinSigma;
		let cosSigma;
		let sigma;
		let sinAlpha;
		let cos2Alpha;
		let cos2SigmaM;
		do {
			const sinLambda = Math.sin(lambda);
			const cosLambda = Math.cos(lambda);
			sinSigma = Math.sqrt(cosU2 * sinLambda * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
			if (sinSigma === 0) return 0;
			cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
			sigma = Math.atan2(sinSigma, cosSigma);
			sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
			cos2Alpha = 1 - sinAlpha * sinAlpha;
			cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cos2Alpha;
			if (isNaN(cos2SigmaM)) cos2SigmaM = 0;
			const C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
			prevLambda = lambda;
			lambda = deltaLon + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
		} while (Math.abs(lambda - prevLambda) > 1e-12 && --iterationLimit > 0);
		if (iterationLimit === 0) return NaN;
		const uSquared = cos2Alpha * (a * a - b * b) / (b * b);
		const A = 1 + uSquared / 16384 * (4096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared)));
		const B = uSquared / 1024 * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared)));
		const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
		return b * A * (sigma - deltaSigma);
	}
};
//#endregion
//#region node_modules/@orama/orama/dist/browser/trees/bool.js
var BoolNode = class BoolNode {
	true;
	false;
	constructor() {
		this.true = /* @__PURE__ */ new Set();
		this.false = /* @__PURE__ */ new Set();
	}
	insert(value, bool) {
		if (bool) this.true.add(value);
		else this.false.add(value);
	}
	delete(value, bool) {
		if (bool) this.true.delete(value);
		else this.false.delete(value);
	}
	getSize() {
		return this.true.size + this.false.size;
	}
	toJSON() {
		return {
			true: Array.from(this.true),
			false: Array.from(this.false)
		};
	}
	static fromJSON(json) {
		const node = new BoolNode();
		node.true = new Set(json.true);
		node.false = new Set(json.false);
		return node;
	}
};
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/algorithms.js
function BM25(tf, matchingCount, docsCount, fieldLength, averageFieldLength, { k, b, d }) {
	return Math.log(1 + (docsCount - matchingCount + .5) / (matchingCount + .5)) * (d + tf * (k + 1)) / (tf + k * (1 - b + b * fieldLength / averageFieldLength));
}
var VectorIndex = class VectorIndex {
	size;
	vectors = /* @__PURE__ */ new Map();
	constructor(size) {
		this.size = size;
	}
	add(internalDocumentId, value) {
		if (!(value instanceof Float32Array)) value = new Float32Array(value);
		const magnitude = getMagnitude(value, this.size);
		this.vectors.set(internalDocumentId, [magnitude, value]);
	}
	remove(internalDocumentId) {
		this.vectors.delete(internalDocumentId);
	}
	find(vector, similarity, whereFiltersIDs) {
		if (!(vector instanceof Float32Array)) vector = new Float32Array(vector);
		return findSimilarVectors(vector, whereFiltersIDs, this.vectors, this.size, similarity);
	}
	toJSON() {
		const vectors = [];
		for (const [id, [magnitude, vector]] of this.vectors) vectors.push([id, [magnitude, Array.from(vector)]]);
		return {
			size: this.size,
			vectors
		};
	}
	static fromJSON(json) {
		const raw = json;
		const index = new VectorIndex(raw.size);
		for (const [id, [magnitude, vector]] of raw.vectors) index.vectors.set(id, [magnitude, new Float32Array(vector)]);
		return index;
	}
};
function getMagnitude(vector, vectorLength) {
	let magnitude = 0;
	for (let i = 0; i < vectorLength; i++) magnitude += vector[i] * vector[i];
	return Math.sqrt(magnitude);
}
function findSimilarVectors(targetVector, keys, vectors, length, threshold) {
	const targetMagnitude = getMagnitude(targetVector, length);
	const similarVectors = [];
	const base = keys ? keys : vectors.keys();
	for (const vectorId of base) {
		const entry = vectors.get(vectorId);
		if (!entry) continue;
		const magnitude = entry[0];
		const vector = entry[1];
		let dotProduct = 0;
		for (let i = 0; i < length; i++) dotProduct += targetVector[i] * vector[i];
		const similarity = dotProduct / (targetMagnitude * magnitude);
		if (similarity >= threshold) similarVectors.push([vectorId, similarity]);
	}
	return similarVectors;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/index.js
function insertDocumentScoreParameters(index, prop, id, tokens, docsCount) {
	const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
	index.avgFieldLength[prop] = ((index.avgFieldLength[prop] ?? 0) * (docsCount - 1) + tokens.length) / docsCount;
	index.fieldLengths[prop][internalId] = tokens.length;
	index.frequencies[prop][internalId] = {};
}
function insertTokenScoreParameters(index, prop, id, tokens, token) {
	let tokenFrequency = 0;
	for (const t of tokens) if (t === token) tokenFrequency++;
	const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
	const tf = tokenFrequency / tokens.length;
	index.frequencies[prop][internalId][token] = tf;
	if (!(token in index.tokenOccurrences[prop])) index.tokenOccurrences[prop][token] = 0;
	index.tokenOccurrences[prop][token] = (index.tokenOccurrences[prop][token] ?? 0) + 1;
}
function removeDocumentScoreParameters(index, prop, id, docsCount) {
	const internalId = getInternalDocumentId(index.sharedInternalDocumentStore, id);
	if (docsCount > 1) index.avgFieldLength[prop] = (index.avgFieldLength[prop] * docsCount - index.fieldLengths[prop][internalId]) / (docsCount - 1);
	else index.avgFieldLength[prop] = void 0;
	index.fieldLengths[prop][internalId] = void 0;
	index.frequencies[prop][internalId] = void 0;
}
function removeTokenScoreParameters(index, prop, token) {
	index.tokenOccurrences[prop][token]--;
}
function create$3(orama, sharedInternalDocumentStore, schema, index, prefix = "") {
	if (!index) index = {
		sharedInternalDocumentStore,
		indexes: {},
		vectorIndexes: {},
		searchableProperties: [],
		searchablePropertiesWithTypes: {},
		frequencies: {},
		tokenOccurrences: {},
		avgFieldLength: {},
		fieldLengths: {}
	};
	for (const [prop, type] of Object.entries(schema)) {
		const path = `${prefix}${prefix ? "." : ""}${prop}`;
		if (typeof type === "object" && !Array.isArray(type)) {
			create$3(orama, sharedInternalDocumentStore, type, index, path);
			continue;
		}
		if (isVectorType(type)) {
			index.searchableProperties.push(path);
			index.searchablePropertiesWithTypes[path] = type;
			index.vectorIndexes[path] = {
				type: "Vector",
				node: new VectorIndex(getVectorSize(type)),
				isArray: false
			};
		} else {
			const isArray = /\[/.test(type);
			switch (type) {
				case "boolean":
				case "boolean[]":
					index.indexes[path] = {
						type: "Bool",
						node: new BoolNode(),
						isArray
					};
					break;
				case "number":
				case "number[]":
					index.indexes[path] = {
						type: "AVL",
						node: new AVLTree(0, []),
						isArray
					};
					break;
				case "string":
				case "string[]":
					index.indexes[path] = {
						type: "Radix",
						node: new RadixTree(),
						isArray
					};
					index.avgFieldLength[path] = 0;
					index.frequencies[path] = {};
					index.tokenOccurrences[path] = {};
					index.fieldLengths[path] = {};
					break;
				case "enum":
				case "enum[]":
					index.indexes[path] = {
						type: "Flat",
						node: new FlatTree(),
						isArray
					};
					break;
				case "geopoint":
					index.indexes[path] = {
						type: "BKD",
						node: new BKDTree(),
						isArray
					};
					break;
				default: throw createError("INVALID_SCHEMA_TYPE", Array.isArray(type) ? "array" : type, path);
			}
			index.searchableProperties.push(path);
			index.searchablePropertiesWithTypes[path] = type;
		}
	}
	return index;
}
function insertScalarBuilder(implementation, index, prop, internalId, language, tokenizer, docsCount, options) {
	return (value) => {
		const { type, node } = index.indexes[prop];
		switch (type) {
			case "Bool":
				node[value ? "true" : "false"].add(internalId);
				break;
			case "AVL": {
				const avlRebalanceThreshold = options?.avlRebalanceThreshold ?? 1;
				node.insert(value, internalId, avlRebalanceThreshold);
				break;
			}
			case "Radix": {
				const tokens = tokenizer.tokenize(value, language, prop, false);
				implementation.insertDocumentScoreParameters(index, prop, internalId, tokens, docsCount);
				for (const token of tokens) {
					implementation.insertTokenScoreParameters(index, prop, internalId, tokens, token);
					node.insert(token, internalId);
				}
				break;
			}
			case "Flat":
				node.insert(value, internalId);
				break;
			case "BKD": node.insert(value, [internalId]);
		}
	};
}
function insert$1(implementation, index, prop, id, internalId, value, schemaType, language, tokenizer, docsCount, options) {
	if (isVectorType(schemaType)) return insertVector(index, prop, value, id, internalId);
	const insertScalar = insertScalarBuilder(implementation, index, prop, internalId, language, tokenizer, docsCount, options);
	if (!isArrayType(schemaType)) return insertScalar(value);
	const elements = value;
	const elementsLength = elements.length;
	for (let i = 0; i < elementsLength; i++) insertScalar(elements[i]);
}
function insertVector(index, prop, value, id, internalDocumentId) {
	index.vectorIndexes[prop].node.add(internalDocumentId, value);
}
function removeScalar(implementation, index, prop, id, internalId, value, schemaType, language, tokenizer, docsCount) {
	if (isVectorType(schemaType)) {
		index.vectorIndexes[prop].node.remove(internalId);
		return true;
	}
	const { type, node } = index.indexes[prop];
	switch (type) {
		case "AVL":
			node.removeDocument(value, internalId);
			return true;
		case "Bool":
			node[value ? "true" : "false"].delete(internalId);
			return true;
		case "Radix": {
			const tokens = tokenizer.tokenize(value, language, prop);
			implementation.removeDocumentScoreParameters(index, prop, id, docsCount);
			for (const token of tokens) {
				implementation.removeTokenScoreParameters(index, prop, token);
				node.removeDocumentByWord(token, internalId);
			}
			return true;
		}
		case "Flat":
			node.removeDocument(internalId, value);
			return true;
		case "BKD":
			node.removeDocByID(value, internalId);
			return false;
	}
}
function remove$1(implementation, index, prop, id, internalId, value, schemaType, language, tokenizer, docsCount) {
	if (!isArrayType(schemaType)) return removeScalar(implementation, index, prop, id, internalId, value, schemaType, language, tokenizer, docsCount);
	const innerSchemaType = getInnerType(schemaType);
	const elements = value;
	const elementsLength = elements.length;
	for (let i = 0; i < elementsLength; i++) removeScalar(implementation, index, prop, id, internalId, elements[i], innerSchemaType, language, tokenizer, docsCount);
	return true;
}
function calculateResultScores(index, prop, term, ids, docsCount, bm25Relevance, resultsMap, boostPerProperty, whereFiltersIDs, keywordMatchesMap) {
	const documentIDs = Array.from(ids);
	const avgFieldLength = index.avgFieldLength[prop];
	const fieldLengths = index.fieldLengths[prop];
	const oramaOccurrences = index.tokenOccurrences[prop];
	const oramaFrequencies = index.frequencies[prop];
	const termOccurrences = typeof oramaOccurrences[term] === "number" ? oramaOccurrences[term] ?? 0 : 0;
	const documentIDsLength = documentIDs.length;
	for (let k = 0; k < documentIDsLength; k++) {
		const internalId = documentIDs[k];
		if (whereFiltersIDs && !whereFiltersIDs.has(internalId)) continue;
		if (!keywordMatchesMap.has(internalId)) keywordMatchesMap.set(internalId, /* @__PURE__ */ new Map());
		const propertyMatches = keywordMatchesMap.get(internalId);
		propertyMatches.set(prop, (propertyMatches.get(prop) || 0) + 1);
		const bm25 = BM25(oramaFrequencies?.[internalId]?.[term] ?? 0, termOccurrences, docsCount, fieldLengths[internalId], avgFieldLength, bm25Relevance);
		if (resultsMap.has(internalId)) resultsMap.set(internalId, resultsMap.get(internalId) + bm25 * boostPerProperty);
		else resultsMap.set(internalId, bm25 * boostPerProperty);
	}
}
function search$1(index, term, tokenizer, language, propertiesToSearch, exact, tolerance, boost, relevance, docsCount, whereFiltersIDs, threshold = 0) {
	const tokens = tokenizer.tokenize(term, language);
	const keywordsCount = tokens.length || 1;
	const keywordMatchesMap = /* @__PURE__ */ new Map();
	const tokenFoundMap = /* @__PURE__ */ new Map();
	const resultsMap = /* @__PURE__ */ new Map();
	for (const prop of propertiesToSearch) {
		if (!(prop in index.indexes)) continue;
		const tree = index.indexes[prop];
		const { type } = tree;
		if (type !== "Radix") throw createError("WRONG_SEARCH_PROPERTY_TYPE", prop);
		const boostPerProperty = boost[prop] ?? 1;
		if (boostPerProperty <= 0) throw createError("INVALID_BOOST_VALUE", boostPerProperty);
		if (tokens.length === 0 && !term) tokens.push("");
		const tokenLength = tokens.length;
		for (let i = 0; i < tokenLength; i++) {
			const token = tokens[i];
			const searchResult = tree.node.find({
				term: token,
				exact,
				tolerance
			});
			const termsFound = Object.keys(searchResult);
			if (termsFound.length > 0) tokenFoundMap.set(token, true);
			const termsFoundLength = termsFound.length;
			for (let j = 0; j < termsFoundLength; j++) {
				const word = termsFound[j];
				const ids = searchResult[word];
				calculateResultScores(index, prop, word, ids, docsCount, relevance, resultsMap, boostPerProperty, whereFiltersIDs, keywordMatchesMap);
			}
		}
	}
	const results = Array.from(resultsMap.entries()).map(([id, score]) => [id, score]).sort((a, b) => b[1] - a[1]);
	if (results.length === 0) return [];
	if (threshold === 1) return results;
	if (threshold === 0) {
		if (keywordsCount === 1) return results;
		for (const token of tokens) if (!tokenFoundMap.get(token)) return [];
		return results.filter(([id]) => {
			const propertyMatches = keywordMatchesMap.get(id);
			if (!propertyMatches) return false;
			return Array.from(propertyMatches.values()).some((matches) => matches === keywordsCount);
		});
	}
	const fullMatches = results.filter(([id]) => {
		const propertyMatches = keywordMatchesMap.get(id);
		if (!propertyMatches) return false;
		return Array.from(propertyMatches.values()).some((matches) => matches === keywordsCount);
	});
	if (fullMatches.length > 0) {
		const remainingResults = results.filter(([id]) => !fullMatches.some(([fid]) => fid === id));
		const additionalResults = Math.ceil(remainingResults.length * threshold);
		return [...fullMatches, ...remainingResults.slice(0, additionalResults)];
	}
	return results;
}
function searchByWhereClause(index, tokenizer, filters, language) {
	if ("and" in filters && filters.and && Array.isArray(filters.and)) {
		const andFilters = filters.and;
		if (andFilters.length === 0) return /* @__PURE__ */ new Set();
		return setIntersection(...andFilters.map((filter) => searchByWhereClause(index, tokenizer, filter, language)));
	}
	if ("or" in filters && filters.or && Array.isArray(filters.or)) {
		const orFilters = filters.or;
		if (orFilters.length === 0) return /* @__PURE__ */ new Set();
		return orFilters.map((filter) => searchByWhereClause(index, tokenizer, filter, language)).reduce((acc, set) => setUnion(acc, set), /* @__PURE__ */ new Set());
	}
	if ("not" in filters && filters.not) {
		const notFilter = filters.not;
		const allDocs = /* @__PURE__ */ new Set();
		const docsStore = index.sharedInternalDocumentStore;
		for (let i = 1; i <= docsStore.internalIdToId.length; i++) allDocs.add(i);
		return setDifference(allDocs, searchByWhereClause(index, tokenizer, notFilter, language));
	}
	const filterKeys = Object.keys(filters);
	const filtersMap = filterKeys.reduce((acc, key) => ({
		[key]: /* @__PURE__ */ new Set(),
		...acc
	}), {});
	for (const param of filterKeys) {
		const operation = filters[param];
		if (typeof index.indexes[param] === "undefined") throw createError("UNKNOWN_FILTER_PROPERTY", param);
		const { node, type, isArray } = index.indexes[param];
		if (type === "Bool") {
			const idx = node;
			const filteredIDs = operation ? idx.true : idx.false;
			filtersMap[param] = setUnion(filtersMap[param], filteredIDs);
			continue;
		}
		if (type === "BKD") {
			let reqOperation;
			if ("radius" in operation) reqOperation = "radius";
			else if ("polygon" in operation) reqOperation = "polygon";
			else throw new Error(`Invalid operation ${operation}`);
			if (reqOperation === "radius") {
				const { value, coordinates, unit = "m", inside = true, highPrecision = false } = operation[reqOperation];
				const distanceInMeters = convertDistanceToMeters(value, unit);
				const ids = node.searchByRadius(coordinates, distanceInMeters, inside, void 0, highPrecision);
				filtersMap[param] = addGeoResult(filtersMap[param], ids);
			} else {
				const { coordinates, inside = true, highPrecision = false } = operation[reqOperation];
				const ids = node.searchByPolygon(coordinates, inside, void 0, highPrecision);
				filtersMap[param] = addGeoResult(filtersMap[param], ids);
			}
			continue;
		}
		if (type === "Radix" && (typeof operation === "string" || Array.isArray(operation))) {
			for (const raw of [operation].flat()) {
				const term = tokenizer.tokenize(raw, language, param);
				for (const t of term) {
					const filteredIDsResults = node.find({
						term: t,
						exact: true
					});
					filtersMap[param] = addFindResult(filtersMap[param], filteredIDsResults);
				}
			}
			continue;
		}
		const operationKeys = Object.keys(operation);
		if (operationKeys.length > 1) throw createError("INVALID_FILTER_OPERATION", operationKeys.length);
		if (type === "Flat") {
			const results = new Set(isArray ? node.filterArr(operation) : node.filter(operation));
			filtersMap[param] = setUnion(filtersMap[param], results);
			continue;
		}
		if (type === "AVL") {
			const operationOpt = operationKeys[0];
			const operationValue = operation[operationOpt];
			let filteredIDs;
			switch (operationOpt) {
				case "gt":
					filteredIDs = node.greaterThan(operationValue, false);
					break;
				case "gte":
					filteredIDs = node.greaterThan(operationValue, true);
					break;
				case "lt":
					filteredIDs = node.lessThan(operationValue, false);
					break;
				case "lte":
					filteredIDs = node.lessThan(operationValue, true);
					break;
				case "eq":
					filteredIDs = node.find(operationValue) ?? /* @__PURE__ */ new Set();
					break;
				case "between": {
					const [min, max] = operationValue;
					filteredIDs = node.rangeSearch(min, max);
					break;
				}
				default: throw createError("INVALID_FILTER_OPERATION", operationOpt);
			}
			filtersMap[param] = setUnion(filtersMap[param], filteredIDs);
		}
	}
	return setIntersection(...Object.values(filtersMap));
}
function getSearchableProperties(index) {
	return index.searchableProperties;
}
function getSearchablePropertiesWithTypes(index) {
	return index.searchablePropertiesWithTypes;
}
function load$3(sharedInternalDocumentStore, raw) {
	const { indexes: rawIndexes, vectorIndexes: rawVectorIndexes, searchableProperties, searchablePropertiesWithTypes, frequencies, tokenOccurrences, avgFieldLength, fieldLengths } = raw;
	const indexes = {};
	const vectorIndexes = {};
	for (const prop of Object.keys(rawIndexes)) {
		const { node, type, isArray } = rawIndexes[prop];
		switch (type) {
			case "Radix":
				indexes[prop] = {
					type: "Radix",
					node: RadixTree.fromJSON(node),
					isArray
				};
				break;
			case "Flat":
				indexes[prop] = {
					type: "Flat",
					node: FlatTree.fromJSON(node),
					isArray
				};
				break;
			case "AVL":
				indexes[prop] = {
					type: "AVL",
					node: AVLTree.fromJSON(node),
					isArray
				};
				break;
			case "BKD":
				indexes[prop] = {
					type: "BKD",
					node: BKDTree.fromJSON(node),
					isArray
				};
				break;
			case "Bool":
				indexes[prop] = {
					type: "Bool",
					node: BoolNode.fromJSON(node),
					isArray
				};
				break;
			default: indexes[prop] = rawIndexes[prop];
		}
	}
	for (const idx of Object.keys(rawVectorIndexes)) vectorIndexes[idx] = {
		type: "Vector",
		isArray: false,
		node: VectorIndex.fromJSON(rawVectorIndexes[idx])
	};
	return {
		sharedInternalDocumentStore,
		indexes,
		vectorIndexes,
		searchableProperties,
		searchablePropertiesWithTypes,
		frequencies,
		tokenOccurrences,
		avgFieldLength,
		fieldLengths
	};
}
function save$3(index) {
	const { indexes, vectorIndexes, searchableProperties, searchablePropertiesWithTypes, frequencies, tokenOccurrences, avgFieldLength, fieldLengths } = index;
	const dumpVectorIndexes = {};
	for (const idx of Object.keys(vectorIndexes)) dumpVectorIndexes[idx] = vectorIndexes[idx].node.toJSON();
	const savedIndexes = {};
	for (const name of Object.keys(indexes)) {
		const { type, node, isArray } = indexes[name];
		if (type === "Flat" || type === "Radix" || type === "AVL" || type === "BKD" || type === "Bool") savedIndexes[name] = {
			type,
			node: node.toJSON(),
			isArray
		};
		else {
			savedIndexes[name] = indexes[name];
			savedIndexes[name].node = savedIndexes[name].node.toJSON();
		}
	}
	return {
		indexes: savedIndexes,
		vectorIndexes: dumpVectorIndexes,
		searchableProperties,
		searchablePropertiesWithTypes,
		frequencies,
		tokenOccurrences,
		avgFieldLength,
		fieldLengths
	};
}
function createIndex() {
	return {
		create: create$3,
		insert: insert$1,
		remove: remove$1,
		insertDocumentScoreParameters,
		insertTokenScoreParameters,
		removeDocumentScoreParameters,
		removeTokenScoreParameters,
		calculateResultScores,
		search: search$1,
		searchByWhereClause,
		getSearchableProperties,
		getSearchablePropertiesWithTypes,
		load: load$3,
		save: save$3
	};
}
function addGeoResult(set, ids) {
	if (!set) set = /* @__PURE__ */ new Set();
	const idsLength = ids.length;
	for (let i = 0; i < idsLength; i++) {
		const entry = ids[i].docIDs;
		const idsLength = entry.length;
		for (let j = 0; j < idsLength; j++) set.add(entry[j]);
	}
	return set;
}
function createGeoTokenScores(ids, centerPoint, highPrecision = false) {
	const distanceFn = highPrecision ? BKDTree.vincentyDistance : BKDTree.haversineDistance;
	const results = [];
	const distances = [];
	for (const { point } of ids) distances.push(distanceFn(centerPoint, point));
	const maxDistance = Math.max(...distances);
	let index = 0;
	for (const { docIDs } of ids) {
		const score = maxDistance - distances[index] + 1;
		for (const docID of docIDs) results.push([docID, score]);
		index++;
	}
	results.sort((a, b) => b[1] - a[1]);
	return results;
}
function isGeosearchOnlyQuery(filters, index) {
	const filterKeys = Object.keys(filters);
	if (filterKeys.length !== 1) return { isGeoOnly: false };
	const param = filterKeys[0];
	const operation = filters[param];
	if (typeof index.indexes[param] === "undefined") return { isGeoOnly: false };
	const { type } = index.indexes[param];
	if (type === "BKD" && operation && ("radius" in operation || "polygon" in operation)) return {
		isGeoOnly: true,
		geoProperty: param,
		geoOperation: operation
	};
	return { isGeoOnly: false };
}
function searchByGeoWhereClause(index, filters) {
	const indexTyped = index;
	const geoInfo = isGeosearchOnlyQuery(filters, indexTyped);
	if (!geoInfo.isGeoOnly || !geoInfo.geoProperty || !geoInfo.geoOperation) return null;
	const { node } = indexTyped.indexes[geoInfo.geoProperty];
	const operation = geoInfo.geoOperation;
	const bkdNode = node;
	let results;
	if ("radius" in operation) {
		const { value, coordinates, unit = "m", inside = true, highPrecision = false } = operation.radius;
		const centerPoint = coordinates;
		const distanceInMeters = convertDistanceToMeters(value, unit);
		results = bkdNode.searchByRadius(centerPoint, distanceInMeters, inside, "asc", highPrecision);
		return createGeoTokenScores(results, centerPoint, highPrecision);
	} else if ("polygon" in operation) {
		const { coordinates, inside = true, highPrecision = false } = operation.polygon;
		results = bkdNode.searchByPolygon(coordinates, inside, "asc", highPrecision);
		const centroid = BKDTree.calculatePolygonCentroid(coordinates);
		return createGeoTokenScores(results, centroid, highPrecision);
	}
	return null;
}
function addFindResult(set, filteredIDsResults) {
	if (!set) set = /* @__PURE__ */ new Set();
	const keys = Object.keys(filteredIDsResults);
	const keysLength = keys.length;
	for (let i = 0; i < keysLength; i++) {
		const ids = filteredIDsResults[keys[i]];
		const idsLength = ids.length;
		for (let j = 0; j < idsLength; j++) set.add(ids[j]);
	}
	return set;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/sorter.js
function innerCreate(orama, sharedInternalDocumentStore, schema, sortableDeniedProperties, prefix) {
	const sorter = {
		language: orama.tokenizer.language,
		sharedInternalDocumentStore,
		enabled: true,
		isSorted: true,
		sortableProperties: [],
		sortablePropertiesWithTypes: {},
		sorts: {}
	};
	for (const [prop, type] of Object.entries(schema)) {
		const path = `${prefix}${prefix ? "." : ""}${prop}`;
		if (sortableDeniedProperties.includes(path)) continue;
		if (typeof type === "object" && !Array.isArray(type)) {
			const ret = innerCreate(orama, sharedInternalDocumentStore, type, sortableDeniedProperties, path);
			safeArrayPush(sorter.sortableProperties, ret.sortableProperties);
			sorter.sorts = {
				...sorter.sorts,
				...ret.sorts
			};
			sorter.sortablePropertiesWithTypes = {
				...sorter.sortablePropertiesWithTypes,
				...ret.sortablePropertiesWithTypes
			};
			continue;
		}
		if (!isVectorType(type)) switch (type) {
			case "boolean":
			case "number":
			case "string":
				sorter.sortableProperties.push(path);
				sorter.sortablePropertiesWithTypes[path] = type;
				sorter.sorts[path] = {
					docs: /* @__PURE__ */ new Map(),
					orderedDocsToRemove: /* @__PURE__ */ new Map(),
					orderedDocs: [],
					type
				};
				break;
			case "geopoint":
			case "enum": continue;
			case "enum[]":
			case "boolean[]":
			case "number[]":
			case "string[]": continue;
			default: throw createError("INVALID_SORT_SCHEMA_TYPE", Array.isArray(type) ? "array" : type, path);
		}
	}
	return sorter;
}
function create$2(orama, sharedInternalDocumentStore, schema, config) {
	if (!(config?.enabled !== false)) return { disabled: true };
	return innerCreate(orama, sharedInternalDocumentStore, schema, (config || {}).unsortableProperties || [], "");
}
function insert(sorter, prop, id, value) {
	if (!sorter.enabled) return;
	sorter.isSorted = false;
	const internalId = getInternalDocumentId(sorter.sharedInternalDocumentStore, id);
	const s = sorter.sorts[prop];
	if (s.orderedDocsToRemove.has(internalId)) ensureOrderedDocsAreDeletedByProperty(sorter, prop);
	s.docs.set(internalId, s.orderedDocs.length);
	s.orderedDocs.push([internalId, value]);
}
function ensureIsSorted(sorter) {
	if (sorter.isSorted || !sorter.enabled) return;
	const properties = Object.keys(sorter.sorts);
	for (const prop of properties) ensurePropertyIsSorted(sorter, prop);
	sorter.isSorted = true;
}
function stringSort(language, value, d) {
	return value[1].localeCompare(d[1], getLocale(language));
}
function numberSort(value, d) {
	return value[1] - d[1];
}
function booleanSort(value, d) {
	return d[1] ? -1 : 1;
}
function ensurePropertyIsSorted(sorter, prop) {
	const s = sorter.sorts[prop];
	let predicate;
	switch (s.type) {
		case "string":
			predicate = stringSort.bind(null, sorter.language);
			break;
		case "number":
			predicate = numberSort.bind(null);
			break;
		case "boolean": predicate = booleanSort.bind(null);
	}
	s.orderedDocs.sort(predicate);
	const orderedDocsLength = s.orderedDocs.length;
	for (let i = 0; i < orderedDocsLength; i++) {
		const docId = s.orderedDocs[i][0];
		s.docs.set(docId, i);
	}
}
function ensureOrderedDocsAreDeleted(sorter) {
	const properties = Object.keys(sorter.sorts);
	for (const prop of properties) ensureOrderedDocsAreDeletedByProperty(sorter, prop);
}
function ensureOrderedDocsAreDeletedByProperty(sorter, prop) {
	const s = sorter.sorts[prop];
	if (!s.orderedDocsToRemove.size) return;
	s.orderedDocs = s.orderedDocs.filter((doc) => !s.orderedDocsToRemove.has(doc[0]));
	s.orderedDocsToRemove.clear();
}
function remove(sorter, prop, id) {
	if (!sorter.enabled) return;
	const s = sorter.sorts[prop];
	const internalId = getInternalDocumentId(sorter.sharedInternalDocumentStore, id);
	if (!s.docs.get(internalId)) return;
	s.docs.delete(internalId);
	s.orderedDocsToRemove.set(internalId, true);
}
function sortBy(sorter, docIds, by) {
	if (!sorter.enabled) throw createError("SORT_DISABLED");
	const property = by.property;
	const isDesc = by.order === "DESC";
	const s = sorter.sorts[property];
	if (!s) throw createError("UNABLE_TO_SORT_ON_UNKNOWN_FIELD", property, sorter.sortableProperties.join(", "));
	ensureOrderedDocsAreDeletedByProperty(sorter, property);
	ensureIsSorted(sorter);
	docIds.sort((a, b) => {
		const indexOfA = s.docs.get(getInternalDocumentId(sorter.sharedInternalDocumentStore, a[0]));
		const indexOfB = s.docs.get(getInternalDocumentId(sorter.sharedInternalDocumentStore, b[0]));
		const isAIndexed = typeof indexOfA !== "undefined";
		const isBIndexed = typeof indexOfB !== "undefined";
		if (!isAIndexed && !isBIndexed) return 0;
		if (!isAIndexed) return 1;
		if (!isBIndexed) return -1;
		return isDesc ? indexOfB - indexOfA : indexOfA - indexOfB;
	});
	return docIds;
}
function getSortableProperties(sorter) {
	if (!sorter.enabled) return [];
	return sorter.sortableProperties;
}
function getSortablePropertiesWithTypes(sorter) {
	if (!sorter.enabled) return {};
	return sorter.sortablePropertiesWithTypes;
}
function load$2(sharedInternalDocumentStore, raw) {
	const rawDocument = raw;
	if (!rawDocument.enabled) return { enabled: false };
	const sorts = Object.keys(rawDocument.sorts).reduce((acc, prop) => {
		const { docs, orderedDocs, type } = rawDocument.sorts[prop];
		acc[prop] = {
			docs: new Map(Object.entries(docs).map(([k, v]) => [+k, v])),
			orderedDocsToRemove: /* @__PURE__ */ new Map(),
			orderedDocs,
			type
		};
		return acc;
	}, {});
	return {
		sharedInternalDocumentStore,
		language: rawDocument.language,
		sortableProperties: rawDocument.sortableProperties,
		sortablePropertiesWithTypes: rawDocument.sortablePropertiesWithTypes,
		sorts,
		enabled: true,
		isSorted: rawDocument.isSorted
	};
}
function save$2(sorter) {
	if (!sorter.enabled) return { enabled: false };
	ensureOrderedDocsAreDeleted(sorter);
	ensureIsSorted(sorter);
	const sorts = Object.keys(sorter.sorts).reduce((acc, prop) => {
		const { docs, orderedDocs, type } = sorter.sorts[prop];
		acc[prop] = {
			docs: Object.fromEntries(docs.entries()),
			orderedDocs,
			type
		};
		return acc;
	}, {});
	return {
		language: sorter.language,
		sortableProperties: sorter.sortableProperties,
		sortablePropertiesWithTypes: sorter.sortablePropertiesWithTypes,
		sorts,
		enabled: sorter.enabled,
		isSorted: sorter.isSorted
	};
}
function createSorter() {
	return {
		create: create$2,
		insert,
		remove,
		save: save$2,
		load: load$2,
		sortBy,
		getSortableProperties,
		getSortablePropertiesWithTypes
	};
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/tokenizer/diacritics.js
var DIACRITICS_CHARCODE_START = 192;
var DIACRITICS_CHARCODE_END = 383;
var CHARCODE_REPLACE_MAPPING = [
	65,
	65,
	65,
	65,
	65,
	65,
	65,
	67,
	69,
	69,
	69,
	69,
	73,
	73,
	73,
	73,
	69,
	78,
	79,
	79,
	79,
	79,
	79,
	null,
	79,
	85,
	85,
	85,
	85,
	89,
	80,
	115,
	97,
	97,
	97,
	97,
	97,
	97,
	97,
	99,
	101,
	101,
	101,
	101,
	105,
	105,
	105,
	105,
	101,
	110,
	111,
	111,
	111,
	111,
	111,
	null,
	111,
	117,
	117,
	117,
	117,
	121,
	112,
	121,
	65,
	97,
	65,
	97,
	65,
	97,
	67,
	99,
	67,
	99,
	67,
	99,
	67,
	99,
	68,
	100,
	68,
	100,
	69,
	101,
	69,
	101,
	69,
	101,
	69,
	101,
	69,
	101,
	71,
	103,
	71,
	103,
	71,
	103,
	71,
	103,
	72,
	104,
	72,
	104,
	73,
	105,
	73,
	105,
	73,
	105,
	73,
	105,
	73,
	105,
	73,
	105,
	74,
	106,
	75,
	107,
	107,
	76,
	108,
	76,
	108,
	76,
	108,
	76,
	108,
	76,
	108,
	78,
	110,
	78,
	110,
	78,
	110,
	110,
	78,
	110,
	79,
	111,
	79,
	111,
	79,
	111,
	79,
	111,
	82,
	114,
	82,
	114,
	82,
	114,
	83,
	115,
	83,
	115,
	83,
	115,
	83,
	115,
	84,
	116,
	84,
	116,
	84,
	116,
	85,
	117,
	85,
	117,
	85,
	117,
	85,
	117,
	85,
	117,
	85,
	117,
	87,
	119,
	89,
	121,
	89,
	90,
	122,
	90,
	122,
	90,
	122,
	115
];
function replaceChar(charCode) {
	if (charCode < DIACRITICS_CHARCODE_START || charCode > DIACRITICS_CHARCODE_END) return charCode;
	/* c8 ignore next  */
	return CHARCODE_REPLACE_MAPPING[charCode - DIACRITICS_CHARCODE_START] || charCode;
}
function replaceDiacritics(str) {
	const stringCharCode = [];
	for (let idx = 0; idx < str.length; idx++) stringCharCode[idx] = replaceChar(str.charCodeAt(idx));
	return String.fromCharCode(...stringCharCode);
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/tokenizer/english-stemmer.js
var step2List = {
	ational: "ate",
	tional: "tion",
	enci: "ence",
	anci: "ance",
	izer: "ize",
	bli: "ble",
	alli: "al",
	entli: "ent",
	eli: "e",
	ousli: "ous",
	ization: "ize",
	ation: "ate",
	ator: "ate",
	alism: "al",
	iveness: "ive",
	fulness: "ful",
	ousness: "ous",
	aliti: "al",
	iviti: "ive",
	biliti: "ble",
	logi: "log"
};
var step3List = {
	icate: "ic",
	ative: "",
	alize: "al",
	iciti: "ic",
	ical: "ic",
	ful: "",
	ness: ""
};
var mgr0 = "^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*";
var meq1 = "^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*([aeiouy][aeiou]*)?$";
var mgr1 = "^([^aeiou][^aeiouy]*)?[aeiouy][aeiou]*[^aeiou][^aeiouy]*[aeiouy][aeiou]*[^aeiou][^aeiouy]*";
var s_v = "^([^aeiou][^aeiouy]*)?[aeiouy]";
function stemmer$1(w) {
	let stem;
	let suffix;
	let re;
	let re2;
	let re3;
	let re4;
	if (w.length < 3) return w;
	const firstch = w.substring(0, 1);
	if (firstch == "y") w = firstch.toUpperCase() + w.substring(1);
	re = /^(.+?)(ss|i)es$/;
	re2 = /^(.+?)([^s])s$/;
	if (re.test(w)) w = w.replace(re, "$1$2");
	else if (re2.test(w)) w = w.replace(re2, "$1$2");
	re = /^(.+?)eed$/;
	re2 = /^(.+?)(ed|ing)$/;
	if (re.test(w)) {
		const fp = re.exec(w);
		re = new RegExp(mgr0);
		if (re.test(fp[1])) {
			re = /.$/;
			w = w.replace(re, "");
		}
	} else if (re2.test(w)) {
		stem = re2.exec(w)[1];
		re2 = new RegExp(s_v);
		if (re2.test(stem)) {
			w = stem;
			re2 = /(at|bl|iz)$/;
			re3 = /* @__PURE__ */ new RegExp("([^aeiouylsz])\\1$");
			re4 = /* @__PURE__ */ new RegExp("^[^aeiou][^aeiouy]*[aeiouy][^aeiouwxy]$");
			if (re2.test(w)) w = w + "e";
			else if (re3.test(w)) {
				re = /.$/;
				w = w.replace(re, "");
			} else if (re4.test(w)) w = w + "e";
		}
	}
	re = /^(.+?)y$/;
	if (re.test(w)) {
		stem = re.exec(w)?.[1];
		re = new RegExp(s_v);
		if (stem && re.test(stem)) w = stem + "i";
	}
	re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
	if (re.test(w)) {
		const fp = re.exec(w);
		stem = fp?.[1];
		suffix = fp?.[2];
		re = new RegExp(mgr0);
		if (stem && re.test(stem)) w = stem + step2List[suffix];
	}
	re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
	if (re.test(w)) {
		const fp = re.exec(w);
		stem = fp?.[1];
		suffix = fp?.[2];
		re = new RegExp(mgr0);
		if (stem && re.test(stem)) w = stem + step3List[suffix];
	}
	re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
	re2 = /^(.+?)(s|t)(ion)$/;
	if (re.test(w)) {
		stem = re.exec(w)?.[1];
		re = new RegExp(mgr1);
		if (stem && re.test(stem)) w = stem;
	} else if (re2.test(w)) {
		const fp = re2.exec(w);
		stem = fp?.[1] ?? "" + fp?.[2] ?? "";
		re2 = new RegExp(mgr1);
		if (re2.test(stem)) w = stem;
	}
	re = /^(.+?)e$/;
	if (re.test(w)) {
		stem = re.exec(w)?.[1];
		re = new RegExp(mgr1);
		re2 = new RegExp(meq1);
		re3 = /* @__PURE__ */ new RegExp("^[^aeiou][^aeiouy]*[aeiouy][^aeiouwxy]$");
		if (stem && (re.test(stem) || re2.test(stem) && !re3.test(stem))) w = stem;
	}
	re = /ll$/;
	re2 = new RegExp(mgr1);
	if (re.test(w) && re2.test(w)) {
		re = /.$/;
		w = w.replace(re, "");
	}
	if (firstch == "y") w = firstch.toLowerCase() + w.substring(1);
	return w;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/tokenizer/index.js
function normalizeToken(prop, token, withCache = true) {
	const key = `${this.language}:${prop}:${token}`;
	if (withCache && this.normalizationCache.has(key)) return this.normalizationCache.get(key);
	if (this.stopWords?.includes(token)) {
		if (withCache) this.normalizationCache.set(key, "");
		return "";
	}
	if (this.stemmer && !this.stemmerSkipProperties.has(prop)) token = this.stemmer(token);
	token = replaceDiacritics(token);
	if (withCache) this.normalizationCache.set(key, token);
	return token;
}
/* c8 ignore next 10 */
function trim(text) {
	while (text[text.length - 1] === "") text.pop();
	while (text[0] === "") text.shift();
	return text;
}
function tokenize(input, language, prop, withCache = true) {
	if (language && language !== this.language) throw createError("LANGUAGE_NOT_SUPPORTED", language);
	/* c8 ignore next 3 */
	if (typeof input !== "string") return [input];
	const normalizeToken = this.normalizeToken.bind(this, prop ?? "");
	let tokens;
	if (prop && this.tokenizeSkipProperties.has(prop)) tokens = [normalizeToken(input, withCache)];
	else {
		const splitRule = SPLITTERS[this.language];
		tokens = input.toLowerCase().split(splitRule).map((t) => normalizeToken(t, withCache)).filter(Boolean);
	}
	const trimTokens = trim(tokens);
	if (!this.allowDuplicates) return Array.from(new Set(trimTokens));
	return trimTokens;
}
function createTokenizer(config = {}) {
	if (!config.language) config.language = "english";
	else if (!SUPPORTED_LANGUAGES.includes(config.language)) throw createError("LANGUAGE_NOT_SUPPORTED", config.language);
	let stemmer;
	if (config.stemming || config.stemmer && !("stemming" in config)) {
		if (config.stemmer) {
			if (typeof config.stemmer !== "function") throw createError("INVALID_STEMMER_FUNCTION_TYPE");
			stemmer = config.stemmer;
		} else if (config.language === "english") stemmer = stemmer$1;
		else throw createError("MISSING_STEMMER", config.language);
	}
	let stopWords;
	if (config.stopWords !== false) {
		stopWords = [];
		if (Array.isArray(config.stopWords)) stopWords = config.stopWords;
		else if (typeof config.stopWords === "function") stopWords = config.stopWords(stopWords);
		else if (config.stopWords) throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
		if (!Array.isArray(stopWords)) throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
		for (const s of stopWords) if (typeof s !== "string") throw createError("CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY");
	}
	const tokenizer = {
		tokenize,
		language: config.language,
		stemmer,
		stemmerSkipProperties: new Set(config.stemmerSkipProperties ? [config.stemmerSkipProperties].flat() : []),
		tokenizeSkipProperties: new Set(config.tokenizeSkipProperties ? [config.tokenizeSkipProperties].flat() : []),
		stopWords,
		allowDuplicates: Boolean(config.allowDuplicates),
		normalizeToken,
		normalizationCache: /* @__PURE__ */ new Map()
	};
	tokenizer.tokenize = tokenize.bind(tokenizer);
	tokenizer.normalizeToken = normalizeToken;
	return tokenizer;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/pinning.js
function create$1(sharedInternalDocumentStore) {
	return {
		sharedInternalDocumentStore,
		rules: /* @__PURE__ */ new Map()
	};
}
function addRule(store, rule) {
	if (store.rules.has(rule.id)) throw new Error(`PINNING_RULE_ALREADY_EXISTS: A pinning rule with id "${rule.id}" already exists. Use updateRule to modify it.`);
	store.rules.set(rule.id, rule);
}
function updateRule(store, rule) {
	if (!store.rules.has(rule.id)) throw new Error(`PINNING_RULE_NOT_FOUND: Cannot update pinning rule with id "${rule.id}" because it does not exist. Use addRule to create it.`);
	store.rules.set(rule.id, rule);
}
function removeRule(store, ruleId) {
	return store.rules.delete(ruleId);
}
function getRule(store, ruleId) {
	return store.rules.get(ruleId);
}
function getAllRules(store) {
	return Array.from(store.rules.values());
}
function matchesCondition(term, condition) {
	const normalizedTerm = term.toLowerCase().trim();
	const normalizedPattern = condition.pattern.toLowerCase().trim();
	switch (condition.anchoring) {
		case "is": return normalizedTerm === normalizedPattern;
		case "starts_with": return normalizedTerm.startsWith(normalizedPattern);
		case "contains": return normalizedTerm.includes(normalizedPattern);
		default: return false;
	}
}
function matchesRule(term, rule) {
	if (!term) return false;
	return rule.conditions.every((condition) => matchesCondition(term, condition));
}
function getMatchingRules(store, term) {
	if (!term) return [];
	const matchingRules = [];
	for (const rule of store.rules.values()) if (matchesRule(term, rule)) matchingRules.push(rule);
	return matchingRules;
}
function load$1(sharedInternalDocumentStore, raw) {
	return {
		sharedInternalDocumentStore,
		rules: new Map(raw?.rules ?? [])
	};
}
function save$1(store) {
	return { rules: Array.from(store.rules.entries()) };
}
function createPinning() {
	return {
		create: create$1,
		addRule,
		updateRule,
		removeRule,
		getRule,
		getAllRules,
		getMatchingRules,
		load: load$1,
		save: save$1
	};
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/create.js
function validateComponents(components) {
	const defaultComponents = {
		formatElapsedTime,
		getDocumentIndexId,
		getDocumentProperties,
		validateSchema
	};
	for (const rawKey of FUNCTION_COMPONENTS) {
		const key = rawKey;
		if (components[key]) {
			if (typeof components[key] !== "function") throw createError("COMPONENT_MUST_BE_FUNCTION", key);
		} else components[key] = defaultComponents[key];
	}
	for (const rawKey of Object.keys(components)) if (!OBJECT_COMPONENTS.includes(rawKey) && !FUNCTION_COMPONENTS.includes(rawKey)) throw createError("UNSUPPORTED_COMPONENT", rawKey);
}
function create({ schema, sort, language, components, id, plugins }) {
	if (!components) components = {};
	for (const plugin of plugins ?? []) {
		if (!("getComponents" in plugin)) continue;
		if (typeof plugin.getComponents !== "function") continue;
		const pluginComponents = plugin.getComponents(schema);
		const keys = Object.keys(pluginComponents);
		for (const key of keys) if (components[key]) throw createError("PLUGIN_COMPONENT_CONFLICT", key, plugin.name);
		components = {
			...components,
			...pluginComponents
		};
	}
	if (!id) id = uniqueId();
	let tokenizer = components.tokenizer;
	let index = components.index;
	let documentsStore = components.documentsStore;
	let sorter = components.sorter;
	let pinning = components.pinning;
	if (!tokenizer) tokenizer = createTokenizer({ language: language ?? "english" });
	else if (!tokenizer.tokenize) tokenizer = createTokenizer(tokenizer);
	else tokenizer = tokenizer;
	if (components.tokenizer && language) throw createError("NO_LANGUAGE_WITH_CUSTOM_TOKENIZER");
	const internalDocumentStore = createInternalDocumentIDStore();
	index ||= createIndex();
	sorter ||= createSorter();
	documentsStore ||= createDocumentsStore();
	pinning ||= createPinning();
	validateComponents(components);
	const { getDocumentProperties, getDocumentIndexId, validateSchema, formatElapsedTime } = components;
	const orama = {
		data: {},
		caches: {},
		schema,
		tokenizer,
		index,
		sorter,
		documentsStore,
		pinning,
		internalDocumentIDStore: internalDocumentStore,
		getDocumentProperties,
		getDocumentIndexId,
		validateSchema,
		beforeInsert: [],
		afterInsert: [],
		beforeRemove: [],
		afterRemove: [],
		beforeUpdate: [],
		afterUpdate: [],
		beforeUpsert: [],
		afterUpsert: [],
		beforeSearch: [],
		afterSearch: [],
		beforeInsertMultiple: [],
		afterInsertMultiple: [],
		beforeRemoveMultiple: [],
		afterRemoveMultiple: [],
		beforeUpdateMultiple: [],
		afterUpdateMultiple: [],
		beforeUpsertMultiple: [],
		afterUpsertMultiple: [],
		afterCreate: [],
		formatElapsedTime,
		id,
		plugins,
		version: getVersion()
	};
	orama.data = {
		index: orama.index.create(orama, internalDocumentStore, schema),
		docs: orama.documentsStore.create(orama, internalDocumentStore),
		sorting: orama.sorter.create(orama, internalDocumentStore, schema, sort),
		pinning: orama.pinning.create(internalDocumentStore)
	};
	for (const hook of AVAILABLE_PLUGIN_HOOKS) orama[hook] = (orama[hook] ?? []).concat(getAllPluginsByHook(orama, hook));
	const afterCreate = orama["afterCreate"];
	if (afterCreate) runAfterCreate(afterCreate, orama);
	return orama;
}
function getVersion() {
	return "{{VERSION}}";
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/docs.js
function count(db) {
	return db.documentsStore.count(db.data.docs);
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/facets.js
function sortAsc(a, b) {
	return a[1] - b[1];
}
function sortDesc(a, b) {
	return b[1] - a[1];
}
function sortingPredicateBuilder(order = "desc") {
	return order.toLowerCase() === "asc" ? sortAsc : sortDesc;
}
function getFacets(orama, results, facetsConfig) {
	const facets = {};
	const allIDs = results.map(([id]) => id);
	const allDocs = orama.documentsStore.getMultiple(orama.data.docs, allIDs);
	const facetKeys = Object.keys(facetsConfig);
	const properties = orama.index.getSearchablePropertiesWithTypes(orama.data.index);
	for (const facet of facetKeys) {
		let values;
		if (properties[facet] === "number") {
			const { ranges } = facetsConfig[facet];
			const rangesLength = ranges.length;
			const tmp = Array.from({ length: rangesLength });
			for (let i = 0; i < rangesLength; i++) {
				const range = ranges[i];
				tmp[i] = [`${range.from}-${range.to}`, 0];
			}
			values = Object.fromEntries(tmp);
		}
		facets[facet] = {
			count: 0,
			values: values ?? {}
		};
	}
	const allDocsLength = allDocs.length;
	for (let i = 0; i < allDocsLength; i++) {
		const doc = allDocs[i];
		for (const facet of facetKeys) {
			const facetValue = facet.includes(".") ? getNested(doc, facet) : doc[facet];
			const propertyType = properties[facet];
			const facetValues = facets[facet].values;
			switch (propertyType) {
				case "number": {
					const ranges = facetsConfig[facet].ranges;
					calculateNumberFacetBuilder(ranges, facetValues)(facetValue);
					break;
				}
				case "number[]": {
					const alreadyInsertedValues = /* @__PURE__ */ new Set();
					const ranges = facetsConfig[facet].ranges;
					const calculateNumberFacet = calculateNumberFacetBuilder(ranges, facetValues, alreadyInsertedValues);
					for (const v of facetValue) calculateNumberFacet(v);
					break;
				}
				case "boolean":
				case "enum":
				case "string":
					calculateBooleanStringOrEnumFacetBuilder(facetValues, propertyType)(facetValue);
					break;
				case "boolean[]":
				case "enum[]":
				case "string[]": {
					const calculateBooleanStringOrEnumFacet = calculateBooleanStringOrEnumFacetBuilder(facetValues, propertyType === "boolean[]" ? "boolean" : "string", /* @__PURE__ */ new Set());
					for (const v of facetValue) calculateBooleanStringOrEnumFacet(v);
					break;
				}
				default: throw createError("FACET_NOT_SUPPORTED", propertyType);
			}
		}
	}
	for (const facet of facetKeys) {
		const currentFacet = facets[facet];
		currentFacet.count = Object.keys(currentFacet.values).length;
		if (properties[facet] === "string") {
			const stringFacetDefinition = facetsConfig[facet];
			const sortingPredicate = sortingPredicateBuilder(stringFacetDefinition.sort);
			currentFacet.values = Object.fromEntries(Object.entries(currentFacet.values).sort(sortingPredicate).slice(stringFacetDefinition.offset ?? 0, stringFacetDefinition.limit ?? 10));
		}
	}
	return facets;
}
function calculateNumberFacetBuilder(ranges, values, alreadyInsertedValues) {
	return (facetValue) => {
		for (const range of ranges) {
			const value = `${range.from}-${range.to}`;
			if (alreadyInsertedValues?.has(value)) continue;
			if (facetValue >= range.from && facetValue <= range.to) {
				if (values[value] === void 0) values[value] = 1;
				else {
					values[value]++;
					alreadyInsertedValues?.add(value);
				}
			}
		}
	};
}
function calculateBooleanStringOrEnumFacetBuilder(values, propertyType, alreadyInsertedValues) {
	const defaultValue = propertyType === "boolean" ? "false" : "";
	return (facetValue) => {
		const value = facetValue?.toString() ?? defaultValue;
		if (alreadyInsertedValues?.has(value)) return;
		values[value] = (values[value] ?? 0) + 1;
		alreadyInsertedValues?.add(value);
	};
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/groups.js
var DEFAULT_REDUCE = {
	reducer: (_, acc, res, index) => {
		acc[index] = res;
		return acc;
	},
	getInitialValue: (length) => Array.from({ length })
};
var ALLOWED_TYPES = [
	"string",
	"number",
	"boolean"
];
function getGroups(orama, results, groupBy) {
	const properties = groupBy.properties;
	const propertiesLength = properties.length;
	const schemaProperties = orama.index.getSearchablePropertiesWithTypes(orama.data.index);
	for (let i = 0; i < propertiesLength; i++) {
		const property = properties[i];
		if (typeof schemaProperties[property] === "undefined") throw createError("UNKNOWN_GROUP_BY_PROPERTY", property);
		if (!ALLOWED_TYPES.includes(schemaProperties[property])) throw createError("INVALID_GROUP_BY_PROPERTY", property, ALLOWED_TYPES.join(", "), schemaProperties[property]);
	}
	const allIDs = results.map(([id]) => getDocumentIdFromInternalId(orama.internalDocumentIDStore, id));
	const allDocs = orama.documentsStore.getMultiple(orama.data.docs, allIDs);
	const allDocsLength = allDocs.length;
	const returnedCount = groupBy.maxResult || Number.MAX_SAFE_INTEGER;
	const listOfValues = [];
	const g = {};
	for (let i = 0; i < propertiesLength; i++) {
		const groupByKey = properties[i];
		const group = {
			property: groupByKey,
			perValue: {}
		};
		const values = /* @__PURE__ */ new Set();
		for (let j = 0; j < allDocsLength; j++) {
			const doc = allDocs[j];
			const value = getNested(doc, groupByKey);
			if (typeof value === "undefined") continue;
			const keyValue = typeof value !== "boolean" ? value : "" + value;
			const perValue = group.perValue[keyValue] ?? {
				indexes: [],
				count: 0
			};
			if (perValue.count >= returnedCount) continue;
			perValue.indexes.push(j);
			perValue.count++;
			group.perValue[keyValue] = perValue;
			values.add(value);
		}
		listOfValues.push(Array.from(values));
		g[groupByKey] = group;
	}
	const combinations = calculateCombination(listOfValues);
	const combinationsLength = combinations.length;
	const groups = [];
	for (let i = 0; i < combinationsLength; i++) {
		const combination = combinations[i];
		const combinationLength = combination.length;
		const group = {
			values: [],
			indexes: []
		};
		const indexes = [];
		for (let j = 0; j < combinationLength; j++) {
			const value = combination[j];
			const property = properties[j];
			indexes.push(g[property].perValue[typeof value !== "boolean" ? value : "" + value].indexes);
			group.values.push(value);
		}
		group.indexes = intersect(indexes).sort((a, b) => a - b);
		if (group.indexes.length === 0) continue;
		groups.push(group);
	}
	const groupsLength = groups.length;
	const res = Array.from({ length: groupsLength });
	for (let i = 0; i < groupsLength; i++) {
		const group = groups[i];
		const reduce = groupBy.reduce || DEFAULT_REDUCE;
		const docs = group.indexes.map((index) => {
			return {
				id: allIDs[index],
				score: results[index][1],
				document: allDocs[index]
			};
		});
		const func = reduce.reducer.bind(null, group.values);
		const initialValue = reduce.getInitialValue(group.indexes.length);
		const aggregationValue = docs.reduce(func, initialValue);
		res[i] = {
			values: group.values,
			result: aggregationValue
		};
	}
	return res;
}
function calculateCombination(arrs, index = 0) {
	if (index + 1 === arrs.length) return arrs[index].map((item) => [item]);
	const head = arrs[index];
	const c = calculateCombination(arrs, index + 1);
	const combinations = [];
	for (const value of head) for (const combination of c) {
		const result = [value];
		safeArrayPush(result, combination);
		combinations.push(result);
	}
	return combinations;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/components/pinning-manager.js
/**
* Apply pinning rules to search results.
* This function modifies the uniqueDocsArray by:
* 1. Finding matching pin rules based on the search term
* 2. Inserting pinned documents at their specified positions
* 3. Assigning high scores to pinned documents to maintain their positions
*/
function applyPinningRules(orama, pinningStore, uniqueDocsArray, searchTerm) {
	const matchingRules = getMatchingRules(pinningStore, searchTerm);
	if (matchingRules.length === 0) return uniqueDocsArray;
	const allPromotions = matchingRules.flatMap((rule) => rule.consequence.promote);
	allPromotions.sort((a, b) => a.position - b.position);
	const pinnedInternalIds = /* @__PURE__ */ new Set();
	const promotionsMap = /* @__PURE__ */ new Map();
	const positionsTaken = /* @__PURE__ */ new Set();
	for (const promotion of allPromotions) {
		const internalId = getInternalDocumentId(orama.internalDocumentIDStore, promotion.doc_id);
		if (internalId === void 0) continue;
		if (promotionsMap.has(internalId)) {
			const existingPosition = promotionsMap.get(internalId);
			if (promotion.position < existingPosition) promotionsMap.set(internalId, promotion.position);
			continue;
		}
		if (positionsTaken.has(promotion.position)) continue;
		pinnedInternalIds.add(internalId);
		promotionsMap.set(internalId, promotion.position);
		positionsTaken.add(promotion.position);
	}
	if (promotionsMap.size === 0) return uniqueDocsArray;
	const unpinnedResults = uniqueDocsArray.filter(([id]) => !pinnedInternalIds.has(id));
	const BASE_PIN_SCORE = 1e6;
	const pinnedResults = [];
	for (const [internalId, position] of promotionsMap.entries()) if (uniqueDocsArray.find(([id]) => id === internalId)) pinnedResults.push([internalId, BASE_PIN_SCORE - position]);
	else if (orama.documentsStore.get(orama.data.docs, internalId)) pinnedResults.push([internalId, 0]);
	pinnedResults.sort((a, b) => {
		return (promotionsMap.get(a[0]) ?? Infinity) - (promotionsMap.get(b[0]) ?? Infinity);
	});
	const finalResults = [];
	const pinnedByPosition = /* @__PURE__ */ new Map();
	for (const pinnedResult of pinnedResults) {
		const position = promotionsMap.get(pinnedResult[0]);
		pinnedByPosition.set(position, pinnedResult);
	}
	let unpinnedIndex = 0;
	let currentPosition = 0;
	while (currentPosition < unpinnedResults.length + pinnedResults.length) if (pinnedByPosition.has(currentPosition)) {
		finalResults.push(pinnedByPosition.get(currentPosition));
		currentPosition++;
	} else if (unpinnedIndex < unpinnedResults.length) {
		finalResults.push(unpinnedResults[unpinnedIndex]);
		unpinnedIndex++;
		currentPosition++;
	} else break;
	for (const [position, pinnedResult] of pinnedByPosition.entries()) if (position >= finalResults.length) finalResults.push(pinnedResult);
	return finalResults;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/search-fulltext.js
function innerFullTextSearch(orama, params, language) {
	const { term, properties } = params;
	const index = orama.data.index;
	let propertiesToSearch = orama.caches["propertiesToSearch"];
	if (!propertiesToSearch) {
		const propertiesToSearchWithTypes = orama.index.getSearchablePropertiesWithTypes(index);
		propertiesToSearch = orama.index.getSearchableProperties(index);
		propertiesToSearch = propertiesToSearch.filter((prop) => propertiesToSearchWithTypes[prop].startsWith("string"));
		orama.caches["propertiesToSearch"] = propertiesToSearch;
	}
	if (properties && properties !== "*") {
		for (const prop of properties) if (!propertiesToSearch.includes(prop)) throw createError("UNKNOWN_INDEX", prop, propertiesToSearch.join(", "));
		propertiesToSearch = propertiesToSearch.filter((prop) => properties.includes(prop));
	}
	const hasFilters = Object.keys(params.where ?? {}).length > 0;
	let whereFiltersIDs;
	if (hasFilters) whereFiltersIDs = orama.index.searchByWhereClause(index, orama.tokenizer, params.where, language);
	let uniqueDocsIDs;
	const threshold = params.threshold !== void 0 && params.threshold !== null ? params.threshold : 1;
	if (term || properties) {
		const docsCount = count(orama);
		uniqueDocsIDs = orama.index.search(index, term || "", orama.tokenizer, language, propertiesToSearch, params.exact || false, params.tolerance || 0, params.boost || {}, applyDefault(params.relevance), docsCount, whereFiltersIDs, threshold);
		if (params.exact && term) {
			const searchTerms = term.trim().split(/\s+/);
			uniqueDocsIDs = uniqueDocsIDs.filter(([docId]) => {
				const doc = orama.documentsStore.get(orama.data.docs, docId);
				if (!doc) return false;
				for (const prop of propertiesToSearch) {
					const propValue = getPropValue(doc, prop);
					if (typeof propValue === "string") {
						if (searchTerms.every((searchTerm) => {
							return new RegExp(`\\b${escapeRegex(searchTerm)}\\b`).test(propValue);
						})) return true;
					}
				}
				return false;
			});
		}
	} else if (hasFilters) {
		const geoResults = searchByGeoWhereClause(index, params.where);
		if (geoResults) uniqueDocsIDs = geoResults;
		else uniqueDocsIDs = (whereFiltersIDs ? Array.from(whereFiltersIDs) : []).map((k) => [+k, 0]);
	} else uniqueDocsIDs = Object.keys(orama.documentsStore.getAll(orama.data.docs)).map((k) => [+k, 0]);
	return uniqueDocsIDs;
}
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getPropValue(obj, path) {
	const keys = path.split(".");
	let value = obj;
	for (const key of keys) if (value && typeof value === "object" && key in value) value = value[key];
	else return;
	return value;
}
function fullTextSearch(orama, params, language) {
	const timeStart = getNanosecondsTime();
	function performSearchLogic() {
		const vectorProperties = Object.keys(orama.data.index.vectorIndexes);
		const shouldCalculateFacets = params.facets && Object.keys(params.facets).length > 0;
		const { limit = 10, offset = 0, distinctOn, includeVectors = false } = params;
		const isPreflight = params.preflight === true;
		let uniqueDocsArray = innerFullTextSearch(orama, params, language);
		if (params.sortBy) {
			if (typeof params.sortBy === "function") {
				const ids = uniqueDocsArray.map(([id]) => id);
				const docsWithIdAndScore = orama.documentsStore.getMultiple(orama.data.docs, ids).map((d, i) => [
					uniqueDocsArray[i][0],
					uniqueDocsArray[i][1],
					d
				]);
				docsWithIdAndScore.sort(params.sortBy);
				uniqueDocsArray = docsWithIdAndScore.map(([id, score]) => [id, score]);
			} else uniqueDocsArray = orama.sorter.sortBy(orama.data.sorting, uniqueDocsArray, params.sortBy).map(([id, score]) => [getInternalDocumentId(orama.internalDocumentIDStore, id), score]);
		} else uniqueDocsArray = uniqueDocsArray.sort(sortTokenScorePredicate);
		uniqueDocsArray = applyPinningRules(orama, orama.data.pinning, uniqueDocsArray, params.term);
		let results;
		if (!isPreflight) results = distinctOn ? fetchDocumentsWithDistinct(orama, uniqueDocsArray, offset, limit, distinctOn) : fetchDocuments(orama, uniqueDocsArray, offset, limit);
		const searchResult = {
			elapsed: {
				formatted: "",
				raw: 0
			},
			hits: [],
			count: uniqueDocsArray.length
		};
		if (typeof results !== "undefined") {
			searchResult.hits = results.filter(Boolean);
			if (!includeVectors) removeVectorsFromHits(searchResult, vectorProperties);
		}
		if (shouldCalculateFacets) searchResult.facets = getFacets(orama, uniqueDocsArray, params.facets);
		if (params.groupBy) searchResult.groups = getGroups(orama, uniqueDocsArray, params.groupBy);
		searchResult.elapsed = orama.formatElapsedTime(getNanosecondsTime() - timeStart);
		return searchResult;
	}
	async function executeSearchAsync() {
		if (orama.beforeSearch) await runBeforeSearch(orama.beforeSearch, orama, params, language);
		const searchResult = performSearchLogic();
		if (orama.afterSearch) await runAfterSearch(orama.afterSearch, orama, params, language, searchResult);
		return searchResult;
	}
	if (orama.beforeSearch?.length || orama.afterSearch?.length) return executeSearchAsync();
	return performSearchLogic();
}
var defaultBM25Params = {
	k: 1.2,
	b: .75,
	d: .5
};
function applyDefault(bm25Relevance) {
	const r = bm25Relevance ?? {};
	r.k = r.k ?? defaultBM25Params.k;
	r.b = r.b ?? defaultBM25Params.b;
	r.d = r.d ?? defaultBM25Params.d;
	return r;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/search-vector.js
function innerVectorSearch(orama, params, language) {
	const vector = params.vector;
	if (vector && (!("value" in vector) || !("property" in vector))) throw createError("INVALID_VECTOR_INPUT", Object.keys(vector).join(", "));
	const vectorIndex = orama.data.index.vectorIndexes[vector.property];
	if (!vectorIndex) throw createError("UNKNOWN_VECTOR_PROPERTY", vector.property);
	const vectorSize = vectorIndex.node.size;
	if (vector?.value.length !== vectorSize) {
		if (vector?.property === void 0 || vector?.value.length === void 0) throw createError("INVALID_INPUT_VECTOR", "undefined", vectorSize, "undefined");
		throw createError("INVALID_INPUT_VECTOR", vector.property, vectorSize, vector.value.length);
	}
	const index = orama.data.index;
	let whereFiltersIDs;
	if (Object.keys(params.where ?? {}).length > 0) whereFiltersIDs = orama.index.searchByWhereClause(index, orama.tokenizer, params.where, language);
	return vectorIndex.node.find(vector.value, params.similarity ?? .8, whereFiltersIDs);
}
function searchVector(orama, params, language = "english") {
	const timeStart = getNanosecondsTime();
	function performSearchLogic() {
		let results = innerVectorSearch(orama, params, language).sort(sortTokenScorePredicate);
		results = applyPinningRules(orama, orama.data.pinning, results, void 0);
		let facetsResults = [];
		if (params.facets && Object.keys(params.facets).length > 0) facetsResults = getFacets(orama, results, params.facets);
		const vectorProperty = params.vector.property;
		const includeVectors = params.includeVectors ?? false;
		const limit = params.limit ?? 10;
		const offset = params.offset ?? 0;
		const docs = Array.from({ length: limit });
		for (let i = 0; i < limit; i++) {
			const result = results[i + offset];
			if (!result) break;
			const doc = orama.data.docs.docs[result[0]];
			if (doc) {
				if (!includeVectors) doc[vectorProperty] = null;
				const newDoc = {
					id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, result[0]),
					score: result[1],
					document: doc
				};
				docs[i] = newDoc;
			}
		}
		let groups = [];
		if (params.groupBy) groups = getGroups(orama, results, params.groupBy);
		const elapsedTime = getNanosecondsTime() - timeStart;
		return {
			count: results.length,
			hits: docs.filter(Boolean),
			elapsed: {
				raw: Number(elapsedTime),
				formatted: formatNanoseconds(elapsedTime)
			},
			...facetsResults ? { facets: facetsResults } : {},
			...groups ? { groups } : {}
		};
	}
	async function executeSearchAsync() {
		if (orama.beforeSearch) await runBeforeSearch(orama.beforeSearch, orama, params, language);
		const results = performSearchLogic();
		if (orama.afterSearch) await runAfterSearch(orama.afterSearch, orama, params, language, results);
		return results;
	}
	if (orama.beforeSearch?.length || orama.afterSearch?.length) return executeSearchAsync();
	return performSearchLogic();
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/search-hybrid.js
function innerHybridSearch(orama, params, language) {
	const fullTextIDs = minMaxScoreNormalization(innerFullTextSearch(orama, params, language));
	const vectorIDs = innerVectorSearch(orama, params, language);
	const hybridWeights = params.hybridWeights;
	return mergeAndRankResults(fullTextIDs, vectorIDs, params.term ?? "", hybridWeights);
}
function hybridSearch(orama, params, language) {
	const timeStart = getNanosecondsTime();
	function performSearchLogic() {
		let uniqueTokenScores = innerHybridSearch(orama, params, language);
		uniqueTokenScores = applyPinningRules(orama, orama.data.pinning, uniqueTokenScores, params.term);
		let facetsResults;
		if (params.facets && Object.keys(params.facets).length > 0) facetsResults = getFacets(orama, uniqueTokenScores, params.facets);
		let groups;
		if (params.groupBy) groups = getGroups(orama, uniqueTokenScores, params.groupBy);
		const offset = params.offset ?? 0;
		const limit = params.limit ?? 10;
		const results = fetchDocuments(orama, uniqueTokenScores, offset, limit).filter(Boolean);
		const timeEnd = getNanosecondsTime();
		const returningResults = {
			count: uniqueTokenScores.length,
			elapsed: {
				raw: Number(timeEnd - timeStart),
				formatted: formatNanoseconds(timeEnd - timeStart)
			},
			hits: results,
			...facetsResults ? { facets: facetsResults } : {},
			...groups ? { groups } : {}
		};
		if (!(params.includeVectors ?? false)) removeVectorsFromHits(returningResults, Object.keys(orama.data.index.vectorIndexes));
		return returningResults;
	}
	async function executeSearchAsync() {
		if (orama.beforeSearch) await runBeforeSearch(orama.beforeSearch, orama, params, language);
		const results = performSearchLogic();
		if (orama.afterSearch) await runAfterSearch(orama.afterSearch, orama, params, language, results);
		return results;
	}
	if (orama.beforeSearch?.length || orama.afterSearch?.length) return executeSearchAsync();
	return performSearchLogic();
}
function extractScore(token) {
	return token[1];
}
function minMaxScoreNormalization(results) {
	const maxScore = Math.max.apply(Math, results.map(extractScore));
	return results.map(([id, score]) => [id, score / maxScore]);
}
function normalizeScore(score, maxScore) {
	return score / maxScore;
}
function hybridScoreBuilder(textWeight, vectorWeight) {
	return (textScore, vectorScore) => textScore * textWeight + vectorScore * vectorWeight;
}
function mergeAndRankResults(textResults, vectorResults, query, hybridWeights) {
	const maxTextScore = Math.max.apply(Math, textResults.map(extractScore));
	const maxVectorScore = Math.max.apply(Math, vectorResults.map(extractScore));
	const { text: textWeight, vector: vectorWeight } = hybridWeights && hybridWeights.text && hybridWeights.vector ? hybridWeights : getQueryWeights(query);
	const mergedResults = /* @__PURE__ */ new Map();
	const textResultsLength = textResults.length;
	const hybridScore = hybridScoreBuilder(textWeight, vectorWeight);
	for (let i = 0; i < textResultsLength; i++) {
		const [id, score] = textResults[i];
		const hybridScoreValue = hybridScore(normalizeScore(score, maxTextScore), 0);
		mergedResults.set(id, hybridScoreValue);
	}
	const vectorResultsLength = vectorResults.length;
	for (let i = 0; i < vectorResultsLength; i++) {
		const [resultId, score] = vectorResults[i];
		const normalizedScore = normalizeScore(score, maxVectorScore);
		const existingRes = mergedResults.get(resultId) ?? 0;
		mergedResults.set(resultId, existingRes + hybridScore(0, normalizedScore));
	}
	return [...mergedResults].sort((a, b) => b[1] - a[1]);
}
function getQueryWeights(query) {
	return {
		text: .5,
		vector: .5
	};
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/search.js
function search(orama, params, language) {
	const mode = params.mode ?? "fulltext";
	if (mode === "fulltext") return fullTextSearch(orama, params, language);
	if (mode === "vector") return searchVector(orama, params);
	if (mode === "hybrid") return hybridSearch(orama, params);
	throw createError("INVALID_SEARCH_MODE", mode);
}
function fetchDocumentsWithDistinct(orama, uniqueDocsArray, offset, limit, distinctOn) {
	const docs = orama.data.docs;
	const values = /* @__PURE__ */ new Map();
	const results = [];
	const resultIDs = /* @__PURE__ */ new Set();
	const uniqueDocsArrayLength = uniqueDocsArray.length;
	let count = 0;
	for (let i = 0; i < uniqueDocsArrayLength; i++) {
		const idAndScore = uniqueDocsArray[i];
		if (typeof idAndScore === "undefined") continue;
		const [id, score] = idAndScore;
		if (resultIDs.has(id)) continue;
		const doc = orama.documentsStore.get(docs, id);
		const value = getNested(doc, distinctOn);
		if (typeof value === "undefined" || values.has(value)) continue;
		values.set(value, true);
		count++;
		if (count <= offset) continue;
		results.push({
			id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, id),
			score,
			document: doc
		});
		resultIDs.add(id);
		if (count >= offset + limit) break;
	}
	return results;
}
function fetchDocuments(orama, uniqueDocsArray, offset, limit) {
	const docs = orama.data.docs;
	const results = Array.from({ length: limit });
	const resultIDs = /* @__PURE__ */ new Set();
	for (let i = offset; i < limit + offset; i++) {
		const idAndScore = uniqueDocsArray[i];
		if (typeof idAndScore === "undefined") break;
		const [id, score] = idAndScore;
		if (!resultIDs.has(id)) {
			const fullDoc = orama.documentsStore.get(docs, id);
			results[i] = {
				id: getDocumentIdFromInternalId(orama.internalDocumentIDStore, id),
				score,
				document: fullDoc
			};
			resultIDs.add(id);
		}
	}
	return results;
}
//#endregion
//#region node_modules/@orama/orama/dist/browser/methods/serialization.js
function load(orama, raw) {
	orama.internalDocumentIDStore.load(orama, raw.internalDocumentIDStore);
	orama.data.index = orama.index.load(orama.internalDocumentIDStore, raw.index);
	orama.data.docs = orama.documentsStore.load(orama.internalDocumentIDStore, raw.docs);
	orama.data.sorting = orama.sorter.load(orama.internalDocumentIDStore, raw.sorting);
	orama.data.pinning = orama.pinning.load(orama.internalDocumentIDStore, raw.pinning);
	orama.tokenizer.language = raw.language;
}
function save(orama) {
	return {
		internalDocumentIDStore: orama.internalDocumentIDStore.save(orama.internalDocumentIDStore),
		index: orama.index.save(orama.data.index),
		docs: orama.documentsStore.save(orama.data.docs),
		sorting: orama.sorter.save(orama.data.sorting),
		pinning: orama.pinning.save(orama.data.pinning),
		language: orama.tokenizer.language
	};
}
new TextEncoder();
var CHUNK_SIZE = 4096;
function utf8DecodeJs(bytes, inputOffset, byteLength) {
	let offset = inputOffset;
	const end = offset + byteLength;
	const units = [];
	let result = "";
	while (offset < end) {
		const byte1 = bytes[offset++];
		if ((byte1 & 128) === 0) units.push(byte1);
		else if ((byte1 & 224) === 192) {
			const byte2 = bytes[offset++] & 63;
			units.push((byte1 & 31) << 6 | byte2);
		} else if ((byte1 & 240) === 224) {
			const byte2 = bytes[offset++] & 63;
			const byte3 = bytes[offset++] & 63;
			units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
		} else if ((byte1 & 248) === 240) {
			const byte2 = bytes[offset++] & 63;
			const byte3 = bytes[offset++] & 63;
			const byte4 = bytes[offset++] & 63;
			let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
			if (unit > 65535) {
				unit -= 65536;
				units.push(unit >>> 10 & 1023 | 55296);
				unit = 56320 | unit & 1023;
			}
			units.push(unit);
		} else units.push(byte1);
		if (units.length >= CHUNK_SIZE) {
			result += String.fromCharCode(...units);
			units.length = 0;
		}
	}
	if (units.length > 0) result += String.fromCharCode(...units);
	return result;
}
var sharedTextDecoder = new TextDecoder();
var TEXT_DECODER_THRESHOLD = 200;
function utf8DecodeTD(bytes, inputOffset, byteLength) {
	const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
	return sharedTextDecoder.decode(stringBytes);
}
function utf8Decode(bytes, inputOffset, byteLength) {
	if (byteLength > TEXT_DECODER_THRESHOLD) return utf8DecodeTD(bytes, inputOffset, byteLength);
	else return utf8DecodeJs(bytes, inputOffset, byteLength);
}
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/ExtData.mjs
/**
* ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
*/
var ExtData = class {
	type;
	data;
	constructor(type, data) {
		this.type = type;
		this.data = data;
	}
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/DecodeError.mjs
var DecodeError = class DecodeError extends Error {
	constructor(message) {
		super(message);
		const proto = Object.create(DecodeError.prototype);
		Object.setPrototypeOf(this, proto);
		Object.defineProperty(this, "name", {
			configurable: true,
			enumerable: false,
			value: DecodeError.name
		});
	}
};
function setInt64(view, offset, value) {
	const high = Math.floor(value / 4294967296);
	const low = value;
	view.setUint32(offset, high);
	view.setUint32(offset + 4, low);
}
function getInt64(view, offset) {
	const high = view.getInt32(offset);
	const low = view.getUint32(offset + 4);
	return high * 4294967296 + low;
}
function getUint64(view, offset) {
	const high = view.getUint32(offset);
	const low = view.getUint32(offset + 4);
	return high * 4294967296 + low;
}
var TIMESTAMP32_MAX_SEC = 4294967295;
var TIMESTAMP64_MAX_SEC = 17179869183;
function encodeTimeSpecToTimestamp({ sec, nsec }) {
	if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
		if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
			const rv = /* @__PURE__ */ new Uint8Array(4);
			new DataView(rv.buffer).setUint32(0, sec);
			return rv;
		} else {
			const secHigh = sec / 4294967296;
			const secLow = sec & 4294967295;
			const rv = /* @__PURE__ */ new Uint8Array(8);
			const view = new DataView(rv.buffer);
			view.setUint32(0, nsec << 2 | secHigh & 3);
			view.setUint32(4, secLow);
			return rv;
		}
	} else {
		const rv = /* @__PURE__ */ new Uint8Array(12);
		const view = new DataView(rv.buffer);
		view.setUint32(0, nsec);
		setInt64(view, 4, sec);
		return rv;
	}
}
function encodeDateToTimeSpec(date) {
	const msec = date.getTime();
	const sec = Math.floor(msec / 1e3);
	const nsec = (msec - sec * 1e3) * 1e6;
	const nsecInSec = Math.floor(nsec / 1e9);
	return {
		sec: sec + nsecInSec,
		nsec: nsec - nsecInSec * 1e9
	};
}
function encodeTimestampExtension(object) {
	if (object instanceof Date) return encodeTimeSpecToTimestamp(encodeDateToTimeSpec(object));
	else return null;
}
function decodeTimestampToTimeSpec(data) {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	switch (data.byteLength) {
		case 4: return {
			sec: view.getUint32(0),
			nsec: 0
		};
		case 8: {
			const nsec30AndSecHigh2 = view.getUint32(0);
			const secLow32 = view.getUint32(4);
			return {
				sec: (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32,
				nsec: nsec30AndSecHigh2 >>> 2
			};
		}
		case 12: return {
			sec: getInt64(view, 4),
			nsec: view.getUint32(0)
		};
		default: throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
	}
}
function decodeTimestampExtension(data) {
	const timeSpec = decodeTimestampToTimeSpec(data);
	return /* @__PURE__ */ new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
}
var timestampExtension = {
	type: -1,
	encode: encodeTimestampExtension,
	decode: decodeTimestampExtension
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/ExtensionCodec.mjs
var ExtensionCodec = class ExtensionCodec {
	static defaultCodec = new ExtensionCodec();
	__brand;
	builtInEncoders = [];
	builtInDecoders = [];
	encoders = [];
	decoders = [];
	constructor() {
		this.register(timestampExtension);
	}
	register({ type, encode, decode }) {
		if (type >= 0) {
			this.encoders[type] = encode;
			this.decoders[type] = decode;
		} else {
			const index = -1 - type;
			this.builtInEncoders[index] = encode;
			this.builtInDecoders[index] = decode;
		}
	}
	tryToEncode(object, context) {
		for (let i = 0; i < this.builtInEncoders.length; i++) {
			const encodeExt = this.builtInEncoders[i];
			if (encodeExt != null) {
				const data = encodeExt(object, context);
				if (data != null) return new ExtData(-1 - i, data);
			}
		}
		for (let i = 0; i < this.encoders.length; i++) {
			const encodeExt = this.encoders[i];
			if (encodeExt != null) {
				const data = encodeExt(object, context);
				if (data != null) return new ExtData(i, data);
			}
		}
		if (object instanceof ExtData) return object;
		return null;
	}
	decode(data, type, context) {
		const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
		if (decodeExt) return decodeExt(data, type, context);
		else return new ExtData(type, data);
	}
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/utils/typedArrays.mjs
function isArrayBufferLike(buffer) {
	return buffer instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
}
function ensureUint8Array(buffer) {
	if (buffer instanceof Uint8Array) return buffer;
	else if (ArrayBuffer.isView(buffer)) return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	else if (isArrayBufferLike(buffer)) return new Uint8Array(buffer);
	else return Uint8Array.from(buffer);
}
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/utils/prettyByte.mjs
function prettyByte(byte) {
	return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
}
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/CachedKeyDecoder.mjs
var DEFAULT_MAX_KEY_LENGTH = 16;
var DEFAULT_MAX_LENGTH_PER_KEY = 16;
var CachedKeyDecoder = class {
	hit = 0;
	miss = 0;
	caches;
	maxKeyLength;
	maxLengthPerKey;
	constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
		this.maxKeyLength = maxKeyLength;
		this.maxLengthPerKey = maxLengthPerKey;
		this.caches = [];
		for (let i = 0; i < this.maxKeyLength; i++) this.caches.push([]);
	}
	canBeCached(byteLength) {
		return byteLength > 0 && byteLength <= this.maxKeyLength;
	}
	find(bytes, inputOffset, byteLength) {
		const records = this.caches[byteLength - 1];
		FIND_CHUNK: for (const record of records) {
			const recordBytes = record.bytes;
			for (let j = 0; j < byteLength; j++) if (recordBytes[j] !== bytes[inputOffset + j]) continue FIND_CHUNK;
			return record.str;
		}
		return null;
	}
	store(bytes, value) {
		const records = this.caches[bytes.length - 1];
		const record = {
			bytes,
			str: value
		};
		if (records.length >= this.maxLengthPerKey) records[Math.random() * records.length | 0] = record;
		else records.push(record);
	}
	decode(bytes, inputOffset, byteLength) {
		const cachedValue = this.find(bytes, inputOffset, byteLength);
		if (cachedValue != null) {
			this.hit++;
			return cachedValue;
		}
		this.miss++;
		const str = utf8DecodeJs(bytes, inputOffset, byteLength);
		const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
		this.store(slicedCopyOfBytes, str);
		return str;
	}
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/Decoder.mjs
var STATE_ARRAY = "array";
var STATE_MAP_KEY = "map_key";
var STATE_MAP_VALUE = "map_value";
var mapKeyConverter = (key) => {
	if (typeof key === "string" || typeof key === "number") return key;
	throw new DecodeError("The type of key must be string or number but " + typeof key);
};
var StackPool = class {
	stack = [];
	stackHeadPosition = -1;
	get length() {
		return this.stackHeadPosition + 1;
	}
	top() {
		return this.stack[this.stackHeadPosition];
	}
	pushArrayState(size) {
		const state = this.getUninitializedStateFromPool();
		state.type = STATE_ARRAY;
		state.position = 0;
		state.size = size;
		state.array = new Array(size);
	}
	pushMapState(size) {
		const state = this.getUninitializedStateFromPool();
		state.type = STATE_MAP_KEY;
		state.readCount = 0;
		state.size = size;
		state.map = {};
	}
	getUninitializedStateFromPool() {
		this.stackHeadPosition++;
		if (this.stackHeadPosition === this.stack.length) this.stack.push({
			type: void 0,
			size: 0,
			array: void 0,
			position: 0,
			readCount: 0,
			map: void 0,
			key: null
		});
		return this.stack[this.stackHeadPosition];
	}
	release(state) {
		if (this.stack[this.stackHeadPosition] !== state) throw new Error("Invalid stack state. Released state is not on top of the stack.");
		if (state.type === STATE_ARRAY) {
			const partialState = state;
			partialState.size = 0;
			partialState.array = void 0;
			partialState.position = 0;
			partialState.type = void 0;
		}
		if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
			const partialState = state;
			partialState.size = 0;
			partialState.map = void 0;
			partialState.readCount = 0;
			partialState.type = void 0;
		}
		this.stackHeadPosition--;
	}
	reset() {
		this.stack.length = 0;
		this.stackHeadPosition = -1;
	}
};
var HEAD_BYTE_REQUIRED = -1;
var EMPTY_VIEW = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(0));
var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
try {
	EMPTY_VIEW.getInt8(0);
} catch (e) {
	if (!(e instanceof RangeError)) throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
}
var MORE_DATA = /* @__PURE__ */ new RangeError("Insufficient data");
var sharedCachedKeyDecoder = new CachedKeyDecoder();
var Decoder = class Decoder {
	extensionCodec;
	context;
	useBigInt64;
	rawStrings;
	maxStrLength;
	maxBinLength;
	maxArrayLength;
	maxMapLength;
	maxExtLength;
	keyDecoder;
	mapKeyConverter;
	totalPos = 0;
	pos = 0;
	view = EMPTY_VIEW;
	bytes = EMPTY_BYTES;
	headByte = HEAD_BYTE_REQUIRED;
	stack = new StackPool();
	entered = false;
	constructor(options) {
		this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
		this.context = options?.context;
		this.useBigInt64 = options?.useBigInt64 ?? false;
		this.rawStrings = options?.rawStrings ?? false;
		this.maxStrLength = options?.maxStrLength ?? 4294967295;
		this.maxBinLength = options?.maxBinLength ?? 4294967295;
		this.maxArrayLength = options?.maxArrayLength ?? 4294967295;
		this.maxMapLength = options?.maxMapLength ?? 4294967295;
		this.maxExtLength = options?.maxExtLength ?? 4294967295;
		this.keyDecoder = options?.keyDecoder !== void 0 ? options.keyDecoder : sharedCachedKeyDecoder;
		this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
	}
	clone() {
		return new Decoder({
			extensionCodec: this.extensionCodec,
			context: this.context,
			useBigInt64: this.useBigInt64,
			rawStrings: this.rawStrings,
			maxStrLength: this.maxStrLength,
			maxBinLength: this.maxBinLength,
			maxArrayLength: this.maxArrayLength,
			maxMapLength: this.maxMapLength,
			maxExtLength: this.maxExtLength,
			keyDecoder: this.keyDecoder
		});
	}
	reinitializeState() {
		this.totalPos = 0;
		this.headByte = HEAD_BYTE_REQUIRED;
		this.stack.reset();
	}
	setBuffer(buffer) {
		const bytes = ensureUint8Array(buffer);
		this.bytes = bytes;
		this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		this.pos = 0;
	}
	appendBuffer(buffer) {
		if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) this.setBuffer(buffer);
		else {
			const remainingData = this.bytes.subarray(this.pos);
			const newData = ensureUint8Array(buffer);
			const newBuffer = new Uint8Array(remainingData.length + newData.length);
			newBuffer.set(remainingData);
			newBuffer.set(newData, remainingData.length);
			this.setBuffer(newBuffer);
		}
	}
	hasRemaining(size) {
		return this.view.byteLength - this.pos >= size;
	}
	createExtraByteError(posToShow) {
		const { view, pos } = this;
		return /* @__PURE__ */ new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
	}
	/**
	* @throws {@link DecodeError}
	* @throws {@link RangeError}
	*/
	decode(buffer) {
		if (this.entered) return this.clone().decode(buffer);
		try {
			this.entered = true;
			this.reinitializeState();
			this.setBuffer(buffer);
			const object = this.doDecodeSync();
			if (this.hasRemaining(1)) throw this.createExtraByteError(this.pos);
			return object;
		} finally {
			this.entered = false;
		}
	}
	*decodeMulti(buffer) {
		if (this.entered) {
			yield* this.clone().decodeMulti(buffer);
			return;
		}
		try {
			this.entered = true;
			this.reinitializeState();
			this.setBuffer(buffer);
			while (this.hasRemaining(1)) yield this.doDecodeSync();
		} finally {
			this.entered = false;
		}
	}
	async decodeAsync(stream) {
		if (this.entered) return this.clone().decodeAsync(stream);
		try {
			this.entered = true;
			let decoded = false;
			let object;
			for await (const buffer of stream) {
				if (decoded) {
					this.entered = false;
					throw this.createExtraByteError(this.totalPos);
				}
				this.appendBuffer(buffer);
				try {
					object = this.doDecodeSync();
					decoded = true;
				} catch (e) {
					if (!(e instanceof RangeError)) throw e;
				}
				this.totalPos += this.pos;
			}
			if (decoded) {
				if (this.hasRemaining(1)) throw this.createExtraByteError(this.totalPos);
				return object;
			}
			const { headByte, pos, totalPos } = this;
			throw new RangeError(`Insufficient data in parsing ${prettyByte(headByte)} at ${totalPos} (${pos} in the current buffer)`);
		} finally {
			this.entered = false;
		}
	}
	decodeArrayStream(stream) {
		return this.decodeMultiAsync(stream, true);
	}
	decodeStream(stream) {
		return this.decodeMultiAsync(stream, false);
	}
	async *decodeMultiAsync(stream, isArray) {
		if (this.entered) {
			yield* this.clone().decodeMultiAsync(stream, isArray);
			return;
		}
		try {
			this.entered = true;
			let isArrayHeaderRequired = isArray;
			let arrayItemsLeft = -1;
			for await (const buffer of stream) {
				if (isArray && arrayItemsLeft === 0) throw this.createExtraByteError(this.totalPos);
				this.appendBuffer(buffer);
				if (isArrayHeaderRequired) {
					arrayItemsLeft = this.readArraySize();
					isArrayHeaderRequired = false;
					this.complete();
				}
				try {
					while (true) {
						yield this.doDecodeSync();
						if (--arrayItemsLeft === 0) break;
					}
				} catch (e) {
					if (!(e instanceof RangeError)) throw e;
				}
				this.totalPos += this.pos;
			}
		} finally {
			this.entered = false;
		}
	}
	doDecodeSync() {
		DECODE: while (true) {
			const headByte = this.readHeadByte();
			let object;
			if (headByte >= 224) object = headByte - 256;
			else if (headByte < 192) {
				if (headByte < 128) object = headByte;
				else if (headByte < 144) {
					const size = headByte - 128;
					if (size !== 0) {
						this.pushMapState(size);
						this.complete();
						continue DECODE;
					} else object = {};
				} else if (headByte < 160) {
					const size = headByte - 144;
					if (size !== 0) {
						this.pushArrayState(size);
						this.complete();
						continue DECODE;
					} else object = [];
				} else {
					const byteLength = headByte - 160;
					object = this.decodeString(byteLength, 0);
				}
			} else if (headByte === 192) object = null;
			else if (headByte === 194) object = false;
			else if (headByte === 195) object = true;
			else if (headByte === 202) object = this.readF32();
			else if (headByte === 203) object = this.readF64();
			else if (headByte === 204) object = this.readU8();
			else if (headByte === 205) object = this.readU16();
			else if (headByte === 206) object = this.readU32();
			else if (headByte === 207) {
				if (this.useBigInt64) object = this.readU64AsBigInt();
				else object = this.readU64();
			} else if (headByte === 208) object = this.readI8();
			else if (headByte === 209) object = this.readI16();
			else if (headByte === 210) object = this.readI32();
			else if (headByte === 211) {
				if (this.useBigInt64) object = this.readI64AsBigInt();
				else object = this.readI64();
			} else if (headByte === 217) {
				const byteLength = this.lookU8();
				object = this.decodeString(byteLength, 1);
			} else if (headByte === 218) {
				const byteLength = this.lookU16();
				object = this.decodeString(byteLength, 2);
			} else if (headByte === 219) {
				const byteLength = this.lookU32();
				object = this.decodeString(byteLength, 4);
			} else if (headByte === 220) {
				const size = this.readU16();
				if (size !== 0) {
					this.pushArrayState(size);
					this.complete();
					continue DECODE;
				} else object = [];
			} else if (headByte === 221) {
				const size = this.readU32();
				if (size !== 0) {
					this.pushArrayState(size);
					this.complete();
					continue DECODE;
				} else object = [];
			} else if (headByte === 222) {
				const size = this.readU16();
				if (size !== 0) {
					this.pushMapState(size);
					this.complete();
					continue DECODE;
				} else object = {};
			} else if (headByte === 223) {
				const size = this.readU32();
				if (size !== 0) {
					this.pushMapState(size);
					this.complete();
					continue DECODE;
				} else object = {};
			} else if (headByte === 196) {
				const size = this.lookU8();
				object = this.decodeBinary(size, 1);
			} else if (headByte === 197) {
				const size = this.lookU16();
				object = this.decodeBinary(size, 2);
			} else if (headByte === 198) {
				const size = this.lookU32();
				object = this.decodeBinary(size, 4);
			} else if (headByte === 212) object = this.decodeExtension(1, 0);
			else if (headByte === 213) object = this.decodeExtension(2, 0);
			else if (headByte === 214) object = this.decodeExtension(4, 0);
			else if (headByte === 215) object = this.decodeExtension(8, 0);
			else if (headByte === 216) object = this.decodeExtension(16, 0);
			else if (headByte === 199) {
				const size = this.lookU8();
				object = this.decodeExtension(size, 1);
			} else if (headByte === 200) {
				const size = this.lookU16();
				object = this.decodeExtension(size, 2);
			} else if (headByte === 201) {
				const size = this.lookU32();
				object = this.decodeExtension(size, 4);
			} else throw new DecodeError(`Unrecognized type byte: ${prettyByte(headByte)}`);
			this.complete();
			const stack = this.stack;
			while (stack.length > 0) {
				const state = stack.top();
				if (state.type === STATE_ARRAY) {
					state.array[state.position] = object;
					state.position++;
					if (state.position === state.size) {
						object = state.array;
						stack.release(state);
					} else continue DECODE;
				} else if (state.type === STATE_MAP_KEY) {
					if (object === "__proto__") throw new DecodeError("The key __proto__ is not allowed");
					state.key = this.mapKeyConverter(object);
					state.type = STATE_MAP_VALUE;
					continue DECODE;
				} else {
					state.map[state.key] = object;
					state.readCount++;
					if (state.readCount === state.size) {
						object = state.map;
						stack.release(state);
					} else {
						state.key = null;
						state.type = STATE_MAP_KEY;
						continue DECODE;
					}
				}
			}
			return object;
		}
	}
	readHeadByte() {
		if (this.headByte === HEAD_BYTE_REQUIRED) this.headByte = this.readU8();
		return this.headByte;
	}
	complete() {
		this.headByte = HEAD_BYTE_REQUIRED;
	}
	readArraySize() {
		const headByte = this.readHeadByte();
		switch (headByte) {
			case 220: return this.readU16();
			case 221: return this.readU32();
			default: if (headByte < 160) return headByte - 144;
			else throw new DecodeError(`Unrecognized array type byte: ${prettyByte(headByte)}`);
		}
	}
	pushMapState(size) {
		if (size > this.maxMapLength) throw new DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
		this.stack.pushMapState(size);
	}
	pushArrayState(size) {
		if (size > this.maxArrayLength) throw new DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
		this.stack.pushArrayState(size);
	}
	decodeString(byteLength, headerOffset) {
		if (!this.rawStrings || this.stateIsMapKey()) return this.decodeUtf8String(byteLength, headerOffset);
		return this.decodeBinary(byteLength, headerOffset);
	}
	/**
	* @throws {@link RangeError}
	*/
	decodeUtf8String(byteLength, headerOffset) {
		if (byteLength > this.maxStrLength) throw new DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
		if (this.bytes.byteLength < this.pos + headerOffset + byteLength) throw MORE_DATA;
		const offset = this.pos + headerOffset;
		let object;
		if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) object = this.keyDecoder.decode(this.bytes, offset, byteLength);
		else object = utf8Decode(this.bytes, offset, byteLength);
		this.pos += headerOffset + byteLength;
		return object;
	}
	stateIsMapKey() {
		if (this.stack.length > 0) return this.stack.top().type === STATE_MAP_KEY;
		return false;
	}
	/**
	* @throws {@link RangeError}
	*/
	decodeBinary(byteLength, headOffset) {
		if (byteLength > this.maxBinLength) throw new DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
		if (!this.hasRemaining(byteLength + headOffset)) throw MORE_DATA;
		const offset = this.pos + headOffset;
		const object = this.bytes.subarray(offset, offset + byteLength);
		this.pos += headOffset + byteLength;
		return object;
	}
	decodeExtension(size, headOffset) {
		if (size > this.maxExtLength) throw new DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
		const extType = this.view.getInt8(this.pos + headOffset);
		const data = this.decodeBinary(size, headOffset + 1);
		return this.extensionCodec.decode(data, extType, this.context);
	}
	lookU8() {
		return this.view.getUint8(this.pos);
	}
	lookU16() {
		return this.view.getUint16(this.pos);
	}
	lookU32() {
		return this.view.getUint32(this.pos);
	}
	readU8() {
		const value = this.view.getUint8(this.pos);
		this.pos++;
		return value;
	}
	readI8() {
		const value = this.view.getInt8(this.pos);
		this.pos++;
		return value;
	}
	readU16() {
		const value = this.view.getUint16(this.pos);
		this.pos += 2;
		return value;
	}
	readI16() {
		const value = this.view.getInt16(this.pos);
		this.pos += 2;
		return value;
	}
	readU32() {
		const value = this.view.getUint32(this.pos);
		this.pos += 4;
		return value;
	}
	readI32() {
		const value = this.view.getInt32(this.pos);
		this.pos += 4;
		return value;
	}
	readU64() {
		const value = getUint64(this.view, this.pos);
		this.pos += 8;
		return value;
	}
	readI64() {
		const value = getInt64(this.view, this.pos);
		this.pos += 8;
		return value;
	}
	readU64AsBigInt() {
		const value = this.view.getBigUint64(this.pos);
		this.pos += 8;
		return value;
	}
	readI64AsBigInt() {
		const value = this.view.getBigInt64(this.pos);
		this.pos += 8;
		return value;
	}
	readF32() {
		const value = this.view.getFloat32(this.pos);
		this.pos += 4;
		return value;
	}
	readF64() {
		const value = this.view.getFloat64(this.pos);
		this.pos += 8;
		return value;
	}
};
//#endregion
//#region node_modules/@msgpack/msgpack/dist.esm/decode.mjs
/**
* It decodes a single MessagePack object in a buffer.
*
* This is a synchronous decoding function.
* See other variants for asynchronous decoding: {@link decodeAsync}, {@link decodeMultiStream}, or {@link decodeArrayStream}.
*
* @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
* @throws {@link DecodeError} if the buffer contains invalid data.
*/
function decode(buffer, options) {
	return new Decoder(options).decode(buffer);
}
//#endregion
//#region node_modules/dpack/lib/serialize.js
var require_serialize = /* @__PURE__ */ __commonJSMin(((exports) => {
	var PROPERTY_CODE = 0;
	var TYPE_CODE = 3;
	var STRING_CODE = 2;
	var NUMBER_CODE = 1;
	var SEQUENCE_CODE = 7;
	var NULL = 0;
	var FALSE = 3;
	var TRUE = 4;
	var UNDEFINED = 5;
	var DEFAULT_TYPE = 6;
	var ARRAY_TYPE = 7;
	var REFERENCING_TYPE = 8;
	var NUMBER_TYPE = 9;
	var METADATA_TYPE = 11;
	var REFERENCING_POSITION = 13;
	var ERROR_METADATA = 500;
	var OPEN_SEQUENCE = 12;
	var END_SEQUENCE = 14;
	var DEFERRED_REFERENCE = 15;
	var nextId = 1;
	var iteratorSymbol = typeof Symbol !== "undefined" ? Symbol.iterator : "__iterator_symbol__";
	function createSerializer(options) {
		if (!options) options = {};
		var extendedTypes = options.converterByConstructor;
		if (!extendedTypes) extendedTypes = /* @__PURE__ */ new Map();
		extendedTypes.set(Map, {
			name: "Map",
			toValue: writeMap
		});
		extendedTypes.set(Set, {
			name: "Set",
			toValue: writeSet
		});
		extendedTypes.set(Date, {
			name: "Date",
			toValue: writeDate
		});
		options.outlet || options.avoidShareUpdate;
		var charEncoder = typeof global != "undefined" && global.Buffer && !(options && options.encoding === "utf16le") ? exports.nodeCharEncoder(options) : browserCharEncoder(options);
		var writeString = charEncoder.writeString;
		var writeToken = charEncoder.writeToken;
		var startSequence = charEncoder.startSequence;
		var endSequence = charEncoder.endSequence;
		var writeBuffer = charEncoder.writeBuffer;
		options.forProperty;
		var propertyUsed;
		if (options.shared) {
			propertyUsed = options.shared.propertyUsed;
			options.shared.propertyUsed;
		}
		var pendingEncodings = [];
		var property;
		var bufferSymbol = exports.bufferSymbol || "_bufferSymbol_";
		var targetSymbol = exports.targetSymbol || "_targetSymbol_";
		var serializerId = nextId++;
		var writers = [
			0,
			1,
			2,
			3,
			4,
			5,
			writeAsDefault,
			writeAsArray,
			writeAsReferencing,
			writeAsNumber,
			writeOnlyNull
		];
		function writeNumber(number) {
			writeToken(NUMBER_CODE, number);
		}
		function writeInlineString(string) {
			writeToken(STRING_CODE, string.length);
			writeString(string);
		}
		function writeAsReferencing(value) {
			var type, values = property.values;
			if (values) {
				if (values.resetTo > -1 && values.serializer !== serializerId) {
					values.serializer = serializerId;
					if (values.resetTo < values.length) values.length = values.resetTo;
					writeToken(TYPE_CODE, REFERENCING_POSITION);
					writeToken(NUMBER_CODE, values.resetTo);
				}
				var reference = values.indexOf(value);
				if (reference > -1) return writeNumber(reference);
			}
			if ((type = typeof value) === "string" || type === "object" && value) {
				if (property.writeSharedValue) {
					if (property.writeSharedValue(value, writeToken, serializerId)) return;
				} else if (values) {
					var index = values.length;
					if (index < 12) values[index] = value;
				}
			}
			if (type === "string") writeInlineString(value);
			else writeAsDefault(value);
		}
		function writeAsNumber(number) {
			var type = typeof number;
			if (type === "number") {
				if (number >>> 0 === number || number > 0 && number < 70368744177664 && number % 1 === 0) writeToken(NUMBER_CODE, number);
				else writeInlineString(number.toString());
			} else if (type === "object") writeAsDefault(number);
			else writeTypedValue(number);
		}
		function writeTypedValue(value) {
			if (value === null) writeToken(TYPE_CODE, NULL);
			else if (value === false) writeToken(TYPE_CODE, FALSE);
			else if (value === true) writeToken(TYPE_CODE, TRUE);
			else if (value === void 0) writeToken(TYPE_CODE, UNDEFINED);
			else writeTypedNonConstant(value);
		}
		function writeTypedNonConstant(value) {
			var type = typeof value;
			var extendedType;
			if (type === "object") {
				if (value) {
					var constructor = value.constructor;
					if (constructor === Object) {} else if (constructor === Array) type = "array";
					else {
						extendedType = extendedTypes.get(constructor);
						if (extendedType && extendedType.toValue) {
							value = extendedType.toValue(value);
							type = typeof value;
							if (value && type === "object" && value.constructor === Array) type = "array";
							if (property.type === type) {
								if (property.extendedType !== extendedType) {
									property.extendedType = extendedType;
									writeToken(TYPE_CODE, METADATA_TYPE);
									writeInlineString(extendedType.name);
								}
								return writers[property.code](value);
							}
						} else extendedType = false;
					}
				} else type = "undefined";
			} else if (type === "boolean") type = "undefined";
			else if (type === "function") {
				value = value.toString();
				type = "string";
			}
			property = writeProperty(null, type, extendedType);
			writers[property.code](value);
		}
		function writeOnlyNull() {
			writeToken(TYPE_CODE, NULL);
		}
		function writeAsDefault(value, isRoot) {
			var type = typeof value;
			if (type === "object") {
				if (!value) return writeToken(TYPE_CODE, NULL);
			} else if (type === "string") return writeInlineString(value);
			else if (type === "number" && (value >>> 0 === value || value > 0 && value < 70368744177664 && value % 1 === 0)) return writeToken(NUMBER_CODE, value);
			else return writeTypedValue(value);
			var object = value;
			var constructor = object.constructor;
			var notPlainObject;
			if (object[targetSymbol]) return writeBlockReference(value);
			else if (constructor === Object) notPlainObject = false;
			else if (constructor === Array) {
				property = writeProperty(property.key, "array");
				return writers[property.code](value);
			} else {
				if (object.then) return writeBlockReference(value);
				extendedType = extendedTypes.get(constructor);
				if (extendedType) {
					if (extendedType.toValue) return writeTypedValue(object);
				} else {
					if (object[iteratorSymbol]) {
						property = writeProperty(property.key, "array");
						return writeAsIterable(object, isRoot);
					}
					extendedTypes.set(constructor, extendedType = { name: constructor.name });
				}
				if (property.constructs !== constructor) {
					writeToken(TYPE_CODE, METADATA_TYPE);
					writeInlineString(extendedType.name);
					property.constructs = constructor;
				}
				notPlainObject = true;
			}
			var thisProperty = property;
			if (thisProperty.resetTo < thisProperty.length && thisProperty.serializer != serializerId) {
				thisProperty.length = thisProperty.resetTo;
				thisProperty.serializer = serializerId;
			}
			startSequence();
			var i = 0;
			var resumeIndex = -2;
			var propertyIndex = 0;
			for (var key in object) {
				if (notPlainObject && !object.hasOwnProperty(key)) continue;
				var value = object[key];
				type = typeof value;
				property = thisProperty[propertyIndex];
				var constructor;
				var extendedType = false;
				if (type === "object") {
					if (value) {
						constructor = value.constructor;
						if (constructor === Object) {} else if (constructor === Array) type = "array";
						else {
							extendedType = extendedTypes.get(constructor);
							if (extendedType && extendedType.toValue) {
								value = extendedType.toValue(value);
								type = typeof value;
								if (value && type === "object" && value.constructor === Array) type = "array";
							} else if (value[iteratorSymbol] && !value.then) type = "array";
							else extendedType = false;
						}
					} else type = "undefined";
				}
				if (!property || property.key !== key || property.type !== type && type !== "boolean" && type !== "undefined" && !(type === "string" && property.type !== "number") || extendedType && property.extendedType !== constructor) {
					var lastPropertyIndex = propertyIndex;
					if (resumeIndex > -2) propertyIndex = resumeIndex;
					do
						property = thisProperty[++propertyIndex];
					while (property && (property.key !== key || property.type !== type && type !== "boolean" && type !== "undefined" && !(type === "string" && property.type !== "number") || extendedType && property.extendedType !== constructor));
					if (property) {
						writeToken(PROPERTY_CODE, propertyIndex);
						if (resumeIndex === -2) resumeIndex = lastPropertyIndex - 1;
					} else if (thisProperty.getProperty) {
						property = thisProperty.getProperty(value, key, type, extendedType, writeProperty, writeToken, lastPropertyIndex);
						propertyIndex = property.index;
						if (lastPropertyIndex !== propertyIndex && resumeIndex === -2) resumeIndex = lastPropertyIndex - 1;
					} else {
						if (lastPropertyIndex === thisProperty.length) propertyIndex = lastPropertyIndex;
						else {
							writeToken(PROPERTY_CODE, propertyIndex = thisProperty.length);
							if (resumeIndex === -2) resumeIndex = lastPropertyIndex - 1;
						}
						if (propertyIndex < thisProperty.resetTo) {
							debugger;
							throw new Error("overwriting frozen property");
						}
						property = thisProperty[propertyIndex] = writeProperty(key, type, extendedType);
					}
				}
				if (propertyUsed) propertyUsed(property, object, serializerId, i);
				var code = property.code;
				if (code > 7) {
					if (code === 8) writeAsReferencing(value);
					else writeAsNumber(value);
				} else if (code === 6) writeAsDefault(value);
				else writeAsArray(value);
				propertyIndex++;
				i++;
			}
			property = thisProperty;
			endSequence(i);
		}
		function writeProperty(key, type, extendedType) {
			var property = [];
			property.key = key;
			property.type = type;
			if (type === "string") {
				writeToken(TYPE_CODE, REFERENCING_TYPE);
				property.values = [];
				property.code = REFERENCING_TYPE;
			} else if (type === "number") {
				writeToken(TYPE_CODE, NUMBER_TYPE);
				property.code = NUMBER_TYPE;
			} else if (type === "object") {
				writeToken(TYPE_CODE, DEFAULT_TYPE);
				property.code = DEFAULT_TYPE;
			} else if (type === "array") {
				writeToken(TYPE_CODE, ARRAY_TYPE);
				property.code = ARRAY_TYPE;
			} else if (type === "boolean" || type === "undefined") {
				property.type = "object";
				writeToken(TYPE_CODE, DEFAULT_TYPE);
				property.code = DEFAULT_TYPE;
			} else {
				writeToken(TYPE_CODE, DEFAULT_TYPE);
				property.code = 10;
				console.error("Unable to write value of type " + type);
			}
			if (typeof key === "string") writeInlineString(key);
			else if (!(key === null && (type === "object" || type === "array"))) writeAsDefault(key);
			if (extendedType) {
				property.extendedType = extendedType;
				writeToken(TYPE_CODE, METADATA_TYPE);
				writeInlineString(extendedType.name);
			}
			return property;
		}
		function writeAsIterable(iterable, isRoot, iterator) {
			try {
				if (!iterator) {
					writeToken(SEQUENCE_CODE, OPEN_SEQUENCE);
					iterator = iterable[iteratorSymbol]();
				}
				var arrayProperty = property;
				property = arrayProperty.child || (arrayProperty.child = arrayProperty);
				var result;
				while (!(result = iterator.next()).done) {
					writers[property.code](result.value, arrayProperty);
					if (isRoot && charEncoder.hasWritten) {
						charEncoder.hasWritten = false;
						property = arrayProperty;
						pendingEncodings.unshift({ then: function(callback) {
							writeAsIterable(null, true, iterator);
							return callback();
						} });
						return;
					}
				}
			} catch (error) {
				writeToken(TYPE_CODE, METADATA_TYPE);
				writeToken(NUMBER_CODE, ERROR_METADATA);
				writeAsDefault(Object.assign(new (typeof error == "object" && error ? error.constructor : Error)(), {
					name: error && error.name,
					message: error && error.message || error
				}));
				throw error;
			}
			if (property !== arrayProperty.child) arrayProperty.child = property;
			property = arrayProperty;
			writeToken(SEQUENCE_CODE, END_SEQUENCE);
		}
		function writeAsArray(array) {
			if (!array) writeTypedValue(array);
			else if (array[targetSymbol]) return writeBlockReference(array);
			else if (array.constructor === Array) {
				var length = array.length;
				var needsClosing;
				if (length > 11) {
					writeToken(SEQUENCE_CODE, OPEN_SEQUENCE);
					needsClosing = true;
				} else writeToken(SEQUENCE_CODE, length);
				var arrayProperty = property;
				property = arrayProperty[0];
				if (arrayProperty.resetTo < arrayProperty.length && arrayProperty.serializer != serializerId) {
					arrayProperty.length = arrayProperty.resetTo;
					arrayProperty.serializer = serializerId;
				}
				var propertyIndex = 0;
				for (var i = 0; i < length; i++) {
					var value = array[i];
					var type = typeof value;
					if (type === "object") {
						if (value) {
							var constructor = value.constructor;
							if (constructor === Object) {} else if (constructor === Array) type = "array";
							else {
								var extendedType = extendedTypes.get(constructor);
								if (extendedType && extendedType.toValue) {
									value = extendedType.toValue(value);
									type = typeof value;
									if (value && type === "object" && value.constructor === Array) type = "array";
								} else extendedType = false;
							}
						} else type = "undefined";
					}
					if (!property) {
						if (arrayProperty.getProperty) property = arrayProperty.getProperty(value, null, type, extendedType, writeProperty, writeToken, 0);
						else {
							if (type === "string" || type === "number" || type === "array") property = writeProperty(null, type, extendedType);
							else {
								property = [];
								property.type = type;
								property.key = null;
								property.code = DEFAULT_TYPE;
							}
							arrayProperty[0] = property;
						}
					} else if (property.type !== type && type !== "boolean" && type !== "undefined" && !(type === "string" && property.type !== "number") || extendedType && property.extendedType !== constructor) {
						propertyIndex = -1;
						do
							property = arrayProperty[++propertyIndex];
						while (property && (property.type !== type && type !== "boolean" && type !== "undefined" && !(type === "string" && property.type !== "number") || extendedType && property.extendedType !== constructor));
						if (property) writeToken(PROPERTY_CODE, propertyIndex);
						else if (arrayProperty.getProperty) property = arrayProperty.getProperty(value, null, type, extendedType, writeProperty, writeToken, -1);
						else {
							writeToken(PROPERTY_CODE, propertyIndex);
							property = writeProperty(null, type, extendedType);
							arrayProperty[propertyIndex] = property;
						}
					}
					if (propertyUsed) propertyUsed(property, array, serializerId, i);
					var code = property.code;
					if (code > 7) {
						if (code === 8) writeAsReferencing(value);
						else writeAsNumber(value);
					} else if (code === 6) writeAsDefault(value);
					else writeAsArray(value);
				}
				if (needsClosing) writeToken(SEQUENCE_CODE, END_SEQUENCE);
				property = arrayProperty;
			} else if (typeof array == "object" && array[iteratorSymbol]) return writeAsIterable(array);
			else if (type === "string") return writeInlineString(value);
			else if (type === "number" && (value >>> 0 === value || value > 0 && value < 70368744177664 && value % 1 === 0)) return writeToken(NUMBER_CODE, value);
			else writeTypedValue(array);
		}
		function writeBlockReference(block, writer) {
			writeToken(SEQUENCE_CODE, DEFERRED_REFERENCE);
			var blockProperty = property;
			var lazyPromise = block[targetSymbol] ? { then } : { then: function(callback) {
				return block.then(function(value) {
					block = value;
					then(callback);
				}, function(error) {
					block = Object.assign(new (typeof error == "object" && error ? error.constructor : Error)(), {
						name: error && error.name,
						message: error && error.message || error
					});
					if (!blockProperty.upgrade) {
						writeToken(TYPE_CODE, METADATA_TYPE);
						writeToken(NUMBER_CODE, ERROR_METADATA);
					}
					then(callback);
				});
			} };
			function then(callback) {
				if (options.forBlock && block) options.forBlock(block, blockProperty);
				else {
					var buffer = block && block[bufferSymbol] && block[bufferSymbol](blockProperty);
					if (buffer) writeBuffer(buffer);
					else {
						property = blockProperty;
						var lastPendingEncodings = pendingEncodings;
						pendingEncodings = [];
						writeAsDefault(block, true);
						lastPendingEncodings.unshift.apply(lastPendingEncodings, pendingEncodings);
						pendingEncodings = lastPendingEncodings;
					}
				}
				callback();
			}
			pendingEncodings.push(lazyPromise);
		}
		var serializer = {
			serialize: function(value, sharedProperty) {
				var buffer = value && value[bufferSymbol] && value[bufferSymbol](sharedProperty);
				if (buffer) {
					charEncoder.writeBuffer(buffer);
					return;
				}
				if (sharedProperty) {
					property = sharedProperty;
					writers[property.code](value);
				} else {
					property = [];
					property.key = null;
					writeAsDefault(value, true);
				}
			},
			getSerialized: function() {
				if (pendingEncodings.length > 0) {
					var promises = [];
					while (pendingEncodings.length > 0) {
						var finished = false;
						var promise = pendingEncodings.shift().then(function() {
							finished = true;
						});
						if (!finished) promises.push(promise);
					}
					if (promises.length > 0) return Promise.all(promises).then(function() {
						return serializer.getSerialized();
					});
				}
				if (options && options.encoding === "utf16le") return Buffer.from(charEncoder.getSerialized(), "utf16le");
				return charEncoder.getSerialized();
			},
			flush: charEncoder.flush,
			setOffset: charEncoder.setOffset,
			finish: charEncoder.finish,
			pendingEncodings,
			getWriters: function() {
				return {
					writeProperty,
					writeToken,
					writeAsDefault,
					writeBuffer
				};
			}
		};
		return serializer;
	}
	function serialize(value, options) {
		var serializer = createSerializer(options);
		var sharedProperty = options && options.shared;
		var buffer;
		if (sharedProperty && sharedProperty.startWrite) sharedProperty.startWrite(options.avoidShareUpdate, value);
		serializer.serialize(value, sharedProperty);
		buffer = serializer.getSerialized();
		if (sharedProperty && sharedProperty.endWrite) sharedProperty.endWrite(options.avoidShareUpdate, value);
		if (serializer.finish) serializer.finish();
		var sizeTable = value && value[exports.sizeTableSymbol];
		if (sizeTable) buffer.sizeTable = sizeTable;
		if (options && options.lazy) return Buffer.concat([value[exports.sizeTableSymbol], buffer]);
		return buffer;
	}
	exports.serialize = serialize;
	exports.createSerializer = createSerializer;
	function browserCharEncoder() {
		var serialized = "";
		function writeToken(type, number) {
			var serializedToken;
			if (number < 16) serializedToken = String.fromCharCode((type << 4 | number) ^ 64);
			else if (number < 1024) serializedToken = String.fromCharCode((type << 4) + (number >>> 6), (number & 63) + 64);
			else if (number < 65536) serializedToken = String.fromCharCode((type << 4) + (number >>> 12), number >>> 6 & 63, (number & 63) + 64);
			else if (number < 4194304) serializedToken = String.fromCharCode((type << 4) + (number >>> 18), number >>> 12 & 63, number >>> 6 & 63, (number & 63) + 64);
			else if (number < 268435456) serializedToken = String.fromCharCode((type << 4) + (number >>> 24), number >>> 18 & 63, number >>> 12 & 63, number >>> 6 & 63, (number & 63) + 64);
			else if (number < 4294967296) serializedToken = String.fromCharCode((type << 4) + (number >>> 30), number >>> 24 & 63, number >>> 18 & 63, number >>> 12 & 63, number >>> 6 & 63, (number & 63) + 64);
			else if (number < 17179869184) serializedToken = String.fromCharCode((type << 4) + (number / 1073741824 >>> 0), number >>> 24 & 63, number >>> 18 & 63, number >>> 12 & 63, number >>> 6 & 63, (number & 63) + 64);
			else if (number < 1099511627776) serializedToken = String.fromCharCode((type << 4) + (number / 68719476736 >>> 0), number / 1073741824 & 63, number >>> 24 & 63, number >>> 18 & 63, number >>> 12 & 63, number >>> 6 & 63, (number & 63) + 64);
			else if (number < 70368744177664) serializedToken = String.fromCharCode((type << 4) + (number / 4398046511104 >>> 0), number / 68719476736 & 63, number / 1073741824 & 63, number >>> 24 & 63, number >>> 18 & 63, number >>> 12 & 63, number >>> 6 & 63, (number & 63) + 64);
			else throw new Error("Too big of number");
			serialized += serializedToken;
		}
		function writeString(string) {
			serialized += string;
		}
		function getSerialized() {
			return serialized;
		}
		return {
			writeToken,
			writeString,
			getSerialized,
			startSequence: function() {
				writeToken(SEQUENCE_CODE, OPEN_SEQUENCE);
			},
			endSequence: function() {
				writeToken(SEQUENCE_CODE, END_SEQUENCE);
			},
			getOffset: function() {
				return -1;
			}
		};
	}
	var ArrayFrom = Array.from || function(iterable, keyValue) {
		var array = [];
		var keyValue = iterable.constructor === Map;
		iterable.forEach(function(key, value) {
			if (keyValue) array.push([value, key]);
			else array.push(key);
		});
		return array;
	};
	function writeMap(map) {
		var keyValues = ArrayFrom(map);
		for (var i = 0, length = keyValues.length; i < length; i++) {
			var keyValue = keyValues[i];
			keyValues[i] = {
				key: keyValue[0],
				value: keyValue[1]
			};
		}
		return keyValues;
	}
	function writeSet(set) {
		return ArrayFrom(set);
	}
	function writeDate(date) {
		return date.getTime();
	}
}));
//#endregion
//#region node_modules/dpack/lib/serialize-stream.js
var require_serialize_stream = /* @__PURE__ */ __commonJSMin(((exports) => {
	var { Transform: Transform$1 } = require("stream");
	var { createSerializer } = require_serialize();
	var DPackSerializeStream = class extends Transform$1 {
		constructor(options) {
			options = options || {};
			super(options);
			this.options = options;
			this.continueWriting = true;
		}
		write(value) {
			const serializer = this.serializer || (this.serializer = createSerializer({ asBlock: true }));
			serializer.serialize(value);
			const buffer = serializer.getSerialized();
			if (buffer.then) {
				buffer.then((buffer) => this.push(buffer));
				this.serializer = null;
			} else serializer.flush(this);
		}
		end(value) {
			if (value) {
				this.options.outlet = this;
				(this.serializer || (this.serializer = createSerializer(this.options))).serialize(value);
			}
			if (this.serializer.pendingEncodings.length > 0) {
				this.endWhenDone = true;
				this.writeNext();
			} else {
				this.serializer.flush();
				this.push(null);
			}
		}
		writeBytes(buffer) {
			try {
				this.continueWriting = this.push(buffer);
			} catch (error) {
				throw error;
			}
		}
		_read() {
			this.continueWriting = true;
			if (!this.pausedForPromise && this.serializer && this.endWhenDone && this.serializer.pendingEncodings.length > 0) this.writeNext();
		}
		writeNext() {
			var isSync;
			do {
				var hasMoreToSend = this.serializer.pendingEncodings.length > 0;
				isSync = null;
				if (hasMoreToSend) {
					this.serializer.pendingEncodings.shift().then(() => {
						if (isSync === false) {
							this.pausedForPromise = false;
							if (this.continueWriting || this.serializer.pendingEncodings.length === 0) this.writeNext();
							else this.serializer.flush();
						} else isSync = true;
					}, (error) => {
						console.error(error);
						this.push(error.toString());
						this.push(null);
					});
					if (!isSync) {
						isSync = false;
						this.pausedForPromise = true;
						this.serializer.flush();
					} else if (!this.continueWriting && this.serializer.pendingEncodings.length > 0) {
						this.serializer.flush();
						return;
					}
				} else if (this.endWhenDone) {
					this.serializer.flush();
					this.push("]");
					this.push(null);
				}
			} while (isSync);
		}
	};
	exports.createSerializeStream = () => {
		return new DPackSerializeStream();
	};
}));
//#endregion
//#region node_modules/dpack/lib/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports) => {
	var FALSE = 3;
	var TRUE = 4;
	var DEFAULT_TYPE = 6;
	var ARRAY_TYPE = 7;
	var REFERENCING_TYPE = 8;
	var NUMBER_TYPE = 9;
	var METADATA_TYPE = 11;
	var REFERENCING_POSITION = 13;
	var TYPE_DEFINITION = 14;
	var ERROR_METADATA = 500;
	var OPEN_SEQUENCE = 12;
	var END_SEQUENCE = 14;
	var DEFERRED_REFERENCE = 15;
	function createParser(options) {
		if (!options) options = {};
		var offset;
		var source;
		var isPartial;
		var classByName = options.classByName || /* @__PURE__ */ new Map();
		classByName.set("Map", readMap);
		classByName.set("Set", readSet);
		classByName.set("Date", readDate);
		var pausedState;
		var deferredReads;
		function pause(state, lastRead) {
			state.previous = pausedState;
			state.resume = true;
			pausedState = state;
			if (!isPartial) throw new Error("Unexpected end of dpack stream");
			if (!parser.onResume) parser.onResume = function(nextString, isPartialString, rebuildString) {
				var resumeState = pausedState;
				pausedState = null;
				parser.onResume = null;
				if (lastRead < source.length) source = source.slice(lastRead) + nextString;
				else if (rebuildString) source = nextString.slice(0, 1) + nextString.slice(1);
				else source = nextString;
				isPartial = isPartialString;
				disposedChars += lastRead;
				offset = 0;
				return resumeState.reader ? resumeState.reader(resumeState) : readSequence(resumeState.length, resumeState);
			};
			return state.object;
		}
		function readSequence(length, thisProperty) {
			var propertyState = 0;
			thisProperty = thisProperty || [];
			var property, isArray, object, value, i = 0, propertyIndex = 0;
			if (thisProperty.resume) {
				property = thisProperty.previous;
				if (property) {
					var value = property.reader ? property.reader(property) : readSequence(property.length, property);
					var values = property.values;
					if (values) {
						if (pausedState) pausedState.values = values;
						else if (value.nextPosition > -1) values[values.nextPosition++] = value;
						else values.push(value);
					}
				}
				if (thisProperty.code && thisProperty.code !== thisProperty.thisProperty.code) thisProperty.resume = false;
				else {
					i = thisProperty.i || 0;
					object = thisProperty.object;
					propertyState = thisProperty.propertyState || 0;
					propertyIndex = thisProperty.propertyIndex || 0;
					thisProperty = thisProperty.thisProperty;
				}
			}
			isArray = thisProperty.code === ARRAY_TYPE;
			object = object || (thisProperty.constructs ? new thisProperty.constructs() : isArray ? [] : {});
			for (; i < length;) {
				var type, number;
				var lastRead = offset;
				var token = source.charCodeAt(offset++);
				if (token >= 48) {
					if (token > 12288) {
						type = token >>> 12 ^ 4;
						number = token & 4095;
					} else {
						type = token >>> 4 ^ 4;
						number = token & 15;
					}
				} else {
					type = token >>> 4 & 11;
					number = token & 15;
					token = source.charCodeAt(offset++);
					number = (number << 6) + (token & 63);
					if (!(token >= 64)) {
						token = source.charCodeAt(offset++);
						number = (number << 6) + (token & 63);
						if (!(token >= 64)) {
							token = source.charCodeAt(offset++);
							number = (number << 6) + (token & 63);
							if (!(token >= 64)) {
								token = source.charCodeAt(offset++);
								number = (number << 6) + (token & 63);
								if (!(token >= 64)) {
									token = source.charCodeAt(offset++);
									number = number * 64 + (token & 63);
									if (!(token >= 64)) {
										token = source.charCodeAt(offset++);
										number = number * 64 + (token & 63);
										if (!(token >= 64)) {
											token = source.charCodeAt(offset++);
											number = number * 64 + (token & 63);
											if (!(token >= 0)) {
												if (offset > source.length) return pause({
													length,
													thisProperty,
													i,
													object,
													propertyIndex,
													propertyState
												}, lastRead);
											}
										}
									}
								}
							}
						}
					}
				}
				if (type === 0) {
					propertyIndex = number;
					propertyState = 0;
					continue;
				}
				property = thisProperty[propertyIndex];
				if (type === 3) {
					if (number < 6) {
						if (number < 3) {
							if (number === 0) value = null;
							else value = "Unknown token, type: " + type + " number: " + number;
						} else if (number === TRUE) value = true;
						else if (number === FALSE) value = false;
						else value = void 0;
					} else {
						if (number <= NUMBER_TYPE) {
							if (propertyState === 1) {
								propertyIndex++;
								i++;
								property = thisProperty[propertyIndex];
							}
							if (propertyIndex < thisProperty.resetTo) throw new Error("Overwriting frozen property");
							if (property) {
								if (!property.resume) {
									value = property.key;
									property = thisProperty[propertyIndex] = [];
									property.key = value;
								}
							} else {
								property = thisProperty[propertyIndex] = [];
								property.key = null;
							}
							property.code = number;
							property.parent = thisProperty;
							propertyState = 2;
							if (number === REFERENCING_TYPE) property.values = [];
							else if (number === ARRAY_TYPE) {
								property[0] = [];
								property[0].key = null;
								property[0].code = DEFAULT_TYPE;
								property[0].parent = property;
							}
						} else propertyState = number;
						continue;
					}
				} else if (type === 2) {
					value = source.slice(offset, offset += number);
					if (offset > source.length) return pause({
						length,
						thisProperty,
						i,
						object,
						propertyIndex,
						propertyState
					}, lastRead);
					if (propertyState < 2) {
						if (property.code === NUMBER_TYPE) value = +value;
					}
				} else if (type === 1) value = number;
				else if (number > 13) {
					if (number === END_SEQUENCE) return object;
					else if (number === DEFERRED_REFERENCE) {
						value = readSequence(0, property);
						propertyState = 0;
						if (options.forDeferred) value = options.forDeferred(value, property);
						else (deferredReads || (deferredReads = [])).push({
							property,
							value
						});
					}
				} else {
					if (number >= OPEN_SEQUENCE) number = 2e9;
					if (propertyState > 1) {
						if (propertyState === 2) {
							propertyState = 0;
							value = readSequence(number, property);
						} else if (propertyState === METADATA_TYPE) value = readSequence(number, [{
							key: null,
							code: 6
						}]);
						else if (property.resume && (property.code || DEFAULT_TYPE) === property.thisProperty.code) value = readSequence(number, property.thisProperty);
						else value = readSequence(number, property);
					} else value = readSequence(number, property);
					if (pausedState) {
						if (value === void 0) {
							pausedState = null;
							parser.onResume = null;
							return pause({
								length,
								thisProperty,
								i,
								object,
								property,
								propertyIndex,
								previousProperty,
								propertyState
							}, lastRead);
						} else pausedState.values = property.values instanceof Array ? property.values : void 0;
					}
				}
				if (!property) throw new Error("No property defined for slot" + (thisProperty.key ? " in " + thisProperty.key : ""));
				if (propertyState < 2 && property && property.code === REFERENCING_TYPE) {
					var values = property.values;
					if (typeof value === "number") {
						value = values[number];
						if (value === void 0 && !(number in values)) throw new Error("Referencing value that has not been read yet");
					} else if ((type === 2 || type === 7) && values) {
						if (values.nextPosition > -1) {
							if (property.recordValueReference) property.recordValueReference(values);
							values[values.nextPosition++] = value;
						} else values.push(value);
					}
				}
				if (propertyState > 1) {
					if (propertyState === 2) property.key = value;
					else if (propertyState === METADATA_TYPE) {
						if (typeof value === "string") {
							var extendedType = classByName.get(value);
							if (extendedType) {
								if (extendedType.fromValue) property.fromValue = extendedType.fromValue;
								else property.constructs = extendedType;
							} else if (options.errorOnUnknownClass) throw new Error("Attempt to deserialize to unknown class " + parameter);
							property.extendedType = extendedType;
						} else {
							property.metadata = value;
							if (value === ERROR_METADATA) property.fromValue = onError;
						}
					} else if (propertyState === REFERENCING_POSITION) {
						var values = property.values || (property.values = []);
						values.nextPosition = value;
					} else if (propertyState === TYPE_DEFINITION) {} else throw new Error("Unknown property type " + propertyState);
					propertyState = 1;
					continue;
				} else propertyState = 0;
				if (property.fromValue) value = property.fromValue(value);
				if (isArray && property.key === null) object.push(value);
				else if (value !== void 0) object[property.key] = value;
				i++;
				if (!isArray) propertyIndex++;
			}
			return object;
		}
		var nonParsingError;
		function onError(error) {
			var g = typeof global != "undefined" ? global : window;
			if (error && error.name && g[error.name]) error = new g[error.name](error.message);
			else if (typeof error == "string") error = new Error(error);
			if (options.onError) options.onError(error);
			else {
				nonParsingError = true;
				throw error;
			}
		}
		var disposedChars = 0;
		function read(property) {
			try {
				if (property && property.resume) {
					var previous = property.previous;
					value = readSequence(previous.length, previous);
					value = property.object || value;
					property = property.property;
				} else {
					property = property || [options && options.shared || {
						key: null,
						code: 6
					}];
					var value = readSequence(1, property)[property[0].key];
				}
				while (true) {
					if (pausedState) return pause({
						reader: read,
						object: value,
						property
					});
					if (!deferredReads) return value;
					var index = deferredReads.index || 0;
					var deferredRead = deferredReads[index];
					deferredReads.index = index + 1;
					if (!deferredRead) {
						deferredReads = deferredReads.parent;
						continue;
					}
					var target = deferredRead.value;
					var parentDeferredReads = deferredReads;
					deferredReads = [];
					deferredReads.parent = parentDeferredReads;
					var targetProperty = deferredRead.property;
					var result = readSequence(1, property = [{
						resume: true,
						key: null,
						thisProperty: targetProperty,
						object: target
					}]);
					result = result.null || result[targetProperty.key];
					if (result != target) {
						Object.assign(target, result);
						if (pausedState && pausedState.object === result) pausedState.object = target;
						if (result && result.constructor === Array) {
							target.length = result.length;
							Object.setPrototypeOf(target, Object.getPrototypeOf(result));
						}
					}
				}
			} catch (error) {
				if (!nonParsingError) error.message = "DPack parsing error: " + error.message + " at position: " + (offset + disposedChars) + " near: " + source.slice(offset - 10, offset + 10);
				throw error;
			}
		}
		var parser = {
			setSource: function(string, startOffset, isPartialString) {
				source = string;
				offset = startOffset || 0;
				disposedChars = 0;
				isPartial = isPartialString;
				return this;
			},
			hasMoreData: function() {
				return source.length > offset;
			},
			isPaused: function() {
				return pausedState;
			},
			hasUnfulfilledReferences: function() {
				return deferredReads && deferredReads.length > deferredReads.index;
			},
			getOffset: function() {
				return offset + disposedChars;
			},
			read
		};
		return parser;
	}
	exports.parse = function(stringOrBuffer, options) {
		var source;
		if (typeof stringOrBuffer === "string") source = stringOrBuffer;
		else if (stringOrBuffer && stringOrBuffer.toString) source = stringOrBuffer.toString(options && options.encoding || "utf8");
		else return stringOrBuffer;
		var parser = createParser(options).setSource(source);
		if (options && options.shared) return parser.read([options.shared]);
		return parser.read();
	};
	exports.createParser = createParser;
	var readMap = { fromValue: function(entries) {
		var map = /* @__PURE__ */ new Map();
		for (var i = 0, l = entries.length; i < l; i++) {
			var entry = entries[i];
			map.set(entry.key, entry.value);
		}
		return map;
	} };
	var readSet = { fromValue: function(values) {
		var set = new Set(values);
		if (set.size === 0 && values.length > 0) for (var i = 0, l = values.length; i < l; i++) set.add(values[i]);
		return set;
	} };
	var readDate = { fromValue: function(time) {
		return new Date(time);
	} };
}));
//#endregion
//#region node_modules/dpack/lib/parse-stream.js
var require_parse_stream = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Transform = require("stream").Transform;
	var createParser = require_parse().createParser;
	var DEFAULT_OPTIONS = { objectMode: true };
	var DPackParseStream = class extends Transform {
		constructor(options) {
			if (options) options.objectMode = true;
			else options = DEFAULT_OPTIONS;
			super(options);
			this.parser = createParser(options);
			this.waitingValues = [];
		}
		_transform(chunk, encoding, callback) {
			var value;
			try {
				var sourceString = chunk.toString();
				var parser = this.parser;
				if (parser.onResume) {
					value = parser.onResume(sourceString, true);
					if (!parser.isPaused()) this.sendValue(value);
				} else parser.setSource(sourceString, 0, true);
				while (parser.hasMoreData()) {
					value = parser.read();
					if (parser.isPaused()) break;
					else this.sendValue(value);
				}
			} catch (error) {
				console.error(error);
			}
			if (callback) callback();
		}
		sendValue(value) {
			if (this.parser.hasUnfulfilledReferences()) {
				if (value !== void 0) this.waitingValues.push(value);
			} else {
				while (this.waitingValues.length > 0) this.push(this.waitingValues.shift());
				if (value !== void 0) this.push(value);
			}
		}
	};
	exports.createParseStream = () => new DPackParseStream();
}));
//#endregion
//#region node_modules/dpack/lib/node-encoder.js
var require_node_encoder = /* @__PURE__ */ __commonJSMin(((exports) => {
	var PREFERRED_MAX_BUFFER_SIZE = 32768;
	var availableBuffers = [];
	function nodeCharEncoder(options) {
		var offset = options.startOffset || 0;
		var bufferSize;
		var outlet = options.outlet;
		var buffer = availableBuffers.pop();
		if (buffer && buffer.length > offset + 128) bufferSize = buffer.length;
		else {
			bufferSize = (offset >> 12 << 12) + 8192;
			buffer = Buffer.allocUnsafeSlow(bufferSize);
		}
		var encoding = options.encoding;
		var sequences = [];
		function makeRoom(bytesNeeded) {
			if (outlet) {
				outlet.writeBytes(buffer.slice(0, offset));
				if (bufferSize < PREFERRED_MAX_BUFFER_SIZE || bytesNeeded > PREFERRED_MAX_BUFFER_SIZE) bufferSize = Math.max(bufferSize * 4, bytesNeeded);
				buffer = Buffer.allocUnsafeSlow(bufferSize);
				offset = 0;
				sequences = [];
				encoder.hasWritten = true;
			} else {
				bufferSize = Math.max(bufferSize * 4, bufferSize + bytesNeeded, 8192);
				var oldBuffer = buffer;
				buffer = Buffer.allocUnsafeSlow(bufferSize);
				oldBuffer.copy(buffer, 0, 0, offset);
			}
		}
		function flush(specifiedOutlet) {
			(specifiedOutlet || outlet).writeBytes(buffer.slice(0, offset));
			if (offset + 128 > buffer.length) buffer = Buffer.allocUnsafeSlow(bufferSize = Math.min(Math.max((offset >> 10 << 10) + 8192, bufferSize), 32768));
			else {
				buffer = buffer.slice(offset);
				bufferSize = buffer.length;
			}
			offset = 0;
			sequences = [];
		}
		function writeToken(type, number) {
			if (number < 16) buffer[offset++] = (type << 4) + number ^ 64;
			else if (number < 1024) {
				buffer[offset++] = (type << 4) + (number >>> 6);
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 65536) {
				buffer[offset++] = (type << 4) + (number >>> 12);
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 4194304) {
				buffer[offset++] = (type << 4) + (number >>> 18);
				buffer[offset++] = number >>> 12 & 63;
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 268435456) {
				buffer[offset++] = (type << 4) + (number >>> 24);
				buffer[offset++] = number >>> 18 & 63;
				buffer[offset++] = number >>> 12 & 63;
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 4294967296) {
				buffer[offset++] = (type << 4) + (number >>> 30);
				buffer[offset++] = number >>> 24 & 63;
				buffer[offset++] = number >>> 18 & 63;
				buffer[offset++] = number >>> 12 & 63;
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 17179869184) {
				buffer[offset++] = (type << 4) + (number / 1073741824 >>> 0);
				buffer[offset++] = number >>> 24 & 63;
				buffer[offset++] = number >>> 18 & 63;
				buffer[offset++] = number >>> 12 & 63;
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 1099511627776) {
				buffer[offset++] = (type << 4) + (number / 68719476736 >>> 0);
				buffer[offset++] = number / 1073741824 & 63;
				buffer[offset++] = number >>> 24 & 63;
				buffer[offset++] = number >>> 18 & 63;
				buffer[offset++] = number >>> 12 & 63;
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else if (number < 70368744177664) {
				buffer[offset++] = (type << 4) + (number / 4398046511104 >>> 0);
				buffer[offset++] = number / 68719476736 & 63;
				buffer[offset++] = number / 1073741824 & 63;
				buffer[offset++] = number >>> 24 & 63;
				buffer[offset++] = number >>> 18 & 63;
				buffer[offset++] = number >>> 12 & 63;
				buffer[offset++] = number >>> 6 & 63;
				buffer[offset++] = (number & 63) + 64;
			} else throw new Error("Invalid number " + number);
			if (offset > bufferSize - 10) makeRoom(0);
		}
		function writeBuffer(source) {
			var sourceLength = source.length;
			if (sourceLength + offset + 10 > bufferSize) makeRoom(sourceLength + 10);
			source.copy(buffer, offset);
			offset += sourceLength;
		}
		function writeString(string) {
			var maxStringLength = string.length * 3 + 10;
			if (offset + maxStringLength > bufferSize) makeRoom(maxStringLength + 10);
			var bytesWritten = encoding ? buffer.write(string, offset, buffer.length, encoding) : buffer.utf8Write(string, offset, buffer.length);
			offset += bytesWritten;
		}
		function getSerialized() {
			return buffer.slice(0, offset);
		}
		function insertBuffer(headerBuffer, position) {
			var headerLength = headerBuffer.length;
			if (offset + headerLength + 10 > bufferSize) makeRoom(headerLength + 10);
			buffer.copy(buffer, headerLength + position, position, offset);
			headerBuffer.copy(buffer, position);
			offset += headerLength;
		}
		var encoder = {
			writeToken,
			writeString,
			writeBuffer,
			getSerialized,
			insertBuffer,
			flush,
			startSequence() {
				var currentOffset = offset;
				buffer[offset++] = 60;
				sequences.push(currentOffset);
				if (offset > bufferSize - 10) makeRoom(0);
			},
			endSequence(length) {
				var startOffset = sequences.pop();
				if (length < 12 && startOffset > -1) {
					buffer[startOffset] = 48 + length;
					return;
				}
				buffer[offset++] = 62;
			},
			finish() {
				if (buffer.length - offset > 144) availableBuffers.push(buffer.slice(offset));
			},
			getOffset() {
				return offset;
			},
			setOffset(newOffset) {
				offset = newOffset;
			}
		};
		return encoder;
	}
	exports.nodeCharEncoder = nodeCharEncoder;
}));
//#endregion
//#region node_modules/dpack/lib/Options.js
var require_Options = /* @__PURE__ */ __commonJSMin(((exports) => {
	function Options() {
		this.classByName = /* @__PURE__ */ new Map();
		this.converterByConstructor = /* @__PURE__ */ new Map();
	}
	Options.prototype.addExtension = function(Class, name, options) {
		if (name && Class.name !== name) Class.name = name;
		this.classByName.set(Class.name, options && options.fromArray ? options : Class);
		this.converterByConstructor.set(Class, options && options.toArray ? options : Class);
	};
	exports.Options = Options;
}));
//#endregion
//#region node_modules/dpack/lib/shared.js
var require_shared = /* @__PURE__ */ __commonJSMin(((exports) => {
	var createSerializer = require_serialize().createSerializer;
	require_serialize().serialize;
	var createParser = require_parse().createParser;
	require_Options().Options;
	var PROPERTY_CODE = 0;
	var TYPE_CODE = 3;
	var SEQUENCE_CODE = 7;
	var DEFAULT_TYPE = 6;
	var ARRAY_TYPE = 7;
	var REFERENCING_TYPE = 8;
	var NUMBER_TYPE = 9;
	var TYPE_DEFINITION = 14;
	var UNSTRUCTURED_MARKER = 11;
	var OPEN_SEQUENCE = 12;
	var END_SEQUENCE = 14;
	exports.createSharedStructure = createSharedStructure;
	exports.readSharedStructure = readSharedStructure;
	function readSharedStructure(from) {
		var parser = createParser();
		var sharedProperty = [];
		sharedProperty.code = 6;
		sharedProperty.key = null;
		parser.setSource(from + "p").read([sharedProperty]);
		setupShared(sharedProperty);
		sharedProperty.serialized = from;
		return sharedProperty;
	}
	function setupShared(property) {
		property.resetTo = property.length;
		property.upgrade = upgrade;
		property.type = types[property.code];
		property.isFrozen = true;
		Object.defineProperty(property, "serialized", { get() {
			return this._serialized || (this._serialized = serializeSharedStructure(this));
		} });
		if (typeof property.values === "object" && property.values) {
			property.values.resetTo = property.values.length;
			property.lastIndex = property.values.length;
		}
		for (var i = 0, l = property.length; i < l; i++) {
			property[i].index = i;
			property[i].resumeIndex = i;
			setupShared(property[i]);
		}
	}
	function upgrade(property) {
		if (!property) return 1;
		var compatibility;
		if (property) {
			if (property.insertedFrom === this && property.insertedVersion === this.version && (property.recordUpdate || property.isFrozen || property.length == 0 && property.code == this.code && property.values == null)) return 0;
			var changedCode;
			if (this.code !== property.code) changedCode = true;
			if (property.upgrade) {
				var compatibility = copyProperty(this, property);
				if (changedCode) compatibility = 2;
				if (property.isFrozen && compatibility > 0) return 2;
				property.insertedFrom = this;
				property.insertedVersion = this.version;
				if (compatibility === 2) {
					debugger;
					console.error("Inserting incompatible block into property");
					return 2;
				} else return 0;
			} else {
				property.insertedFrom = this;
				property.insertedVersion = this.version;
				property.length = 0;
				property.values = null;
				if (property.fromValue) property.fromValue = null;
				return 1;
			}
		} else if (this.length > 0) blockBuffer = Buffer.concat([this.serialized, blockBuffer]);
		return 1;
	}
	var typeToCode = {
		string: REFERENCING_TYPE,
		number: NUMBER_TYPE,
		object: DEFAULT_TYPE,
		boolean: DEFAULT_TYPE,
		undefined: DEFAULT_TYPE,
		array: ARRAY_TYPE
	};
	var lastPropertyOnObject = /* @__PURE__ */ new WeakMap();
	function createSharedStructure(from, options) {
		var instanceProperty = [];
		instanceProperty.key = null;
		instanceProperty.code = 6;
		instanceProperty.type = "object";
		let activeList = [];
		activeList.iteration = 0;
		var previousAvoidShareUpdate;
		class Shared extends Array {
			constructor(instanceProperty) {
				super();
				this.key = typeof instanceProperty.key == "string" ? isolateString(instanceProperty.key) : instanceProperty.key;
				this.type = instanceProperty.type;
				this.code = instanceProperty.code;
				this.count = 0;
				this.comesAfter = [];
				if (this.code == REFERENCING_TYPE) {
					this.values = [];
					this.values.resetTo = 512;
					this.values.nextPosition = 512;
					this.previousValues = /* @__PURE__ */ new Map();
					this.lastIndex = 0;
					this.repetitions = 0;
				}
			}
			newProperty(instance) {
				return new Shared(instance);
			}
			getProperty(value, key, type, extendedType, writeProperty, writeToken, lastPropertyIndex) {
				let property;
				if (this.insertedFrom) {
					propertySearch(this.insertedFrom);
					if (property) {
						if (lastPropertyIndex !== property.index) writeToken(PROPERTY_CODE, propertyIndex);
						return property;
					}
					if (this.insertedFrom.getProperty) return this.insertedFrom.getProperty(value, key, type, extendedType, writeProperty, writeToken, lastPropertyIndex);
					else debugger;
				}
				this.recordUpdate();
				let propertyIndex = this.length;
				if (lastPropertyIndex !== propertyIndex) writeToken(PROPERTY_CODE, propertyIndex);
				if (type === "boolean" || type === "undefined") type = "object";
				property = this[propertyIndex] = new Shared({
					key,
					type,
					code: typeToCode[type]
				});
				property.parent = this;
				property.index = propertyIndex;
				return property;
				function propertySearch(parentProperty) {
					let propertyIndex = -1;
					do
						property = parentProperty[++propertyIndex];
					while (property && (property.key !== key || property.type !== type && type !== "boolean" && type !== "undefined" || extendedType && property.extendedType !== constructor));
				}
			}
			writeSharedValue(value, writeToken, serializerId) {
				let valueEntry = this.previousValues.get(value);
				if (valueEntry) {
					if (valueEntry.serializer == serializerId) this.repetitions++;
					else {
						valueEntry.serializations++;
						valueEntry.serializer = serializerId;
					}
				} else this.previousValues.set(value, valueEntry = {
					serializations: 1,
					serializer: serializerId
				});
				if (!this.active) {
					this.active = 2;
					activeList.push(this);
				}
				return false;
			}
			propertyUsed(property, object, serializerId, i) {
				if (property.lastSerializer !== serializerId) {
					property.lastSerializer = serializerId;
					property.count++;
				}
				if (i !== 0) {
					let lastProperty = lastPropertyOnObject.get(object);
					if (lastProperty && property.comesAfter.indexOf(lastProperty) === -1) property.comesAfter.push(lastProperty);
				}
				lastPropertyOnObject.set(object, property);
			}
			recordUpdate() {
				var property = this;
				do {
					property.version = (property.version || 0) + 1;
					if (property.insertedFrom) property.insertedFrom = null;
					if (property._serialized) property._serialized = null;
				} while (property = property.parent);
			}
			readingBlock(parse) {
				try {
					return parse();
				} finally {
					this.readReset();
					if (this.length > 500) debugger;
				}
			}
			startWrite(avoidShareUpdate, value) {
				activeList.iteration++;
				if (value && value.constructor === Array) {
					if (this.code !== ARRAY_TYPE && this.version > 0) throw new Error("Can not change the root type of a shared object to an array");
					if (this.code != ARRAY_TYPE) this.recordUpdate();
					this.code = ARRAY_TYPE;
					this.type = "array";
				}
				if (this.writing) return;
				else this.writing = true;
			}
			endWrite() {
				if (this.writing) this.writing = false;
				else return;
				let iterations = this.iterations = (this.iterations || 0) + 1;
				for (let i = 0; i < activeList.length; i++) {
					let activeSharedProperty = activeList[i];
					let previousValues = activeSharedProperty.previousValues;
					if (previousValues && previousValues.size && !activeSharedProperty.isFrozen) {
						if (!currentAvoidShareUpdate) {
							if (activeSharedProperty.values.length == 0 && iterations > ((activeSharedProperty.repetitions || 0) + 10) * 5) {
								console.log("changing referenceable to default", activeSharedProperty.key);
								activeSharedProperty.previousValues = null;
								activeSharedProperty.code = DEFAULT_TYPE;
								activeSharedProperty.type = "object";
								activeSharedProperty.recordUpdate();
								activeList.splice(i--, 1);
								previousValues = [];
							}
							for (let [value, entry] of previousValues) {
								let values = activeSharedProperty.values;
								if ((entry.serializations + 3) * 8 < iterations - (entry.startingIteration || (entry.startingIteration = iterations)) || values.length > 500) previousValues.delete(value);
								if (entry.serializations > 50 && entry.serializations * 3 > iterations) {
									values[activeSharedProperty.lastIndex++] = value;
									activeSharedProperty.recordUpdate();
									console.log("adding value", value, "to", activeSharedProperty.key);
									previousValues.delete(value);
								}
							}
						}
					} else {
						activeSharedProperty.active = 0;
						activeList.splice(i--, 1);
					}
				}
				if (activeList.hasUpdates) {
					activeList.hasUpdates = false;
					this.version++;
					if (!this._serialized) this._serialized = null;
					if (options && options.onUpdate) options.onUpdate();
				}
				currentAvoidShareUpdate = previousAvoidShareUpdate;
			}
			upgrade(property) {
				return upgrade.call(this, property);
			}
			get serialized() {
				return this._serialized || (this._serialized = serializeSharedStructure(this));
			}
			serializeCommonStructure(embedded) {
				var usageThreshold = Math.sqrt(activeList.iteration);
				return serializeSharedStructure(this, (childProperty) => childProperty.count >= usageThreshold, embedded);
			}
		}
		var sharedStructure = new Shared(instanceProperty);
		sharedStructure.version = 0;
		sharedStructure.freeze = function() {
			this.isFrozen = true;
			this.reset();
		};
		if (from) {
			var parser = createParser({
				forDeferred(block, property) {
					property.isBlock = true;
					return block;
				},
				parseDeferreds: true
			});
			var readProperty = [];
			readProperty.code = 6;
			readProperty.key = null;
			parser.setSource(from + "p").read([readProperty]);
			copyProperty(readProperty, sharedStructure);
			activeList.hasUpdates = false;
			sharedStructure.version = 1;
		}
		sharedStructure.key = null;
		return sharedStructure;
	}
	var types = {
		6: "object",
		7: "array",
		8: "string",
		9: "number"
	};
	var currentAvoidShareUpdate;
	function serializeSharedStructure(property, condition, embedded) {
		var serializer = createSerializer();
		var writers = serializer.getWriters();
		serializeSharedProperty(property, !embedded, !embedded);
		function serializeSharedProperty(property, expectsObjectWithNullKey, isRoot) {
			if (property.insertedFrom && property.insertedFrom.serializeCommonStructure) {
				property = property.insertedFrom;
				return writers.writeBuffer(property.serializeCommonStructure(!isRoot));
			}
			var isArray = property.code === ARRAY_TYPE;
			var commonProperties = condition ? orderProperties(property.filter(condition)) : property;
			var length = commonProperties.length;
			if (!(expectsObjectWithNullKey && property.code === DEFAULT_TYPE)) {
				let key = isRoot ? null : property.key;
				writers.writeProperty(key, types[property.code]);
				if (length === 0 && key === null && (property.code === DEFAULT_TYPE || property.code === ARRAY_TYPE)) writers.writeToken(SEQUENCE_CODE, 0);
			}
			if (isRoot && length > 0) writers.writeToken(TYPE_CODE, TYPE_DEFINITION);
			if (length > 0) {
				writers.writeToken(SEQUENCE_CODE, OPEN_SEQUENCE);
				for (var i = 0; i < length; i++) {
					var childProperty = commonProperties[i];
					childProperty.index = i;
					if (isArray && i > 0) writers.writeToken(PROPERTY_CODE, i);
					serializeSharedProperty(childProperty, commonProperties.code === ARRAY_TYPE && i === 0, false, condition);
				}
				writers.writeToken(SEQUENCE_CODE, END_SEQUENCE);
			}
			var first = true;
			if (property.lastIndex > 0) for (var i = 0, l = property.lastIndex; i < l; i++) {
				var value = property.values[i];
				if (first) first = false;
				else writers.writeToken(PROPERTY_CODE, property.index);
				writers.writeAsDefault(value);
			}
		}
		return serializer.getSerialized();
	}
	function copyProperty(source, target, freezeTarget, startingIndex) {
		var compatibility = 0;
		target.code = source.code;
		target.type = source.type || types[source.code];
		if (freezeTarget) {
			target.isFrozen = true;
			if (target.previousValues) target.previousValues = null;
		}
		let sourceLength = source.resetTo > -1 ? source.resetTo : source.length;
		if (target.resetTo > -1 && target.resetTo < target.length) target.length = target.resetTo;
		for (var i = startingIndex || 0; i < sourceLength; i++) {
			var targetChild = target[i];
			var childProperty = source[i];
			if (targetChild && (targetChild.key != childProperty.key || targetChild.extendedType != childProperty.extendedType || targetChild.code != childProperty.code && !(targetChild.code == 8 && childProperty.code === 6 && (!targetChild.values || !targetChild.values.length)))) {
				if (target.isFrozen) return 2;
				compatibility = 2;
			}
			if (!targetChild) {
				if (target.isFrozen) return 2;
				var targetChild = [];
				targetChild.code = childProperty.code;
				if (target.newProperty) targetChild = target.newProperty(targetChild);
				target[i] = targetChild;
				if (childProperty.metadata) targetChild.metadata = childProperty.metadata;
				if (childProperty.insertedFrom) {
					targetChild.insertedFrom = childProperty.insertedFrom;
					targetChild.insertedVersion = childProperty.insertedVersion;
				}
				targetChild.parent = target;
			}
			targetChild.key = childProperty.key;
			if (childProperty.values && childProperty.values.length > 0) {
				if (childProperty.values.resetTo > -1) childProperty.values.length = childProperty.values.resetTo;
				if (!targetChild.values || childProperty.values.length > (targetChild.values.resetTo > -1 ? targetChild.values.resetTo : targetChild.values.length)) {
					targetChild.values = childProperty.values.slice(0);
					targetChild.values.nextPosition = childProperty.values.length;
					if (targetChild.values.length >= 12) targetChild.previousValues = null;
					if (compatibility == 0) compatibility = 1;
				}
			}
			var childCompatibility = copyProperty(childProperty, targetChild, freezeTarget);
			if (childCompatibility > compatibility) compatibility = childCompatibility;
		}
		if ((target.resetTo > -1 ? target.resetTo : target.length) > sourceLength) {
			if (target.recordUpdate) {
				source.metadata = UNSTRUCTURED_MARKER;
				source.recordUpdate();
			} else if (target.isFrozen) return 2;
		}
		return compatibility;
	}
	function isolateString(string) {
		return string.slice(0, 1) + string.slice(1);
	}
	function orderProperties(properties) {
		var ordered = [];
		var traversed = /* @__PURE__ */ new Set();
		function addProperty(property) {
			if (traversed.has(property)) return;
			traversed.add(property);
			for (var propertyBefore of property.comesAfter) addProperty(propertyBefore);
			ordered.push(property);
		}
		for (let property of properties) addProperty(property);
		return ordered;
	}
}));
//#endregion
//#region node_modules/dpack/lib/Block.js
var require_Block = /* @__PURE__ */ __commonJSMin(((exports) => {
	var makeSymbol = typeof Symbol !== "undefined" ? Symbol : function(name) {
		return "symbol-" + name;
	};
	var nextVersion = 1;
	var bufferSymbol = makeSymbol("buffer");
	var sizeTableSymbol = makeSymbol("sizeTable");
	makeSymbol("header");
	var parsedSymbol = makeSymbol("parsed");
	var sharedSymbol = makeSymbol("shared");
	var targetSymbol = makeSymbol("target");
	var freezeObjects = process.env.NODE_ENV != "production";
	var DEFAULT_TYPE = 6;
	var ARRAY_TYPE = 7;
	function Block() {}
	var serializeModule = require_serialize();
	exports.Block = Block;
	exports.bufferSymbol = serializeModule.bufferSymbol = bufferSymbol;
	exports.parsedSymbol = parsedSymbol;
	exports.sharedSymbol = sharedSymbol;
	exports.targetSymbol = serializeModule.targetSymbol = targetSymbol;
	exports.sizeTableSymbol = serializeModule.sizeTableSymbol = sizeTableSymbol;
	var serialize = serializeModule.serialize;
	var createSerializer = serializeModule.createSerializer;
	exports.asBlock = asBlock;
	function asBlock(object, shared) {
		if (object && object[targetSymbol]) return object;
		if (Array.isArray(object)) {
			let target = [];
			target.parsed = object;
			target.shared = shared;
			return new Proxy(target, onDemandHandler);
		}
		return new Proxy({
			parsed: object,
			shared
		}, onDemandHandler);
	}
	exports.isBlock = isBlock;
	function isBlock(object) {
		return object && object[targetSymbol];
	}
	exports.makeBlockFromBuffer = makeBlockFromBuffer;
	function makeBlockFromBuffer(buffer, shared) {
		var dpackBuffer, sizeTableBuffer;
		if (buffer[0] < 128) dpackBuffer = buffer;
		else {
			var type = buffer[0] >> 6;
			var dpackOffset;
			if (type === 2) dpackOffset = buffer.readUInt16BE(0) & 16383;
			else dpackOffset = buffer.readUInt32BE(0) & 1073741823;
			dpackBuffer = buffer.slice(dpackOffset);
			sizeTableBuffer = buffer.slice(0, dpackOffset);
		}
		var target = {
			dpackBuffer,
			sizeTableBuffer,
			shared,
			reassign: function(buffer) {
				this.buffer = buffer;
			}
		};
		buffer.owner = target;
		return new Proxy(target, onDemandHandler);
	}
	exports.getLazyHeader = function(block) {
		return block[sizeTableSymbol];
	};
	var onDemandHandler = {
		get: function(target, key) {
			if (specialGetters.hasOwnProperty(key)) return specialGetters[key].call(target);
			var parsed = target.parsed;
			if (!parsed) parsed = getParsed(target);
			return parsed[key];
		},
		set: function(target, key, value) {
			if (typeof key === "symbol") {
				target[key] = value;
				makeSymbolGetter(key);
				return true;
			}
			throw new Error("No changes are allowed on frozen parsed object, Use dpack copy() function to modify");
		},
		deleteProperty: function() {
			throw new Error("No changes are allowed on frozen parsed object, Use dpack copy() function to modify");
		},
		getOwnPropertyDescriptor: function(target, key) {
			var parsed = getParsed(target);
			return Object.getOwnPropertyDescriptor(parsed, key);
		},
		has: function(target, key) {
			return key in getParsed(target);
		},
		ownKeys: function(target) {
			var parsed = getParsed(target);
			var keys = Object.keys(parsed);
			if (Array.isArray(parsed)) keys.push("length");
			return keys;
		},
		getPrototypeOf: function(target) {
			var parsed = getParsed(target);
			return Object.getPrototypeOf(parsed);
		}
	};
	exports.reassignBuffers = reassignBuffers;
	function reassignBuffers(block, newParentNodeBuffer, parentArrayBuffer) {
		var target = block[targetSymbol];
		var buffer = target.dpackBuffer;
		if (!parentArrayBuffer) parentArrayBuffer = buffer.buffer;
		if (buffer && buffer.buffer === parentArrayBuffer) {
			var byteOffset = buffer.byteOffset;
			target.dpackBuffer = newParentNodeBuffer.slice(byteOffset, byteOffset + buffer.length);
		}
		var buffer = target.sizeTableBuffer;
		if (buffer && buffer.buffer === parentArrayBuffer) {
			var byteOffset = buffer.byteOffset;
			target.sizeTableBuffer = newParentNodeBuffer.slice(byteOffset, byteOffset + buffer.length);
		}
		if (target.parsed) {
			var parsed = target.parsed;
			for (var key in parsed) {
				var value = parsed[key];
				if (isBlock(value)) reassignBuffers(value, newParentNodeBuffer, parentArrayBuffer);
			}
		}
	}
	var copyOnWriteHandler = {
		get: function(target, key) {
			if (specialGetters.hasOwnProperty(key)) return specialGetters[key].call(target);
			var cachedParsed = target.cachedParsed;
			if (cachedParsed && cachedParsed.hasOwnProperty(key) && !(key == "length" && Array.isArray(cachedParsed))) return cachedParsed[key];
			var parsed = target.parsed;
			if (!parsed) parsed = getParsed(target);
			var value = parsed[key];
			if (value && value[targetSymbol]) {
				if (!cachedParsed) target.cachedParsed = cachedParsed = parsed instanceof Array ? [] : {};
				cachedParsed[key] = value = copyWithParent(value, target);
			}
			return value;
		},
		changed: function(target) {
			target.dpackBuffer = null;
			target.sizeTableBuffer = null;
			target.shared = null;
			var parsed = target.parsed;
			if (!parsed) parsed = getParsed(target);
			if (!target.copied) {
				var cachedParsed = target.cachedParsed;
				var copied = target.parsed = target.cachedParsed = parsed instanceof Array ? [] : {};
				for (var key in parsed) {
					var value = cachedParsed && cachedParsed[key];
					if (!value) {
						value = parsed[key];
						if (value && value[targetSymbol]) value = copyWithParent(value, target);
					}
					copied[key] = value;
				}
				parsed = copied;
				target.copied = true;
			}
			target.version = nextVersion++;
			return parsed;
		},
		checkVersion: function(target) {
			var cachedParsed = target.cachedParsed;
			let version = target.version || 0;
			if (cachedParsed) for (let key in cachedParsed) {
				var value = cachedParsed[key];
				if (value && value[targetSymbol]) version = Math.max(version, this.checkVersion(value[targetSymbol]));
			}
			if (version != (target.version || 0)) {
				this.changed(target);
				target.version = version;
			}
			return version;
		},
		set: function(target, key, value, proxy) {
			if (specialSetters.hasOwnProperty(key)) {
				specialSetters[key].call(target, value);
				return true;
			}
			var parsed = copyOnWriteHandler.changed(target);
			parsed[key] = value;
			return true;
		},
		deleteProperty: function(target, key) {
			var parsed = copyOnWriteHandler.changed(target);
			return delete parsed[key];
		},
		getOwnPropertyDescriptor: function(target, key) {
			var parsed = getParsed(target);
			return Object.getOwnPropertyDescriptor(parsed, key);
		},
		has: function(target, key) {
			return key in getParsed(target);
		},
		ownKeys: function(target) {
			var parsed = getParsed(target);
			var keys = Object.keys(parsed);
			if (Array.isArray(parsed)) keys.push("length");
			if (target.copied) {
				for (var key in target.copied) if (keys.indexOf(key) === -1) keys.push(key);
			}
			return keys;
		},
		getPrototypeOf: function(target) {
			var parsed = getParsed(target);
			return Object.getPrototypeOf(parsed);
		}
	};
	var specialGetters = {};
	specialGetters[bufferSymbol] = function() {
		return function(property, randomAccess) {
			var propertyIsShared = property && property.upgrade;
			var buffer;
			if (this.cachedParsed && this.dpackBuffer) copyOnWriteHandler.checkVersion(this);
			if (!(this.shared && this.shared.upgrade) && propertyIsShared) {
				if (this.dpackBuffer) {
					this.sizeTableBuffer = null;
					return inSeparateProperty(this.dpackBuffer, true);
				} else return getSerialized(this, this.shared = property);
			}
			if (!this.dpackBuffer) getSerialized(this, this.shared);
			if (this.shared && this.shared.upgrade && this.shared !== property) {
				var compatibility = this.shared.upgrade(property, randomAccess);
				if (compatibility > 0) {
					this.sizeTableBuffer = null;
					var sharedBuffer = this.shared.serialized;
					if (sharedBuffer.length > 0) {
						if (compatibility == 2 && !(property.isFrozen && property.resetTo === 0)) sharedBuffer = inSeparateProperty(sharedBuffer);
						buffer = Buffer.concat([sharedBuffer, this.dpackBuffer]);
						buffer.mustSequence = true;
						return buffer;
					}
				}
			} else if (property) {
				if (!propertyIsShared) property.length = 0;
				if (property.insertedFrom) property.insertedFrom = null;
			}
			return this.dpackBuffer;
			function inSeparateProperty(dpackBuffer) {
				var serializer = createSerializer();
				var isArray = dpackBuffer[0] === 119;
				var writeToken = serializer.getWriters().writeToken;
				if (isArray) dpackBuffer = dpackBuffer.slice(1);
				writeToken(0, 1e3);
				writeToken(3, isArray ? ARRAY_TYPE : DEFAULT_TYPE);
				if (property && property.key !== null) serializer.serialize(property.key);
				dpackBuffer = Buffer.concat([serializer.getSerialized(), dpackBuffer]);
				dpackBuffer.mustSequence = true;
				return dpackBuffer;
			}
		}.bind(this);
	};
	specialGetters[targetSymbol] = function() {
		return this;
	};
	specialGetters[sharedSymbol] = function() {
		return this.shared;
	};
	specialGetters[parsedSymbol] = function() {
		return this.parsed || getParsed(this);
	};
	specialGetters[sizeTableSymbol] = function() {
		if (!this.dpackBuffer) getSerialized(this);
		return this.sizeTableBuffer;
	};
	specialGetters.then = function() {};
	specialGetters.toJSON = function() {
		return valueOf;
	};
	specialGetters.valueOf = function() {
		return valueOf;
	};
	specialGetters.entries = function() {
		return entries;
	};
	function entries() {
		return this[parsedSymbol].entries();
	}
	specialGetters[Symbol.iterator] = function() {
		var parsed = this.parsed || getParsed(this);
		return parsed && parsed[Symbol.iterator] && iterator;
	};
	function iterator() {
		var parsed = this[parsedSymbol];
		return parsed && parsed[Symbol.iterator] ? parsed[Symbol.iterator]() : [][Symbol.iterator]();
	}
	specialGetters.constructor = function() {
		if (this.parsed) return this.parsed.constructor;
		if (this.dpackBuffer) {
			let firstByte = this.dpackBuffer[0];
			if (firstByte >= 48 && firstByte <= 60) {
				if (this.shared) {
					if (this.shared.code == DEFAULT_TYPE) return Object;
					else if (this.shared.code == ARRAY_TYPE) return Array;
				} else return Object;
			} else if (firstByte === 119) return Array;
		}
		return getParsed(this).constructor;
	};
	function makeSymbolGetter(symbol) {
		if (!specialGetters[symbol]) specialGetters[symbol] = function() {
			return this[symbol];
		};
	}
	function valueOf() {
		return this[parsedSymbol];
	}
	function copy(source) {
		return copyWithParent(source);
	}
	function copyWithParent(source, parent) {
		if (!isBlock(source)) return source;
		let isArray = Array.isArray(source);
		let target = isArray ? [] : {};
		Object.defineProperties(target, {
			parsed: {
				get() {
					return source[parsedSymbol];
				},
				set(value) {
					Object.defineProperty(this, "parsed", {
						value,
						writable: true,
						enumerable: true
					});
				},
				configurable: true
			},
			shared: {
				get() {
					return source[sharedSymbol];
				},
				set(value) {
					Object.defineProperty(this, "shared", {
						value,
						writable: true,
						enumerable: true
					});
					this.dpackBuffer = null;
					this.sizeTableBuffer = null;
				},
				configurable: true
			},
			dpackBuffer: {
				get() {
					return source[targetSymbol].dpackBuffer;
				},
				set(value) {
					Object.defineProperty(this, "dpackBuffer", {
						value,
						writable: true,
						enumerable: true
					});
				},
				configurable: true
			},
			sizeTableBuffer: {
				get() {
					return source[sizeTableSymbol];
				},
				set(value) {
					Object.defineProperty(this, "sizeTableBuffer", {
						value,
						writable: true,
						enumerable: true
					});
				},
				configurable: true
			}
		});
		if (isArray) Object.define;
		return new Proxy(target, copyOnWriteHandler);
	}
	exports.copy = copy;
	var specialSetters = {};
	function getParsed(target) {
		var parsed = target.parsed;
		if (parsed) return parsed;
		var sizeTableBuffer = target.sizeTableBuffer;
		var dpackBuffer = target.dpackBuffer;
		if (!sizeTableBuffer) return target.parsed = parse(dpackBuffer, {
			freezeObjects,
			shared: target.shared
		});
		var totalSizeTableLength = sizeTableBuffer.length;
		var rootBlockLength;
		var type = sizeTableBuffer[0] >> 6;
		var offset;
		if (type === 2) {
			rootBlockLength = sizeTableBuffer.readUInt16BE(4);
			offset = 6;
		} else {
			rootBlockLength = sizeTableBuffer.readUIntBE(10, 6);
			offset = 16;
		}
		var childSizeTables = [];
		var childDpackBlocks = [];
		var dpackChildOffset = rootBlockLength;
		while (offset < totalSizeTableLength) {
			var type = sizeTableBuffer[offset] >> 6;
			var sizeTableLength;
			var dpackLength;
			if (type < 2) {
				if (type == 0) {
					sizeTableLength = 1;
					dpackLength = sizeTableBuffer[offset];
				} else {
					sizeTableLength = 2;
					dpackLength = sizeTableBuffer.readUInt16BE(offset) & 16383;
				}
			} else if (type === 2) {
				sizeTableLength = sizeTableBuffer.readUInt16BE(offset) & 16383;
				dpackLength = sizeTableBuffer.readUInt16BE(offset + 2);
			} else {
				sizeTableLength = sizeTableBuffer.readUInt32BE(offset) & 1073741823;
				dpackLength = sizeTableBuffer.readUIntBE(offset + 4, 6);
			}
			childSizeTables.push(type < 2 || type == 3 && sizeTableLength == 16 ? void 0 : sizeTableBuffer.slice(offset, offset + sizeTableLength));
			offset += sizeTableLength;
			childDpackBlocks.push(dpackBuffer.slice(dpackChildOffset, dpackChildOffset += dpackLength));
		}
		var blockIndex = 0;
		return target.parsed = parse(target.dpackBuffer.slice(0, rootBlockLength), childDpackBlocks.length > 0 ? {
			shared: target.shared,
			forDeferred: function(value, property) {
				let target = new value.constructor();
				target.dpackBuffer = childDpackBlocks[blockIndex];
				target.sizeTableBuffer = childSizeTables[blockIndex++];
				target.shared = property ? property.upgrade ? property : {
					code: property.code,
					key: null,
					type: property.type
				} : null;
				return new Proxy(target, onDemandHandler);
			},
			freezeObjects
		} : { shared: target.shared });
	}
	function getSerialized(target, shareProperty) {
		var childBlocks = [];
		var childSizeTables = [];
		var childDpackSizes = 0;
		var mustSequence;
		var serializerOptions = {
			forBlock: function(block, property) {
				var dpackBuffer = block[bufferSymbol](property, true);
				if (dpackBuffer.mustSequence) {
					mustSequence = true;
					childBlocks.push(dpackBuffer);
					return dpackBuffer;
				}
				var sizeTableBuffer = block[sizeTableSymbol];
				if (!sizeTableBuffer) {
					var bufferLength = dpackBuffer.length;
					if (bufferLength < 64) sizeTableBuffer = Buffer.from([bufferLength]);
					else if (bufferLength < 16384) sizeTableBuffer = Buffer.from([bufferLength >> 8 | 64, bufferLength & 255]);
					else {
						sizeTableBuffer = Buffer.allocUnsafe(16);
						sizeTableBuffer.writeUInt32BE(3221225488);
						sizeTableBuffer.writeUIntBE(bufferLength, 4, 6);
						sizeTableBuffer.writeUIntBE(bufferLength, 10, 6);
					}
				}
				childSizeTables.push(sizeTableBuffer);
				childDpackSizes += dpackBuffer.length;
				childBlocks.push(dpackBuffer);
				return dpackBuffer;
			},
			shared: shareProperty,
			freezeObjects
		};
		var rootBlock = serialize(target.parsed, serializerOptions);
		if (childBlocks.length == 0) return target.dpackBuffer = rootBlock;
		childBlocks.unshift(rootBlock);
		var dpackBuffer = target.dpackBuffer = Buffer.concat(childBlocks);
		if (mustSequence) return dpackBuffer;
		var ourSizeBlock = Buffer.allocUnsafe(dpackBuffer.length >= 65536 ? 16 : 6);
		childSizeTables.unshift(ourSizeBlock);
		ourSizeBlock = target.sizeTableBuffer = Buffer.concat(childSizeTables);
		if (dpackBuffer.length >= 65536) {
			ourSizeBlock.writeUInt32BE(ourSizeBlock.length + 3221225472, 0);
			ourSizeBlock.writeUIntBE(dpackBuffer.length, 4, 6);
			ourSizeBlock.writeUIntBE(rootBlock.length, 10, 6);
		} else {
			ourSizeBlock.writeUInt16BE(ourSizeBlock.length | 32768, 0);
			ourSizeBlock.writeUInt16BE(dpackBuffer.length, 2);
			ourSizeBlock.writeUInt16BE(rootBlock.length, 4);
		}
		return dpackBuffer;
	}
	var parse = require_parse().parse;
	require_shared().serializeSharedBlock;
	exports.parseLazy = function(buffer, options) {
		if (buffer[0] & 128 || buffer[0] >> 4 === 3 || buffer[0] === 119) return makeBlockFromBuffer(buffer, options && options.shared);
		else return parse(buffer, options);
	};
}));
//#endregion
//#region node_modules/@orama/plugin-data-persistence/dist/errors.js
var import_dpack = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	exports.createSerializeStream = require_serialize_stream().createSerializeStream;
	exports.createParseStream = require_parse_stream().createParseStream;
	var serialize = require_serialize();
	serialize.nodeCharEncoder = require_node_encoder().nodeCharEncoder;
	var parse = require_parse();
	require_Options().Options;
	exports.serialize = serialize.serialize;
	exports.parse = parse.parse;
	exports.createSerializer = serialize.createSerializer;
	exports.createParser = parse.createParser;
	var Block = require_Block();
	exports.parseLazy = Block.parseLazy;
	exports.asBlock = Block.asBlock;
	exports.isBlock = Block.isBlock;
	exports.copy = Block.copy;
	exports.reassignBuffers = Block.reassignBuffers;
	exports.createSharedStructure = require_shared().createSharedStructure;
	exports.readSharedStructure = require_shared().readSharedStructure;
})))(), 1);
function capitalize(word) {
	return `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`;
}
function UNSUPPORTED_FORMAT(format) {
	return `Unsupported serialization format: ${format}`;
}
function FILESYSTEM_NOT_SUPPORTED_ON_RUNTIME(runtime) {
	return `Filesystem access is not supported on ${capitalize(runtime)}`;
}
//#endregion
//#region node_modules/@orama/plugin-data-persistence/dist/utils.js
function detectRuntime() {
	/* c8 ignore next 11 */ if (typeof process !== "undefined" && process.versions !== void 0) return "node";
	else if (typeof Deno !== "undefined") return "deno";
	else if (typeof Bun !== "undefined") return "bun";
	else if (typeof window !== "undefined") return "browser";
	return "unknown";
}
//#endregion
//#region node_modules/seqproto/dist/esm/index.js
var TYPE_FLOAT = 0;
var TYPE_UINT32 = 1;
var TYPE_INT32 = 2;
var POW_2_32 = 2 ** 32;
function createDes(buffer) {
	const n32 = Math.floor(buffer.byteLength / 4);
	return {
		index: 0,
		buffer,
		uint32Array: new Uint32Array(buffer, 0, n32),
		float32Array: new Float32Array(buffer, 0, n32),
		setBuffer: function(buffer, byteOffset, byteLength) {
			if (typeof byteOffset === "number" && typeof byteLength === "number") {
				this.index = Math.floor(byteOffset / 4);
				const n32 = this.index + Math.ceil(byteLength / 4);
				this.buffer = buffer;
				this.uint32Array = new Uint32Array(buffer, 0, n32);
				this.float32Array = new Float32Array(buffer, 0, n32);
				return;
			}
			const n32 = Math.floor(buffer.byteLength / 4);
			this.buffer = buffer;
			this.index = 0;
			this.uint32Array = new Uint32Array(buffer, 0, n32);
			this.float32Array = new Float32Array(buffer, 0, n32);
		},
		deserializeBoolean,
		deserializeUInt32,
		deserializeFloat32,
		deserializeNumber,
		deserializeString,
		deserializeArray,
		deserializeIterable,
		getArrayElements,
		unsafeDeserializeUint32Array
	};
}
function deserializeBoolean() {
	return this.uint32Array[this.index++] === 1;
}
function deserializeUInt32() {
	return this.uint32Array[this.index++];
}
function deserializeFloat32() {
	return this.float32Array[this.index++];
}
function deserializeNumber() {
	const type = this.uint32Array[this.index++];
	if (type === TYPE_FLOAT) return this.deserializeFloat32();
	else if (type === TYPE_UINT32) return this.deserializeUInt32();
	else if (type === TYPE_INT32) return this.uint32Array[this.index++] - POW_2_32;
	else throw new Error("Unknown type");
}
new TextEncoder();
var textDecoder = new TextDecoder();
function deserializeString() {
	const len = this.uint32Array[this.index++];
	const decoded = textDecoder.decode(new Uint8Array(this.buffer, this.index * 4, len));
	this.index += Math.ceil(len / 4);
	return decoded;
}
function deserializeArray(deserialize) {
	const len = this.deserializeUInt32();
	const arr = new Array(len);
	for (let i = 0; i < len; i++) arr[i] = deserialize(this);
	return arr;
}
function deserializeIterable(deserialize) {
	const len = this.deserializeUInt32();
	const aGeneratorObject = (function* (des) {
		for (let i = 0; i < len; i++) yield deserialize(des);
	})(this);
	return { [Symbol.iterator]() {
		return aGeneratorObject;
	} };
}
function unsafeDeserializeUint32Array() {
	const byteLength = this.uint32Array[this.index++];
	const d = new Uint32Array(this.buffer, this.index * 4, byteLength);
	this.index += byteLength;
	return d;
}
function getArrayElements(indexes, deserialize) {
	const currentIndex = this.index + 1;
	const l = indexes.length;
	const arr = new Array(l);
	for (let i = 0; i < l; i++) {
		const indexOffset = currentIndex + indexes[i] * 2;
		const start = this.uint32Array[indexOffset];
		const end = this.uint32Array[indexOffset + 1];
		arr[i] = deserialize(this, start * 4, end);
	}
	return arr;
}
//#endregion
//#region node_modules/@orama/plugin-data-persistence/dist/seqproto.js
function deserializeStringArray(des) {
	const len = des.deserializeUInt32();
	const arr = new Array(len);
	for (let i = 0; i < len; i++) arr[i] = des.deserializeString();
	return arr;
}
function deserializeNumberArray(des) {
	const len = des.deserializeUInt32();
	const arr = new Array(len);
	for (let i = 0; i < len; i++) arr[i] = des.deserializeNumber();
	return arr;
}
function deserializeIndexNode(des) {
	const nodeType = des.deserializeUInt32();
	if (nodeType === 1) {
		const w = des.deserializeString();
		const s = des.deserializeString();
		const e = des.deserializeBoolean();
		const k = des.deserializeString();
		const d = deserializeNumberArray(des);
		const childrenLen = des.deserializeUInt32();
		const c = [];
		for (let i = 0; i < childrenLen; i++) {
			const key = des.deserializeString();
			const child = deserializeIndexNode(des);
			c.push([key, child]);
		}
		return {
			w: w || "",
			s: s || "",
			e,
			k: k || "",
			d,
			c
		};
	} else if (nodeType === 2) {
		const numberToDocumentIdLen = des.deserializeUInt32();
		const numberToDocumentId = [];
		for (let i = 0; i < numberToDocumentIdLen; i++) {
			const key = des.deserializeString();
			const ids = deserializeStringArray(des);
			numberToDocumentId.push([key, ids]);
		}
		return { numberToDocumentId };
	} else return deserializeValue(des);
}
function deserializeStringToNumberMap(des) {
	const len = des.deserializeUInt32();
	const map = {};
	for (let i = 0; i < len; i++) {
		const key = des.deserializeString();
		map[key] = des.deserializeNumber();
	}
	return map;
}
function deserializeFrequencies(des) {
	const fieldCount = des.deserializeUInt32();
	const frequencies = {};
	for (let i = 0; i < fieldCount; i++) {
		const field = des.deserializeString();
		const docCount = des.deserializeUInt32();
		const docFreqs = {};
		for (let j = 0; j < docCount; j++) {
			const docId = des.deserializeString();
			docFreqs[docId] = deserializeStringToNumberMap(des);
		}
		frequencies[field] = docFreqs;
	}
	return frequencies;
}
function deserializeTokenOccurrences(des) {
	const fieldCount = des.deserializeUInt32();
	const tokenOccurrences = {};
	for (let i = 0; i < fieldCount; i++) {
		const field = des.deserializeString();
		tokenOccurrences[field] = deserializeStringToNumberMap(des);
	}
	return tokenOccurrences;
}
function deserializeValue(des) {
	const type = des.deserializeUInt32();
	if (type === 0) return null;
	if (type === 1) return void 0;
	if (type === 2) return des.deserializeString();
	if (type === 3) return des.deserializeNumber();
	if (type === 4) return des.deserializeBoolean();
	if (type === 5) {
		const len = des.deserializeUInt32();
		const arr = new Array(len);
		for (let i = 0; i < len; i++) arr[i] = deserializeValue(des);
		return arr;
	}
	if (type === 6) {
		const len = des.deserializeUInt32();
		const obj = {};
		for (let i = 0; i < len; i++) {
			const key = des.deserializeString();
			obj[key] = deserializeValue(des);
		}
		return obj;
	}
	throw new Error(`Unknown type: ${type}`);
}
/**
* Deserialize a previously serialized snapshot with schema-aware deserialization.
*/ function deserializeOramaInstance(buffer) {
	const des = createDes(buffer);
	const version = des.deserializeUInt32();
	if (version === 1) return deserializeValue(des);
	if (version !== 2) throw new Error(`Unsupported seqproto Orama serialization version: ${version}`);
	const raw = {};
	const idStoreLen = des.deserializeUInt32();
	const internalIdToId = new Array(idStoreLen);
	for (let i = 0; i < idStoreLen; i++) internalIdToId[i] = des.deserializeString();
	raw.internalDocumentIDStore = { internalIdToId };
	const docCount = des.deserializeUInt32();
	const docsLength = des.deserializeUInt32();
	const docs = {};
	for (let i = 0; i < docsLength; i++) {
		const docId = des.deserializeString();
		const doc = {};
		const fieldCount = des.deserializeUInt32();
		for (let j = 0; j < fieldCount; j++) {
			const field = des.deserializeString();
			const arrayInfo = des.deserializeUInt32();
			if (arrayInfo & 2147483648) {
				const len = arrayInfo & 2147483647;
				const arr = new Array(len);
				for (let k = 0; k < len; k++) arr[k] = des.deserializeString();
				doc[field] = arr;
			} else doc[field] = des.deserializeString();
		}
		docs[docId] = doc;
	}
	raw.docs = {
		docs,
		count: docCount
	};
	const indexCount = des.deserializeUInt32();
	const indexes = {};
	for (let i = 0; i < indexCount; i++) {
		const key = des.deserializeString();
		const type = des.deserializeString();
		const isArray = des.deserializeBoolean();
		const nodeType = des.deserializeUInt32();
		let node;
		if (nodeType === 1) {
			const w = des.deserializeString();
			const s = des.deserializeString();
			const e = des.deserializeBoolean();
			const k = des.deserializeString();
			const dLen = des.deserializeUInt32();
			const d = new Array(dLen);
			for (let j = 0; j < dLen; j++) d[j] = des.deserializeNumber();
			const cLen = des.deserializeUInt32();
			const c = new Array(cLen);
			for (let j = 0; j < cLen; j++) {
				const cKey = des.deserializeString();
				const child = deserializeIndexNode(des);
				c[j] = [cKey, child];
			}
			node = {
				w,
				s,
				e,
				k,
				d,
				c
			};
		} else if (nodeType === 2) {
			const ntdiLen = des.deserializeUInt32();
			const numberToDocumentId = new Array(ntdiLen);
			for (let j = 0; j < ntdiLen; j++) {
				const key = des.deserializeString();
				const idsLen = des.deserializeUInt32();
				const ids = new Array(idsLen);
				for (let k = 0; k < idsLen; k++) ids[k] = des.deserializeString();
				numberToDocumentId[j] = [key, ids];
			}
			node = { numberToDocumentId };
		} else node = {};
		indexes[key] = {
			type,
			isArray,
			node
		};
	}
	const searchPropLen = des.deserializeUInt32();
	const searchableProperties = new Array(searchPropLen);
	for (let i = 0; i < searchPropLen; i++) searchableProperties[i] = des.deserializeString();
	const propsWithTypesLen = des.deserializeUInt32();
	const searchablePropertiesWithTypes = {};
	for (let i = 0; i < propsWithTypesLen; i++) {
		const key = des.deserializeString();
		searchablePropertiesWithTypes[key] = des.deserializeString();
	}
	const frequencies = deserializeFrequencies(des);
	const tokenOccurrences = deserializeTokenOccurrences(des);
	const avgFLLen = des.deserializeUInt32();
	const avgFieldLength = {};
	for (let i = 0; i < avgFLLen; i++) {
		const key = des.deserializeString();
		avgFieldLength[key] = des.deserializeNumber();
	}
	const fieldLengthsLen = des.deserializeUInt32();
	const fieldLengths = {};
	for (let i = 0; i < fieldLengthsLen; i++) {
		const field = des.deserializeString();
		const dataLen = des.deserializeUInt32();
		const fieldData = {};
		for (let j = 0; j < dataLen; j++) {
			const key = des.deserializeString();
			fieldData[key] = des.deserializeNumber();
		}
		fieldLengths[field] = fieldData;
	}
	raw.index = {
		indexes,
		vectorIndexes: {},
		searchableProperties,
		searchablePropertiesWithTypes,
		frequencies,
		tokenOccurrences,
		avgFieldLength,
		fieldLengths
	};
	raw.language = des.deserializeString();
	const pinningRulesLen = des.deserializeUInt32();
	const pinningRules = new Array(pinningRulesLen);
	for (let i = 0; i < pinningRulesLen; i++) {
		const ruleId = des.deserializeString();
		const rule = deserializeValue(des);
		pinningRules[i] = [ruleId, rule];
	}
	raw.pinning = { rules: pinningRules };
	raw.sorting = {};
	return raw;
}
//#endregion
//#region node_modules/@orama/plugin-data-persistence/dist/index.js
var hexFromMap = {
	0: 0,
	1: 1,
	2: 2,
	3: 3,
	4: 4,
	5: 5,
	6: 6,
	7: 7,
	8: 8,
	9: 9,
	a: 10,
	b: 11,
	c: 12,
	d: 13,
	e: 14,
	f: 15
};
Object.keys(hexFromMap);
/* c8 ignore next 13 */ function slowHexToBuffer(hex) {
	const bytes = new Uint8Array(Math.floor(hex.length / 2));
	hex = hex.toLowerCase();
	for (let i = 0; i < hex.length; i++) {
		const a = hexFromMap[hex[i * 2]];
		const b = hexFromMap[hex[i * 2 + 1]];
		if (a === void 0 || b === void 0) break;
		bytes[i] = a << 4 | b;
	}
	return bytes;
}
async function restore(format, data, runtime) {
	if (!runtime) runtime = detectRuntime();
	const db = create({ schema: { __placeholder: "string" } });
	let deserialized;
	switch (format) {
		case "json":
			deserialized = JSON.parse(data.toString());
			break;
		case "dpack":
			deserialized = import_dpack.parse(data);
			break;
		case "binary":
			if (runtime === "node") data = Buffer.from(data.toString(), "hex");
			else data = slowHexToBuffer(data);
			deserialized = decode(data);
			break;
		case "seqproto":
			{
				let ab;
				if (data instanceof ArrayBuffer) ab = data;
				else if (ArrayBuffer.isView(data)) {
					const view = data;
					const slice = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
					const copy = new Uint8Array(view.byteLength);
					copy.set(new Uint8Array(slice));
					ab = copy.buffer;
				} else if (typeof data === "string") {
					const buf = Buffer.from(data, "binary");
					const slice = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
					const copy = new Uint8Array(buf.byteLength);
					copy.set(new Uint8Array(slice));
					ab = copy.buffer;
				} else throw new Error("Unsupported data type for seqproto restore");
				deserialized = deserializeOramaInstance(ab);
			}
			break;
		default: throw new Error(UNSUPPORTED_FORMAT(format));
	}
	load(db, deserialized);
	return db;
}
//#endregion
//#region node_modules/@orama/plugin-data-persistence/dist/server.js
var DEFAULT_DB_NAME = `orama_bump_${+/* @__PURE__ */ new Date()}`;
var _fs;
async function restoreFromFile(format = "binary", path, runtime) {
	if (!runtime) runtime = detectRuntime();
	if (!_fs) _fs = await loadFileSystem(runtime);
	if (!path) path = await getDefaultOutputFilename(format, runtime);
	const data = await _fs.readFile(path);
	if (format === "binary" && data instanceof Buffer) return restoreFromBinaryData(data, runtime);
	return restore(format, data, runtime);
}
async function loadFileSystem(runtime) {
	switch (runtime) {
		case "node": {
			const { readFile, writeFile } = await Promise.resolve().then(() => /* @__PURE__ */ __toESM(require("node:fs/promises"), 1));
			const { resolve } = await Promise.resolve().then(() => /* @__PURE__ */ __toESM(require("node:path"), 1));
			return {
				cwd: process.cwd,
				resolve,
				readFile,
				writeFile
			};
		}
		/* c8 ignore next 13 */ case "deno": {
			const { resolve } = await Promise.resolve().then(() => /* @__PURE__ */ __toESM(require(
				/* webpackIgnore: true */
				"https://deno.land/std/path/mod.ts"
			), 1));
			const { cwd, readTextFile: readFile, writeTextFile: writeFile } = Deno;
			return {
				cwd,
				resolve,
				readFile,
				writeFile
			};
		}
		default: throw new Error(FILESYSTEM_NOT_SUPPORTED_ON_RUNTIME(runtime));
	}
}
async function getDefaultOutputFilename(format, runtime) {
	if (!_fs) _fs = await loadFileSystem(runtime);
	return _fs.resolve(_fs.cwd(), await getDefaultFileName(format, runtime));
}
async function getDefaultFileName(format, runtime) {
	if (!runtime) runtime = detectRuntime();
	let extension;
	switch (format) {
		case "json":
			extension = "json";
			break;
		case "dpack":
			extension = "dpack";
			break;
		case "binary":
			extension = "msp";
			break;
		case "seqproto":
			extension = "seqp";
			break;
		default: extension = "dump";
	}
	let dbName = DEFAULT_DB_NAME;
	/* c8 ignore next 3 */ if (runtime === "deno") dbName = Deno.env.get("ORAMA_DB_NAME") ?? DEFAULT_DB_NAME;
	else dbName = process?.env?.ORAMA_DB_NAME ?? DEFAULT_DB_NAME;
	return `${dbName}.${extension}`;
}
async function restoreFromBinaryData(data, runtime) {
	const db = create({ schema: { __placeholder: "string" } });
	load(db, decode(data));
	return db;
}
//#endregion
//#region node_modules/@orama/stemmers/dist/de.js
function r() {
	this.p = function(r) {
		this.j = r, this.cursor = 0, this.a = this.j.length, this.f = 0, this.c = this.cursor, this.d = this.a;
	}, this.z = function() {
		return this.j;
	}, this.w = function(r) {
		this.j = r.j, this.cursor = r.cursor, this.a = r.a, this.f = r.f, this.c = r.c, this.d = r.d;
	}, this.i = function(r, s, t) {
		if (this.cursor >= this.a) return !1;
		var i = this.j.charCodeAt(this.cursor);
		return !(i > t) && !(i < s) && 0 != (r[(i -= s) >>> 3] & 1 << (7 & i)) && (this.cursor++, !0);
	}, this.n = function(r, s, t) {
		if (this.cursor <= this.f) return !1;
		var i = this.j.charCodeAt(this.cursor - 1);
		return !(i > t) && !(i < s) && 0 != (r[(i -= s) >>> 3] & 1 << (7 & i)) && (this.cursor--, !0);
	}, this.k = function(r, s, t) {
		if (this.cursor >= this.a) return !1;
		var i = this.j.charCodeAt(this.cursor);
		return i > t || i < s ? (this.cursor++, !0) : 0 == (r[(i -= s) >>> 3] & 1 << (7 & i)) && (this.cursor++, !0);
	}, this.q = function(r, s, t) {
		if (this.cursor <= this.f) return !1;
		var i = this.j.charCodeAt(this.cursor - 1);
		return i > t || i < s ? (this.cursor--, !0) : 0 == (r[(i -= s) >>> 3] & 1 << (7 & i)) && (this.cursor--, !0);
	}, this.m = function(r) {
		return !(this.a - this.cursor < r.length) && this.j.slice(this.cursor, this.cursor + r.length) == r && (this.cursor += r.length, !0);
	}, this.g = function(r) {
		return !(this.cursor - this.f < r.length) && this.j.slice(this.cursor - r.length, this.cursor) == r && (this.cursor -= r.length, !0);
	}, this.o = function(r) {
		for (var s = 0, t = r.length, i = this.cursor, c = this.a, u = 0, o = 0, e = !1;;) {
			var h, n = s + (t - s >>> 1), a = 0, f = u < o ? u : o, b = r[n];
			for (h = f; h < b[0].length; h++) {
				if (i + f == c) {
					a = -1;
					break;
				}
				if (0 != (a = this.j.charCodeAt(i + f) - b[0].charCodeAt(h))) break;
				f++;
			}
			if (0 > a ? (t = n, o = f) : (s = n, u = f), 1 >= t - s) {
				if (0 < s || t == s || e) break;
				e = !0;
			}
		}
		for (;;) {
			if (u >= (b = r[s])[0].length && (this.cursor = i + b[0].length, 4 > b.length || (s = b[3](this), this.cursor = i + b[0].length, s))) return b[2];
			if (0 > (s = b[1])) return 0;
		}
	}, this.h = function(r) {
		for (var s = 0, t = r.length, i = this.cursor, c = this.f, u = 0, o = 0, e = !1;;) {
			var h, n = s + (t - s >> 1), a = 0, f = u < o ? u : o, b = r[n];
			for (h = b[0].length - 1 - f; 0 <= h; h--) {
				if (i - f == c) {
					a = -1;
					break;
				}
				if (0 != (a = this.j.charCodeAt(i - 1 - f) - b[0].charCodeAt(h))) break;
				f++;
			}
			if (0 > a ? (t = n, o = f) : (s = n, u = f), 1 >= t - s) {
				if (0 < s || t == s || e) break;
				e = !0;
			}
		}
		for (;;) {
			if (u >= (b = r[s])[0].length && (this.cursor = i - b[0].length, 4 > b.length || (s = b[3](this), this.cursor = i - b[0].length, s))) return b[2];
			if (0 > (s = b[1])) return 0;
		}
	}, this.s = function(r, s, t) {
		var i = t.length - (s - r);
		return this.j = this.j.slice(0, r) + t + this.j.slice(s), this.a += i, this.cursor >= s ? this.cursor += i : this.cursor > r && (this.cursor = r), i;
	}, this.t = function() {
		return !(0 > this.c) && !(this.c > this.d) && !(this.d > this.a) && !(this.a > this.j.length);
	}, this.b = function(r) {
		var s = !1;
		return this.t() && (this.s(this.c, this.d, r), s = !0), s;
	}, this.e = function() {
		return this.b("");
	}, this.r = function(r, s, t) {
		s = this.s(r, s, t), r <= this.c && (this.c += s), r <= this.d && (this.d += s);
	}, this.u = function() {
		var r = "";
		return this.t() && (r = this.j.slice(this.c, this.d)), r;
	}, this.v = function() {
		return this.j.slice(0, this.a);
	};
}
var s = new function() {
	var s = new r(), t = [
		[
			"",
			-1,
			5
		],
		[
			"U",
			0,
			2
		],
		[
			"Y",
			0,
			1
		],
		[
			"ä",
			0,
			3
		],
		[
			"ö",
			0,
			4
		],
		[
			"ü",
			0,
			2
		]
	], i = [
		[
			"e",
			-1,
			2
		],
		[
			"em",
			-1,
			1
		],
		[
			"en",
			-1,
			2
		],
		[
			"ern",
			-1,
			1
		],
		[
			"er",
			-1,
			1
		],
		[
			"s",
			-1,
			3
		],
		[
			"es",
			5,
			2
		]
	], c = [
		[
			"en",
			-1,
			1
		],
		[
			"er",
			-1,
			1
		],
		[
			"st",
			-1,
			2
		],
		[
			"est",
			2,
			1
		]
	], u = [[
		"ig",
		-1,
		1
	], [
		"lich",
		-1,
		1
	]], o = [
		[
			"end",
			-1,
			1
		],
		[
			"ig",
			-1,
			2
		],
		[
			"ung",
			-1,
			1
		],
		[
			"lich",
			-1,
			3
		],
		[
			"isch",
			-1,
			2
		],
		[
			"ik",
			-1,
			2
		],
		[
			"heit",
			-1,
			3
		],
		[
			"keit",
			-1,
			4
		]
	], e = [
		17,
		65,
		16,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		8,
		0,
		32,
		8
	], h = [
		117,
		30,
		5
	], n = [
		117,
		30,
		4
	], a = 0, f = 0, b = 0;
	this.l = function() {
		var r = s.cursor;
		return function() {
			for (var r = s.cursor;;) {
				var t = s.cursor;
				r: {
					s: {
						var i = s.cursor;
						if (s.c = s.cursor, s.m("ß")) {
							if (s.d = s.cursor, !s.b("ss")) return;
							break s;
						}
						if (s.cursor = i, s.cursor >= s.a) break r;
						s.cursor++;
					}
					continue;
				}
				s.cursor = t;
				break;
			}
			for (s.cursor = r;;) {
				r = s.cursor;
				r: {
					for (;;) {
						t = s.cursor;
						t: if (s.i(e, 97, 252)) {
							s.c = s.cursor;
							i: {
								if (i = s.cursor, s.m("u") && (s.d = s.cursor, s.i(e, 97, 252))) {
									if (!s.b("U")) return;
									break i;
								}
								if (s.cursor = i, !s.m("y") || (s.d = s.cursor, !s.i(e, 97, 252))) break t;
								if (!s.b("Y")) return;
							}
							s.cursor = t;
							break;
						}
						if (s.cursor = t, s.cursor >= s.a) break r;
						s.cursor++;
					}
					continue;
				}
				s.cursor = r;
				break;
			}
		}(), s.cursor = r, r = s.cursor, function() {
			f = b = s.a;
			var r = s.cursor, t = s.cursor + 3;
			if (!(t > s.a)) {
				for (s.cursor = t, a = s.cursor, s.cursor = r; !s.i(e, 97, 252);) {
					if (s.cursor >= s.a) return;
					s.cursor++;
				}
				for (; !s.k(e, 97, 252);) {
					if (s.cursor >= s.a) return;
					s.cursor++;
				}
				for ((b = s.cursor) < a && (b = a); !s.i(e, 97, 252);) {
					if (s.cursor >= s.a) return;
					s.cursor++;
				}
				for (; !s.k(e, 97, 252);) {
					if (s.cursor >= s.a) return;
					s.cursor++;
				}
				f = s.cursor;
			}
		}(), s.cursor = r, s.f = s.cursor, s.cursor = s.a, function() {
			var r, t = s.a - s.cursor;
			r: if (s.d = s.cursor, 0 != (r = s.h(i)) && (s.c = s.cursor, b <= s.cursor)) switch (r) {
				case 1:
					if (!s.e()) return;
					break;
				case 2:
					if (!s.e()) return;
					if (r = s.a - s.cursor, s.d = s.cursor, s.g("s")) if (s.c = s.cursor, s.g("nis")) {
						if (!s.e()) return;
					} else s.cursor = s.a - r;
					else s.cursor = s.a - r;
					break;
				case 3:
					if (!s.n(h, 98, 116)) break r;
					if (!s.e()) return;
			}
			s.cursor = s.a - t, t = s.a - s.cursor;
			r: if (s.d = s.cursor, 0 != (r = s.h(c)) && (s.c = s.cursor, b <= s.cursor)) switch (r) {
				case 1:
					if (!s.e()) return;
					break;
				case 2:
					if (!s.n(n, 98, 116) || (r = s.cursor - 3) < s.f) break r;
					if (s.cursor = r, !s.e()) return;
			}
			s.cursor = s.a - t, t = s.a - s.cursor;
			r: if (s.d = s.cursor, 0 != (r = s.h(o)) && (s.c = s.cursor, f <= s.cursor)) switch (r) {
				case 1:
					if (!s.e()) return;
					r = s.a - s.cursor;
					s: if (s.d = s.cursor, s.g("ig")) {
						s.c = s.cursor;
						var e = s.a - s.cursor;
						if (s.g("e")) {
							s.cursor = s.a - r;
							break s;
						}
						if (s.cursor = s.a - e, f <= s.cursor) {
							if (!s.e()) return;
						} else s.cursor = s.a - r;
					} else s.cursor = s.a - r;
					break;
				case 2:
					if (r = s.a - s.cursor, s.g("e")) break r;
					if (s.cursor = s.a - r, !s.e()) return;
					break;
				case 3:
					if (!s.e()) return;
					r = s.a - s.cursor;
					s: {
						if ((s.d = s.cursor, e = s.a - s.cursor, !s.g("er")) && (s.cursor = s.a - e, !s.g("en"))) {
							s.cursor = s.a - r;
							break s;
						}
						if (s.c = s.cursor, b <= s.cursor) {
							if (!s.e()) return;
						} else s.cursor = s.a - r;
					}
					break;
				case 4:
					if (!s.e()) return;
					if (r = s.a - s.cursor, s.d = s.cursor, 0 == s.h(u)) s.cursor = s.a - r;
					else if (s.c = s.cursor, f <= s.cursor) {
						if (!s.e()) return;
					} else s.cursor = s.a - r;
			}
			s.cursor = s.a - t;
		}(), s.cursor = s.f, r = s.cursor, function() {
			for (var r;;) {
				var i = s.cursor;
				r: if (s.c = s.cursor, 0 != (r = s.o(t))) {
					switch (s.d = s.cursor, r) {
						case 1:
							if (!s.b("y")) return;
							break;
						case 2:
							if (!s.b("u")) return;
							break;
						case 3:
							if (!s.b("a")) return;
							break;
						case 4:
							if (!s.b("o")) return;
							break;
						case 5:
							if (s.cursor >= s.a) break r;
							s.cursor++;
					}
					continue;
				}
				s.cursor = i;
				break;
			}
		}(), s.cursor = r, !0;
	}, this.stemWord = function(r) {
		return s.p(r), this.l(), s.j;
	};
}();
function stemmer(r) {
	return s.stemWord(r);
}
var GERMAN_TOKENIZER = {
	stemming: true,
	stemmer,
	language: "german",
	stopWords: [
		"der",
		"die",
		"das",
		"des",
		"dem",
		"den",
		"ein",
		"eine",
		"einer",
		"eines",
		"einem",
		"einen",
		"und",
		"oder",
		"aber",
		"sowie",
		"sowohl",
		"weder",
		"noch",
		"hinter",
		"vor",
		"über",
		"unter",
		"zwischen",
		"neben",
		"an",
		"auf",
		"in",
		"im",
		"am",
		"zu",
		"zum",
		"zur",
		"für",
		"von",
		"vom",
		"mit",
		"bei",
		"aus",
		"nach",
		"durch",
		"gegen",
		"ohne",
		"bis",
		"seit",
		"während",
		"wegen",
		"trotz",
		"innerhalb",
		"außerhalb",
		"oberhalb",
		"unterhalb",
		"ist",
		"sind",
		"war",
		"waren",
		"wird",
		"werden",
		"wurde",
		"wurden",
		"hat",
		"haben",
		"hatte",
		"hatten",
		"kann",
		"können",
		"muss",
		"müssen",
		"soll",
		"sollen",
		"darf",
		"dürfen",
		"sich",
		"als",
		"wie",
		"so",
		"nicht",
		"kein",
		"keine",
		"auch",
		"nur",
		"noch",
		"schon",
		"dass",
		"daß",
		"diese",
		"dieser",
		"dieses",
		"diesem",
		"diesen",
		"jene",
		"jener",
		"jenes"
	]
};
var TEXT_SCHEMA = {
	rowId: "string",
	seitencode: "string",
	sektionNr: "string",
	sektion: "string",
	titel: "string",
	tags: "string[]",
	notePath: "string",
	bilddatei: "string",
	kind: "enum",
	text: "string"
};
async function loadTextIndex(indexPath) {
	const exported = await save(await restoreFromFile("binary", indexPath, "node"));
	const db = await create({
		schema: TEXT_SCHEMA,
		components: { tokenizer: GERMAN_TOKENIZER }
	});
	await load(db, exported);
	return db;
}
async function loadVectorShard(indexPath) {
	return await restoreFromFile("binary", indexPath, "node");
}
//#endregion
//#region src/retrieval/index-cache.ts
var cachedKey = null;
var cachedPromise = null;
async function loadIndices(pluginDir, manifest) {
	const textDb = await loadTextIndex(`${pluginDir}/${manifest.textIndexFile}`);
	const vectorDbs = await Promise.all(Array.from({ length: manifest.vectorShardCount }, (_, i) => loadVectorShard(`${pluginDir}/${manifest.vectorIndexFilePattern.replace("{i}", String(i))}`)));
	const referenceChunksRaw = JSON.parse((0, node_fs.readFileSync)(`${pluginDir}/${manifest.referenceChunksFile}`, "utf-8"));
	return {
		textDb,
		vectorDbs,
		referenceChunks: new Map(Object.entries(referenceChunksRaw))
	};
}
async function getIndices(pluginDir, manifest) {
	const key = {
		pluginDir,
		corpusHash: manifest.corpusHash
	};
	const sameKey = cachedKey !== null && cachedKey.pluginDir === key.pluginDir && cachedKey.corpusHash === key.corpusHash;
	if (cachedPromise && sameKey) return cachedPromise;
	cachedKey = key;
	const promise = loadIndices(pluginDir, manifest).catch((err) => {
		if (cachedPromise === promise) {
			cachedKey = null;
			cachedPromise = null;
		}
		throw err;
	});
	cachedPromise = promise;
	return promise;
}
function clearIndicesCache() {
	cachedKey = null;
	cachedPromise = null;
}
//#endregion
//#region src/stt/recorder.ts
var CANDIDATE_MIME_TYPES = [
	"audio/webm;codecs=opus",
	"audio/webm",
	"audio/ogg;codecs=opus"
];
function pickSupportedMimeType() {
	if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return void 0;
	return CANDIDATE_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}
/**
* Records microphone audio for a push-to-talk style workflow: call start(), then
* later stop() to get the recorded clip. Safe to call stop() even if start()'s
* getUserMedia permission prompt hasn't resolved yet (e.g. a very quick tap).
*/
var MicRecorder = class {
	constructor() {
		this.stream = null;
		this.mediaRecorder = null;
		this.chunks = [];
		this.startPromise = null;
		this.stopRequested = false;
	}
	async start(deviceId) {
		if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mikrofonzugriff wird von dieser Umgebung nicht unterstützt.");
		const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
		this.startPromise = (async () => {
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			if (this.stopRequested) {
				for (const track of stream.getTracks()) track.stop();
				return;
			}
			this.stream = stream;
			const mimeType = pickSupportedMimeType();
			this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : void 0);
			this.chunks = [];
			this.mediaRecorder.ondataavailable = (evt) => {
				if (evt.data && evt.data.size > 0) this.chunks.push(evt.data);
			};
			this.mediaRecorder.start();
		})();
		return this.startPromise;
	}
	/** Stops recording (if started) and releases the microphone. Returns the recorded clip, or null if nothing was recorded. */
	async stop() {
		this.stopRequested = true;
		if (this.startPromise) await this.startPromise.catch(() => void 0);
		const recorder = this.mediaRecorder;
		const stream = this.stream;
		this.mediaRecorder = null;
		this.stream = null;
		if (!recorder || recorder.state === "inactive") {
			if (stream) for (const track of stream.getTracks()) track.stop();
			return null;
		}
		const blob = await new Promise((resolve) => {
			recorder.addEventListener("stop", () => resolve(new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" })), { once: true });
			recorder.stop();
		});
		if (stream) for (const track of stream.getTracks()) track.stop();
		return blob;
	}
};
//#endregion
//#region src/stt/wav-encode.ts
/**
* Decodes a recorded audio Blob (typically audio/webm from MediaRecorder) and re-encodes it
* as 16-bit PCM WAV, base64-encoded. Gemini's documented inline-audio mime types are
* wav/mp3/aiff/aac/ogg/flac - not webm - so recorder output is normalized here before upload.
*/
async function blobToWavBase64(blob) {
	const arrayBuffer = await blob.arrayBuffer();
	const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
	if (!AudioContextCtor) throw new Error("AudioContext wird von dieser Umgebung nicht unterstützt.");
	const audioContext = new AudioContextCtor();
	try {
		return {
			base64: arrayBufferToBase64(encodeWav(await audioContext.decodeAudioData(arrayBuffer))),
			mimeType: "audio/wav"
		};
	} finally {
		audioContext.close();
	}
}
function encodeWav(audioBuffer) {
	const numChannels = audioBuffer.numberOfChannels;
	const sampleRate = audioBuffer.sampleRate;
	const numFrames = audioBuffer.length;
	const blockAlign = numChannels * 2;
	const dataSize = numFrames * blockAlign;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	writeAscii(view, 0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeAscii(view, 8, "WAVE");
	writeAscii(view, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * blockAlign, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, 16, true);
	writeAscii(view, 36, "data");
	view.setUint32(40, dataSize, true);
	const channelData = [];
	for (let ch = 0; ch < numChannels; ch++) channelData.push(audioBuffer.getChannelData(ch));
	let offset = 44;
	for (let i = 0; i < numFrames; i++) for (let ch = 0; ch < numChannels; ch++) {
		const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
		view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
		offset += 2;
	}
	return buffer;
}
function writeAscii(view, offset, text) {
	for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	const chunkSize = 32768;
	for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	return btoa(binary);
}
//#endregion
//#region src/agent/step-reporter.ts
function createStepReporter(onStep) {
	let counter = 0;
	const start = (input) => {
		const step = {
			id: `step-${++counter}`,
			status: "running",
			startedAt: Date.now(),
			...input
		};
		onStep?.(step);
		return step;
	};
	const update = (step, patch) => {
		Object.assign(step, patch);
		onStep?.(step);
	};
	const finish = (step, patch) => {
		if (patch) Object.assign(step, patch);
		step.status = "done";
		step.finishedAt = Date.now();
		step.durationMs = step.finishedAt - step.startedAt;
		onStep?.(step);
	};
	const fail = (step, errorMessage) => {
		step.status = "error";
		step.errorMessage = errorMessage;
		step.finishedAt = Date.now();
		step.durationMs = step.finishedAt - step.startedAt;
		onStep?.(step);
	};
	const record = (input) => {
		const step = start(input);
		finish(step);
		return step;
	};
	return {
		start,
		update,
		finish,
		fail,
		record
	};
}
var NOOP_STEP_REPORTER = createStepReporter();
//#endregion
//#region src/agent/status-text.ts
function mergeGrounding(map, chunks) {
	for (const c of chunks) if (c.uri) map.set(c.uri, c);
}
function describeCall(fc) {
	switch (fc.name) {
		case "search_manual": return `durchsuche Handbuch nach "${String(fc.args?.query ?? "")}"`;
		case "search_manual_fuzzy": return `durchsuche Handbuch (tippfehlertolerant) nach "${String(fc.args?.query ?? "")}"`;
		case "get_manual_page": return `hole Seite ${String(fc.args?.seitencode ?? fc.args?.notePath ?? "")}`;
		default: return `führe ${fc.name} aus`;
	}
}
function extractToolHits(response) {
	if (!Array.isArray(response.hits)) return void 0;
	return response.hits.map((h) => ({
		seitencode: h.seitencode,
		sektion: h.sektion,
		titel: h.titel
	}));
}
function describeToolNarration(fc, response) {
	if (typeof response.error === "string") return `Fehler bei ${fc.name}: ${response.error}`;
	switch (fc.name) {
		case "search_manual":
		case "search_manual_fuzzy": {
			const hits = Array.isArray(response.hits) ? response.hits : [];
			if (hits.length === 0) return "Keine Treffer im Handbuch gefunden.";
			const list = hits.map((h) => `${h.titel} [${h.seitencode || "Referenz"}]`).join(", ");
			return `${hits.length} Treffer gefunden: ${list}.`;
		}
		case "get_manual_page": {
			const seitencode = String(response.seitencode ?? "");
			const titel = String(response.titel ?? "");
			const fullText = typeof response.fullText === "string" ? response.fullText : "";
			return `Seite "${titel}"${seitencode ? ` [${seitencode}]` : ""} vollständig geladen (${fullText.length} Zeichen).`;
		}
		default: return `Werkzeug ${fc.name} ausgeführt.`;
	}
}
function describeEmbedding(model, outputDim) {
	return `Such-Embedding mit Modell "${model}" erzeugt (${outputDim} Dimensionen).`;
}
function describeRetrieval(query, hitCount, usedFuzzy) {
	return `${usedFuzzy ? "Hybrid-Suche (Volltext + Vektor), kombiniert mit tippfehlertoleranter Suche" : "Hybrid-Suche (Volltext + Vektor)"} nach "${query}": ${hitCount} Seite(n)/Abschnitt(e) gefunden.`;
}
function describeRoundDecision(round, maxRounds, functionCalls) {
	if (functionCalls.length === 0) return `Runde ${round}/${maxRounds}: Modell hat genug Informationen und antwortet direkt, ohne weitere Werkzeugaufrufe.`;
	const names = functionCalls.map((fc) => fc.name).join(", ");
	return `Runde ${round}/${maxRounds}: Modell entscheidet sich für ${functionCalls.length} Werkzeugaufruf(e): ${names}.`;
}
function describeClarification(question, batchedToolNames) {
	if (batchedToolNames.length === 0) return `Modell stellt eine Rückfrage: "${question}"`;
	return `Modell stellt eine Rückfrage: "${question}" (zusätzlich in derselben Runde ausgeführt: ${batchedToolNames.join(", ")}).`;
}
function describeBudgetExhausted(round, maxRounds) {
	return `Werkzeug-Budget erreicht (${round}/${maxRounds} Runden) - erstelle abschließende Antwort ohne weitere Werkzeugaufrufe.`;
}
function describeFinalAnswer(text, manualCitations, webCitations) {
	return `Antwort erstellt (${text.trim().length} Zeichen) mit ${manualCitations.length} Handbuch-Zitat(en) und ${webCitations.length} Web-Zitat(en).`;
}
//#endregion
//#region src/gemini/history.ts
function buildHistoryContents(history) {
	return history.map((t) => ({
		...t,
		text: t.text.trim()
	})).filter((t) => t.text.length > 0).map((t) => ({
		role: t.role === "assistant" ? "model" : "user",
		parts: [{ text: t.text }]
	}));
}
//#endregion
//#region src/gemini/transcript-block.ts
var TRANSCRIPT_START = "%%%TRANSCRIPT_START%%%";
var TRANSCRIPT_END = "%%%TRANSCRIPT_END%%%";
function splitTranscriptBlock(text) {
	const startIdx = text.indexOf(TRANSCRIPT_START);
	if (startIdx === -1) return { transcriptComplete: false };
	const endIdx = text.indexOf(TRANSCRIPT_END, startIdx + 22);
	if (endIdx === -1) return { transcriptComplete: false };
	return {
		transcript: text.slice(startIdx + 22, endIdx).trim(),
		transcriptComplete: true
	};
}
function extractFinalTranscript(fullText) {
	const block = splitTranscriptBlock(fullText);
	if (block.transcriptComplete) return block.transcript ?? "";
	return fullText.trim();
}
//#endregion
//#region src/agent/audio-turn.ts
var AUDIO_TURN_INSTRUCTION = `Transkribiere zuerst wortwörtlich das gesprochene Audio, in der Originalsprache. Gib NUR das Transkript aus, eingeschlossen in ${TRANSCRIPT_START} und ${TRANSCRIPT_END} - keine Anführungszeichen, keine Kommentare, keine Zusätze. Ist kein verständliches Audio zu erkennen, lass den Inhalt zwischen den Markern leer. Beantworte die Frage in dieser Runde noch NICHT - dir fehlt dafür noch der Handbuchkontext, der dir gleich in der nächsten Runde zugeführt wird. Tätige in dieser Runde keinen Funktionsaufruf.`;
function buildAudioInitialState(base64Audio, mimeType, history) {
	return {
		contents: [...buildHistoryContents(history), {
			role: "user",
			parts: [{ inlineData: {
				mimeType,
				data: base64Audio
			} }, { text: AUDIO_TURN_INSTRUCTION }]
		}],
		round: 0,
		manualPages: /* @__PURE__ */ new Map(),
		webCitations: /* @__PURE__ */ new Map()
	};
}
//#endregion
//#region src/gemini/answer-blocks.ts
var SHORT_ANSWER_START = "%%%SHORT_ANSWER_START%%%";
var SHORT_ANSWER_END = "%%%SHORT_ANSWER_END%%%";
var ANSWER_START = "%%%ANSWER_START%%%";
var ANSWER_END = "%%%ANSWER_END%%%";
function stripAnswerMarkers(text) {
	return text.replace(ANSWER_START, "").replace(ANSWER_END, "").trim();
}
function removeAll(text, marker) {
	return text.split(marker).join("");
}
function stripAllMarkers(text) {
	return [
		SHORT_ANSWER_START,
		SHORT_ANSWER_END,
		ANSWER_START,
		ANSWER_END
	].reduce(removeAll, text).trim();
}
function splitAnswerBlocks(text) {
	const shortStartIdx = text.indexOf(SHORT_ANSWER_START);
	if (shortStartIdx === -1) return {
		shortAnswerComplete: false,
		answer: stripAnswerMarkers(text)
	};
	const shortEndIdx = text.indexOf(SHORT_ANSWER_END, shortStartIdx + 24);
	if (shortEndIdx === -1) return {
		shortAnswerComplete: false,
		answer: ""
	};
	return {
		shortAnswer: text.slice(shortStartIdx + 24, shortEndIdx).trim(),
		shortAnswerComplete: true,
		answer: stripAnswerMarkers(text.slice(shortEndIdx + 22))
	};
}
function extractFinalAnswer(fullText) {
	const blocks = splitAnswerBlocks(fullText);
	if (blocks.shortAnswerComplete) return {
		text: blocks.answer,
		shortAnswer: blocks.shortAnswer
	};
	return { text: stripAllMarkers(fullText) };
}
//#endregion
//#region src/retrieval/context-xml.ts
function escapeXml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function buildContextXml(blocks) {
	return `<context>\n${blocks.map((b) => `<document source="${escapeXml(b.notePath)}" seitencode="${escapeXml(b.seitencode)}" sektion="${escapeXml(b.sektion)}" titel="${escapeXml(b.titel)}">\n${escapeXml(b.fullText)}\n</document>`).join("\n\n")}\n</context>`;
}
//#endregion
//#region src/agent/conversation.ts
function buildInitialState(question, history, baselineBlocks) {
	const manualPages = /* @__PURE__ */ new Map();
	for (const b of baselineBlocks) manualPages.set(b.notePath, b);
	const contextXml = buildContextXml(baselineBlocks);
	return {
		contents: [...buildHistoryContents(history), {
			role: "user",
			parts: [{ text: `${contextXml}\n\n<question>\n${escapeXml(question)}\n</question>` }]
		}],
		round: 0,
		manualPages,
		webCitations: /* @__PURE__ */ new Map()
	};
}
function cloneState(state) {
	return {
		contents: [...state.contents],
		round: state.round,
		manualPages: new Map(state.manualPages),
		webCitations: new Map(state.webCitations)
	};
}
function appendClarificationAnswer(state, userAnswer, callId) {
	state.contents.push({
		role: "user",
		parts: [{ functionResponse: {
			...callId ? { id: callId } : {},
			name: "ask_user",
			response: { answer: userAnswer }
		} }]
	});
}
//#endregion
//#region src/http/abort.ts
function linkAbort(target, source) {
	if (!source) return () => {};
	if (source.aborted) {
		target.abort(source.reason);
		return () => {};
	}
	const handler = () => target.abort(source.reason);
	source.addEventListener("abort", handler, { once: true });
	return () => source.removeEventListener("abort", handler);
}
//#endregion
//#region src/http/sse-parse.ts
function extractSseEvents(buffer) {
	const frames = buffer.replace(/\r\n/g, "\n").split("\n\n");
	const rest = frames.pop() ?? "";
	const events = [];
	for (const frame of frames) {
		const dataLines = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart());
		if (dataLines.length === 0) continue;
		const payload = dataLines.join("\n");
		if (!payload || payload === "[DONE]") continue;
		try {
			events.push(JSON.parse(payload));
		} catch {}
	}
	return {
		events,
		rest
	};
}
//#endregion
//#region src/http/sse-attempt.ts
var SseAttemptError = class extends Error {
	constructor(message, firstByteReceived, status) {
		super(message);
		this.firstByteReceived = firstByteReceived;
		this.status = status;
	}
};
async function attemptPostSse(params, opts) {
	const fetchImpl = opts.fetchImpl ?? fetch;
	const attemptController = new AbortController();
	const unlinkCaller = linkAbort(attemptController, opts.signal);
	let firstByteReceived = false;
	let timer;
	const armTimer = (ms, reason) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => attemptController.abort(new Error(reason)), ms);
	};
	const clearTimer = () => {
		if (timer) clearTimeout(timer);
		timer = void 0;
	};
	const fail = (message, status) => {
		throw new SseAttemptError(message, firstByteReceived, status);
	};
	try {
		armTimer(HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS, `Zeitüberschreitung nach ${HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS / 1e3}s (kein Streaming-Start)`);
		let response;
		try {
			response = await fetchImpl(params.url, {
				method: "POST",
				headers: params.headers,
				body: params.body,
				signal: attemptController.signal
			});
		} catch (err) {
			if (opts.signal?.aborted) throw fail(ABORT_ERROR_MESSAGE);
			throw fail(err instanceof Error ? err.message : String(err));
		}
		if (!response.ok) {
			const msg = extractErrorMessageFromText(await response.text().catch(() => ""));
			throw fail(`Request failed, status ${response.status}${msg ? `: ${msg}` : ""}`, response.status);
		}
		if (!response.body) throw fail("Streaming-Antwort enthält keinen lesbaren Body.");
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		try {
			while (true) {
				let result;
				try {
					result = await reader.read();
				} catch (err) {
					if (opts.signal?.aborted) throw fail(ABORT_ERROR_MESSAGE);
					throw fail(err instanceof Error ? err.message : String(err));
				}
				if (result.done) break;
				firstByteReceived = true;
				armTimer(HTTP_STREAM_IDLE_TIMEOUT_MS, `Streaming-Verbindung gestoppt (keine Daten seit ${HTTP_STREAM_IDLE_TIMEOUT_MS / 1e3}s).`);
				buffer += decoder.decode(result.value, { stream: true });
				const { events, rest } = extractSseEvents(buffer);
				buffer = rest;
				for (const event of events) opts.onEvent(event);
			}
			const { events } = extractSseEvents(buffer + "\n\n");
			for (const event of events) opts.onEvent(event);
		} finally {
			reader.releaseLock();
		}
	} finally {
		clearTimer();
		unlinkCaller();
	}
}
//#endregion
//#region src/http/stream.ts
async function postSseWithRetry(params, opts) {
	const label = opts.label ?? "Anfrage";
	for (let attempt = 1; attempt <= 5; attempt++) {
		if (opts.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
		try {
			await attemptPostSse(params, opts);
			return;
		} catch (err) {
			if (opts.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
			const message = err instanceof Error ? err.message : String(err);
			if (!(err instanceof SseAttemptError)) throw new Error(`${label} fehlgeschlagen: ${message}`);
			const retryableStatus = typeof err.status === "number" && RETRYABLE_STATUSES.has(err.status);
			if (!(!err.firstByteReceived && (retryableStatus || err.status === void 0)) || attempt === 5) throw err.status !== void 0 ? err : /* @__PURE__ */ new Error(`${label} fehlgeschlagen: ${message}`);
			await sleep(computeDelayMs(attempt), opts.signal, (seconds) => opts.onStatus?.(`${label} fehlgeschlagen (${message}) – erneuter Versuch in ${seconds}s (${attempt}/5) …`));
			opts.onStatus?.(`${label} fehlgeschlagen (${message}) – erneuter Versuch (${attempt}/5) …`);
		}
	}
}
//#endregion
//#region src/gemini/block-reason.ts
var BLOCK_REASON_MESSAGES = {
	SAFETY: "Die Antwort wurde von Sicherheitsfiltern blockiert (SAFETY).",
	RECITATION: "Die Antwort wurde blockiert - möglicherweise wörtliche Wiedergabe urheberrechtlich geschützten Materials (RECITATION).",
	MAX_TOKENS: "Die Antwort wurde wegen Erreichens des Token-Limits abgebrochen, bevor Inhalt erzeugt wurde (MAX_TOKENS).",
	OTHER: "Die Antwort wurde aus einem nicht näher spezifizierten Grund blockiert (OTHER)."
};
function blockReasonMessage(json, candidate) {
	const blockReason = json?.promptFeedback?.blockReason;
	const finishReason = candidate?.finishReason;
	const reason = blockReason ?? (finishReason && finishReason !== "STOP" ? finishReason : void 0);
	if (!reason) return void 0;
	return BLOCK_REASON_MESSAGES[reason] ?? `Die Antwort wurde blockiert/abgebrochen (Grund: ${reason}).`;
}
//#endregion
//#region src/agent/tool-declarations.ts
var FUNCTION_DECLARATIONS = [
	{
		name: "search_manual",
		description: "Durchsucht das Werkstatthandbuch (Hybrid: Volltext + Vektor) mit einer selbst gewählten Suchanfrage. Liefert eine kompakte Trefferliste (Titel, Seitencode, Sektion, notePath) - noch keinen vollen Seitentext. Nutze dies, wenn die bisher abgerufenen Handbuchseiten die Frage nicht abdecken oder du gezielt nach einem anderen Begriff/Bauteil suchen willst.",
		parameters: {
			type: "object",
			properties: { query: {
				type: "string",
				description: "Die Suchanfrage, idealerweise mit Werkstatt-Fachbegriffen."
			} },
			required: ["query"]
		}
	},
	{
		name: "search_manual_fuzzy",
		description: "Durchsucht das Handbuch tippfehler- und synonymtolerant (Vault Search). Nützlich bei umgangssprachlichen Formulierungen oder wenn search_manual nichts Passendes liefert.",
		parameters: {
			type: "object",
			properties: { query: {
				type: "string",
				description: "Die Suchanfrage."
			} },
			required: ["query"]
		}
	},
	{
		name: "get_manual_page",
		description: "Liest eine bestimmte, über search_manual oder search_manual_fuzzy bereits gefundene Handbuchseite vollständig ein. Gib exakt die notePath/seitencode/sektion/titel-Werte an, die dir die Suche für diesen Treffer geliefert hat.",
		parameters: {
			type: "object",
			properties: {
				notePath: { type: "string" },
				seitencode: { type: "string" },
				sektion: { type: "string" },
				titel: { type: "string" }
			},
			required: [
				"notePath",
				"seitencode",
				"sektion",
				"titel"
			]
		}
	},
	{
		name: "ask_user",
		description: "Stellt dem Nutzer eine kurze Rückfrage, falls die Frage mehrdeutig ist oder eine wichtige Information fehlt. Sparsam einsetzen - nur wenn es die Antwort deutlich verbessert. Beendet diese Werkzeug-Runde; die Antwort des Nutzers wird dir danach als Ergebnis dieses Aufrufs zurückgegeben.",
		parameters: {
			type: "object",
			properties: { question: {
				type: "string",
				description: "Die Rückfrage an den Nutzer, auf Deutsch."
			} },
			required: ["question"]
		}
	}
];
//#endregion
//#region src/gemini/prompts.ts
var TTS_ANSWER_FORMAT_CLAUSE = `

Wenn du jetzt direkt antwortest (keinen Funktionsaufruf tätigst), formatiere deine Antwort exakt so:
${SHORT_ANSWER_START}
Eine sehr kurze, gesprochen-taugliche Zusammenfassung in 1-2 Sätzen. Exakte Zahlen und Einheiten
unverändert übernehmen, aber keine Zitatmarker, keine Seitencodes, keine Markdown-Symbole.
${SHORT_ANSWER_END}
${ANSWER_START}
Die vollständige Antwort wie oben beschrieben, inklusive Zitaten und Markdown.
${ANSWER_END}
Tätigst du stattdessen einen Funktionsaufruf, lass dieses Format komplett weg.`;
function SYSTEM_PROMPT(includeGoogleSearch, ttsRequested = false) {
	return `Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.

Antworte kurz und klar: nur das, was zur Beantwortung der Frage nötig ist. Wiederhole die Frage nicht,
vermeide Füllsätze, Höflichkeitsfloskeln und Einleitungen. Füge keine ungefragten allgemeinen
Hintergrundinformationen hinzu, die nicht zur Beantwortung beitragen.

Struktur jeder Antwort:
1. **Aus dem Werkstatthandbuch:** Beantworte den Teil der Frage, der sich aus den abgerufenen
   Handbuchseiten ergibt. Nenne bei technischen Angaben (Drehmomente, Teilenummern, Toleranzen,
   Spezifikationen) IMMER den Seitencode der Quelle. Nenne KEINEN Zahlenwert als Handbuch-Angabe, wenn er
   nicht wörtlich in einer abgerufenen Handbuchseite steht. Fehlt eine Angabe im Handbuch, sage das
   ausdrücklich ("Diese Information ist im Handbuch nicht enthalten."). Schreibe Seitencode-Zitate IMMER
   exakt im Format "[Seite <code>]" bzw. bei mehreren Seiten "[Seite <code1>, <code2>]" (z.B.
   "[Seite 16-02, 16-03]") - nur die Seitencodes selbst getrennt durch ", ", ohne zusätzlichen Text
   innerhalb der Klammer. Verwende dabei ausschließlich Seitencodes, die dir tatsächlich in einem
   <document seitencode="..."> deiner abgerufenen Quellen geliefert wurden. Manche abgerufenen
   <document>-Quellen haben KEINEN Seitencode (leeres seitencode-Attribut) - das sind eigenständige
   Nachschlagewerke (z.B. Sonderwerkzeuge, Sicherheitshinweise, Glossar, Technische Daten), keine
   einzelnen Handbuchseiten. Zitiere solche Quellen stattdessen exakt im Format "[Referenz: <titel>]"
   (titel aus dem titel-Attribut derselben Quelle), niemals mit "[Seite ...]".
2. **${includeGoogleSearch ? "Zusätzliches Wissen (Allgemeinwissen & Web, nicht werksseitig verifiziert)" : "Zusätzliches Wissen (Allgemeinwissen, nicht werksseitig verifiziert)"}:** Ergänze die Antwort NUR dann um zusätzlichen Kontext, praktische Hinweise
   oder aktuelle Informationen (z.B. moderne Ersatzteile, bekannte Fallstricke, aktualisierte
   Teilenummern) aus deinem Allgemeinwissen${includeGoogleSearch ? " und - falls verfügbar - aktuellen Web-Rechercheergebnissen" : ""}, wenn das für die konkrete Frage einen echten
   Mehrwert bietet - nicht routinemäßig. Lass diesen Abschnitt ganz weg, wenn es nichts Relevantes zu
   ergänzen gibt. Kennzeichne vorhandene Angaben klar als nicht aus dem Werksmanual stammend. Weise bei
   sicherheitsrelevanten Werten (Drehmomente, Toleranzen, Materialspezifikationen) ausdrücklich darauf
   hin, dass die Werksangabe (falls in Abschnitt 1 vorhanden) Vorrang hat und ungeprüfte Werte nicht
   ohne Weiteres übernommen werden sollten.${includeGoogleSearch ? "\n3. Nenne bei Web-Quellen die URL bzw. Domain, damit sie nachvollziehbar sind." : ""}

Antworte auf Deutsch.${ttsRequested ? TTS_ANSWER_FORMAT_CLAUSE : ""}`;
}
function toolParamNames(decl) {
	const properties = decl.parameters?.properties;
	return properties ? Object.keys(properties) : [];
}
var TOOL_DESCRIPTIONS = Object.fromEntries(FUNCTION_DECLARATIONS.map((decl) => [decl.name, `${decl.name}(${toolParamNames(decl).join(", ")}): ${decl.description}`]));
var GOOGLE_SEARCH_DESCRIPTION = "google_search: durchsucht das Web nach aktuellen, öffentlich verfügbaren Informationen.";
function buildToolsSuffix(functionDeclarations, includeGoogleSearch) {
	const lines = [];
	if (includeGoogleSearch) lines.push(`- ${GOOGLE_SEARCH_DESCRIPTION}`);
	for (const decl of functionDeclarations ?? []) {
		const desc = TOOL_DESCRIPTIONS[decl.name];
		if (desc) lines.push(`- ${desc}`);
	}
	if (lines.length === 0) return "\n\nFür diese Antwort stehen dir keine Werkzeuge (auch keine Websuche) zur Verfügung - antworte jetzt direkt und vollständig mit den bisher verfügbaren Informationen.";
	return "\n\nDir stehen für diese Anfrage folgende Werkzeuge zur Verfügung:\n" + lines.join("\n") + "\n\nDir steht pro Frage nur ein begrenztes Budget an Werkzeug-Aufrufen zur Verfügung (in der Regel wenige Runden) - suche gezielt und effizient, nicht plan- und ziellos. Wird das Budget aufgebraucht, antworte direkt mit dem, was du bis dahin gefunden hast.";
}
//#endregion
//#region src/gemini/thinking-config.ts
var GEMINI_3_PATTERN = /^gemini-3/i;
function buildThinkingConfig(model, thinkingEnabled) {
	if (thinkingEnabled) return void 0;
	if (GEMINI_3_PATTERN.test(model)) return { thinkingConfig: { thinkingLevel: "low" } };
	return { thinkingConfig: { thinkingBudget: 0 } };
}
//#endregion
//#region src/gemini/request-body.ts
function buildGenerateBody(contents, functionDeclarations, model, opts) {
	const includeGoogleSearch = opts?.includeGoogleSearch === true;
	const tools = [];
	if (includeGoogleSearch) tools.push({ google_search: {} });
	if (functionDeclarations && functionDeclarations.length > 0) tools.push({ functionDeclarations });
	const body = { contents };
	if (!opts?.skipSystemInstruction) body.systemInstruction = { parts: [{ text: SYSTEM_PROMPT(includeGoogleSearch, opts?.ttsRequested === true) + buildToolsSuffix(functionDeclarations, includeGoogleSearch) }] };
	if (tools.length > 0) {
		body.tools = tools;
		if (includeGoogleSearch && functionDeclarations && functionDeclarations.length > 0) body.toolConfig = { includeServerSideToolInvocations: true };
	}
	const thinkingConfig = buildThinkingConfig(model, opts?.thinkingEnabled === true || includeGoogleSearch);
	if (thinkingConfig) body.generationConfig = thinkingConfig;
	return body;
}
function modelUrl(model, method) {
	return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;
}
function requireApiKey(apiKey) {
	if (!apiKey) throw new Error("Google API key is required - set it in RAG Chat settings.");
}
//#endregion
//#region src/gemini/response.ts
function mapGroundingChunks(rawChunks) {
	return rawChunks.map((c) => ({
		uri: c.web?.uri ?? "",
		title: c.web?.title ?? c.web?.uri ?? ""
	}));
}
function mapGroundingSupports(rawSupports) {
	return rawSupports.filter((s) => typeof s.segment?.endIndex === "number" && Array.isArray(s.groundingChunkIndices) && s.groundingChunkIndices.length > 0).map((s) => ({
		startIndex: typeof s.segment?.startIndex === "number" ? s.segment.startIndex : 0,
		endIndex: s.segment.endIndex,
		chunkIndices: s.groundingChunkIndices,
		text: typeof s.segment?.text === "string" ? s.segment.text : void 0
	}));
}
//#endregion
//#region src/gemini/generate-stream.ts
async function generateWithToolsStreaming(contents, functionDeclarations, settings, opts) {
	requireApiKey(settings.geminiApiKey);
	const url = modelUrl(settings.generationModel, "streamGenerateContent?alt=sse");
	const body = buildGenerateBody(contents, functionDeclarations, settings.generationModel, opts);
	const parts = [];
	let groundingChunks = [];
	let groundingSupports = [];
	let finishReason;
	let lastJson;
	let lastCandidate;
	await postSseWithRetry({
		url,
		headers: {
			"x-goog-api-key": settings.geminiApiKey,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	}, {
		label: "Generierung",
		signal: opts.signal,
		onStatus: opts.onStatus,
		fetchImpl: opts.fetchImpl,
		onEvent: (event) => {
			const json = event;
			const candidate = json?.candidates?.[0];
			if (!candidate) return;
			lastJson = json;
			lastCandidate = candidate;
			const chunkParts = candidate?.content?.parts ?? [];
			for (const part of chunkParts) {
				parts.push(part);
				if (typeof part.text === "string" && part.text.length > 0) opts.onDelta(part.text);
			}
			const rawChunks = candidate?.groundingMetadata?.groundingChunks;
			if (rawChunks) groundingChunks = mapGroundingChunks(rawChunks);
			const rawSupports = candidate?.groundingMetadata?.groundingSupports;
			if (rawSupports) groundingSupports = mapGroundingSupports(rawSupports);
			if (candidate?.finishReason) finishReason = candidate.finishReason;
		}
	});
	if (parts.length === 0) {
		const msg = blockReasonMessage(lastJson, lastCandidate);
		if (msg) throw new Error(msg);
		throw new Error("Unexpected streamGenerateContent response: no parts received.");
	}
	return {
		parts,
		groundingChunks,
		groundingSupports,
		finishReason
	};
}
//#endregion
//#region src/agent/final-round.ts
var BUDGET_EXHAUSTED_PROMPT = "Das Werkzeug-Budget für diese Frage ist aufgebraucht. Antworte jetzt direkt und vollständig mit den bisher verfügbaren Informationen, ohne weitere Werkzeugaufrufe.";
async function runForcedFinalRound(state, ctx, maxRounds, reporter) {
	reporter.record({
		kind: "budget_exhausted",
		round: state.round,
		title: "Werkzeug-Budget erreicht",
		narration: describeBudgetExhausted(state.round, maxRounds)
	});
	state.contents.push({
		role: "user",
		parts: [{ text: BUDGET_EXHAUSTED_PROMPT }]
	});
	ctx.onTextDelta?.("");
	const finalStep = reporter.start({
		kind: "llm_round",
		round: state.round,
		title: "Erzwungene finale Antwort: Modell denkt nach …",
		model: ctx.settings.generationModel
	});
	let finalRoundText = "";
	let shortAnswerSent = false;
	const final = await generateWithToolsStreaming(state.contents, null, ctx.settings, {
		includeGoogleSearch: false,
		thinkingEnabled: ctx.settings.thinkingEnabled,
		ttsRequested: ctx.settings.ttsEnabled,
		onDelta: (chunk) => {
			finalRoundText += chunk;
			const blocks = splitAnswerBlocks(finalRoundText);
			if (blocks.shortAnswerComplete && !shortAnswerSent) {
				shortAnswerSent = true;
				ctx.onShortAnswerReady?.(blocks.shortAnswer ?? "");
			}
			ctx.onTextDelta?.(blocks.answer);
		},
		onStatus: (status) => reporter.update(finalStep, { title: status }),
		signal: ctx.signal
	});
	mergeGrounding(state.webCitations, final.groundingChunks);
	const { text, shortAnswer } = extractFinalAnswer(final.parts.map((p) => p.text ?? "").join(""));
	const manualCitations = [...state.manualPages.values()];
	const webCitations = [...state.webCitations.values()];
	reporter.finish(finalStep, { title: "Erzwungene finale Antwort erhalten" });
	reporter.record({
		kind: "final_answer",
		round: state.round,
		title: "Antwort fertiggestellt",
		model: ctx.settings.generationModel,
		narration: describeFinalAnswer(text, manualCitations, webCitations)
	});
	return {
		status: "done",
		text,
		shortAnswer,
		manualCitations,
		webCitations,
		webGroundingChunks: final.groundingChunks,
		webGroundingSupports: final.groundingSupports
	};
}
//#endregion
//#region src/agent/round.ts
async function runModelRound(state, ctx, declarations, maxRounds, reporter) {
	const roundStep = reporter.start({
		kind: "llm_round",
		round: state.round,
		title: `Runde ${state.round}/${maxRounds}: Modell denkt nach …`,
		model: ctx.settings.generationModel
	});
	let roundText = "";
	let shortAnswerSent = false;
	const result = await generateWithToolsStreaming(state.contents, declarations, ctx.settings, {
		includeGoogleSearch: ctx.settings.webSearchEnabled,
		thinkingEnabled: ctx.settings.thinkingEnabled,
		ttsRequested: ctx.settings.ttsEnabled,
		onDelta: (chunk) => {
			roundText += chunk;
			const blocks = splitAnswerBlocks(roundText);
			if (blocks.shortAnswerComplete && !shortAnswerSent) {
				shortAnswerSent = true;
				ctx.onShortAnswerReady?.(blocks.shortAnswer ?? "");
			}
			ctx.onTextDelta?.(blocks.answer);
		},
		onStatus: (status) => reporter.update(roundStep, { title: status }),
		signal: ctx.signal
	});
	mergeGrounding(state.webCitations, result.groundingChunks);
	const functionCalls = result.parts.filter((p) => Boolean(p.functionCall)).map((p) => p.functionCall);
	reporter.finish(roundStep, {
		title: `Runde ${state.round}/${maxRounds}: Modellantwort erhalten`,
		narration: describeRoundDecision(state.round, maxRounds, functionCalls)
	});
	return {
		result,
		functionCalls
	};
}
//#endregion
//#region src/retrieval/compact-hits.ts
function toCompactHits(hits) {
	return hits.map((h) => ({
		notePath: h.notePath,
		seitencode: h.seitencode,
		sektion: h.sektion,
		titel: h.titel
	}));
}
//#endregion
//#region src/retrieval/embeddings.ts
var QUERY_PREFIX_TMPL = "task: search result | query: {content}";
function validateManifest(manifest, settings) {
	const warnings = [];
	if (manifest.embeddingModel !== settings.embeddingModel) warnings.push(`Index was built with embedding model "${manifest.embeddingModel}", but settings specify "${settings.embeddingModel}". Update settings or rebuild the index.`);
	if (manifest.embeddingDims !== settings.outputDim) warnings.push(`Index was built at ${manifest.embeddingDims} dims (the shipped/query dims), but settings specify ${settings.outputDim}. These MUST match or vector search will silently return garbage. Fix settings.outputDim.`);
	return warnings;
}
async function embedQuery(query, settings, onStatus, signal) {
	if (!settings.geminiApiKey) throw new Error("Google API key (GEMINI_API_KEY) is required for query embeddings - set it in RAG Chat settings.");
	const prefixed = QUERY_PREFIX_TMPL.replace("{content}", query);
	const response = await requestUrlWithRetry({
		url: `https://generativelanguage.googleapis.com/v1beta/models/${settings.embeddingModel}:embedContent`,
		method: "POST",
		headers: {
			"x-goog-api-key": settings.geminiApiKey,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			content: { parts: [{ text: prefixed }] },
			outputDimensionality: settings.outputDim
		})
	}, {
		onStatus,
		label: "Embedding",
		signal
	});
	const values = response.json?.embedding?.values;
	if (!Array.isArray(values)) throw new Error(`Unexpected embedContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
	return values;
}
//#endregion
//#region src/retrieval/rrf.ts
function rrfMerge(legs, k) {
	const scores = /* @__PURE__ */ new Map();
	for (const leg of legs) for (const entry of leg) {
		const existing = scores.get(entry.key);
		const score = (existing?.score ?? 0) + 1 / (k + entry.rank + 1);
		scores.set(entry.key, {
			score,
			item: existing?.item ?? entry.item
		});
	}
	return [...scores.entries()].map(([key, v]) => ({
		key,
		item: v.item,
		score: v.score
	})).sort((a, b) => b.score - a.score);
}
//#endregion
//#region src/retrieval/hybrid-search.ts
async function federatedHybridSearch(indices, term, vector, settings) {
	const textResult = await search(indices.textDb, {
		mode: "fulltext",
		term,
		limit: CANDIDATE_POOL_LIMIT
	});
	const vectorHits = (await Promise.all(indices.vectorDbs.map((db) => search(db, {
		mode: "vector",
		vector: {
			value: vector,
			property: "embedding"
		},
		similarity: settings.similarity,
		limit: CANDIDATE_POOL_LIMIT
	})))).flatMap((r) => r.hits);
	const textHitsSorted = [...textResult.hits].sort((a, b) => b.score - a.score);
	const vectorHitsSorted = [...vectorHits].sort((a, b) => b.score - a.score);
	return rrfMerge([textHitsSorted.map((h, i) => ({
		key: h.document.rowId,
		rank: i,
		item: h.document
	})), vectorHitsSorted.map((h, i) => ({
		key: h.document.rowId,
		rank: i,
		item: h.document
	}))], settings.rrfK).slice(0, settings.topK).map(({ score, item: doc }) => ({
		score,
		rowId: doc.rowId,
		notePath: doc.notePath,
		seitencode: doc.seitencode,
		sektion: doc.sektion,
		titel: doc.titel,
		kind: doc.kind
	}));
}
//#endregion
//#region src/retrieval/note-reader.ts
async function readNoteOrNull(vault, notePath) {
	const file = vault.getFileByPath(notePath);
	if (!file) return null;
	return await vault.read(file);
}
//#endregion
//#region src/agent/execute-tool.ts
async function executeTool(fc, ctx, state, step) {
	switch (fc.name) {
		case "search_manual": {
			const query = String(fc.args?.query ?? "");
			if (!query.trim()) return { error: "query darf nicht leer sein." };
			const onStatus = step ? (status) => ctx.reporter?.update(step, { title: status }) : void 0;
			const vector = await embedQuery(query, ctx.settings, onStatus, ctx.signal);
			return { hits: toCompactHits(await federatedHybridSearch(ctx.indices, query, vector, ctx.settings)) };
		}
		case "search_manual_fuzzy": {
			if (!ctx.fuzzyApi) return { error: "Das vault-search-Plugin ist nicht installiert/aktiviert - Werkzeug nicht verfügbar." };
			const query = String(fc.args?.query ?? "");
			if (!query.trim()) return { error: "query darf nicht leer sein." };
			const res = await ctx.fuzzyApi.search(query, 10);
			return {
				hits: toCompactHits(res.results),
				correction: res.correction
			};
		}
		case "get_manual_page": {
			const notePath = String(fc.args?.notePath ?? "").trim();
			if (!notePath) return { error: "notePath darf nicht leer sein." };
			const args = fc.args ?? {};
			const missingKeys = [
				"seitencode",
				"sektion",
				"titel"
			].filter((key) => !(key in args));
			if (missingKeys.length > 0) return { error: `Fehlende Pflichtangabe(n): ${missingKeys.join(", ")}. Gib exakt die notePath/seitencode/sektion/titel-Werte an, die dir die Suche für diesen Treffer geliefert hat.` };
			const seitencode = String(args.seitencode ?? "");
			const sektion = String(args.sektion ?? "").trim();
			const titel = String(args.titel ?? "").trim();
			if (!sektion || !titel) return { error: "sektion und titel dürfen nicht leer sein." };
			const fullText = await readNoteOrNull(ctx.vault, notePath);
			if (fullText === null) return { error: `Seite "${notePath}" nicht gefunden - evtl. verschoben oder gelöscht.` };
			state.manualPages.set(notePath, {
				notePath,
				seitencode,
				sektion,
				titel,
				fullText
			});
			return {
				notePath,
				seitencode,
				sektion,
				titel,
				fullText
			};
		}
		default: return { error: `Unbekanntes Werkzeug: ${fc.name}` };
	}
}
//#endregion
//#region src/agent/tool-round.ts
async function runToolCalls(calls, ctx, state, reporter) {
	const responseParts = [];
	for (const fc of calls) {
		if (ctx.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
		const toolStep = reporter.start({
			kind: "tool_call",
			round: state.round,
			title: describeCall(fc),
			toolName: fc.name,
			toolArgs: fc.args,
			model: fc.name === "search_manual" ? ctx.settings.embeddingModel : void 0
		});
		let response;
		try {
			response = await executeTool(fc, ctx, state, toolStep);
		} catch (err) {
			response = { error: err instanceof Error ? err.message : String(err) };
		}
		if (typeof response.error === "string") reporter.fail(toolStep, response.error);
		else reporter.finish(toolStep, {
			toolResult: response,
			hits: extractToolHits(response),
			narration: describeToolNarration(fc, response)
		});
		responseParts.push({ functionResponse: {
			...fc.id ? { id: fc.id } : {},
			name: fc.name,
			response
		} });
	}
	return responseParts;
}
//#endregion
//#region src/agent/loop.ts
function activeDeclarations(ctx) {
	return ctx.settings.enableFuzzySearchLeg ? FUNCTION_DECLARATIONS : FUNCTION_DECLARATIONS.filter((d) => d.name !== "search_manual_fuzzy");
}
function finalAnswer(state, ctx, result, reporter) {
	const { text, shortAnswer } = extractFinalAnswer(result.parts.map((p) => p.text ?? "").join(""));
	const manualCitations = [...state.manualPages.values()];
	const webCitations = [...state.webCitations.values()];
	reporter.record({
		kind: "final_answer",
		round: state.round,
		title: "Antwort fertiggestellt",
		model: ctx.settings.generationModel,
		narration: describeFinalAnswer(text, manualCitations, webCitations)
	});
	return {
		status: "done",
		text,
		shortAnswer,
		manualCitations,
		webCitations,
		webGroundingChunks: result.groundingChunks,
		webGroundingSupports: result.groundingSupports
	};
}
function pauseForClarification(state, ctx, askUserCall, otherCalls, reporter) {
	const question = String(askUserCall.args?.question ?? "Kannst du das bitte genauer beschreiben?");
	reporter.record({
		kind: "clarification",
		round: state.round,
		title: `Rückfrage an Nutzer: "${question}"`,
		narration: describeClarification(question, otherCalls.map((fc) => fc.name))
	});
	return {
		status: "awaiting_clarification",
		question,
		pending: {
			state,
			ctx: {
				...ctx,
				settings: { ...ctx.settings }
			}
		}
	};
}
async function driveLoop(state, ctx) {
	const maxRounds = ctx.settings.maxAgentRounds;
	const reporter = ctx.reporter ?? NOOP_STEP_REPORTER;
	const declarations = activeDeclarations(ctx);
	while (state.round < maxRounds) {
		if (ctx.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
		state.round++;
		ctx.onTextDelta?.("");
		const { result, functionCalls } = await runModelRound(state, ctx, declarations, maxRounds, reporter);
		if (functionCalls.length === 0) return finalAnswer(state, ctx, result, reporter);
		ctx.onTextDelta?.("");
		state.contents.push({
			role: "model",
			parts: result.parts
		});
		const askUserCall = functionCalls.find((fc) => fc.name === "ask_user");
		const otherCalls = functionCalls.filter((fc) => fc !== askUserCall);
		const responseParts = await runToolCalls(otherCalls, ctx, state, reporter);
		if (responseParts.length > 0) state.contents.push({
			role: "user",
			parts: responseParts
		});
		if (askUserCall) return pauseForClarification(state, ctx, askUserCall, otherCalls, reporter);
	}
	if (ctx.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
	return runForcedFinalRound(state, ctx, maxRounds, reporter);
}
async function runAgentLoop(params) {
	const { question, history, baselineBlocks, ctx } = params;
	return driveLoop(buildInitialState(question, history, baselineBlocks), ctx);
}
async function resumeAgentLoop(pending, userAnswer, signal) {
	const { state: pausedState, ctx: pausedCtx } = pending;
	const ctx = signal ? {
		...pausedCtx,
		signal
	} : pausedCtx;
	const askUserCallId = [...pausedState.contents].reverse().find((c) => c.role === "model")?.parts.find((p) => p.functionCall?.name === "ask_user")?.functionCall?.id;
	const state = cloneState(pausedState);
	appendClarificationAnswer(state, userAnswer, askUserCallId);
	return driveLoop(state, ctx);
}
//#endregion
//#region src/agent/transcript-round.ts
async function runTranscriptRound(state, ctx) {
	let roundText = "";
	let transcriptSent = false;
	return extractFinalTranscript((await generateWithToolsStreaming(state.contents, null, ctx.settings, {
		includeGoogleSearch: false,
		thinkingEnabled: false,
		ttsRequested: false,
		skipSystemInstruction: true,
		onDelta: (chunk) => {
			roundText += chunk;
			if (transcriptSent) return;
			const block = splitTranscriptBlock(roundText);
			if (block.transcriptComplete) {
				transcriptSent = true;
				ctx.onTranscriptReady?.(block.transcript ?? "");
			}
		},
		signal: ctx.signal
	})).parts.map((p) => p.text ?? "").join(""));
}
//#endregion
//#region src/agent/audio-loop.ts
async function runAudioAgentLoop(params) {
	const { base64Audio, mimeType, history, ctx, retrieve } = params;
	const transcriptState = buildAudioInitialState(base64Audio, mimeType, history);
	let retrievalPromise = null;
	const transcript = await runTranscriptRound(transcriptState, {
		...ctx,
		onTranscriptReady: (transcript) => {
			ctx.onTranscriptReady?.(transcript);
			if (transcript) retrievalPromise ??= retrieve(transcript);
		}
	});
	if (!transcript) throw new Error("Keine verständliche Sprache erkannt.");
	return runAgentLoop({
		question: transcript,
		history,
		baselineBlocks: await (retrievalPromise ?? retrieve(transcript)),
		ctx
	});
}
//#endregion
//#region src/retrieval/fuzzy-merge.ts
function mergeWithFuzzy(hybridHits, fuzzyHits, topK, rrfK) {
	return rrfMerge([hybridHits.map((h, i) => ({
		key: h.notePath,
		rank: i,
		item: h
	})), fuzzyHits.map((f, i) => ({
		key: f.notePath,
		rank: i + 0,
		item: {
			score: 0,
			rowId: `${f.notePath}::fuzzy`,
			notePath: f.notePath,
			seitencode: f.seitencode,
			sektion: f.sektion,
			titel: f.titel,
			kind: "text"
		}
	}))], rrfK).slice(0, topK).map(({ item, score }) => ({
		...item,
		score
	}));
}
//#endregion
//#region src/retrieval/parent-notes.ts
async function expandToParentNotes(hits, vault, referenceChunks) {
	const seen = /* @__PURE__ */ new Set();
	const blocks = [];
	for (const hit of hits) {
		if (hit.kind === "reference") {
			if (seen.has(hit.rowId)) continue;
			seen.add(hit.rowId);
			const chunk = referenceChunks.get(hit.rowId);
			if (!chunk) continue;
			blocks.push({
				notePath: hit.notePath,
				seitencode: "",
				sektion: hit.sektion,
				titel: hit.titel,
				fullText: chunk.text
			});
			continue;
		}
		if (seen.has(hit.notePath)) continue;
		seen.add(hit.notePath);
		const fullText = await readNoteOrNull(vault, hit.notePath);
		if (fullText === null) continue;
		blocks.push({
			notePath: hit.notePath,
			seitencode: hit.seitencode,
			sektion: hit.sektion,
			titel: hit.titel,
			fullText
		});
	}
	return blocks;
}
//#endregion
//#region src/workflow.ts
function toWorkflowResult(result) {
	if (result.status === "awaiting_clarification") return {
		status: "awaiting_clarification",
		question: result.question,
		pending: result.pending
	};
	return {
		status: "done",
		text: result.text,
		shortAnswer: result.shortAnswer,
		manualCitations: result.manualCitations,
		webCitations: result.webCitations,
		webGroundingChunks: result.webGroundingChunks,
		webGroundingSupports: result.webGroundingSupports
	};
}
async function baselineRetrieve(query, settings, indices, fuzzyApi, vault, reporter, signal) {
	const embeddingStep = reporter.start({
		kind: "embedding",
		title: "Erzeuge Such-Embedding …",
		model: settings.embeddingModel
	});
	const vector = await embedQuery(query, settings, (status) => reporter.update(embeddingStep, { title: status }), signal);
	reporter.finish(embeddingStep, {
		title: "Such-Embedding erzeugt",
		narration: describeEmbedding(settings.embeddingModel, settings.outputDim)
	});
	const retrievalStep = reporter.start({
		kind: "retrieval",
		title: `Durchsuche Handbuch nach "${query}" …`
	});
	const hybridHits = await federatedHybridSearch(indices, query, vector, settings);
	let hits = hybridHits;
	let usedFuzzy = false;
	if (settings.enableFuzzySearchLeg && fuzzyApi) try {
		hits = mergeWithFuzzy(hybridHits, (await fuzzyApi.search(query, 10)).results, settings.topK, settings.rrfK);
		usedFuzzy = true;
	} catch {}
	reporter.finish(retrievalStep, {
		title: `Handbuchsuche nach "${query}" abgeschlossen`,
		narration: describeRetrieval(query, hits.length, usedFuzzy),
		hits: hits.map((h) => ({
			seitencode: h.seitencode,
			sektion: h.sektion,
			titel: h.titel,
			score: h.score
		}))
	});
	return expandToParentNotes(hits, vault, indices.referenceChunks);
}
async function answerQuestion(params) {
	const { question, history, settings, vault, indices, fuzzyApi, reporter, onTextDelta, onShortAnswerReady, signal } = params;
	if (signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
	const rep = reporter ?? NOOP_STEP_REPORTER;
	return toWorkflowResult(await runAgentLoop({
		question,
		history,
		baselineBlocks: await baselineRetrieve(question, settings, indices, fuzzyApi, vault, rep, signal),
		ctx: {
			settings,
			vault,
			indices,
			fuzzyApi,
			reporter: rep,
			onTextDelta,
			onShortAnswerReady,
			signal
		}
	}));
}
async function answerQuestionFromAudio(params) {
	const { base64Audio, mimeType, history, settings, vault, indices, fuzzyApi, reporter, onTranscriptReady, onTextDelta, onShortAnswerReady, signal } = params;
	if (signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
	const rep = reporter ?? NOOP_STEP_REPORTER;
	return toWorkflowResult(await runAudioAgentLoop({
		base64Audio,
		mimeType,
		history,
		ctx: {
			settings,
			vault,
			indices,
			fuzzyApi,
			reporter: rep,
			onTextDelta,
			onShortAnswerReady,
			onTranscriptReady,
			signal
		},
		retrieve: (transcript) => baselineRetrieve(transcript, settings, indices, fuzzyApi, vault, rep, signal)
	}));
}
async function continueAnswer(pending, userAnswer, signal) {
	if (signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
	return toWorkflowResult(await resumeAgentLoop(pending, userAnswer, signal));
}
//#endregion
//#region src/view/apply-result.ts
function clearCitations(turn) {
	turn.citations = [];
	turn.webCitations = [];
	turn.webGroundingChunks = [];
	turn.webGroundingSupports = [];
}
function applyResult(turn, state, result) {
	turn.status = void 0;
	turn.streamingText = void 0;
	if (result.status === "awaiting_clarification") {
		state.pendingAgentState = result.pending;
		turn.text = result.question;
		turn.isClarifying = true;
		clearCitations(turn);
	} else {
		turn.text = result.text.trim() || "Ich habe leider keine Antwort erhalten.";
		turn.ttsShortAnswer = result.shortAnswer;
		turn.isClarifying = false;
		turn.citations = result.manualCitations;
		turn.webCitations = result.webCitations;
		turn.webGroundingChunks = result.webGroundingChunks;
		turn.webGroundingSupports = result.webGroundingSupports;
	}
}
function applyError(turn, message) {
	turn.status = void 0;
	turn.text = `Fehler: ${message}`;
	clearCitations(turn);
}
//#endregion
//#region src/view/controller.ts
function createChatSessionState() {
	return {
		turns: [],
		pendingAgentState: null,
		busy: false
	};
}
function abandonPendingClarification(state) {
	state.pendingAgentState = null;
}
function inputPlaceholder(state) {
	return state.pendingAgentState !== null ? "Antwort auf die Rückfrage …" : "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)";
}
async function sendMessage(state, message, deps, opts) {
	if (state.busy) return;
	state.busy = true;
	try {
		await sendMessageUnguarded(state, message, deps, opts);
	} finally {
		state.busy = false;
	}
}
async function sendMessageUnguarded(state, message, deps, opts) {
	const isResuming = state.pendingAgentState !== null;
	const pendingBeforeSend = state.pendingAgentState;
	const history = [...state.turns];
	const userTurn = {
		role: "user",
		text: message,
		originatedFromVoice: opts?.originatedFromVoice
	};
	state.turns.push(userTurn);
	const assistantTurn = {
		role: "assistant",
		text: "",
		status: isResuming ? "Setze Suche fort …" : "Analysiere Frage …",
		originatedFromVoice: opts?.originatedFromVoice
	};
	state.turns.push(assistantTurn);
	deps.onTurnStarted?.(assistantTurn);
	const reporter = createStepReporter((step) => {
		assistantTurn.status = step.title;
		const steps = assistantTurn.steps ??= [];
		if (!steps.includes(step)) steps.push(step);
		deps.onStep?.(step);
	});
	const onTextDelta = (text) => {
		assistantTurn.streamingText = text || void 0;
		deps.onTextDelta?.();
	};
	const onShortAnswerReady = (text) => {
		assistantTurn.ttsShortAnswer = text;
		deps.onShortAnswerReady?.(assistantTurn);
	};
	try {
		let result;
		if (isResuming && state.pendingAgentState) {
			const pending = state.pendingAgentState;
			state.pendingAgentState = null;
			pending.ctx.reporter = reporter;
			pending.ctx.onTextDelta = onTextDelta;
			pending.ctx.onShortAnswerReady = onShortAnswerReady;
			result = await continueAnswer(pending, message, deps.signal);
		} else result = await answerQuestion({
			question: message,
			history,
			settings: deps.settings,
			vault: deps.vault,
			indices: await deps.getIndices(),
			fuzzyApi: deps.getFuzzyApi(),
			reporter,
			onTextDelta,
			onShortAnswerReady,
			signal: deps.signal
		});
		applyResult(assistantTurn, state, result);
		if (result.status === "done") deps.onTurnDone?.(assistantTurn);
		else deps.onClarificationReady?.(assistantTurn);
	} catch (err) {
		if (deps.signal?.aborted) {
			state.turns.splice(state.turns.length - 2, 2);
			state.pendingAgentState = pendingBeforeSend;
			deps.onCancelled?.(message);
			return;
		}
		state.pendingAgentState = null;
		const errMessage = err instanceof Error ? err.message : String(err);
		applyError(assistantTurn, errMessage);
		assistantTurn.retry = {
			message,
			pendingBefore: pendingBeforeSend
		};
		deps.onError?.(errMessage);
	}
}
function discardFailedTurn(state, turn) {
	if (state.busy) return null;
	const idx = state.turns.indexOf(turn);
	if (idx < 1 || !turn.retry) return null;
	if (state.turns[idx - 1].role !== "user") return null;
	const { message, pendingBefore } = turn.retry;
	state.turns.splice(idx - 1, 2);
	state.pendingAgentState = pendingBefore;
	return message;
}
async function retryTurn(state, turn, deps) {
	const message = discardFailedTurn(state, turn);
	if (message === null) return;
	await sendMessage(state, message, deps);
}
async function sendVoiceMessage(state, audio, deps) {
	if (state.busy) return;
	state.busy = true;
	try {
		await sendVoiceMessageUnguarded(state, audio, deps);
	} finally {
		state.busy = false;
	}
}
async function sendVoiceMessageUnguarded(state, audio, deps) {
	const pendingBeforeSend = state.pendingAgentState;
	const history = [...state.turns];
	const userTurn = {
		role: "user",
		text: "",
		originatedFromVoice: true
	};
	state.turns.push(userTurn);
	const assistantTurn = {
		role: "assistant",
		text: "",
		status: "Transkribiere Sprachaufnahme …",
		originatedFromVoice: true
	};
	state.turns.push(assistantTurn);
	deps.onTurnStarted?.(assistantTurn);
	const reporter = createStepReporter((step) => {
		assistantTurn.status = step.title;
		const steps = assistantTurn.steps ??= [];
		if (!steps.includes(step)) steps.push(step);
		deps.onStep?.(step);
	});
	const onTextDelta = (text) => {
		assistantTurn.streamingText = text || void 0;
		deps.onTextDelta?.();
	};
	const onShortAnswerReady = (text) => {
		assistantTurn.ttsShortAnswer = text;
		deps.onShortAnswerReady?.(assistantTurn);
	};
	const onTranscriptReady = (text) => {
		userTurn.text = text;
		assistantTurn.status = "Analysiere Frage …";
		deps.onTranscriptReady?.(userTurn);
	};
	try {
		const result = await answerQuestionFromAudio({
			base64Audio: audio.base64Audio,
			mimeType: audio.mimeType,
			history,
			settings: deps.settings,
			vault: deps.vault,
			indices: await deps.getIndices(),
			fuzzyApi: deps.getFuzzyApi(),
			reporter,
			onTranscriptReady,
			onTextDelta,
			onShortAnswerReady,
			signal: deps.signal
		});
		applyResult(assistantTurn, state, result);
		if (result.status === "done") deps.onTurnDone?.(assistantTurn);
		else deps.onClarificationReady?.(assistantTurn);
	} catch (err) {
		if (deps.signal?.aborted) {
			state.turns.splice(state.turns.length - 2, 2);
			state.pendingAgentState = pendingBeforeSend;
			deps.onCancelled?.(userTurn.text);
			return;
		}
		state.pendingAgentState = null;
		const errMessage = err instanceof Error ? err.message : String(err);
		applyError(assistantTurn, errMessage);
		if (userTurn.text) assistantTurn.retry = {
			message: userTurn.text,
			pendingBefore: pendingBeforeSend
		};
		deps.onError?.(errMessage);
	}
}
//#endregion
//#region src/view/fuzzy-search-plugin.ts
function getFuzzySearchApi(app) {
	return (app.plugins?.plugins)?.["vault-search"]?.api ?? null;
}
//#endregion
//#region src/view/model-options.ts
async function refreshModelOptions(deps) {
	deps.selectEl.disabled = true;
	deps.setDisabled(true);
	const models = await listFlashModels(deps.apiKey);
	if (deps.isClosed()) return;
	const options = models.some((model) => model.id === deps.currentModel) ? models : [{
		id: deps.currentModel,
		displayName: deps.currentModel
	}, ...models];
	deps.selectEl.empty();
	for (const model of options) deps.selectEl.createEl("option", {
		attr: { value: model.id },
		text: model.displayName
	});
	deps.selectEl.value = deps.currentModel;
	deps.selectEl.disabled = deps.isBusy();
	deps.setDisabled(deps.isBusy());
}
//#endregion
//#region src/citations/util.ts
function escapeWikilinkPath(notePath) {
	return notePath.replace(/\|/g, "\\|");
}
function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderCitationMatch(code, matches, labelFor) {
	if (!matches || matches.length === 0) return `<span class="rag-chat-citation-unverified" title="Konnte nicht gegen die abgerufenen Quellen dieser Antwort verifiziert werden">${escapeHtml(code)}</span>`;
	if (matches.length === 1) return `[[${escapeWikilinkPath(matches[0].notePath)}|${code}]]`;
	const items = matches.map((m) => `[[${escapeWikilinkPath(m.notePath)}|${labelFor(m)}]]`).join(" · ");
	return `<details class="rag-chat-citation-ambiguous"><summary>${escapeHtml(code)}</summary>${items}</details>`;
}
//#endregion
//#region src/citations/page-citations.ts
function linkifyCitations(text, citations) {
	if (citations.length === 0) return text;
	const bySeitencode = /* @__PURE__ */ new Map();
	for (const block of citations) {
		const list = bySeitencode.get(block.seitencode);
		if (list) list.push(block);
		else bySeitencode.set(block.seitencode, [block]);
	}
	return text.replace(/\[Seite\s+([^\]]+)\]/gi, (whole, inner) => {
		const codes = inner.split(",").map((c) => c.trim()).filter((c) => c.length > 0);
		if (codes.length === 0) return whole;
		return `[Seite ${codes.map((code) => renderCitationMatch(code, bySeitencode.get(code), (m) => m.sektion)).join(", ")}]`;
	});
}
//#endregion
//#region src/citations/reference-citations.ts
function linkifyReferenceCitations(text, citations) {
	const referenceBlocks = citations.filter((b) => !b.seitencode);
	if (referenceBlocks.length === 0) return text;
	const byTitel = /* @__PURE__ */ new Map();
	for (const block of referenceBlocks) {
		const list = byTitel.get(block.titel);
		if (list) list.push(block);
		else byTitel.set(block.titel, [block]);
	}
	return text.replace(/\[Referenz:\s*([^\]]+)\]/gi, (whole, inner) => {
		const titel = inner.trim();
		if (!titel) return whole;
		return `[Referenz: ${renderCitationMatch(titel, byTitel.get(titel), (m) => m.notePath)}]`;
	});
}
//#endregion
//#region src/citations/web-citations.ts
var LEADING_LIST_MARKER_RE = /^([ \t]*(?:[-*+]|\d+[.)])[ \t]+)/;
function safeLineContentSpan(text, pos) {
	let lineStart = pos;
	while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;
	let lineEnd = pos;
	while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;
	const line = text.slice(lineStart, lineEnd);
	const markerMatch = LEADING_LIST_MARKER_RE.exec(line);
	return [lineStart + (markerMatch ? markerMatch[0].length : 0), lineEnd];
}
function linkifyWebCitations(text, chunks, supports) {
	if (chunks.length === 0 || supports.length === 0) return text;
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const bytes = encoder.encode(text);
	function byteOffsetToStringIndex(byteIdx) {
		const clamped = Math.max(0, Math.min(byteIdx, bytes.length));
		return decoder.decode(bytes.subarray(0, clamped)).length;
	}
	function firstValidUrl(chunkIndices) {
		for (const i of chunkIndices) {
			const uri = chunks[i]?.uri;
			if (uri) return uri;
		}
		return null;
	}
	const insertions = [];
	for (const support of supports) {
		const url = firstValidUrl(support.chunkIndices);
		if (!url) continue;
		const [contentStart, lineEnd] = safeLineContentSpan(text, byteOffsetToStringIndex(support.startIndex));
		if (lineEnd <= contentStart) continue;
		insertions.push({
			start: contentStart,
			end: lineEnd,
			url
		});
	}
	if (insertions.length === 0) return text;
	insertions.sort((a, b) => b.start - a.start);
	let result = text;
	let earliestAppliedStart = Infinity;
	for (const ins of insertions) {
		if (ins.end > earliestAppliedStart) continue;
		const middle = result.slice(ins.start, ins.end);
		if (!middle.trim()) continue;
		result = `${result.slice(0, ins.start)}[${middle}](${ins.url})${result.slice(ins.end)}`;
		earliestAppliedStart = ins.start;
	}
	return result;
}
function buildWebCitationSnippets(chunks, supports) {
	const snippets = /* @__PURE__ */ new Map();
	for (const support of supports) {
		if (!support.text) continue;
		for (const i of support.chunkIndices) {
			const uri = chunks[i]?.uri;
			if (uri && !snippets.has(uri)) snippets.set(uri, support.text);
		}
	}
	return snippets;
}
//#endregion
//#region src/view/render-citations.ts
function renderManualCitations(turnEl, turn, app, component) {
	if (!turn.citations || turn.citations.length === 0) return;
	const citeEl = turnEl.createDiv({ cls: "rag-chat-citations" });
	citeEl.createSpan({ text: "Quellen (Handbuch): " });
	for (const block of turn.citations) {
		const label = block.seitencode ? `${block.seitencode} (${block.sektion})` : `${block.titel} (${block.sektion})`;
		const link = citeEl.createEl("a", {
			cls: "rag-chat-citation-link",
			text: label
		});
		component.registerDomEvent(link, "click", (evt) => {
			evt.preventDefault();
			app.workspace.openLinkText(block.notePath, "", false);
		});
	}
}
function renderWebCitations(turnEl, turn) {
	if (!turn.webCitations || turn.webCitations.length === 0) return;
	const snippets = buildWebCitationSnippets(turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
	const webCiteEl = turnEl.createDiv({ cls: "rag-chat-citations rag-chat-web-citations" });
	webCiteEl.createSpan({ text: "Quellen (Web): " });
	for (const web of turn.webCitations) {
		const row = webCiteEl.createSpan({ cls: "rag-chat-web-citation-row" });
		row.createEl("a", {
			cls: "rag-chat-citation-link rag-chat-web-citation-link",
			text: web.title || web.uri,
			attr: {
				href: web.uri,
				target: "_blank",
				rel: "noopener"
			}
		});
		const snippet = snippets.get(web.uri);
		if (snippet) row.createSpan({
			cls: "rag-chat-web-citation-snippet",
			text: ` – "${snippet}"`
		});
	}
}
//#endregion
//#region src/view/turn-state.ts
function showsStatus(turn) {
	return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.status);
}
function showsStreamingText(turn) {
	return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.streamingText);
}
//#endregion
//#region src/view/render-status-log.ts
var KIND_LABELS = {
	retrieval: "Suche",
	embedding: "Embedding",
	llm_round: "Modell-Runde",
	tool_call: "Werkzeugaufruf",
	clarification: "Rückfrage",
	budget_exhausted: "Budget",
	final_answer: "Antwort"
};
var STATUS_LABELS = {
	running: "läuft …",
	done: "fertig",
	error: "Fehler"
};
function formatDuration(step) {
	if (typeof step.durationMs !== "number") return null;
	return step.durationMs >= 1e3 ? `${(step.durationMs / 1e3).toFixed(1)}s` : `${step.durationMs}ms`;
}
function renderStepMeta(metaEl, step) {
	if (step.round) metaEl.createSpan({
		cls: "rag-chat-step-round",
		text: `Runde ${step.round}`
	});
	if (step.model) metaEl.createSpan({
		cls: "rag-chat-step-model",
		text: `Modell: ${step.model}`
	});
	const duration = formatDuration(step);
	if (duration) metaEl.createSpan({
		cls: "rag-chat-step-duration",
		text: duration
	});
}
function renderJsonDetails(container, summaryText, cls, value) {
	const jsonDetails = container.createEl("details", { cls: `rag-chat-step-json ${cls}` });
	jsonDetails.createEl("summary", { text: summaryText });
	jsonDetails.createEl("pre", { text: JSON.stringify(value, null, 2) });
}
function renderStepBody(bodyEl, step) {
	if (step.narration) bodyEl.createDiv({
		cls: "rag-chat-step-narration",
		text: step.narration
	});
	if (step.errorMessage) bodyEl.createDiv({
		cls: "rag-chat-step-error",
		text: step.errorMessage
	});
	if (step.hits && step.hits.length > 0) {
		const hitsList = bodyEl.createEl("ul", { cls: "rag-chat-step-hits" });
		for (const hit of step.hits) {
			const scoreText = typeof hit.score === "number" ? ` (${hit.score.toFixed(2)})` : "";
			hitsList.createEl("li", { text: `${hit.titel} [${hit.seitencode || "Referenz"}]${scoreText}` });
		}
	}
	if (step.toolArgs && Object.keys(step.toolArgs).length > 0) renderJsonDetails(bodyEl, "Argumente", "rag-chat-step-json-args", step.toolArgs);
	if (step.toolResult) renderJsonDetails(bodyEl, "Ergebnis", "rag-chat-step-json-result", step.toolResult);
}
function fillStepEl(itemEl, step) {
	itemEl.empty();
	itemEl.addClass("rag-chat-step");
	itemEl.addClass(`rag-chat-step-${step.status}`);
	const details = itemEl.createEl("details", { cls: "rag-chat-step-details" });
	if (step.status === "error") details.setAttribute("open", "");
	const summary = details.createEl("summary", { cls: "rag-chat-step-summary" });
	summary.createSpan({
		cls: "rag-chat-step-kind",
		text: KIND_LABELS[step.kind]
	});
	summary.createSpan({
		cls: "rag-chat-step-title",
		text: step.title
	});
	summary.createSpan({
		cls: `rag-chat-step-status rag-chat-step-status-${step.status}`,
		text: STATUS_LABELS[step.status]
	});
	renderStepMeta(details.createDiv({ cls: "rag-chat-step-meta" }), step);
	renderStepBody(details.createDiv({ cls: "rag-chat-step-body" }), step);
}
function renderStatusLog(turnEl, turn) {
	const steps = turn.steps;
	const details = turnEl.createEl("details", { cls: "rag-chat-status-log" });
	const summaryEl = details.createEl("summary", { text: `Rechercheverlauf (${steps.length} Schritte)` });
	const listEl = details.createEl("ul", { cls: "rag-chat-status-log-list" });
	const stepEls = /* @__PURE__ */ new Map();
	for (const step of steps) {
		const itemEl = listEl.createEl("li");
		fillStepEl(itemEl, step);
		stepEls.set(step.id, itemEl);
	}
	return {
		listEl,
		summaryEl,
		stepEls
	};
}
function appendStatusLogLine(elements, turn) {
	const steps = turn.steps;
	if (!steps || steps.length === 0) return;
	for (const step of steps) {
		const existing = elements.stepEls.get(step.id);
		if (existing) fillStepEl(existing, step);
		else {
			const itemEl = elements.listEl.createEl("li");
			fillStepEl(itemEl, step);
			elements.stepEls.set(step.id, itemEl);
		}
	}
	elements.summaryEl.setText(`Rechercheverlauf (${steps.length} Schritte)`);
}
//#endregion
//#region src/view/clipboard.ts
async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
//#endregion
//#region src/view/render-turn-actions.ts
var COPY_ICON_RESET_MS = 1500;
function renderTurnActions(turnEl, turn, component, callbacks) {
	const canCopy = turn.text.length > 0 && !showsStatus(turn);
	if (!canCopy && !turn.retry) return;
	const actionsEl = turnEl.createDiv({ cls: "rag-chat-turn-actions" });
	if (canCopy) {
		const copyButton = actionsEl.createEl("button", {
			cls: "rag-chat-action-button rag-chat-copy-button",
			attr: { "aria-label": "In Zwischenablage kopieren" }
		});
		(0, obsidian.setIcon)(copyButton, "copy");
		component.registerDomEvent(copyButton, "click", () => {
			copyToClipboard(turn.text).then((ok) => {
				(0, obsidian.setIcon)(copyButton, ok ? "check" : "x");
				setTimeout(() => (0, obsidian.setIcon)(copyButton, "copy"), COPY_ICON_RESET_MS);
			});
		});
	}
	if (turn.role === "assistant" && !turn.isClarifying && canCopy) {
		const speaking = callbacks.isSpeaking?.(turn) ?? false;
		const speakButton = actionsEl.createEl("button", {
			cls: "rag-chat-action-button rag-chat-tts-button",
			attr: { "aria-label": speaking ? "Wiedergabe stoppen" : "Antwort vorlesen" }
		});
		if (turn.ttsStatus === "generating") {
			speakButton.disabled = true;
			speakButton.addClass("rag-chat-tts-button-loading");
			(0, obsidian.setIcon)(speakButton, "loader-2");
		} else if (speaking) {
			speakButton.addClass("rag-chat-tts-button-playing");
			(0, obsidian.setIcon)(speakButton, "square");
		} else if (turn.ttsStatus === "error") {
			speakButton.addClass("rag-chat-tts-button-error");
			(0, obsidian.setIcon)(speakButton, "volume-2");
		} else (0, obsidian.setIcon)(speakButton, "volume-2");
		component.registerDomEvent(speakButton, "click", () => callbacks.onSpeak?.(turn));
	}
	if (turn.retry) {
		const retryButton = actionsEl.createEl("button", {
			cls: "rag-chat-action-button rag-chat-retry-button",
			text: "Erneut versuchen"
		});
		component.registerDomEvent(retryButton, "click", () => callbacks.onRetry?.(turn));
		const deleteButton = actionsEl.createEl("button", {
			cls: "rag-chat-action-button rag-chat-delete-button",
			text: "Löschen"
		});
		component.registerDomEvent(deleteButton, "click", () => callbacks.onDelete?.(turn));
	}
}
//#endregion
//#region src/view/wire-links.ts
function wireInternalLinks(el, app, component) {
	const sourcePath = "";
	el.querySelectorAll("a.internal-link").forEach((a) => {
		component.registerDomEvent(a, "click", (evt) => {
			evt.preventDefault();
			const href = a.getAttribute("href");
			if (href) app.workspace.openLinkText(href, sourcePath, obsidian.Keymap.isModEvent(evt));
		});
		component.registerDomEvent(a, "mouseover", (evt) => {
			const href = a.getAttribute("href");
			if (!href) return;
			app.workspace.trigger("hover-link", {
				event: evt,
				source: "preview",
				hoverParent: { hoverPopover: null },
				targetEl: a,
				linktext: href,
				sourcePath
			});
		});
	});
}
//#endregion
//#region src/view/fill-turn.ts
function textElClass(streaming, status) {
	if (streaming) return "rag-chat-turn-text rag-chat-turn-streaming";
	if (status) return "rag-chat-turn-text rag-chat-turn-status";
	return "rag-chat-turn-text";
}
function renderAnswerMarkdown(textEl, turn, app, parentComponent) {
	const renderedText = linkifyReferenceCitations(linkifyCitations(linkifyWebCitations(turn.text, turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []), turn.citations ?? []), turn.citations ?? []);
	const markdownComponent = new obsidian.Component();
	parentComponent.addChild(markdownComponent);
	obsidian.MarkdownRenderer.render(app, renderedText, textEl, "", markdownComponent).then(() => {
		wireInternalLinks(textEl, app, markdownComponent);
	});
	return markdownComponent;
}
function fillTurn(turnEl, turn, app, parentComponent, callbacks) {
	turnEl.empty();
	turnEl.addClass("rag-chat-turn");
	turnEl.addClass(`rag-chat-turn-${turn.role}`);
	if (turn.isClarifying) turnEl.addClass("rag-chat-turn-clarifying");
	const streaming = showsStreamingText(turn);
	const status = !streaming && showsStatus(turn);
	const textEl = turnEl.createDiv({ cls: textElClass(streaming, status) });
	let markdownComponent;
	if (streaming) textEl.setText(turn.streamingText);
	else if (status) textEl.setText(turn.status);
	else if (turn.role === "assistant" && turn.text) markdownComponent = renderAnswerMarkdown(textEl, turn, app, parentComponent);
	else textEl.setText(turn.text);
	if (turn.isClarifying) turnEl.createDiv({
		cls: "rag-chat-clarifying-hint",
		text: "Antworte unten, um fortzufahren."
	});
	renderManualCitations(turnEl, turn, app, parentComponent);
	renderWebCitations(turnEl, turn);
	let statusLogElements;
	if (turn.steps && turn.steps.length > 0) statusLogElements = renderStatusLog(turnEl, turn);
	renderTurnActions(turnEl, turn, parentComponent, callbacks);
	return {
		textEl,
		statusLogElements,
		markdownComponent
	};
}
//#endregion
//#region src/view/render-turns.ts
var NEAR_BOTTOM_THRESHOLD_PX = 80;
function isNearBottom(messagesEl) {
	const el = messagesEl;
	return el.scrollHeight - (el.scrollTop + el.clientHeight) <= NEAR_BOTTOM_THRESHOLD_PX;
}
function storeFilled(result, turn, filled) {
	result.turnEls.set(turn, filled.textEl);
	if (filled.statusLogElements) result.statusLogElements.set(turn, filled.statusLogElements);
	if (filled.markdownComponent) result.markdownComponents.set(turn, filled.markdownComponent);
}
function renderTurnInto(messagesEl, turn, app, component, result, callbacks) {
	const turnEl = messagesEl.createDiv();
	result.turnContainers.set(turn, turnEl);
	storeFilled(result, turn, fillTurn(turnEl, turn, app, component, callbacks));
}
function emptyResult() {
	return {
		turnEls: /* @__PURE__ */ new Map(),
		turnContainers: /* @__PURE__ */ new Map(),
		statusLogElements: /* @__PURE__ */ new Map(),
		markdownComponents: /* @__PURE__ */ new Map()
	};
}
function renderTurns(messagesEl, turns, app, component, callbacks = {}) {
	messagesEl.empty();
	const result = emptyResult();
	for (const turn of turns) renderTurnInto(messagesEl, turn, app, component, result, callbacks);
	messagesEl.scrollTo({ top: messagesEl.scrollHeight });
	return result;
}
function appendNewTurns(messagesEl, turns, app, component, result, callbacks = {}) {
	const newTurns = turns.filter((t) => !result.turnContainers.has(t));
	if (newTurns.length === 0) return;
	const wasNearBottom = isNearBottom(messagesEl);
	for (const turn of newTurns) renderTurnInto(messagesEl, turn, app, component, result, callbacks);
	if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
}
function updateTurn(messagesEl, turn, app, component, result, callbacks = {}) {
	const turnEl = result.turnContainers.get(turn);
	if (!turnEl) return false;
	result.markdownComponents.get(turn)?.unload();
	result.markdownComponents.delete(turn);
	result.statusLogElements.delete(turn);
	const wasNearBottom = isNearBottom(messagesEl);
	storeFilled(result, turn, fillTurn(turnEl, turn, app, component, callbacks));
	if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
	return true;
}
function updateTurnLive(turn, result, messagesEl) {
	const streaming = showsStreamingText(turn);
	const status = !streaming && showsStatus(turn);
	if (!streaming && !status) return false;
	const turnEl = result.turnContainers.get(turn);
	const textEl = result.turnEls.get(turn);
	if (!turnEl || !textEl) return false;
	if (streaming) {
		textEl.removeClass("rag-chat-turn-status");
		textEl.addClass("rag-chat-turn-streaming");
		textEl.setText(turn.streamingText);
	} else {
		textEl.removeClass("rag-chat-turn-streaming");
		textEl.addClass("rag-chat-turn-status");
		textEl.setText(turn.status);
	}
	if (turn.steps && turn.steps.length > 0) {
		const wasNearBottom = isNearBottom(messagesEl);
		let statusLogElements = result.statusLogElements.get(turn);
		if (!statusLogElements) {
			statusLogElements = renderStatusLog(turnEl, turn);
			result.statusLogElements.set(turn, statusLogElements);
		} else appendStatusLogLine(statusLogElements, turn);
		if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
	}
	return true;
}
function unloadAllTurns(result) {
	for (const component of result.markdownComponents.values()) component.unload();
	result.markdownComponents.clear();
}
//#endregion
//#region src/view/tts-device-options.ts
async function refreshTtsDeviceOptions(deps) {
	deps.selectEl.disabled = true;
	deps.setDisabled(true);
	const devices = await listOutputDevices();
	if (deps.isClosed()) return;
	deps.selectEl.empty();
	deps.selectEl.createEl("option", {
		attr: { value: "" },
		text: "Systemstandard"
	});
	const deviceIds = [];
	for (const device of devices) {
		if (!device.deviceId || device.deviceId === "default") continue;
		deviceIds.push(device.deviceId);
		deps.selectEl.createEl("option", {
			attr: { value: device.deviceId },
			text: device.label || `Gerät ${device.deviceId.slice(0, 8)}`
		});
	}
	const hasCurrent = deps.currentDeviceId === "" || deviceIds.includes(deps.currentDeviceId);
	deps.selectEl.value = hasCurrent ? deps.currentDeviceId : "";
	deps.selectEl.disabled = deps.isBusy();
	deps.setDisabled(deps.isBusy());
}
//#endregion
//#region src/view/tts-controls-controller.ts
var TtsControlsController = class {
	constructor(els, plugin, isClosed, isBusy) {
		this.els = els;
		this.plugin = plugin;
		this.isClosed = isClosed;
		this.isBusy = isBusy;
	}
	syncFromSettings() {
		this.els.volumeSliderEl.value = String(this.plugin.settings.ttsVolume);
		this.updateVolumeLabel();
		this.updateCharCounter();
		this.updateVisibility();
	}
	updateVisibility() {
		this.els.controlsRow.toggleClass("rag-chat-hidden", !this.plugin.settings.ttsEnabled);
	}
	updateVolumeLabel() {
		const pct = Math.round(Number(this.els.volumeSliderEl.value) * 100);
		this.els.volumeLabelEl.setText(`${pct}%`);
	}
	updateCharCounter() {
		const used = this.plugin.settings.ttsCharCount.toLocaleString("de-DE");
		const limit = TTS_FREE_TIER_CHAR_LIMIT.toLocaleString("de-DE");
		this.els.charCounterEl.setText(`${used} / ${limit} Zeichen (Freikontingent)`);
	}
	refreshDevices() {
		return refreshTtsDeviceOptions({
			selectEl: this.els.deviceSelectEl,
			currentDeviceId: this.plugin.settings.ttsOutputDeviceId,
			isClosed: this.isClosed,
			isBusy: this.isBusy,
			setDisabled: (disabled) => {
				this.els.deviceRefreshButton.disabled = disabled;
			}
		});
	}
	async commitVolume() {
		this.plugin.settings.ttsVolume = Number(this.els.volumeSliderEl.value);
		await this.plugin.saveSettings();
	}
	async commitDevice() {
		this.plugin.settings.ttsOutputDeviceId = this.els.deviceSelectEl.value;
		await this.plugin.saveSettings();
	}
	onVolumeInput() {
		setVolume(Number(this.els.volumeSliderEl.value));
		this.updateVolumeLabel();
	}
};
//#endregion
//#region src/http/read-json.ts
function readResponseJson(response) {
	try {
		return response.json;
	} catch (err) {
		throw new Error(`Antwort konnte nicht als JSON gelesen werden: ${err instanceof Error ? err.message : String(err)}`);
	}
}
//#endregion
//#region src/tts/client.ts
var ACCESS_DENIED_MESSAGE = "Zugriff verweigert - Cloud Text-to-Speech API und Billing im Projekt dieses API-Keys aktivieren.";
async function synthesizeSpeech(text, settings, opts) {
	const apiKey = settings.ttsApiKey;
	if (!apiKey) throw new Error("TTS Google API key is required - set it in RAG Chat settings.");
	const url = "https://texttospeech.googleapis.com/v1/text:synthesize";
	const body = {
		input: { text },
		voice: {
			languageCode: settings.ttsLanguageCode,
			name: settings.ttsVoiceName
		},
		audioConfig: { audioEncoding: "MP3" }
	};
	let response;
	try {
		response = await requestUrlWithRetry({
			url,
			method: "POST",
			headers: {
				"X-Goog-Api-Key": apiKey,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		}, {
			label: "Sprachsynthese",
			signal: opts?.signal
		});
	} catch (err) {
		if ((err instanceof Error ? err.message : String(err)).includes("status 403")) throw new Error(ACCESS_DENIED_MESSAGE);
		throw err;
	}
	const json = readResponseJson(response);
	const audioContent = json?.audioContent;
	if (typeof audioContent !== "string" || audioContent.length === 0) throw new Error(`Unexpected text:synthesize response shape: ${JSON.stringify(json).slice(0, 300)}`);
	return audioContent;
}
//#endregion
//#region src/gemini/generate.ts
async function generatePlainText(contents, settings, opts) {
	requireApiKey(settings.geminiApiKey);
	const url = modelUrl(settings.generationModel, "generateContent");
	const body = {
		contents,
		generationConfig: buildThinkingConfig(settings.generationModel, false)
	};
	const json = readResponseJson(await requestUrlWithRetry({
		url,
		method: "POST",
		headers: {
			"x-goog-api-key": settings.geminiApiKey,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	}, {
		label: "Kurzantwort",
		signal: opts?.signal
	}));
	const candidate = json?.candidates?.[0];
	const parts = candidate?.content?.parts ?? [];
	if (parts.length === 0) {
		const msg = blockReasonMessage(json, candidate);
		if (msg) throw new Error(msg);
		throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(json).slice(0, 300)}`);
	}
	return parts.map((p) => p.text ?? "").join("").trim();
}
//#endregion
//#region src/tts/short-answer.ts
var CITATION_MARKUP_PATTERN = /\[Seite\s+[^\]]+\]|\[Referenz:\s*[^\]]+\]/i;
var SHORT_ANSWER_PROMPT = "Fasse die folgende Antwort für eine Sprachausgabe in 1-2 kurzen, klaren Sätzen zusammen. Behalte exakte Zahlen, Einheiten und Anzugsdrehmomente unverändert bei. Keine Zitatmarker, keine Seitencodes, keine Markdown-Symbole.";
async function buildShortAnswer(longText, settings, opts) {
	const trimmed = longText.trim();
	if (trimmed.length <= 240 && !CITATION_MARKUP_PATTERN.test(trimmed)) return trimmed;
	return (await generatePlainText([{
		role: "user",
		parts: [{ text: `${SHORT_ANSWER_PROMPT}\n\n---\n\n${trimmed}` }]
	}], settings, opts)).trim();
}
//#endregion
//#region src/tts/usage.ts
async function recordCharsUsed(plugin, charCount) {
	plugin.settings.ttsCharCount += charCount;
	await plugin.saveSettings();
}
//#endregion
//#region src/view/turn-speech.ts
function errText$1(err) {
	return err instanceof Error ? err.message : String(err);
}
var TurnSpeech = class {
	constructor(host) {
		this.host = host;
		this.playingTurn = null;
		this.speculativeAudio = /* @__PURE__ */ new WeakMap();
	}
	isSpeaking(turn) {
		return this.playingTurn === turn;
	}
	stop() {
		stop();
		this.playingTurn = null;
	}
	beginStreamingSpeech(turn, shortText, signal) {
		if (!shortText) return;
		if (!turn.originatedFromVoice && !this.host.plugin().settings.ttsEnabled) return;
		const promise = synthesizeSpeech(shortText, this.host.plugin().settings, { signal }).catch(() => null);
		this.speculativeAudio.set(turn, promise);
	}
	async handleSpeakClick(turn) {
		if (this.playingTurn === turn) {
			stop();
			this.playingTurn = null;
			this.host.syncTurn(turn);
			return;
		}
		if (turn.ttsStatus === "generating") return;
		if (turn.ttsAudioBase64) {
			this.playTurnAudio(turn, turn.ttsAudioBase64);
			return;
		}
		await this.synthesizeAndPlay(turn);
	}
	async synthesizeAndPlay(turn, signal) {
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
			this.playTurnAudio(turn, audio);
		} catch (err) {
			turn.ttsStatus = "error";
			if (!this.host.isClosed()) {
				this.host.syncTurn(turn);
				new obsidian.Notice(`RAG Chat: Sprachausgabe fehlgeschlagen (${errText$1(err)}).`);
			}
		}
	}
	async resolveSpeech(turn, signal) {
		if (turn.ttsShortAnswer) {
			const audio = await this.speculativeAudio.get(turn) ?? await synthesizeSpeech(turn.ttsShortAnswer, this.host.plugin().settings, { signal });
			return {
				shortText: turn.ttsShortAnswer,
				audio
			};
		}
		const shortText = await buildShortAnswer(turn.text, this.host.plugin().settings, { signal });
		return {
			shortText,
			audio: await synthesizeSpeech(shortText, this.host.plugin().settings, { signal })
		};
	}
	async playTurnAudio(turn, audioBase64) {
		setOnEnded(() => {
			if (this.playingTurn !== turn) return;
			this.playingTurn = null;
			if (!this.host.isClosed()) this.host.syncTurn(turn);
		});
		this.playingTurn = turn;
		try {
			await play(audioBase64, {
				deviceId: this.host.plugin().settings.ttsOutputDeviceId,
				volume: this.host.plugin().settings.ttsVolume
			});
		} catch (err) {
			this.playingTurn = null;
			if (!this.host.isClosed()) new obsidian.Notice(`RAG Chat: Wiedergabe fehlgeschlagen (${errText$1(err)}).`);
		}
		if (!this.host.isClosed()) this.host.syncTurn(turn);
	}
};
//#endregion
//#region src/view/ui/composer.ts
function optionToggle(inputRow, title, label) {
	const toggleLabel = inputRow.createEl("label", {
		cls: "rag-chat-option-toggle",
		attr: { title }
	});
	const checkbox = toggleLabel.createEl("input", {
		cls: "rag-chat-option-checkbox",
		attr: { type: "checkbox" }
	});
	toggleLabel.createSpan({ text: label });
	return checkbox;
}
function buildComposer(container) {
	const clarificationRow = container.createDiv({ cls: "rag-chat-clarification-row" });
	const cancelClarificationButton = clarificationRow.createEl("button", {
		cls: "rag-chat-cancel-clarification rag-chat-hidden",
		text: "Rückfrage abbrechen"
	});
	const inputEl = container.createDiv({ cls: "rag-chat-input-row" }).createEl("textarea", {
		cls: "rag-chat-input",
		attr: { placeholder: "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)" }
	});
	const controlsRow = container.createDiv({ cls: "rag-chat-input-controls" });
	const thinkingCheckboxEl = optionToggle(controlsRow, "Lässt das Modell vor der Antwort nachdenken - genauer, aber spürbar langsamer.", "Denken");
	const webSearchCheckboxEl = optionToggle(controlsRow, "Erlaubt dem Modell, das Web nach zusätzlichem Kontext zu durchsuchen - fügt Latenz hinzu.", "Websuche");
	const ttsToggleLabel = controlsRow.createEl("label", { cls: "rag-chat-tts-toggle" });
	const ttsCheckboxEl = ttsToggleLabel.createEl("input", {
		cls: "rag-chat-tts-checkbox",
		attr: { type: "checkbox" }
	});
	ttsToggleLabel.createSpan({ text: "Sprachausgabe" });
	const micButton = controlsRow.createEl("button", {
		cls: "rag-chat-mic-button",
		attr: {
			type: "button",
			"aria-label": "Gedrückt halten, um eine Sprachnachricht aufzunehmen (oder Strg+Alt+Umschalt+F12)",
			title: "Gedrückt halten, um eine Sprachnachricht aufzunehmen (oder Strg+Alt+Umschalt+F12)"
		}
	});
	(0, obsidian.setIcon)(micButton, "mic");
	return {
		clarificationRow,
		cancelClarificationButton,
		inputEl,
		micButton,
		sendButton: controlsRow.createEl("button", {
			cls: "rag-chat-send",
			text: "Fragen"
		}),
		thinkingCheckboxEl,
		webSearchCheckboxEl,
		ttsCheckboxEl
	};
}
//#endregion
//#region src/view/ui/toolbar.ts
function buildToolbar(container) {
	const toolbarRow = container.createDiv({ cls: "rag-chat-toolbar-row" });
	const modelControls = toolbarRow.createDiv({ cls: "rag-chat-model-controls" });
	const modelSelectEl = modelControls.createEl("select", { cls: "rag-chat-model-select" });
	const modelRefreshButton = modelControls.createEl("button", {
		cls: "rag-chat-model-refresh",
		attr: { "aria-label": "Modellliste aktualisieren" }
	});
	(0, obsidian.setIcon)(modelRefreshButton, "refresh-cw");
	return {
		modelSelectEl,
		modelRefreshButton,
		clearButton: toolbarRow.createEl("button", {
			cls: "rag-chat-clear-button",
			text: "Chat leeren"
		})
	};
}
//#endregion
//#region src/view/ui/tts-controls.ts
function buildTtsControls(container) {
	const controlsRow = container.createEl("details", { cls: "rag-chat-tts-controls" });
	controlsRow.createEl("summary", {
		cls: "rag-chat-tts-controls-summary",
		text: "Sprachausgabe-Einstellungen"
	});
	const body = controlsRow.createDiv({ cls: "rag-chat-tts-controls-body" });
	const deviceGroup = body.createDiv({ cls: "rag-chat-tts-device" });
	const deviceSelectEl = deviceGroup.createEl("select");
	const deviceRefreshButton = deviceGroup.createEl("button", { attr: { "aria-label": "Audioausgabegeräte aktualisieren" } });
	(0, obsidian.setIcon)(deviceRefreshButton, "refresh-cw");
	const volumeGroup = body.createDiv({ cls: "rag-chat-tts-volume" });
	return {
		controlsRow,
		deviceSelectEl,
		deviceRefreshButton,
		volumeSliderEl: volumeGroup.createEl("input", { attr: {
			type: "range",
			min: "0",
			max: "1",
			step: "0.05"
		} }),
		volumeLabelEl: volumeGroup.createSpan({ cls: "rag-chat-tts-volume-label" }),
		charCounterEl: body.createDiv({ cls: "rag-chat-tts-char-counter" })
	};
}
//#endregion
//#region src/view/view.ts
var RAG_CHAT_VIEW_TYPE = "rag-chat-view";
/** Recordings shorter than this are treated as accidental taps and silently discarded. */
var MIN_RECORDING_MS = 300;
function errText(err) {
	return err instanceof Error ? err.message : String(err);
}
function emptyRenderResult() {
	return {
		turnEls: /* @__PURE__ */ new Map(),
		turnContainers: /* @__PURE__ */ new Map(),
		statusLogElements: /* @__PURE__ */ new Map(),
		markdownComponents: /* @__PURE__ */ new Map()
	};
}
var RagChatView = class extends obsidian.ItemView {
	constructor(leaf, plugin) {
		super(leaf);
		this.session = createChatSessionState();
		this.busy = false;
		this.rendered = emptyRenderResult();
		this.closed = false;
		this.abortController = null;
		this.recording = false;
		this.recorder = null;
		this.recordingStartedAt = 0;
		this.speech = new TurnSpeech({
			plugin: () => this.plugin,
			isClosed: () => this.closed,
			syncTurn: (turn) => this.syncTurn(turn),
			onCharCounterChanged: () => this.ttsController.updateCharCounter()
		});
		this.turnCallbacks = {
			onRetry: (turn) => void this.handleRetryClick(turn),
			onDelete: (turn) => this.handleDeleteClick(turn),
			onSpeak: (turn) => void this.speech.handleSpeakClick(turn),
			isSpeaking: (turn) => this.speech.isSpeaking(turn)
		};
		this.plugin = plugin;
	}
	getViewType() {
		return RAG_CHAT_VIEW_TYPE;
	}
	getDisplayText() {
		return "RAG Chat";
	}
	getIcon() {
		return "message-circle-question";
	}
	async onOpen() {
		this.closed = false;
		const container = this.contentEl;
		container.empty();
		container.addClass("rag-chat-container");
		this.toolbar = buildToolbar(container);
		this.messagesEl = container.createDiv({ cls: "rag-chat-messages" });
		this.composer = buildComposer(container);
		this.ttsControls = buildTtsControls(container);
		this.ttsController = new TtsControlsController(this.ttsControls, this.plugin, () => this.closed, () => this.busy);
		this.wireToolbar();
		this.wireComposer();
		this.wireMic();
		this.wireTtsControls();
		this.composer.thinkingCheckboxEl.checked = this.plugin.settings.thinkingEnabled;
		this.composer.webSearchCheckboxEl.checked = this.plugin.settings.webSearchEnabled;
		this.composer.ttsCheckboxEl.checked = this.plugin.settings.ttsEnabled;
		this.ttsController.syncFromSettings();
		this.ttsController.refreshDevices();
		this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
		this.updateClarificationAffordance();
		this.refreshModelOptions();
	}
	wireToolbar() {
		this.registerDomEvent(this.toolbar.modelSelectEl, "change", () => void this.handleModelChange());
		this.registerDomEvent(this.toolbar.modelRefreshButton, "click", () => void this.refreshModelOptions());
		this.registerDomEvent(this.toolbar.clearButton, "click", () => void this.handleClearClick());
	}
	wireComposer() {
		const c = this.composer;
		this.registerDomEvent(c.cancelClarificationButton, "click", () => {
			abandonPendingClarification(this.session);
			this.updateClarificationAffordance();
			c.inputEl.placeholder = inputPlaceholder(this.session);
		});
		this.registerDomEvent(c.inputEl, "keydown", (evt) => {
			if (evt.key === "Enter" && !evt.shiftKey) {
				evt.preventDefault();
				this.handleSend();
			}
		});
		this.registerDomEvent(c.sendButton, "click", () => {
			if (this.busy) this.handleCancelClick();
			else this.handleSend();
		});
		this.registerDomEvent(c.thinkingCheckboxEl, "change", () => {
			this.plugin.settings.thinkingEnabled = c.thinkingCheckboxEl.checked;
			this.plugin.saveSettings();
		});
		this.registerDomEvent(c.webSearchCheckboxEl, "change", () => {
			this.plugin.settings.webSearchEnabled = c.webSearchCheckboxEl.checked;
			this.plugin.saveSettings();
		});
		this.registerDomEvent(c.ttsCheckboxEl, "change", () => {
			this.plugin.settings.ttsEnabled = c.ttsCheckboxEl.checked;
			this.plugin.saveSettings();
			this.ttsController.updateVisibility();
		});
	}
	wireMic() {
		const c = this.composer;
		const start = (evt) => {
			evt.preventDefault();
			this.startVoiceRecording();
		};
		const stop = () => {
			if (this.recording) this.stopVoiceRecordingAndSend();
		};
		this.registerDomEvent(c.micButton, "mousedown", start);
		this.registerDomEvent(c.micButton, "mouseup", stop);
		this.registerDomEvent(c.micButton, "mouseleave", stop);
		if (typeof window !== "undefined") {
			this.registerDomEvent(window, "mouseup", stop);
			this.registerDomEvent(window, "blur", stop);
		}
	}
	startVoiceRecording() {
		if (this.closed || this.busy || this.recording) return;
		this.recording = true;
		this.recordingStartedAt = Date.now();
		this.composer.micButton.addClass("is-recording");
		const recorder = new MicRecorder();
		this.recorder = recorder;
		recorder.start(this.plugin.settings.micInputDeviceId || void 0).catch((err) => {
			if (this.recorder !== recorder) return;
			this.recording = false;
			this.recorder = null;
			if (!this.closed) {
				this.composer.micButton.removeClass("is-recording");
				new obsidian.Notice(`RAG Chat: Mikrofonzugriff fehlgeschlagen (${errText(err)}).`);
			}
		});
	}
	async stopVoiceRecordingAndSend() {
		if (!this.recording || !this.recorder) return;
		this.recording = false;
		this.composer.micButton.removeClass("is-recording");
		const recorder = this.recorder;
		this.recorder = null;
		const startedAt = this.recordingStartedAt;
		let blob;
		try {
			blob = await recorder.stop();
		} catch (err) {
			if (!this.closed) new obsidian.Notice(`RAG Chat: Aufnahme fehlgeschlagen (${errText(err)}).`);
			return;
		}
		if (this.closed) return;
		if (!blob || Date.now() - startedAt < MIN_RECORDING_MS) return;
		if (this.busy) return;
		try {
			const { base64, mimeType } = await blobToWavBase64(blob);
			if (this.closed) return;
			await this.runChatAction((deps) => sendVoiceMessage(this.session, {
				base64Audio: base64,
				mimeType
			}, deps));
		} catch (err) {
			if (!this.closed) new obsidian.Notice(`RAG Chat: Sprachaufnahme fehlgeschlagen (${errText(err)}).`);
		}
	}
	wireTtsControls() {
		const t = this.ttsControls;
		this.registerDomEvent(t.deviceSelectEl, "change", () => void this.ttsController.commitDevice());
		this.registerDomEvent(t.deviceRefreshButton, "click", () => void this.ttsController.refreshDevices());
		this.registerDomEvent(t.volumeSliderEl, "input", () => this.ttsController.onVolumeInput());
		this.registerDomEvent(t.volumeSliderEl, "change", () => void this.ttsController.commitVolume());
	}
	async onClose() {
		this.closed = true;
		this.abortController?.abort();
		this.speech.stop();
		unloadAllTurns(this.rendered);
		this.contentEl.empty();
	}
	onunload() {
		this.closed = true;
		this.abortController?.abort();
	}
	clearChat() {
		this.abortController?.abort();
		unloadAllTurns(this.rendered);
		this.session = createChatSessionState();
		this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
		this.updateClarificationAffordance();
		this.composer.inputEl.placeholder = inputPlaceholder(this.session);
	}
	async handleClearClick() {
		const confirmed = await confirmModal(this.app, "Chat leeren? Der bisherige Verlauf geht verloren.");
		if (this.closed) return;
		if (confirmed) this.clearChat();
		this.composer.inputEl.focus();
	}
	setBusy(busy) {
		this.busy = busy;
		this.composer.sendButton.setText(busy ? "Abbrechen" : "Fragen");
		this.composer.micButton.disabled = busy;
		this.toolbar.modelSelectEl.disabled = busy;
		this.toolbar.modelRefreshButton.disabled = busy;
	}
	refreshModelOptions() {
		return refreshModelOptions({
			selectEl: this.toolbar.modelSelectEl,
			apiKey: this.plugin.settings.geminiApiKey,
			currentModel: this.plugin.settings.generationModel,
			isClosed: () => this.closed,
			isBusy: () => this.busy,
			setDisabled: (disabled) => {
				this.toolbar.modelRefreshButton.disabled = disabled;
			}
		});
	}
	async handleModelChange() {
		const value = this.toolbar.modelSelectEl.value;
		if (!value || value === this.plugin.settings.generationModel) return;
		this.plugin.settings.generationModel = value;
		await this.plugin.saveSettings();
	}
	async handleCancelClick() {
		const confirmed = await confirmModal(this.app, "Anfrage wirklich abbrechen?");
		if (this.closed) return;
		if (confirmed) this.abortController?.abort();
		this.composer.inputEl.focus();
	}
	updateClarificationAffordance() {
		this.composer.cancelClarificationButton.toggleClass("rag-chat-hidden", this.session.pendingAgentState === null);
	}
	syncTurn(turn) {
		if (!updateTurn(this.messagesEl, turn, this.app, this, this.rendered, this.turnCallbacks)) appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered, this.turnCallbacks);
	}
	syncTurnLive(turn) {
		if (!updateTurnLive(turn, this.rendered, this.messagesEl)) this.syncTurn(turn);
	}
	rebuildTurns() {
		unloadAllTurns(this.rendered);
		this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
	}
	async runChatAction(action, opts) {
		if (this.busy) return;
		this.setBusy(true);
		const controller = new AbortController();
		this.abortController = controller;
		let currentTurn = null;
		let cancelled = false;
		try {
			await action({
				settings: this.plugin.settings,
				vault: this.app.vault,
				getIndices: async () => getIndices(this.plugin.getPluginDirFullPath(), await this.plugin.getManifest()),
				getFuzzyApi: () => getFuzzySearchApi(this.app),
				signal: controller.signal,
				onTurnStarted: (turn) => {
					if (this.closed) return;
					currentTurn = turn;
					if (opts?.fullRerenderOnStart) this.rebuildTurns();
					else appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered, this.turnCallbacks);
				},
				onStep: () => {
					if (this.closed || !currentTurn) return;
					this.syncTurnLive(currentTurn);
				},
				onTextDelta: () => {
					if (this.closed || !currentTurn) return;
					this.syncTurnLive(currentTurn);
				},
				onShortAnswerReady: (turn) => {
					if (this.closed) return;
					this.speech.beginStreamingSpeech(turn, turn.ttsShortAnswer ?? "", controller.signal);
				},
				onTranscriptReady: (turn) => {
					if (this.closed) return;
					this.syncTurn(turn);
				},
				onError: (message) => {
					if (this.closed) return;
					new obsidian.Notice(`RAG Chat error: ${message}`);
				},
				onCancelled: (originalMessage) => {
					cancelled = true;
					if (this.closed) return;
					this.rebuildTurns();
					this.composer.inputEl.value = originalMessage;
					this.composer.inputEl.focus();
					new obsidian.Notice("Anfrage abgebrochen.");
				},
				onTurnDone: (turn) => {
					if (this.closed) return;
					if (!turn.originatedFromVoice && !this.plugin.settings.ttsEnabled) return;
					this.speech.synthesizeAndPlay(turn, controller.signal);
				},
				onClarificationReady: (turn) => {
					if (this.closed) return;
					if (!turn.originatedFromVoice && !this.plugin.settings.ttsEnabled) return;
					this.speech.synthesizeAndPlay(turn, controller.signal);
				}
			});
		} finally {
			if (this.abortController === controller) this.abortController = null;
			if (!this.closed) {
				if (!cancelled && currentTurn) this.syncTurn(currentTurn);
				this.updateClarificationAffordance();
				this.setBusy(false);
				this.composer.inputEl.placeholder = inputPlaceholder(this.session);
			}
		}
	}
	async handleSend(overrideMessage, opts) {
		if (this.busy) return;
		const message = (overrideMessage ?? this.composer.inputEl.value).trim();
		if (!message) return;
		this.composer.inputEl.value = "";
		await this.runChatAction((deps) => sendMessage(this.session, message, deps, opts));
	}
	async handleRetryClick(turn) {
		await this.runChatAction((deps) => retryTurn(this.session, turn, deps), { fullRerenderOnStart: true });
	}
	handleDeleteClick(turn) {
		if (this.busy) return;
		const message = discardFailedTurn(this.session, turn);
		if (message === null) return;
		this.rebuildTurns();
		this.composer.inputEl.value = message;
		this.composer.inputEl.focus();
		this.updateClarificationAffordance();
		this.composer.inputEl.placeholder = inputPlaceholder(this.session);
	}
};
//#endregion
//#region src/plugin/paths.ts
function getPluginDir(manifest) {
	return manifest.dir ?? `.obsidian/plugins/${manifest.id}`;
}
function getPluginDirFullPath(vault, manifest) {
	const relPath = getPluginDir(manifest);
	if (vault.adapter instanceof obsidian.FileSystemAdapter) return vault.adapter.getFullPath(relPath);
	return relPath;
}
//#endregion
//#region src/retrieval/manifest.ts
async function readManifest(vault, pluginDir) {
	const relPath = `${pluginDir}/rag-manifest.json`;
	const raw = await vault.adapter.read(relPath);
	return JSON.parse(raw);
}
//#endregion
//#region src/main.ts
var PUSH_TO_TALK_KEY = "F12";
var RagChatPlugin = class extends obsidian.Plugin {
	constructor(..._args) {
		super(..._args);
		this.store = new SettingsStore(this);
		this.manifestCache = null;
		this.pushToTalkActive = false;
		this.handlePushToTalkKeyDown = (evt) => {
			if (!(evt.ctrlKey && evt.altKey && evt.shiftKey && evt.key === PUSH_TO_TALK_KEY)) return;
			evt.preventDefault();
			if (this.pushToTalkActive) return;
			const view = this.getFirstChatView();
			if (!view) {
				new obsidian.Notice("RAG Chat: Bitte zuerst die Chat-Ansicht öffnen.");
				return;
			}
			this.pushToTalkActive = true;
			view.startVoiceRecording();
		};
		this.handlePushToTalkKeyUp = (evt) => {
			if (evt.key !== PUSH_TO_TALK_KEY || !this.pushToTalkActive) return;
			evt.preventDefault();
			this.pushToTalkActive = false;
			this.getFirstChatView()?.stopVoiceRecordingAndSend();
		};
	}
	async onload() {
		await this.loadSettings();
		this.registerView(RAG_CHAT_VIEW_TYPE, (leaf) => new RagChatView(leaf, this));
		this.addRibbonIcon("message-circle-question", "RAG Chat öffnen", () => {
			this.activateView();
		});
		this.addCommand({
			id: "rag-chat-open",
			name: "RAG: Frage stellen",
			callback: () => {
				this.activateView();
			}
		});
		this.addCommand({
			id: "rag-chat-reload-index",
			name: "RAG: Index neu laden",
			callback: () => {
				this.reloadIndex();
			}
		});
		this.addCommand({
			id: "rag-chat-clear",
			name: "RAG: Chat leeren",
			callback: () => {
				for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) if (leaf.view instanceof RagChatView) leaf.view.clearChat();
			}
		});
		this.addSettingTab(new RagChatSettingTab(this.app, this));
		if (typeof window !== "undefined") {
			window.addEventListener("keydown", this.handlePushToTalkKeyDown);
			window.addEventListener("keyup", this.handlePushToTalkKeyUp);
		}
		this.app.workspace.onLayoutReady(() => {
			this.activateView({ focus: false });
		});
		try {
			await this.revalidateManifest();
		} catch (err) {
			new obsidian.Notice(`RAG Chat: konnte rag-manifest.json nicht laden (${err instanceof Error ? err.message : String(err)}). Index ggf. neu bauen.`, 1e4);
		}
	}
	onunload() {
		dispose();
		if (typeof window !== "undefined") {
			window.removeEventListener("keydown", this.handlePushToTalkKeyDown);
			window.removeEventListener("keyup", this.handlePushToTalkKeyUp);
		}
	}
	getFirstChatView() {
		for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) if (leaf.view instanceof RagChatView) return leaf.view;
		return null;
	}
	getPluginDir() {
		return getPluginDir(this.manifest);
	}
	getPluginDirFullPath() {
		return getPluginDirFullPath(this.app.vault, this.manifest);
	}
	async getManifest() {
		if (this.manifestCache) return this.manifestCache;
		this.manifestCache = await readManifest(this.app.vault, this.getPluginDir());
		return this.manifestCache;
	}
	async reloadIndex() {
		this.manifestCache = null;
		clearIndicesCache();
		try {
			await this.getManifest();
			await this.revalidateManifest();
			new obsidian.Notice("RAG Chat: Index-Cache geleert, Manifest neu geladen.", 6e3);
		} catch (err) {
			new obsidian.Notice(`RAG Chat: konnte rag-manifest.json nicht laden (${err instanceof Error ? err.message : String(err)}). Index ggf. neu bauen.`, 1e4);
		}
	}
	async revalidateManifest() {
		const warnings = validateManifest(await this.getManifest(), this.settings);
		for (const w of warnings) new obsidian.Notice(`RAG Chat: ${w}`, 1e4);
	}
	async activateView(options) {
		const focus = options?.focus ?? true;
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
			await leaf.setViewState({
				type: RAG_CHAT_VIEW_TYPE,
				active: focus
			});
		}
		workspace.revealLeaf(leaf);
	}
	async loadSettings() {
		await this.store.load();
		this.settings = this.store.settings;
	}
	async saveSettings() {
		await this.store.save();
	}
};
//#endregion
module.exports = RagChatPlugin;
