(function () {
  "use strict";

  function requested() {
    var params = new URLSearchParams(window.location.search);
    return params.get("supervisor_preview") === "1";
  }

  function makeTechnicalParticipantRules() {
    return Object.freeze({
      allowedSiteCodes: Object.freeze(["00"]),
      allowedPhaseCodes: Object.freeze(["9"]),
      allowedGroupCodes: Object.freeze(["9"]),
      allowedSexCodes: Object.freeze(["9"]),
      requireTechnicalTestCode: true
    });
  }

  function clonePreviewConfig(baseConfig, options) {
    if (!requested()) return baseConfig;

    if (!baseConfig || !options) {
      throw new Error("Supervisor preview requires a base config and preview options.");
    }

    var baseMode = String(
      (baseConfig.task && baseConfig.task.mode) || "unknown"
    );

    var task = Object.freeze(Object.assign({}, baseConfig.task, {
      mode: "supervisor_preview_" + baseMode,
      task_version: String(baseConfig.task.task_version || "unknown") + "_supervisor_preview"
    }));

    var saving = Object.freeze(Object.assign({}, baseConfig.saving, {
      save_backend: "local",
      audio_save_target: options.testAudioTarget,
      log_save_target: options.testLogTarget,
      datapipe_experiment_id: null,
      allow_save_override_from_url: false,
      allow_datapipe_from_localhost: false,
      stop_on_save_error: true
    }));

    var debug = Object.freeze(Object.assign({}, baseConfig.debug || {}, {
      enabled: false,
      log_config_on_start: false,
      log_manifest_summary: false,
      log_participant_metadata: false,
      log_save_results: false,
      max_practice_items_for_test: null,
      max_main_items_for_test: null
    }));

    window.PROSODY_SUPERVISOR_PREVIEW_ACTIVE = true;

    return Object.freeze(Object.assign({}, baseConfig, {
      task: task,
      participant_rules: makeTechnicalParticipantRules(),
      saving: saving,
      debug: debug
    }));
  }

  function clonePerceptionPreviewConfig(baseConfig, options) {
    if (!requested()) return baseConfig;

    if (!baseConfig) {
      throw new Error("Perception supervisor preview requires a base config.");
    }

    options = options || {};

    var task = Object.freeze(Object.assign({}, baseConfig.task, {
      mode: "supervisor_preview",
      task_version: String(baseConfig.task.task_version || "unknown") + "_supervisor_preview"
    }));

    var locale = Object.freeze(Object.assign({}, baseConfig.locale || {}, {
      document_title:
        options.documentTitle ||
        String((baseConfig.locale && baseConfig.locale.document_title) || "")
          .replace(/\s*[—-]\s*Test technique\s*$/i, "")
    }));

    var baseText = baseConfig.text || {};
    var participantCodeText = Object.freeze(Object.assign(
      {},
      baseText.technical_code || {},
      {
        title: options.codeTitle || "Votre code de participation",
        kicker: options.codeKicker || "Participation",
        instruction:
          options.codeInstruction ||
          "Saisissez le code de participation qui vous a été attribué.",
        input_label: options.codeInputLabel || "Code de participation",
        continue_label: options.codeContinueLabel || "Continuer",
        hint:
          options.codeHint ||
          "Saisissez le code à 8 chiffres fourni par l'équipe de recherche."
      }
    ));

    var text = Object.assign({}, baseText, {
      technical_code: participantCodeText
    });

    if (Object.prototype.hasOwnProperty.call(text, "participant_information_placeholder_suffix")) {
      text.participant_information_placeholder_suffix = "";
    }
    if (Object.prototype.hasOwnProperty.call(text, "save_success")) {
      text.save_success = options.saveSuccess || "Données enregistrées avec succès.";
    }
    if (Object.prototype.hasOwnProperty.call(text, "save_failure_prefix")) {
      text.save_failure_prefix = options.saveFailurePrefix || "Échec de l'enregistrement :";
    }
    if (Object.prototype.hasOwnProperty.call(text, "save_unknown_error")) {
      text.save_unknown_error = options.saveUnknownError || "erreur inconnue";
    }

    var participantInformation = baseConfig.participant_information
      ? Object.freeze(Object.assign({}, baseConfig.participant_information))
      : undefined;

    window.PROSODY_SUPERVISOR_PREVIEW_ACTIVE = true;

    var overrides = {
      task: task,
      locale: locale,
      text: Object.freeze(text)
    };

    if (participantInformation) {
      overrides.participant_information = participantInformation;
    }

    return Object.freeze(Object.assign({}, baseConfig, overrides));
  }

  window.ProsodySupervisorPreview = Object.freeze({
    requested: requested,
    apply: clonePreviewConfig,
    applyPerception: clonePerceptionPreviewConfig
  });
})();
