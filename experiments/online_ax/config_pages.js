(function () {
  "use strict";

  const base = window.ONLINE_AX_CONFIG;

  if (!base || !base.task || base.task.mode !== "scientific_rehearsal") {
    throw new Error(
      "AX LLF overlay must be loaded after config_scientific.js."
    );
  }

  function stagedSetupUrl(url) {
    const name = String(url || "").split("/").pop();
    if (!name) {
      throw new Error("AX LLF setup-audio filename is missing.");
    }
    return "../../runtime_data/setup_audio/" + name;
  }

  const isVietnamese = base.locale && base.locale.language === "vi";

  window.ONLINE_AX_CONFIG = Object.freeze({
    ...base,

    task: Object.freeze({
      ...base.task,
      task_version: "2026-09_ax_llf_participant_ready_v0.5",
      mode: "llf_participant_ready"
    }),

    locale: Object.freeze({
      ...base.locale,
      document_title: isVietnamese
        ? "So sánh hai âm thanh"
        : "Perception de deux sons"
    }),

    setup_audio: Object.freeze({
      ...base.setup_audio,
      url: stagedSetupUrl(base.setup_audio.url),
      alternate_vi_url: base.setup_audio.alternate_vi_url
        ? stagedSetupUrl(base.setup_audio.alternate_vi_url)
        : null
    }),

    runtime: Object.freeze({
      ...base.runtime,
      order_directory_url: "../../runtime_data/orders/ax",
      audio_base_url: "../../stimuli/perception/vn_tones/"
    }),

    text: Object.freeze({
      ...base.text,
      participant_code: Object.freeze({
        title: isVietnamese ? "Mã tham gia" : "Votre code de participation",
        kicker: isVietnamese ? "Nghiên cứu" : "Étude",
        instruction: isVietnamese
          ? "Vui lòng nhập mã tham gia gồm 8 chữ số đã được cung cấp cho bạn."
          : "Saisissez le code de participation à 8 chiffres qui vous a été communiqué.",
        input_label: isVietnamese ? "Mã tham gia" : "Code de participation",
        continue_label: isVietnamese ? "Tiếp tục" : "Continuer",
        hint: isVietnamese
          ? "Mã tham gia gồm 8 chữ số."
          : "Le code de participation contient 8 chiffres."
      }),
      checkpoint_save_title: isVietnamese
        ? "Đang lưu dữ liệu…"
        : "Enregistrement des données…",
      checkpoint_save_lead: isVietnamese
        ? "Vui lòng đợi trong giây lát trước khi tiếp tục."
        : "Veuillez patienter un instant avant de continuer.",
      save_success: isVietnamese
        ? "Dữ liệu đã được dịch vụ lưu trữ tiếp nhận."
        : "Données reçues par le service de sauvegarde."
    }),

    saving: Object.freeze({
      save_backend: "datapipe",
      datapipe_experiment_id: "sltJPdommoOo",
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
