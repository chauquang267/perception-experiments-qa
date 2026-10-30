window.ONLINE_AX_CONFIG = Object.freeze({
  task: Object.freeze({
    task_code: "online_ax",
    task_label: "Perception de deux sons",
    task_family: "perception",
    task_version: "2026-09_ax_browser_test_v0.9_fr_whole_syllable",
    mode: "test"
  }),
  locale: Object.freeze({
    language: "fr",
    html_lang: "fr",
    instruction_revision: "fr_whole_syllable_v2_2026-09-26",
    document_title: "Perception de deux sons — Test technique"
  }),
  participant_rules: Object.freeze({
    allowedSiteCodes: Object.freeze(["33", "84"]),
    allowedPhaseCodes: Object.freeze(["0", "1"]),
    allowedGroupCodes: Object.freeze(["1", "2", "3", "4"]),
    allowedSexCodes: Object.freeze(["0", "1", "2", "9"]),
    allowedSerialMin: 990,
    allowedSerialMax: 999,
    requireTechnicalTestCode: false
  }),
  participant_information: Object.freeze({
    url: "#participant-information-placeholder",
    placeholder: true,
    label: "Consulter la notice d'information destinée aux participants"
  }),
  stimulus_audio: Object.freeze({
    source_inventory: "technical_placeholder_bank",
    playback_processing: "Praat Scale intensity 70 dB mean intensity; single scalar gain",
    normalization_status: "technical_validation_passed_2026-08-26",
    normalization_output_format: "24-bit PCM WAV",
    scientific_eligible: false
  }),
  setup_audio: Object.freeze({
    language: "fr",
    url: "/_test_perception/setup_audio/ax_setup_instructions_fr_v1.wav",
    alternate_vi_url: "/_test_perception/setup_audio/ax_setup_instructions_vi_v1.wav",
    source_url: "/assets/audio/perception/ax/ax_setup_instructions_fr_v1.mp3",
    source_alternate_vi_url: "/assets/audio/perception/ax/ax_setup_instructions_vi_v1.mp3",
    asset_version: "v1",
    source_format: "mp3",
    playback_format: "wav",
    normalization_target: "Praat mean intensity 70 dB (uncalibrated digital target)",
    normalization_status: "technical_validation_passed_2026-08-26",
    normalized_derivative_format: "wav",
    purpose: "participant_setup_and_subjective_comfort_volume"
  }),
  runtime: Object.freeze({
    order_pool_size: 120,
    order_directory_url: "/_test_perception/runtime/orders/ax",
    order_filename_prefix: "ax_order_",
    order_filename_extension: ".csv"
  }),
  timing: Object.freeze({
    fixation_ms: 500,
    response_window_after_x_ms: 2000,
    iti_ms: 1000,
    practice_feedback_ms: 900
  }),
  structure: Object.freeze({
    practice_trials_per_isi_block: 6,
    main_trials_per_isi_block: 144,
    mini_block_size: 48,
    mini_blocks_per_isi_block: 3
  }),
  practice: Object.freeze({
    source_inventory: "support",
    feedback_enabled: true,
    sets: Object.freeze([
      Object.freeze([
        Object.freeze({ practice_id: "AXP_A01", same_different: "SAME", correct_key: "s", token_A_id: "VN01__SUP__ME__A1__T01", token_X_id: "VN01__SUP__ME__A1__T02" }),
        Object.freeze({ practice_id: "AXP_A02", same_different: "SAME", correct_key: "s", token_A_id: "VN01__SUP__NE__A1__T02", token_X_id: "VN01__SUP__NE__A1__T03" }),
        Object.freeze({ practice_id: "AXP_A03", same_different: "SAME", correct_key: "s", token_A_id: "VN01__SUP__LE__A1__T03", token_X_id: "VN01__SUP__LE__A1__T01" }),
        Object.freeze({ practice_id: "AXP_A04", same_different: "DIFFERENT", correct_key: "l", token_A_id: "VN01__SUP__ME__A1__T03", token_X_id: "VN01__SUP__NE__A1__T01" }),
        Object.freeze({ practice_id: "AXP_A05", same_different: "DIFFERENT", correct_key: "l", token_A_id: "VN01__SUP__NE__A1__T01", token_X_id: "VN01__SUP__LE__A1__T02" }),
        Object.freeze({ practice_id: "AXP_A06", same_different: "DIFFERENT", correct_key: "l", token_A_id: "VN01__SUP__LE__A1__T02", token_X_id: "VN01__SUP__ME__A1__T03" })
      ]),
      Object.freeze([
        Object.freeze({ practice_id: "AXP_B01", same_different: "SAME", correct_key: "s", token_A_id: "VN01__SUP__ME__A1__T02", token_X_id: "VN01__SUP__ME__A1__T03" }),
        Object.freeze({ practice_id: "AXP_B02", same_different: "SAME", correct_key: "s", token_A_id: "VN01__SUP__NE__A1__T03", token_X_id: "VN01__SUP__NE__A1__T01" }),
        Object.freeze({ practice_id: "AXP_B03", same_different: "SAME", correct_key: "s", token_A_id: "VN01__SUP__LE__A1__T01", token_X_id: "VN01__SUP__LE__A1__T02" }),
        Object.freeze({ practice_id: "AXP_B04", same_different: "DIFFERENT", correct_key: "l", token_A_id: "VN01__SUP__NE__A1__T02", token_X_id: "VN01__SUP__ME__A1__T01" }),
        Object.freeze({ practice_id: "AXP_B05", same_different: "DIFFERENT", correct_key: "l", token_A_id: "VN01__SUP__LE__A1__T03", token_X_id: "VN01__SUP__NE__A1__T02" }),
        Object.freeze({ practice_id: "AXP_B06", same_different: "DIFFERENT", correct_key: "l", token_A_id: "VN01__SUP__ME__A1__T01", token_X_id: "VN01__SUP__LE__A1__T03" })
      ])
    ])
  }),
  saving: Object.freeze({
    save_backend: "local",
    log_save_target: "sandbox_router_local_text"
  }),
  debug: Object.freeze({
    enabled: true,
    max_trials_per_block: 8,
    show_detailed_preload_errors: true
  }),
  text: Object.freeze({
    welcome_kicker: "Étude de perception",
    welcome_title: "Merci et bienvenue !",
    welcome_lead: "Merci de prendre le temps de participer à cette étude sur la perception des sons. La tâche se déroule entièrement en ligne et vous guidera étape par étape.",
    welcome_button: "Continuer",
    initial_scroll_note: "Sur certains des premiers écrans d’instructions, vous devrez peut-être faire défiler la page pour lire tout le contenu. Une fois les touches S et L présentées, vous pourrez continuer uniquement au clavier.",

    consent_kicker: "Votre participation",
    consent_title: "Avant de poursuivre",
    consent_lead: "Avant de commencer, assurez-vous d'avoir pris connaissance des informations qui vous ont été fournies sur l'étude.",
    consent_acknowledgement: "En cliquant sur Confirmer, vous confirmez avoir pris connaissance des informations qui vous ont été fournies sur l'étude, les avoir comprises et accepter de participer selon les modalités présentées.",
    consent_button: "Confirmer",
    participant_information_placeholder_suffix: "— lien à insérer avant le déploiement",

    technical_code: Object.freeze({
      title: "Votre code de participation",
      kicker: "Mode technique",
      instruction: "Saisissez le code de test communiqué pour cette session.",
      input_label: "Code de participation",
      continue_label: "Continuer",
      hint: "Utilisez un code au format participant avec un numéro de série compris entre 990 et 999."
    }),

    preload_message: "Préparation des sons…",

    setup_kicker: "Préparation",
    setup_title: "Préparez votre environnement d'écoute",
    setup_lead: "Ces conditions sont importantes pour que les sons soient entendus dans de bonnes conditions et que vos réponses puissent être interprétées correctement.",
    setup_audio_title: "Écoutez les consignes et réglez le volume",
    setup_audio_instruction: "Pendant ce message, vérifiez votre environnement d'écoute et ajustez le volume jusqu'à ce que la voix soit claire et confortable. Vous pouvez le réécouter autant de fois que nécessaire.",
    setup_audio_button: "▶ Écouter les consignes",
    setup_audio_playing: "Lecture des consignes…",
    setup_audio_ready: "Consignes écoutées. Vous pouvez les réécouter si nécessaire.",
    setup_audio_error: "Les consignes audio n'ont pas pu être lues. Vérifiez la sortie audio puis réessayez.",
    setup_audio_warning: "Une fois le réglage terminé, ne changez plus le volume de l'ordinateur, du navigateur ou du casque pendant toute la suite de la session.",
    setup_conditions: Object.freeze([
      "Je porte un casque ou des écouteurs ; je n'utilise pas les haut-parleurs de l'ordinateur.",
      "Je suis dans un endroit calme et je peux poursuivre sans interruption pendant le bloc.",
      "J'utilise un ordinateur avec un clavier physique et j'ai coupé les notifications ainsi que les autres sources de son.",
      "Je n'ai pas actuellement de difficulté inhabituelle à entendre une conversation ordinaire.",
      "J'ai réglé le volume à un niveau clair et confortable et je ne le modifierai plus pendant la suite de la session."
    ]),
    setup_button: "Continuer",
    setup_blocked_note: "Écoutez au moins une fois les consignes et confirmez chaque condition avant de continuer.",

    intro_kicker: "Consigne",
    intro_title: "Les deux sons sont-ils identiques ou différents ?",
    intro_lead: "À chaque essai, vous entendrez deux syllabes. Écoutez toujours les deux sons jusqu'au bout et comparez les syllabes dans leur ensemble avant de répondre.",
    continue_label: "Continuer",
    trial_timing_title: "Comment se déroule un essai ?",
    trial_timing_steps: Object.freeze([
      Object.freeze({ title: "Un + apparaît", text: "Il vous indique qu'un nouvel essai va commencer." }),
      Object.freeze({ title: "Écoutez le premier son", text: "Ne répondez pas encore." }),
      Object.freeze({ title: "Attendez pendant le silence", text: "" }),
      Object.freeze({ title: "Écoutez le deuxième son jusqu'au bout", text: "Votre réponse n'est acceptée qu'après la fin de ce deuxième son." }),
      Object.freeze({ title: "Répondez", text: "Comparez les deux syllabes dans leur ensemble. Choisissez « Identiques » si elles vous semblent être la même syllabe, avec la même consonne, la même voyelle et la même mélodie générale. Si au moins un de ces aspects vous paraît différent, choisissez « Différents ». Les touches sont présentées à l'écran suivant." })
    ]),
    trial_timing_note: "",
    response_title: "Répondez avec les touches suivantes :",
    response_deadline_note: "Comparez toujours la syllabe dans son ensemble : consonne, voyelle et mélodie générale.",
    response_steps: Object.freeze([
      Object.freeze({ title: "S = identiques", text: "Choisissez S si les deux syllabes vous semblent être la même syllabe : même consonne, même voyelle et même mélodie générale." }),
      Object.freeze({ title: "L = différents", text: "Choisissez L dès que vous percevez une différence dans au moins un de ces aspects : consonne, voyelle ou mélodie." }),
      Object.freeze({ title: "Répondez après le deuxième son", text: "Une pression trop précoce est ignorée ; appuyez de nouveau après la fin du son." })
    ]),
    finger_instruction: "Placez votre index gauche sur S et votre index droit sur L avant de commencer le bloc, puis gardez-les sur ces touches pendant le bloc.",
    keyboard_check_kicker: "Vérification du clavier",
    key_check_s_title: "Vérification de la touche S",
    key_check_s_text: "Placez votre index gauche sur S, puis appuyez une fois sur cette touche.",
    key_check_l_title: "Vérification de la touche L",
    key_check_l_text: "Placez votre index droit sur L, puis appuyez une fois sur cette touche.",
    key_choices_aria_label: "Touches de réponse",

    practice_title: "Se familiariser avec la tâche",
    practice_lead: "Vous aurez 6 essais d'entraînement. Après chaque essai, un bref retour vous indiquera si votre réponse est correcte ou incorrecte.",
    practice_steps: Object.freeze([
      Object.freeze({ title: "Règle", text: "Comparez chaque paire dans son ensemble. Choisissez Identiques si la consonne, la voyelle et la mélodie générale vous semblent les mêmes ; choisissez Différents dès qu'au moins un de ces aspects vous paraît différent." }),
      Object.freeze({ title: "Touches de réponse", text: "Index gauche sur la touche S ; index droit sur la touche L." })
    ]),
    practice_start_button: "Commencer l'entraînement",
    practice_complete_title: "Entraînement terminé",
    practice_complete_lead: "Le bloc principal va maintenant commencer. Replacez votre index gauche sur la touche S et votre index droit sur la touche L.",
    practice_complete_button: "Commencer le bloc principal",
    practice_feedback_timeout: "Aucune réponse enregistrée.",
    practice_feedback_correct: "Correct.",
    practice_feedback_incorrect_same: "Incorrect. La réponse était « Identiques ».",
    practice_feedback_incorrect_different: "Incorrect. La réponse était « Différents ».",
    guided_practice_kicker: "Premier essai d'entraînement",
    guided_practice_display_kicker: "Entraînement",
    guided_practice_title: "Prenez le temps de répondre",
    guided_practice_question: "Les deux syllabes vous semblent-elles être les mêmes dans leur ensemble, ou différentes sur au moins un aspect ?",
    guided_practice_same_instruction: "S'il s'agit de la même syllabe — même consonne, même voyelle et même mélodie générale — appuyez sur la touche S avec l'index gauche.",
    guided_practice_different_instruction: "Si vous percevez une différence dans au moins un de ces aspects — consonne, voyelle ou mélodie — appuyez sur la touche L avec l'index droit.",
    guided_practice_self_paced_note: "Pour ce premier essai, prenez le temps nécessaire pour choisir votre réponse.",
    guided_practice_ready_title: "Vous êtes prêt·e pour la suite ?",
    guided_practice_ready_lead: "À partir de l'essai suivant, répondez dans les 2 secondes suivant la fin du deuxième son.",
    guided_practice_deadline_token: "2 secondes",

    block_title: "Bloc",
    block_counter_separator: "sur",
    block_practice_suffix: "entraînement",
    block_rest_title_first: "Prêt·e à commencer ?",
    block_rest_title_next: "Prêt·e à continuer ?",
    block_rest_lead: "Prenez une pause si vous en avez besoin. Reprenez uniquement lorsque vous êtes prêt·e à rester concentré·e pendant le bloc.",
    block_intro_steps: Object.freeze([
      Object.freeze({ title: "Prenez une pause si nécessaire", text: "Commencez seulement lorsque vous êtes prêt·e à poursuivre." }),
      Object.freeze({ title: "Replacez vos doigts", text: "Index gauche sur S ; index droit sur L." }),
      Object.freeze({ title: "Gardez le même volume", text: "Gardez le casque ou les écouteurs en place et ne modifiez pas le volume." })
    ]),
    block_start_button: "Démarrer le bloc",
    resume_button: "Reprendre",
    mini_break_title: "Petite pause",
    mini_break_lead: "Vous avez terminé cette partie du bloc. Prenez une pause si vous en avez besoin, puis continuez lorsque vous êtes prêt·e.",
    mini_break_steps: Object.freeze([
      Object.freeze({ title: "Reposez-vous si nécessaire", text: "Vous pouvez prendre le temps dont vous avez besoin." }),
      Object.freeze({ title: "Avant de reprendre", text: "Replacez vos index sur S et L et gardez le même volume." })
    ]),
    block_reminder: "Gardez le casque ou les écouteurs en place et ne modifiez pas le volume.",
    first_sound_label: "Premier son",
    second_sound_label: "Deuxième son",
    listen_label: "Écoutez",
    response_question: "Les deux sons étaient-ils identiques ou différents ?",
    response_wait: "Répondez seulement après la fin du deuxième son.",
    same_label: "Identiques",
    different_label: "Différents",
    same_detail: "S · index gauche",
    different_detail: "L · index droit",
    break_title: "Pause",
    break_paragraphs: Object.freeze([
      "Vous avez terminé ce bloc.",
      "Prenez le temps de faire une pause si nécessaire. Gardez le même réglage de volume et reprenez lorsque vous êtes prêt·e."
    ]),
    completion_title: "Merci pour votre participation",
    completion_paragraphs: Object.freeze([
      "Cette courte session de test est terminée."
    ]),
    save_success: "Données techniques enregistrées avec succès.",
    save_failure_prefix: "Échec de l'enregistrement technique :",
    save_unknown_error: "erreur inconnue"
  })
});
