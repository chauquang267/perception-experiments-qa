/**
 * save-router.js
 *
 * Cross-backend save router for Prosody in Contact.
 *
 * Purpose
 * -------
 * Provides one shared interface for experiment code:
 *
 *   ProsodySaveRouter.saveText(...)
 *   ProsodySaveRouter.saveAudioBlob(...)
 *   ProsodySaveRouter.saveAudioResponse(...)
 *
 * It routes saving to:
 *
 *   backend = "local"    -> local server.js helpers
 *   backend = "datapipe" -> DataPipe / OSF helpers
 *   backend = "none"     -> fake success for debugging only
 *
 * Design principle
 * ----------------
 * Real experiment code should not directly call fetch(), DataPipe endpoints,
 * or local-server save routes. It should call this router.
 *
 * Important
 * ---------
 * For audio tasks, save each audio file immediately after the trial,
 * wait for success, then remove base64 audio from the final jsPsych logs.
 */

(function () {
  "use strict";

  const VALID_BACKENDS = ["local", "datapipe", "llf", "none"];

  function nowIsoString() {
    return new Date().toISOString();
  }

  function nowCompactTimestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");

    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds())
    );
  }

  function assertNonEmptyString(value, fieldName) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(fieldName + " must be a non-empty string.");
    }
  }

  function assertObject(value, fieldName) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(fieldName + " must be an object.");
    }
  }

  function normalizeSaveConfig(saveConfig) {
    assertObject(saveConfig, "saveConfig");

    const normalized = Object.assign({
      backend: "local",

      datapipe_experiment_id: null,

      llf_endpoint: null,
      llf_max_attempts: 1,
      llf_retry_delay_ms: 0,

      save_logs: true,
      save_audio: true,

      audio_extension: "webm",
      convert_wav_locally: true,

      remove_audio_base64_from_logs: true,

      allow_save_override_from_url: false,
      allow_datapipe_from_localhost: false,
      allow_llf_from_localhost: false,

      stop_on_save_error: true,
      save_preflight_screen: true
    }, saveConfig);

    if (!VALID_BACKENDS.includes(normalized.backend)) {
      throw new Error(
        "Invalid save backend: " +
        normalized.backend +
        ". Expected one of: " +
        VALID_BACKENDS.join(", ")
      );
    }

    if (normalized.backend === "datapipe") {
      assertNonEmptyString(
        normalized.datapipe_experiment_id,
        "saveConfig.datapipe_experiment_id"
      );
    }

    if (normalized.backend === "llf") {
      assertNonEmptyString(
        normalized.llf_endpoint,
        "saveConfig.llf_endpoint"
      );
      if (normalized.llf_max_attempts !== 1) {
        throw new Error(
          "saveConfig.llf_max_attempts must be exactly 1 for the direct " +
          "LLF no-cors transport; automatic retries are forbidden."
        );
      }
      if (
        !Number.isFinite(normalized.llf_retry_delay_ms) ||
        normalized.llf_retry_delay_ms < 0
      ) {
        throw new Error(
          "saveConfig.llf_retry_delay_ms must be a non-negative number."
        );
      }
    }

    return normalized;
  }

  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function isLocalhost() {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === ""
    );
  }

  /**
   * Apply safe URL override, if allowed.
   *
   * Supported:
   *   ?save=local
   *   ?save=datapipe
   *   ?save=llf
   *   ?save=none
   *
   * This is useful for pilot/sandbox testing but should normally be disabled
   * in main configs.
   */
  function resolveSaveConfig(rawSaveConfig) {
    const config = normalizeSaveConfig(rawSaveConfig);
    const requestedBackend = getUrlParam("save");

    if (requestedBackend) {
      if (!config.allow_save_override_from_url) {
        throw new Error(
          "URL save override was requested (?save=" +
          requestedBackend +
          "), but allow_save_override_from_url is false."
        );
      }

      if (!VALID_BACKENDS.includes(requestedBackend)) {
        throw new Error(
          "Invalid ?save= value: " +
          requestedBackend +
          ". Expected one of: " +
          VALID_BACKENDS.join(", ")
        );
      }

      config.backend = requestedBackend;
    }

    if (config.backend === "datapipe" && isLocalhost()) {
      if (!config.allow_datapipe_from_localhost) {
        throw new Error(
          "DataPipe saving from localhost is blocked by config. " +
          "Set allow_datapipe_from_localhost: true for sandbox/pilot testing."
        );
      }
    }

    if (config.backend === "llf" && isLocalhost()) {
      if (!config.allow_llf_from_localhost) {
        throw new Error(
          "LLF saving from localhost is blocked. " +
          "For a local deployment preview, use ?save=none when the LLF " +
          "technical validation config allows URL save overrides."
        );
      }
    }

    return normalizeSaveConfig(config);
  }

  function makeSkippedSaveResult(kind, filename, reason) {
    return {
      ok: true,
      status: 0,
      save_backend: "none",
      save_kind: kind,
      filename: filename || null,
      skipped: true,
      skip_reason: reason || "Saving skipped because backend is none.",
      upload_started_at: nowIsoString(),
      upload_finished_at: nowIsoString(),
      upload_ms: 0
    };
  }

  function requireSuccess(result, contextLabel) {
    if (!result || !result.ok) {
      const message =
        (contextLabel || "Save") +
        " failed: " +
        (result && result.error_message ? result.error_message : "Unknown save error");

      const error = new Error(message);
      error.save_result = result;
      throw error;
    }

    return result;
  }

  /**
   * Save text-like data.
   *
   * options:
   *   saveConfig
   *   filename
   *   data
   *   localTarget       optional, used by local save utilities if needed
   *   localMetadata     optional
   */
  async function saveText(options) {
    assertObject(options, "options");

    const saveConfig = resolveSaveConfig(options.saveConfig);
    const filename = options.filename;
    const data = options.data;

    assertNonEmptyString(filename, "filename");

    if (!saveConfig.save_logs) {
      return makeSkippedSaveResult("text", filename, "save_logs is false.");
    }

    let result;

    if (saveConfig.backend === "none") {
      result = makeSkippedSaveResult("text", filename);
    }

    else if (saveConfig.backend === "datapipe") {
      if (!window.ProsodyDataPipeSave) {
        throw new Error(
          "ProsodyDataPipeSave is not available. " +
          "Make sure save-utils-online.js is loaded before save-router.js."
        );
      }

      result = await window.ProsodyDataPipeSave.saveDataPipeText({
        experimentID: saveConfig.datapipe_experiment_id,
        filename: filename,
        data: data
      });
    }

    else if (saveConfig.backend === "llf") {
      if (!window.ProsodyLLFSave) {
        throw new Error(
          "ProsodyLLFSave is not available. " +
          "Make sure save-utils-llf.js is loaded before save-router.js."
        );
      }

      result = await window.ProsodyLLFSave.saveText({
        endpoint: saveConfig.llf_endpoint,
        filename: filename,
        data: typeof data === "string" ? data : JSON.stringify(data, null, 2),
        maxAttempts: saveConfig.llf_max_attempts,
        retryDelayMs: saveConfig.llf_retry_delay_ms
      });
    }

    else if (saveConfig.backend === "local") {
      if (!window.ProsodyLocalSave) {
        throw new Error(
          "ProsodyLocalSave is not available. " +
          "Local text saving requires save-utils-local.js to expose window.ProsodyLocalSave. " +
          "If the current local utility uses different names, we will adapt this wrapper."
        );
      }

      result = await window.ProsodyLocalSave.saveText({
        filename: filename,
        data: data,
        target: options.localTarget || null,
        metadata: options.localMetadata || {}
      });
    }

    if (saveConfig.stop_on_save_error) {
      requireSuccess(result, "Text save");
    }

    return Object.assign({}, result, {
      routed_backend: saveConfig.backend,
      filename: filename
    });
  }

  /**
   * Save audio Blob.
   *
   * This is useful for MediaRecorder workflows where we already have a Blob.
   *
   * options:
   *   saveConfig
   *   filename
   *   blob
   *   localTarget       optional
   *   localMetadata     optional
   */
  async function saveAudioBlob(options) {
    assertObject(options, "options");

    const saveConfig = resolveSaveConfig(options.saveConfig);
    const filename = options.filename;
    const blob = options.blob;

    assertNonEmptyString(filename, "filename");

    if (!saveConfig.save_audio) {
      return makeSkippedSaveResult("audio_blob", filename, "save_audio is false.");
    }

    if (!(blob instanceof Blob)) {
      throw new Error("saveAudioBlob expected options.blob to be a Blob.");
    }

    let result;

    if (saveConfig.backend === "none") {
      result = makeSkippedSaveResult("audio_blob", filename);
    }

    else if (saveConfig.backend === "datapipe") {
      if (!window.ProsodyDataPipeSave) {
        throw new Error(
          "ProsodyDataPipeSave is not available. " +
          "Make sure save-utils-online.js is loaded before save-router.js."
        );
      }

      result = await window.ProsodyDataPipeSave.saveDataPipeAudioBlob({
        experimentID: saveConfig.datapipe_experiment_id,
        filename: filename,
        blob: blob
      });
    }

    else if (saveConfig.backend === "llf") {
      throw new Error(
        "LLF audio saving is intentionally disabled for the perception-only migration."
      );
    }

    else if (saveConfig.backend === "local") {
      if (!window.ProsodyLocalSave) {
        throw new Error(
          "ProsodyLocalSave is not available. " +
          "Local audio saving requires save-utils-local.js to expose window.ProsodyLocalSave. " +
          "If the current local utility uses different names, we will adapt this wrapper."
        );
      }

      result = await window.ProsodyLocalSave.saveAudioBlob({
        filename: filename,
        blob: blob,
        target: options.localTarget || null,
        metadata: options.localMetadata || {},
        convert_wav_locally: saveConfig.convert_wav_locally
      });
    }

    if (saveConfig.stop_on_save_error) {
      requireSuccess(result, "Audio Blob save");
    }

    return Object.assign({}, result, {
      routed_backend: saveConfig.backend,
      filename: filename
    });
  }

  /**
   * Save jsPsych audio response.
   *
   * This is useful for plugin data where audio is stored as base64.
   *
   * options:
   *   saveConfig
   *   filename
   *   audioResponseBase64
   *   localTarget       optional
   *   localMetadata     optional
   */
  async function saveAudioResponse(options) {
    assertObject(options, "options");

    const saveConfig = resolveSaveConfig(options.saveConfig);
    const filename = options.filename;
    const audioResponseBase64 = options.audioResponseBase64;

    assertNonEmptyString(filename, "filename");

    if (!saveConfig.save_audio) {
      return makeSkippedSaveResult("audio_response", filename, "save_audio is false.");
    }

    assertNonEmptyString(audioResponseBase64, "audioResponseBase64");

    let result;

    if (saveConfig.backend === "none") {
      result = makeSkippedSaveResult("audio_response", filename);
    }

    else if (saveConfig.backend === "datapipe") {
      if (!window.ProsodyDataPipeSave) {
        throw new Error(
          "ProsodyDataPipeSave is not available. " +
          "Make sure save-utils-online.js is loaded before save-router.js."
        );
      }

      result = await window.ProsodyDataPipeSave.saveDataPipeAudioResponse({
        experimentID: saveConfig.datapipe_experiment_id,
        filename: filename,
        audioResponseBase64: audioResponseBase64
      });
    }

    else if (saveConfig.backend === "llf") {
      throw new Error(
        "LLF audio-response saving is intentionally disabled for the perception-only migration."
      );
    }

    else if (saveConfig.backend === "local") {
      if (!window.ProsodyLocalSave) {
        throw new Error(
          "ProsodyLocalSave is not available. " +
          "Local audio response saving requires save-utils-local.js to expose window.ProsodyLocalSave. " +
          "If the current local utility uses different names, we will adapt this wrapper."
        );
      }

      result = await window.ProsodyLocalSave.saveAudioResponse({
        filename: filename,
        audioResponseBase64: audioResponseBase64,
        target: options.localTarget || null,
        metadata: options.localMetadata || {},
        convert_wav_locally: saveConfig.convert_wav_locally
      });
    }

    if (saveConfig.stop_on_save_error) {
      requireSuccess(result, "Audio response save");
    }

    return Object.assign({}, result, {
      routed_backend: saveConfig.backend,
      filename: filename
    });
  }

  /**
   * Remove heavy audio payload from a jsPsych trial data object.
   *
   * This should be called after the audio file has been saved successfully.
   */
  function stripAudioFromTrialData(trialData, options) {
    if (!trialData || typeof trialData !== "object") {
      return trialData;
    }

    const opts = Object.assign({
      audioField: "response",
      replacement: "[audio saved separately]"
    }, options || {});

    if (Object.prototype.hasOwnProperty.call(trialData, opts.audioField)) {
      trialData[opts.audioField] = opts.replacement;
    }

    return trialData;
  }

  /**
   * Build a concise save-status object suitable for adding to jsPsych data.
   */
  function summarizeSaveResult(result) {
    if (!result || typeof result !== "object") {
      return {
        save_ok: false,
        save_status: null,
        save_backend: null,
        save_kind: null,
        save_filename: null,
        save_upload_ms: null,
        save_error_message: "Missing save result."
      };
    }

    return {
      save_ok: !!result.ok,
      save_status: result.status,
      save_backend: result.routed_backend || result.save_backend || null,
      save_kind: result.save_kind || null,
      save_filename: result.filename || null,
      save_upload_ms: result.upload_ms || null,
      save_error_message: result.error_message || null
    };
  }

  window.ProsodySaveRouter = {
    VALID_BACKENDS,
    nowCompactTimestamp,
    normalizeSaveConfig,
    resolveSaveConfig,
    isLocalhost,
    saveText,
    saveAudioBlob,
    saveAudioResponse,
    stripAudioFromTrialData,
    summarizeSaveResult,
    requireSuccess
  };
})();
