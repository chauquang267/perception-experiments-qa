(function () {
  "use strict";

  const base = window.ONLINE_AX_CONFIG;

  if (!base) {
    throw new Error(
      "Base AX test configuration must be loaded before the scientific rehearsal overlay."
    );
  }

  const isVietnamese =
    base.locale && base.locale.language === "vi";

  const setupUrl = String(base.setup_audio.url)
    .replace(
      "/_test_perception/",
      "/_scientific_perception/"
    );

  window.ONLINE_AX_CONFIG = Object.freeze({
    ...base,

    task: Object.freeze({
      ...base.task,
      task_version:
        "2026-09_ax_scientific_browser_rehearsal_v0.3",
      mode: "scientific_rehearsal"
    }),

    locale: Object.freeze({
      ...base.locale,
      document_title: isVietnamese
        ? "So sánh hai âm thanh — Kiểm tra với kích thích nghiên cứu"
        : "Perception de deux sons — Répétition avec stimuli scientifiques"
    }),

    stimulus_audio: Object.freeze({
      source_inventory:
        "frozen_scientific_ax_main_54_plus_support_27",
      playback_processing:
        "Praat Scale intensity 70 dB mean intensity; single scalar gain",
      normalization_status:
        "scientific_final_selected_bank_passed_2026-09-24",
      normalization_output_format:
        "24-bit PCM WAV",
      scientific_eligible: true
    }),

    setup_audio: Object.freeze({
      ...base.setup_audio,
      url: setupUrl
    }),

    runtime: Object.freeze({
      ...base.runtime,
      order_directory_url:
        "/_scientific_perception/runtime/orders/ax",
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
