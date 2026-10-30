(function () {
  "use strict";

  const base = window.ONLINE_PAMS_CONFIG;

  if (!base || !base.task || base.task.mode !== "scientific_rehearsal") {
    throw new Error(
      "PAM-S LLF overlay must be loaded after config_scientific.js."
    );
  }

  window.ONLINE_PAMS_CONFIG = Object.freeze({
    ...base,

    task: Object.freeze({
      ...base.task,
      task_version: "2026-09_pams_llf_participant_ready_v0.5",
      mode: "llf_participant_ready"
    }),

    locale: Object.freeze({
      ...base.locale,
      document_title:
        "Association à une mélodie française"
    }),

    runtime: Object.freeze({
      ...base.runtime,
      order_directory_url: "../../runtime_data/orders/pams",
      practice_manifest_url:
        "../../runtime_data/manifests/pams_practice_manifest.csv",
      audio_base_url: "../../stimuli/perception/vn_tones/"
    }),

    text: Object.freeze({
      ...base.text,
      participant_code: Object.freeze({
        title: "Votre code de participation",
        kicker: "Étude",
        instruction: "Saisissez le code de participation à 8 chiffres qui vous a été communiqué.",
        input_label: "Code de participation",
        continue_label: "Continuer",
        hint: "Le code de participation contient 8 chiffres."
      }),
      checkpoint_save_title: "Enregistrement des données…",
      checkpoint_save_lead:
        "Veuillez patienter un instant avant de continuer.",
      save_success:
        "Données reçues par le service de sauvegarde."
    }),

    saving: Object.freeze({
      save_backend: "datapipe",
      datapipe_experiment_id: "ZLLbeM7lxkLD",
      log_save_target: null,
      llf_endpoint: null,
      llf_max_attempts: 1,
      llf_retry_delay_ms: 0,
      allow_save_override_from_url: false,
      allow_llf_from_localhost: false,
      allow_datapipe_from_localhost: true
    }),

    debug: Object.freeze({
      ...base.debug,
      enabled: false
    })
  });
})();
