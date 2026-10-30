(function () {
  "use strict";

  let calibrationAudioContext = null;
  let activeCalibrationSource = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderFatalError(title, message) {
    document.body.innerHTML = `
      <main class="pcj-screen">
        <section class="pcj-panel pcj-panel--text">
          <h1 class="pcj-title">${escapeHtml(title)}</h1>
          <div class="pcj-message pcj-message--error"><p>${escapeHtml(message)}</p></div>
        </section>
      </main>
    `;
  }

  function makePanel(title, paragraphs, extraHtml) {
    const body = (paragraphs || [])
      .map((p) => `<p class="pcj-text">${escapeHtml(p)}</p>`)
      .join("");
    return `
      <div class="pcj-screen">
        <div class="pcj-panel pcj-panel--text pcj-center">
          <h1 class="pcj-title">${escapeHtml(title)}</h1>
          <div class="pcj-stack">${body}</div>
          ${extraHtml || ""}
        </div>
      </div>
    `;
  }

  function makeGuidedPanel(options) {
    const opts = options || {};
    const steps = (opts.steps || []).map((step, index) => `
      <div class="pcj-guide-step">
        <div class="pcj-guide-number">${index + 1}</div>
        <div class="pcj-guide-copy">
          <div class="pcj-guide-title">${escapeHtml(step.title || "")}</div>
          ${step.text ? `<div class="pcj-guide-text">${escapeHtml(step.text)}</div>` : ""}
        </div>
      </div>
    `).join("");

    return `
      <div class="pcj-screen">
        <section class="pcj-panel pcj-panel--text pcj-friendly-panel">
          ${opts.kicker ? `<div class="pcj-study-kicker">${escapeHtml(opts.kicker)}</div>` : ""}
          <h1 class="pcj-title pcj-friendly-title">${escapeHtml(opts.title || "")}</h1>
          ${opts.lead ? `<p class="pcj-study-lead">${escapeHtml(opts.lead)}</p>` : ""}
          ${steps ? `<div class="pcj-guide-grid">${steps}</div>` : ""}
          ${opts.note ? `<div class="pcj-friendly-note">${escapeHtml(opts.note)}</div>` : ""}
          ${opts.extraHtml || ""}
        </section>
      </div>
    `;
  }

  function showPreExperimentScreen(options) {
    const opts = options || {};
    const shownAt = new Date().toISOString();
    const panelClass = opts.centered ? " pcj-entry-panel" : "";

    return new Promise((resolve) => {
      document.body.innerHTML = `
        <div class="jspsych-display-element" style="width:100%;min-height:100vh;">
          <div class="jspsych-content-wrapper"><div class="jspsych-content">
            <main class="pcj-screen">
              <section class="pcj-panel pcj-panel--text pcj-friendly-panel${panelClass}">
                ${opts.kicker ? `<div class="pcj-study-kicker">${escapeHtml(opts.kicker)}</div>` : ""}
                <h1 class="pcj-title pcj-friendly-title">${escapeHtml(opts.title || "")}</h1>
                ${opts.lead ? `<p class="pcj-study-lead">${escapeHtml(opts.lead)}</p>` : ""}
                ${opts.bodyHtml || ""}
                ${opts.note ? `<div class="pcj-friendly-note">${escapeHtml(opts.note)}</div>` : ""}
                <div class="pcj-entry-actions">
                  <button id="pcj-pre-experiment-continue" class="jspsych-btn" type="button">${escapeHtml(opts.buttonLabel || "Continuer")}</button>
                </div>
              </section>
            </main>
          </div></div>
        </div>
      `;

      const button = document.getElementById("pcj-pre-experiment-continue");
      button.addEventListener("click", () => {
        resolve({
          shown_at_iso: shownAt,
          continued_at_iso: new Date().toISOString()
        });
      }, { once: true });
      button.focus();
    });
  }

  async function playCalibrationNoise(options) {
    const opts = options || {};
    const durationMs = Number.isFinite(Number(opts.duration_ms)) ? Number(opts.duration_ms) : 2500;
    const outputGain = Number.isFinite(Number(opts.gain)) ? Number(opts.gain) : 0.055;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error("Web Audio is unavailable in this browser.");
    }

    if (!calibrationAudioContext) {
      calibrationAudioContext = new AudioContextCtor();
    }
    if (calibrationAudioContext.state === "suspended") {
      await calibrationAudioContext.resume();
    }

    if (activeCalibrationSource) {
      try {
        activeCalibrationSource.stop();
      } catch (_) {
        // The previous source may already have ended.
      }
      activeCalibrationSource = null;
    }

    const sampleRate = calibrationAudioContext.sampleRate;
    const frameCount = Math.max(1, Math.round(sampleRate * durationMs / 1000));
    const buffer = calibrationAudioContext.createBuffer(1, frameCount, sampleRate);
    const channel = buffer.getChannelData(0);
    const fadeSamples = Math.max(1, Math.round(sampleRate * 0.06));
    let seed = 20260826;

    for (let i = 0; i < frameCount; i += 1) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const white = (seed / 4294967296) * 2 - 1;
      const fadeIn = Math.min(1, i / fadeSamples);
      const fadeOut = Math.min(1, (frameCount - i - 1) / fadeSamples);
      channel[i] = white * Math.min(fadeIn, fadeOut);
    }

    const source = calibrationAudioContext.createBufferSource();
    const highpass = calibrationAudioContext.createBiquadFilter();
    const lowpass = calibrationAudioContext.createBiquadFilter();
    const gain = calibrationAudioContext.createGain();

    highpass.type = "highpass";
    highpass.frequency.value = 180;
    highpass.Q.value = 0.7;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 5000;
    lowpass.Q.value = 0.7;
    gain.gain.value = outputGain;

    source.buffer = buffer;
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(calibrationAudioContext.destination);

    activeCalibrationSource = source;
    return new Promise((resolve) => {
      source.addEventListener("ended", () => {
        if (activeCalibrationSource === source) activeCalibrationSource = null;
        resolve({ duration_ms: durationMs, gain: outputGain });
      }, { once: true });
      source.start();
    });
  }

  function collectParticipantCode(options) {
    const taskLabel = options && options.taskLabel
      ? options.taskLabel
      : "perception task";
    const defaultCode = options && options.defaultCode
      ? options.defaultCode
      : "";
    const allowTechnical = !options || options.allowTechnical !== false;
    const scientificRules = options && options.scientificRules
      ? options.scientificRules
      : null;
    const uiText = Object.assign({
      title: "Votre code de participation",
      kicker: "Étude",
      instruction: "Saisissez le code de participation qui vous a été communiqué.",
      input_label: "Code de participation",
      continue_label: "Continuer",
      hint: "Le code contient 8 chiffres."
    }, options && options.uiText ? options.uiText : {});
    const panelClass = options && options.centered ? " pcj-entry-panel" : "";

    return new Promise((resolve) => {
      function draw(errors) {
        document.body.innerHTML = `
          <div class="jspsych-display-element" style="width:100%;min-height:100vh;">
            <div class="jspsych-content-wrapper"><div class="jspsych-content">
              <main class="pcj-screen">
                <section class="pcj-panel pcj-panel--narrow pcj-center pcj-friendly-panel${panelClass}">
                  <div class="pcj-study-kicker">${escapeHtml(uiText.kicker)}</div>
                  <h1 class="pcj-title">${escapeHtml(uiText.title)}</h1>
                  <p class="pcj-subtitle">${escapeHtml(taskLabel)}</p>
                  <p class="pcj-text">${escapeHtml(uiText.instruction)}</p>
                  <form id="perception-test-code-form" class="pcj-form">
                    <label class="pcj-label" for="perception-test-code">${escapeHtml(uiText.input_label)}</label>
                    <input id="perception-test-code" class="pcj-input pcj-input--code" inputmode="numeric" autocomplete="off" value="${escapeHtml(defaultCode)}" />
                    <button class="jspsych-btn" type="submit">${escapeHtml(uiText.continue_label)}</button>
                  </form>
                  <div class="pcj-tech-hint">${escapeHtml(uiText.hint)}</div>
                  ${(errors || []).length ? `<div class="pcj-message pcj-message--error">${errors.map((e) => `<p>${escapeHtml(e)}</p>`).join("")}</div>` : ""}
                </section>
              </main>
            </div></div>
          </div>
        `;

        document.getElementById("perception-test-code-form").addEventListener("submit", (event) => {
          event.preventDefault();
          const raw = document.getElementById("perception-test-code").value;
          try {
            const decoded = decodeParticipantCode(raw);
            let validation;

            if (decoded.is_technical_test === true) {
              if (!allowTechnical) {
                draw(["Ce code technique n’est pas accepté pour cette session."]);
                return;
              }
              validation = validateParticipantForTask(decoded, {
                allowedSiteCodes: ["00"],
                allowedPhaseCodes: ["9"],
                allowedGroupCodes: ["9"],
                allowedSexCodes: ["9"],
                requireTechnicalTestCode: true
              });
            } else {
              if (!scientificRules) {
                draw(["Cette configuration accepte uniquement les codes techniques réservés."]);
                return;
              }
              validation = validateParticipantForTask(decoded, scientificRules);
            }

            if (!validation.valid) {
              draw(validation.errors);
              return;
            }
            resolve(decoded);
          } catch (error) {
            draw([error.message]);
          }
        });
      }
      draw([]);
    });
  }

  function collectTechnicalParticipantCode(options) {
    return collectParticipantCode(Object.assign({}, options || {}, {
      allowTechnical: true,
      scientificRules: null
    }));
  }

  function isParticipantActivationValidationRun(decodedCode) {
    if (!decodedCode || decodedCode.is_technical_test === true) return false;
    if (decodedCode.phase_code !== "0" && decodedCode.phase_code !== "1") return false;
    const serial = Number(decodedCode.serial);
    return Number.isInteger(serial) && serial >= 990 && serial <= 999;
  }

  function getPositiveIntegerUrlParam(name, maxValue) {
    const raw = new URLSearchParams(window.location.search).get(name);
    if (raw == null || raw === "") return null;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || (maxValue && value > maxValue)) {
      throw new Error(`Invalid URL parameter ${name}=${raw}.`);
    }
    return value;
  }

  function isFullTechnicalRun() {
    const value = new URLSearchParams(window.location.search).get("full");
    return value === "1" || value === "true";
  }

  function deriveOrderNumber(participantId, poolSize) {
    const override = getPositiveIntegerUrlParam("order", poolSize);
    if (override) return override;
    const serial = Number(String(participantId).slice(-3));
    return ((serial - 1) % poolSize) + 1;
  }

  function padOrder(number) {
    return String(number).padStart(3, "0");
  }

  function mapPerceptionAudioPath(projectRelativePath, options) {
    const repositoryPrefix = "prosody-contact-jspsych/";
    const technicalPrefix = "test_data/perception_placeholders/vn_tones/";
    const scientificPrefix = "docs/stimuli/perception/vn_tones/";
    const opts = typeof options === "string"
      ? { mode: options }
      : (options || {});
    const mode = opts.mode || "technical";

    let raw = String(projectRelativePath || "")
      .replace(/\\/g, "/")
      .replace(/^\.\//, "");

    if (raw.startsWith(repositoryPrefix)) {
      raw = raw.slice(repositoryPrefix.length);
    }

    if (mode === "technical") {
      if (!raw.startsWith(technicalPrefix)) {
        throw new Error(
          `Unexpected technical audio path: ${projectRelativePath}`
        );
      }
      const base = String(
        opts.audioBaseUrl || "/_test_perception/audio/"
      ).replace(/\/?$/, "/");
      return base + raw.slice(technicalPrefix.length);
    }

    if (mode === "scientific") {
      if (!raw.startsWith(scientificPrefix)) {
        throw new Error(
          `Unexpected scientific audio path: ${projectRelativePath}`
        );
      }
      const base = String(
        opts.audioBaseUrl || "/stimuli/perception/vn_tones/"
      ).replace(/\/?$/, "/");
      return base + raw.slice(scientificPrefix.length);
    }

    throw new Error(`Unknown perception audio mode: ${mode}`);
  }

  function mapTechnicalAudioPath(projectRelativePath) {
    return mapPerceptionAudioPath(projectRelativePath, {
      mode: "technical"
    });
  }

  async function loadAudioDurationMs(url) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      const cleanup = () => {
        audio.removeAttribute("src");
        audio.load();
      };
      audio.addEventListener("loadedmetadata", () => {
        const duration = Number(audio.duration);
        cleanup();
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error(`Invalid audio duration for ${url}`));
          return;
        }
        resolve(duration * 1000);
      }, { once: true });
      audio.addEventListener("error", () => {
        cleanup();
        reject(new Error(`Could not read audio metadata: ${url}`));
      }, { once: true });
      audio.src = url;
    });
  }

  async function loadDurationMap(urls) {
    const unique = [...new Set(urls)];
    const entries = await Promise.all(unique.map(async (url) => [url, await loadAudioDurationMs(url)]));
    return new Map(entries);
  }

  function selectRowsPerBlock(rows, limitPerBlock) {
    if (!Number.isInteger(limitPerBlock) || limitPerBlock <= 0) return rows.slice();
    const blocks = [...new Set(rows.map((row) => String(row.block_number)))].sort();
    return blocks.flatMap((block) => rows.filter((row) => String(row.block_number) === block).slice(0, limitPerBlock));
  }

  function makeSessionStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function secureNonce() {
    if (!window.crypto || typeof window.crypto.randomUUID !== "function")
      throw new Error("Secure UUID unavailable; cannot name DataPipe file.");
    return window.crypto.randomUUID().replace(/-/g, "");
  }

  async function saveJsPsychLogs({
    jsPsych,
    participantId,
    taskCode,
    saveTarget,
    saveBackend,
    saveConfigExtras,
    savePhase,
    saveLabel
  }) {
    const stamp = makeSessionStamp();
    const extras = saveConfigExtras || {};
    const backend =
      saveBackend || extras.backend || extras.save_backend || "local";
    const phase = savePhase || "final";
    const label = String(saveLabel || phase)
      .replace(/[^A-Za-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "save";

    const base = (backend === "llf" || backend === "datapipe")
      ? `${participantId}__${taskCode}__${label}__${stamp}`
      : `${participantId}__${taskCode}__${stamp}`;

    const baseForSaving = backend === "datapipe" ? base + "__" + secureNonce() : base;

    const saveConfig = {
      save_logs: true,
      save_audio: false,
      stop_on_save_error: true,
      allow_save_override_from_url: false,
      allow_datapipe_from_localhost: false,
      allow_llf_from_localhost: false,
      ...extras,
      backend
    };

    const liveData = jsPsych.data.get();
    let exportData = liveData;
    let clientUploadId = null;

    if (backend === "llf" || backend === "datapipe") {
      if (
        !liveData ||
        typeof liveData.readOnly !== "function"
      ) {
        throw new Error(
          "LLF saving requires DataCollection.readOnly()."
        );
      }

      exportData = liveData.readOnly();
      if (typeof exportData.push !== "function") {
        throw new Error(
          "LLF saving requires DataCollection.push()."
        );
      }

      const randomPart = (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      )
        ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14);

      clientUploadId =
        `${participantId}-${taskCode}-${label}-${stamp}-${randomPart}`;

      exportData.push({
        participant_id: participantId,
        task: taskCode,
        trial_type: "provenance_marker",
        screen: backend === "datapipe" ? "datapipe_upload_checkpoint" : "llf_upload_checkpoint",
        trial_role: "provenance_marker",
        provenance_event: true,
        provenance_event_type: backend === "datapipe" ? "datapipe_upload_checkpoint" : "llf_upload_checkpoint",
        llf_save_phase: phase,
        llf_save_label: label,
        client_upload_id: clientUploadId,
        llf_upload_started_at_iso: new Date().toISOString(),
        llf_expected_formats: "json,csv",
        hosting_platform: backend === "datapipe" ? "github_pages" : "llf",
        save_transport_backend: backend,
        datapipe_experiment_id: backend === "datapipe" ? saveConfig.datapipe_experiment_id : null,
        llf_endpoint_role: backend === "datapipe" ? "external_datapipe_google_drive" : "dedicated_protected_collection_space",
        llf_transport_mode: backend === "datapipe" ? "datapipe_api_json" : "direct_browser_no_cors",
        llf_delivery_semantics: backend === "datapipe" ? "http_201_stored_or_202_queued" : "browser_dispatched_unconfirmed",
        llf_server_confirmation_available: backend === "datapipe",
        llf_automatic_retry_policy: "none_non_idempotent"
      });
    }

    const json = await window.ProsodySaveRouter.saveText({
      saveConfig,
      filename: baseForSaving + ".json",
      data: exportData.json(),
      localTarget: saveTarget
    });
    const csv = await window.ProsodySaveRouter.saveText({
      saveConfig,
      filename: baseForSaving + ".csv",
      data: exportData.csv(),
      localTarget: saveTarget
    });

    return {
      json,
      csv,
      base: baseForSaving,
      save_phase: phase,
      save_label: label,
      client_upload_id: clientUploadId
    };
  }

  window.ProsodyPerceptionRuntime = Object.freeze({
    escapeHtml,
    renderFatalError,
    makePanel,
    makeGuidedPanel,
    showPreExperimentScreen,
    playCalibrationNoise,
    collectParticipantCode,
    collectTechnicalParticipantCode,
    isParticipantActivationValidationRun,
    isFullTechnicalRun,
    deriveOrderNumber,
    padOrder,
    mapPerceptionAudioPath,
    mapTechnicalAudioPath,
    loadAudioDurationMs,
    loadDurationMap,
    selectRowsPerBlock,
    saveJsPsychLogs
  });
})();