window.ONLINE_PAMS_CONFIG = Object.freeze({
  task: Object.freeze({
    task_code: "online_pams",
    task_label: "Association à une mélodie française",
    task_family: "perception",
    task_version: "2026-09_pams_browser_test_v0.4_high_range_id",
    mode: "test"
  }),
  locale: Object.freeze({
    language: "fr",
    html_lang: "fr",
    document_title: "Association à une mélodie française — Test technique"
  }),
  participant_rules: Object.freeze({
    allowedSiteCodes: Object.freeze(["33"]),
    allowedPhaseCodes: Object.freeze(["0", "1"]),
    allowedGroupCodes: Object.freeze(["1", "4"]),
    allowedSexCodes: Object.freeze(["0", "1", "2", "9"]),
    allowedSerialMin: 990,
    allowedSerialMax: 999,
    requireTechnicalTestCode: false
  }),
  runtime: Object.freeze({
    order_pool_size: 120,
    order_directory_url: "/_test_perception/runtime/orders/pams",
    order_filename_prefix: "pams_order_",
    order_filename_extension: ".csv",
    practice_manifest_url: "/_test_perception/runtime/manifests/pams_practice_manifest.csv"
  }),
  structure: Object.freeze({
    practice_trials: 8,
    main_trials: 108,
    blocks: 2,
    main_trials_per_block: 54
  }),
  timing: Object.freeze({
    fixation_ms: 500,
    category_window_after_audio_ms: 6000,
    iti_ms: 1000
  }),
  saving: Object.freeze({
    save_backend: "local",
    log_save_target: "sandbox_router_local_text"
  }),
  debug: Object.freeze({
    enabled: true,
    max_practice_trials: 2,
    max_main_trials_per_block: 6,
    show_detailed_preload_errors: true
  }),
  response: Object.freeze({
    categories: Object.freeze([
      "Déclaration",
      "Question",
      "Exclamation",
      "Ton plat / monotone",
      "Incertain / Autre"
    ]),
    category_descriptions: Object.freeze([
      "La mélodie ressemble à celle d’une affirmation neutre.",
      "La mélodie ressemble à celle d’une question comme « Tu viens ? », à laquelle on peut répondre par oui ou par non. La voix monte généralement vers la fin.",
      "La mélodie ressemble à une réaction exclamative, expressive ou fortement accentuée.",
      "La hauteur de la voix semble relativement stable, sans mouvement clairement associé aux autres catégories.",
      "Aucune des catégories précédentes ne correspond suffisamment bien."
    ]),
    uncertain_index: 4,
    goodness_choices: Object.freeze(["1", "2", "3", "4", "5", "6", "7"])
  }),
  text: Object.freeze({
    technical_code: Object.freeze({
      title: "Votre code de participation",
      kicker: "Mode technique",
      instruction: "Saisissez le code de test communiqué pour cette session.",
      input_label: "Code de participation",
      continue_label: "Continuer",
      hint: "Utilisez un code au format participant avec un numéro de série compris entre 990 et 999."
    }),
    preload_message: "Préparation des sons…",
    intro_kicker: "Deuxième tâche de perception",
    intro_title: "Associer une syllabe à une mélodie française",
    intro_lead: "Dans cette expérience, vous allez entendre des personnes prononcer de courtes syllabes. Nous ne nous intéressons pas au sens de ces syllabes, mais uniquement à la mélodie de la voix.",
    intro_interpretive_note: "Il ne s'agit pas de dire que le son vietnamien est réellement une phrase française : les catégories servent uniquement à décrire la ressemblance mélodique qui vous paraît la plus naturelle. Une syllabe vietnamienne isolée ne constitue pas à elle seule une déclaration, une question ou une exclamation française complète.",
    intro_steps: Object.freeze([
      Object.freeze({ title: "Choisissez la mélodie française la plus proche", text: "Après chaque son, choisissez la catégorie à laquelle la mélodie ressemble le plus : une déclaration, une question en oui/non comme « Tu viens ? », une exclamation ou un ton plat / monotone." }),
      Object.freeze({ title: "Si aucune catégorie ne convient", text: "Choisissez « Incertain / Autre » si aucune des quatre catégories précédentes ne correspond suffisamment bien." }),
      Object.freeze({ title: "Fiez-vous à votre première impression", text: "Il n’y a pas de bonne ou de mauvaise réponse au sens strict. Nous nous intéressons à votre perception personnelle : répondez sans essayer d’analyser le son trop longtemps." }),
      Object.freeze({ title: "Évaluez ensuite la correspondance", text: "Après Déclaration, Question, Exclamation ou Ton plat / monotone, indiquez à quel point le son constitue un bon ou un mauvais exemple de la catégorie choisie, sur une échelle de 1 à 7." })
    ]),
    intro_uncertain_note: "Lorsque vous choisissez « Incertain / Autre », aucune note de 1 à 7 n’est demandée et l’expérience passe directement à l’essai suivant.",
    continue_label: "Continuer",
    practice_title: "Familiarisez-vous avec la tâche",
    practice_lead_full: "Vous allez d'abord faire 8 essais d'entraînement avec des syllabes réservées à la pratique afin de vous familiariser avec l’interface et la procédure de réponse.",
    practice_lead_debug: "Vous allez d'abord faire quelques essais d'entraînement pour vérifier le fonctionnement de la tâche.",
    practice_steps: Object.freeze([
      Object.freeze({ title: "Écoutez", text: "Laissez le son se terminer avant de répondre." }),
      Object.freeze({ title: "Choisissez", text: "Sélectionnez la catégorie de mélodie française qui correspond le mieux à votre première impression. Vous avez jusqu'à 6 secondes après la fin du son." }),
      Object.freeze({ title: "Notez si nécessaire", text: "Une échelle de 1 à 7 apparaît uniquement après Déclaration, Question, Exclamation ou Ton plat / monotone." })
    ]),
    practice_note: "Il n’y a pas de bonne ou de mauvaise réponse au sens strict. Fiez-vous à votre perception personnelle ; aucun retour de justesse n’est donné pendant l’entraînement.",
    practice_start_button: "Commencer l'entraînement",
    block_title: "Partie",
    block_first_title: "Prêt·e pour la première partie ?",
    block_next_title: "Prêt·e à continuer ?",
    block_lead_full: "Cette partie comprend 54 sons.",
    block_lead_debug_prefix: "Cette partie comprend",
    block_steps: Object.freeze([
      Object.freeze({ title: "Écoutez le son", text: "Fiez-vous à votre première impression de la mélodie." }),
      Object.freeze({ title: "Choisissez une catégorie", text: "Pour Question, pensez à une question en oui/non comme « Tu viens ? ». Utilisez « Incertain / Autre » si aucune des quatre catégories ne convient suffisamment bien." }),
      Object.freeze({ title: "Évaluez la correspondance", text: "Donnez une note de 1 à 7 uniquement lorsqu’elle vous est demandée." })
    ]),
    block_start_button: "Commencer",
    resume_button: "Reprendre",
    category_listen_kicker: "Écoutez jusqu'au bout",
    category_prompt: "À quelle catégorie de mélodie française ce son ressemble-t-il le plus ?",
    goodness_kicker: "Votre choix",
    goodness_prompt: "À quel point cette mélodie correspond-elle à la catégorie que vous avez choisie ?",
    goodness_low: "1 = Très mauvais exemple",
    goodness_high: "7 = Excellent exemple",
    break_title: "Pause",
    break_paragraphs: Object.freeze([
      "Vous avez terminé la première partie.",
      "Prenez une pause si vous le souhaitez, puis continuez lorsque vous êtes prêt·e."
    ]),
    open_ended_title: "Une dernière question facultative",
    open_ended_prompt: "Lorsque vous avez choisi « Incertain / Autre », qu’est-ce qui rendait généralement votre choix difficile ? Vous pouvez laisser ce champ vide si vous ne souhaitez rien ajouter.",
    open_ended_placeholder: "Votre réponse (facultative)",
    open_ended_button: "Terminer",
    completion_title: "Merci pour votre participation",
    completion_paragraphs: Object.freeze([
      "Cette tâche est maintenant terminée."
    ]),
    save_success: "Données techniques enregistrées avec succès.",
    save_failure_prefix: "Échec de l'enregistrement technique :",
    save_unknown_error: "erreur inconnue"
  })
});
