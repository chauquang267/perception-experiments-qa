(function () {
  "use strict";

  const base = window.ONLINE_PAMS_CONFIG;

  if (!base) {
    throw new Error(
      "Base PAM-S test configuration must be loaded before the scientific rehearsal overlay."
    );
  }

  window.ONLINE_PAMS_CONFIG = Object.freeze({
    ...base,

    task: Object.freeze({
      ...base.task,
      task_version:
        "2026-09_pams_scientific_browser_rehearsal_v0.3",
      mode: "scientific_rehearsal"
    }),

    locale: Object.freeze({
      ...base.locale,
      document_title:
        "Association à une mélodie française — Répétition avec stimuli scientifiques"
    }),

    stimulus_audio: Object.freeze({
      source_inventory:
        "frozen_scientific_pams_main_108_plus_practice_8",
      playback_processing:
        "Praat Scale intensity 70 dB mean intensity; single scalar gain",
      normalization_status:
        "scientific_final_selected_bank_passed_2026-09-24",
      normalization_output_format:
        "24-bit PCM WAV",
      scientific_eligible: true
    }),

    runtime: Object.freeze({
      ...base.runtime,
      order_directory_url:
        "/_scientific_perception/runtime/orders/pams",
      practice_manifest_url:
        "/_scientific_perception/runtime/manifests/pams_practice_manifest.csv",
      audio_base_url:
        "/stimuli/perception/vn_tones/"
    }),

    saving: Object.freeze({
      save_backend: "local",
      log_save_target: "sandbox_router_local_text"
    }),

    debug: Object.freeze({
      ...base.debug,
      enabled: true
    })
  });
})();
