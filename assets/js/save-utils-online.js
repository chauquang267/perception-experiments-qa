/**
 * GitHub Pages perception transport adapter for DataPipe (September 2026 API).
 *
 * This is NOT the historical save-utils-online.js (DataPipe/OSF).
 * Exported website only. The frozen LLF source and its PHP saver stay unchanged.
 *
 * No credentials or identifiable contact data may be embedded here.
 * API: https://pipe.jspsych.org/docs/api
 */
(function () {
  "use strict";

  const ENDPOINT = "https://pipe.jspsych.org/api/data/";

  function nonEmptyString(value, label) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(label + " is required.");
    }
  }

  async function saveDataPipeText(options) {
    options = options || {};
    const experimentID = options.experimentID;
    const filename = options.filename;
    const data = options.data;

    nonEmptyString(experimentID, "DataPipe experiment ID");
    nonEmptyString(filename, "DataPipe filename");
    nonEmptyString(data, "DataPipe text data");

    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:json|csv)$/.test(filename)) {
      throw new Error("Unsafe DataPipe output filename: " + filename);
    }

    const startedAt = new Date().toISOString();
    const t0 = performance.now();
    let response;
    let parsed = null;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experimentID, filename, data }),
        credentials: "omit",
        cache: "no-store"
      });
      const responseText = await response.text();
      try { parsed = responseText ? JSON.parse(responseText) : null; }
      catch (_) { parsed = { raw_message: responseText.slice(0, 300) }; }

      const stored = response.status === 201;
      const queued = response.status === 202;
      const accepted = stored || queued;
      const definitiveRejection = response.status >= 400 && response.status < 500;
      return {
        ok: accepted,
        status: response.status,
        save_backend: "datapipe",
        save_kind: "text",
        filename,
        data_length: data.length,
        upload_started_at: startedAt,
        upload_finished_at: new Date().toISOString(),
        upload_ms: Math.round(performance.now() - t0),
        delivery_state: stored ? "provider_stored" :
          queued ? "accepted_queued_provider_pending" :
          definitiveRejection ? "rejected" : "server_response_ambiguous",
        server_confirmation_available: true,
        response: parsed,
        error_name: accepted ? null : (parsed && parsed.error) || "DataPipeHTTPError",
        error_message: accepted ? null :
          (definitiveRejection ? "DataPipe rejected the submission" :
            "DataPipe returned a non-success response; the delivery outcome is not confirmed") +
          " (HTTP " + response.status +
          ", code " + ((parsed && parsed.error) || "unknown") + ").",
        // Automatic retries are unsafe for duplicate filenames and ambiguous failures.
        retryable: false,
        automatic_retry: false
      };
    } catch (error) {
      return {
        ok: false,
        status: null,
        save_backend: "datapipe",
        save_kind: "text",
        filename,
        data_length: data.length,
        upload_started_at: startedAt,
        upload_finished_at: new Date().toISOString(),
        upload_ms: Math.round(performance.now() - t0),
        delivery_state: "transport_error_ambiguous",
        server_confirmation_available: false,
        error_name: error && error.name || "FetchError",
        error_message: "Network failure; the delivery outcome is unknown. " +
          (error && error.message || String(error)),
        retryable: false,
        automatic_retry: false
      };
    }
  }

  window.ProsodyDataPipeSave = Object.freeze({ saveDataPipeText });
})();
