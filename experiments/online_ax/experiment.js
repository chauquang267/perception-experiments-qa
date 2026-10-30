(async function runAxTechnicalBrowser() {
  "use strict";

  const config = window.ONLINE_AX_CONFIG;
  const U = window.ProsodyPerceptionRuntime;
  const scientificStimuli = Boolean(
    config && config.stimulus_audio &&
    config.stimulus_audio.scientific_eligible === true
  );
  const audioMode = scientificStimuli ? "scientific" : "technical";
  const audioPathOptions = {
    mode: audioMode,
    audioBaseUrl: config.runtime && config.runtime.audio_base_url
      ? config.runtime.audio_base_url
      : null
  };

  if (window.PERCEPTION_CONFIG_ERROR) {
    U.renderFatalError("Configuration unavailable", window.PERCEPTION_CONFIG_ERROR);
    return;
  }
  if (!config || !U) {
    document.body.innerHTML = "<p>La configuration de la tâche AX est indisponible.</p>";
    return;
  }

  if (config.locale) {
    document.documentElement.lang = config.locale.html_lang || config.locale.language || "fr";
    if (config.locale.document_title) {
      document.title = config.locale.document_title;
    }
  }

  const state = {
    participant: null,
    orderNumber: null,
    orderCode: null,
    orderUrl: null,
    allRows: [],
    rows: [],
    practiceSets: [],
    durationMap: null,
    setupAudioDurationMs: null,
    fullTechnicalRun: false,
    consentAcknowledgedAt: null,
    setupConfirmedAt: null,
    setupAudioPlayCount: 0,
    activeSetupAudio: null,
    activeSetupAudioResolve: null,
    checkpointSaves: [],
    finalSave: null
  };
  window.ONLINE_AX_RUNTIME = state;

  function normalizeRow(row) {
    const numericFields = [
      "order_number", "block_number", "position_in_block", "global_position",
      "block_isi_ms", "isi_ms"
    ];
    let out = coerceIntegerFields(row, numericFields);
    out = coerceBooleanFields(out, ["technical_only", "scientific_eligible"]);
    out.audio_A_project_path = out.audio_A_path;
    out.audio_X_project_path = out.audio_X_path;
    out.audio_A_url = U.mapPerceptionAudioPath(
      out.audio_A_path,
      audioPathOptions
    );
    out.audio_X_url = U.mapPerceptionAudioPath(
      out.audio_X_path,
      audioPathOptions
    );
    const expectedTechnicalOnly = !scientificStimuli;
    const expectedScientificEligible = scientificStimuli;
    if (
      out.technical_only !== expectedTechnicalOnly ||
      out.scientific_eligible !== expectedScientificEligible
    ) {
      throw new Error(
        `AX row ${out.trial_id} eligibility mismatch for ${audioMode} mode.`
      );
    }
    return out;
  }

  function supportPath(tokenId) {
    if (scientificStimuli) {
      return (
        "prosody-contact-jspsych/docs/stimuli/perception/vn_tones/support/" +
        `${tokenId}.wav`
      );
    }
    return (
      "prosody-contact-jspsych/test_data/perception_placeholders/vn_tones/support/" +
      `${tokenId}.wav`
    );
  }

  function tokenSyllable(tokenId) {
    const parts = String(tokenId).split("__");
    return parts.length >= 3 ? parts[2] : "SUPPORT";
  }

  function makePracticeRow(spec, setNumber, position) {
    const audioAPath = supportPath(spec.token_A_id);
    const audioXPath = supportPath(spec.token_X_id);
    return {
      order_id: `AX_PRACTICE_SET_${setNumber}`,
      order_number: state.orderNumber,
      block_order_pattern: "PRACTICE",
      block_number: setNumber,
      position_in_block: position,
      global_position: null,
      block_isi_ms: null,
      trial_id: spec.practice_id,
      item_id: spec.practice_id,
      trial_class: "practice",
      isi_ms: null,
      speaker_slot: "VN01",
      tone_pair: "SUPPORT_PRACTICE",
      same_different: spec.same_different,
      direction: spec.same_different,
      tone_A: "A1",
      tone_X: "A1",
      syllable_A: tokenSyllable(spec.token_A_id),
      syllable_X: tokenSyllable(spec.token_X_id),
      token_A_id: spec.token_A_id,
      token_X_id: spec.token_X_id,
      audio_A_project_path: audioAPath,
      audio_X_project_path: audioXPath,
      audio_A_url: U.mapPerceptionAudioPath(audioAPath, audioPathOptions),
      audio_X_url: U.mapPerceptionAudioPath(audioXPath, audioPathOptions),
      correct_response: spec.same_different,
      correct_key: spec.correct_key,
      technical_only: !scientificStimuli,
      scientific_eligible: scientificStimuli,
      practice_set_number: setNumber,
      practice_position: position
    };
  }

  function baseData(row) {
    return {
      task: config.task.task_code,
      task_label: config.task.task_label,
      task_family: config.task.task_family,
      task_version: config.task.task_version,
      task_mode: config.task.mode,
      order_id: row.order_id,
      order_number: row.order_number,
      block_order_pattern: row.block_order_pattern,
      block_number: row.block_number,
      position_in_block: row.position_in_block,
      global_position: row.global_position,
      block_isi_ms: row.block_isi_ms,
      trial_id: row.trial_id,
      item_id: row.item_id,
      trial_class: row.trial_class,
      trial_phase: row.trial_phase || (row.trial_class === "practice" ? "practice" : "main"),
      mini_block_number: row.mini_block_number || null,
      isi_ms: row.isi_ms,
      speaker_slot: row.speaker_slot,
      tone_pair: row.tone_pair,
      same_different: row.same_different,
      direction: row.direction,
      tone_A: row.tone_A,
      tone_X: row.tone_X,
      syllable_A: row.syllable_A,
      syllable_X: row.syllable_X,
      token_A_id: row.token_A_id,
      token_X_id: row.token_X_id,
      audio_A_project_path: row.audio_A_project_path,
      audio_X_project_path: row.audio_X_project_path,
      audio_A_url: row.audio_A_url,
      audio_X_url: row.audio_X_url,
      correct_response: row.correct_response,
      correct_key: row.correct_key,
      practice_set_number: row.practice_set_number || null,
      practice_position: row.practice_position || null,
      guided_practice: row.guided_practice === true,
      technical_only: row.technical_only,
      scientific_eligible: row.scientific_eligible
    };
  }

  function makeButtonScreen(title, paragraphs, screen, buttonLabel) {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: U.makePanel(title, paragraphs),
      choices: [buttonLabel || config.text.continue_label],
      data: { task: config.task.task_code, screen }
    };
  }

  function makeKeyChoices() {
    return `
      <div class="pcj-key-choice-grid ax-guide-choices" aria-label="${U.escapeHtml(config.text.key_choices_aria_label)}">
        <div class="pcj-key-choice">
          <div class="pcj-keycap">S</div>
          <div class="pcj-key-choice-label">${U.escapeHtml(config.text.same_label)}</div>
          <div class="pcj-key-choice-detail">${U.escapeHtml(config.text.same_detail)}</div>
        </div>
        <div class="pcj-key-choice">
          <div class="pcj-keycap">L</div>
          <div class="pcj-key-choice-label">${U.escapeHtml(config.text.different_label)}</div>
          <div class="pcj-key-choice-detail">${U.escapeHtml(config.text.different_detail)}</div>
        </div>
      </div>
    `;
  }

  function makeParticipantInformationLink() {
    if (config.participant_information.placeholder) {
      return "";
    }
    return `
      <a class="ax-participant-info-link"
         href="${U.escapeHtml(config.participant_information.url)}"
         target="_blank"
         rel="noopener noreferrer">
        ${U.escapeHtml(config.participant_information.label)}
      </a>
    `;
  }

  function stopSetupAudio(reason) {
    const audio = state.activeSetupAudio;
    if (!audio) return false;

    const wasPlaying = !audio.paused && !audio.ended;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {
      // The media element may already be detached or unavailable.
    }

    state.activeSetupAudio = null;
    if (state.activeSetupAudioResolve) {
      const resolve = state.activeSetupAudioResolve;
      state.activeSetupAudioResolve = null;
      resolve({ completed: false, reason: reason || "stopped" });
    }
    return wasPlaying;
  }

  function playSetupAudio() {
    stopSetupAudio("restarted");
    return new Promise((resolve, reject) => {
      const audio = new Audio(config.setup_audio.url);
      audio.preload = "auto";
      state.activeSetupAudio = audio;
      state.activeSetupAudioResolve = resolve;

      const clearActive = () => {
        if (state.activeSetupAudio === audio) state.activeSetupAudio = null;
        if (state.activeSetupAudioResolve === resolve) state.activeSetupAudioResolve = null;
      };

      audio.addEventListener("ended", () => {
        clearActive();
        resolve({ completed: true, reason: "ended" });
      }, { once: true });
      audio.addEventListener("error", () => {
        clearActive();
        reject(new Error(`Could not play setup audio: ${config.setup_audio.url}`));
      }, { once: true });
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
          clearActive();
          reject(error);
        });
      }
    });
  }

  window.addEventListener("beforeunload", () => {
    stopSetupAudio("page_unload");
  });

  try {
    await U.showPreExperimentScreen({
      centered: true,
      kicker: config.text.welcome_kicker,
      title: config.text.welcome_title,
      lead: config.text.welcome_lead,
      bodyHtml: '<div class="ax-welcome-mark" aria-hidden="true">♪</div>',
      buttonLabel: config.text.welcome_button
    });

    const consentScreen = await U.showPreExperimentScreen({
      centered: true,
      kicker: config.text.consent_kicker,
      title: config.text.consent_title,
      lead: config.text.consent_lead,
      bodyHtml: `
        <div class="ax-consent-box">
          ${makeParticipantInformationLink()}
          <p>${U.escapeHtml(config.text.consent_acknowledgement)}</p>
        </div>
      `,
      buttonLabel: config.text.consent_button
    });
    state.consentAcknowledgedAt = consentScreen.continued_at_iso;

    const participantFormatTestRun = config.task.mode === "test";
    state.participant = await U.collectParticipantCode({
      taskLabel: config.task.task_label,
      uiText: config.text.participant_code || config.text.technical_code,
      centered: true,
      defaultCode: "",
      allowTechnical: true,
      scientificRules: HOSTED_PARTICIPANT_ENTRY_RULES
    });
    state.taskEligibility = validateParticipantForTask(
      state.participant,
      {
        allowedSiteCodes: ["33", "84"],
        allowedPhaseCodes: ["0", "1"],
        allowedGroupCodes: ["1", "2", "3", "4"],
        allowedSexCodes: ["0", "1", "2", "9"],
        allowedSiteGroupPairs: ["33:1", "33:2", "84:3", "33:4"],
        requireTechnicalTestCode: false
      }
    );
    state.fullTechnicalRun = participantFormatTestRun
      ? U.isFullTechnicalRun()
      : true;
    state.orderNumber = U.deriveOrderNumber(
      state.participant.participant_id,
      config.runtime.order_pool_size
    );
    state.orderCode = U.padOrder(state.orderNumber);
    state.orderUrl = `${config.runtime.order_directory_url}/${config.runtime.order_filename_prefix}${state.orderCode}${config.runtime.order_filename_extension}`;

    state.allRows = (await loadCsvAsObjects(state.orderUrl)).map(normalizeRow);
    if (state.allRows.length !== 288) {
      throw new Error(`Expected 288 AX order rows, found ${state.allRows.length}.`);
    }

    state.rows = state.fullTechnicalRun
      ? state.allRows.slice()
      : U.selectRowsPerBlock(state.allRows, config.debug.max_trials_per_block);

    const blockIds = [...new Set(state.rows.map((row) => row.block_number))];
    if (blockIds.length !== 2) {
      throw new Error(`AX run must contain two ISI blocks; found ${blockIds.length}.`);
    }

    if (config.practice.sets.length !== 2 ||
        config.practice.sets.some((set) => set.length !== config.structure.practice_trials_per_isi_block)) {
      throw new Error("AX practice configuration must provide exactly 6 trials for each of two ISI blocks.");
    }
    state.practiceSets = config.practice.sets.map((set, setIndex) =>
      set.map((spec, position) => makePracticeRow(spec, setIndex + 1, position + 1))
    );

    state.setupAudioDurationMs = await U.loadAudioDurationMs(config.setup_audio.url);

    const xUrls = [
      ...state.rows.map((row) => row.audio_X_url),
      ...state.practiceSets.flat().map((row) => row.audio_X_url)
    ];
    state.durationMap = await U.loadDurationMap(xUrls);
  } catch (error) {
    console.error("[online_ax] setup failed", error);
    U.renderFatalError(
      "Impossible de préparer la tâche AX",
      `${error.message}`
    );
    return;
  }

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    experiment_width: 1100,
    case_sensitive_responses: false
  });

  const participantReadyRun =
    config.task.mode === "llf_participant_ready";
  const scientificRehearsalRun =
    config.task.mode === "scientific_rehearsal";
  const activationValidationRun =
    participantReadyRun &&
    U.isParticipantActivationValidationRun(state.participant);

  jsPsych.data.addProperties({
    ...getParticipantDataProperties(state.participant),
    task: config.task.task_code,
    task_label: config.task.task_label,
    task_family: config.task.task_family,
    task_version: config.task.task_version,
    task_mode: config.task.mode,
    instruction_language: config.locale.language,
    instruction_revision: config.locale.instruction_revision || null,
    html_language: config.locale.html_lang,
    order_number_assigned: state.orderNumber,
    order_code: state.orderCode,
    order_file_url: state.orderUrl,
    technical_placeholder_audio: !scientificStimuli,
    scientific_stimulus_audio: scientificStimuli,
    scientific_rehearsal: scientificRehearsalRun,
    activation_validation_run: activationValidationRun,
    participant_task_match: state.taskEligibility.valid === true,
    participant_task_eligibility_errors_json:
      JSON.stringify(state.taskEligibility.errors || []),
    scientific_eligible_run:
      scientificStimuli &&
      participantReadyRun &&
      state.participant.is_technical_test !== true &&
      activationValidationRun !== true &&
      state.taskEligibility.valid === true,
    participant_id_entry_policy_version: "2026-09-26_global_validity_v2",
    participant_id_policy_version: "2026-09-26_high_range_v1",
    debug_short_run:
      config.task.mode === "test" &&
      !state.fullTechnicalRun,
    source_order_total_rows: state.allRows.length,
    executed_order_rows: state.rows.length,
    consent_acknowledged: true,
    consent_acknowledged_at_iso: state.consentAcknowledgedAt,
    participant_information_url: config.participant_information.url,
    participant_information_placeholder: config.participant_information.placeholder,
    setup_audio_url: config.setup_audio.url,
    setup_audio_language: config.setup_audio.language,
    setup_audio_asset_version: config.setup_audio.asset_version,
    setup_audio_duration_metadata_ms: state.setupAudioDurationMs,
    setup_audio_normalization_target: config.setup_audio.normalization_target,
    setup_audio_purpose: config.setup_audio.purpose,
    practice_trials_per_isi_block: config.structure.practice_trials_per_isi_block,
    guided_practice_policy: "first_practice_trial_first_section_self_paced",
    main_trials_per_isi_block: config.structure.main_trials_per_isi_block,
    mini_block_size: config.structure.mini_block_size,
    mini_blocks_per_isi_block: config.structure.mini_blocks_per_isi_block,
    keyboard_case_sensitive_responses: false,
    response_key_normalization: "lowercase"
  });

  const uniqueAudio = [...new Set([
    ...state.rows.flatMap((row) => [row.audio_A_url, row.audio_X_url]),
    ...state.practiceSets.flatMap((set) => set.flatMap((row) => [row.audio_A_url, row.audio_X_url]))
  ])];

  const browserEnvironmentCheck = {
    type: jsPsychBrowserCheck,
    features: [
      "width",
      "height",
      "webaudio",
      "browser",
      "browser_version",
      "mobile",
      "os"
    ],
    allow_window_resize: false,
    inclusion_function: function () {
      return true;
    },
    data: {
      task: config.task.task_code,
      screen: "browser_environment_check",
      environment_capture_version: "perception_browser_environment_v1",
      environment_policy: "observational_pre_pilot"
    }
  };

  const preload = {
    type: jsPsychPreload,
    audio: uniqueAudio,
    continue_after_error: false,
    show_detailed_errors: config.debug.show_detailed_preload_errors === true,
    message: config.text.preload_message,
    data: { task: config.task.task_code, screen: "audio_preload" }
  };

  const setupChecklistHtml = config.text.setup_conditions.map((condition, index) => `
    <label class="ax-condition-row" for="ax-condition-${index + 1}">
      <input id="ax-condition-${index + 1}" class="ax-condition-checkbox" type="checkbox" />
      <span>${U.escapeHtml(condition)}</span>
    </label>
  `).join("");

  const setup = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="pcj-screen">
        <section class="pcj-panel pcj-panel--text pcj-friendly-panel ax-preflight-panel">
          <div class="pcj-study-kicker">${U.escapeHtml(config.text.setup_kicker)}</div>
          <h1 class="pcj-title pcj-friendly-title">${U.escapeHtml(config.text.setup_title)}</h1>
          <p class="pcj-study-lead">${U.escapeHtml(config.text.setup_lead)}</p>

          <div class="ax-calibration-card">
            <h2>${U.escapeHtml(config.text.setup_audio_title)}</h2>
            <p>${U.escapeHtml(config.text.setup_audio_instruction)}</p>
            <button id="ax-setup-audio-play" class="ax-calibration-button" type="button">
              ${U.escapeHtml(config.text.setup_audio_button)}
            </button>
            <div id="ax-setup-audio-status" class="ax-calibration-status" aria-live="polite"></div>
            <div class="ax-calibration-warning">${U.escapeHtml(config.text.setup_audio_warning)}</div>
          </div>

          <div class="ax-condition-list">
            ${setupChecklistHtml}
          </div>
          <div class="ax-setup-blocked-note">${U.escapeHtml(config.text.setup_blocked_note)}</div>
        </section>
      </div>
    `,
    choices: [config.text.setup_button],
    data: {
      task: config.task.task_code,
      screen: "environment_and_volume_setup",
      setup_audio_url: config.setup_audio.url,
      setup_audio_purpose: config.setup_audio.purpose
    },
    on_load: function () {
      const playButton = document.getElementById("ax-setup-audio-play");
      const status = document.getElementById("ax-setup-audio-status");
      const checkboxes = [...document.querySelectorAll(".ax-condition-checkbox")];
      const continueButton = document.querySelector("#jspsych-html-button-response-btngroup .jspsych-btn");

      function refreshContinueState() {
        const allChecked = checkboxes.every((checkbox) => checkbox.checked);
        continueButton.disabled = !(allChecked && state.setupAudioPlayCount > 0);
      }

      continueButton.disabled = true;
      checkboxes.forEach((checkbox) => checkbox.addEventListener("change", refreshContinueState));

      playButton.addEventListener("click", async () => {
        playButton.disabled = true;
        status.textContent = config.text.setup_audio_playing;
        try {
          const playback = await playSetupAudio();
          if (playback && playback.completed) {
            state.setupAudioPlayCount += 1;
            status.textContent = config.text.setup_audio_ready;
          }
        } catch (error) {
          console.error("[online_ax] setup audio failed", error);
          status.textContent = config.text.setup_audio_error;
        } finally {
          playButton.disabled = false;
          refreshContinueState();
        }
      });
    },
    on_finish: function (data) {
      const setupAudioInterrupted = stopSetupAudio("leaving_setup_screen");
      state.setupConfirmedAt = new Date().toISOString();
      data.setup_confirmed = true;
      data.setup_confirmed_at_iso = state.setupConfirmedAt;
      data.setup_audio_play_count = state.setupAudioPlayCount;
      data.setup_audio_interrupted_on_continue = setupAudioInterrupted;
      data.headphones_or_earphones_confirmed = true;
      data.quiet_environment_confirmed = true;
      data.physical_keyboard_confirmed = true;
      data.current_hearing_difficulty_denied = true;
      data.volume_fixed_commitment_confirmed = true;
    }
  };

  const trialFlowIntro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: U.makeGuidedPanel({
      kicker: config.text.intro_kicker,
      title: config.text.trial_timing_title,
      lead: config.text.intro_lead,
      steps: config.text.trial_timing_steps,
      note: config.text.trial_timing_note
    }),
    choices: [config.text.continue_label],
    data: { task: config.task.task_code, screen: "trial_flow_instructions" }
  };

  const responseIntro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: U.makeGuidedPanel({
      kicker: config.text.intro_kicker,
      title: config.text.response_title,
      lead: config.text.response_deadline_note,
      steps: config.text.response_steps,
      note: config.text.finger_instruction,
      extraHtml: makeKeyChoices()
    }),
    choices: [config.text.continue_label],
    data: { task: config.task.task_code, screen: "response_instructions" }
  };

  function makeKeyCheck(key, title, text, screen) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: U.makeGuidedPanel({
        kicker: config.text.keyboard_check_kicker,
        title,
        lead: text,
        extraHtml: makeKeyChoices()
      }),
      choices: [key],
      data: {
        task: config.task.task_code,
        screen,
        expected_key: key,
        case_sensitive_responses: false
      },
      on_finish: function (data) {
        const normalized = data.response == null ? null : String(data.response).toLowerCase();
        data.response_key_normalized = normalized;
        data.key_check_passed = normalized != null && jsPsych.pluginAPI.compareKeys(normalized, key);
      }
    };
  }

  const keyCheckS = makeKeyCheck(
    "s",
    config.text.key_check_s_title,
    config.text.key_check_s_text,
    "key_check_s"
  );
  const keyCheckL = makeKeyCheck(
    "l",
    config.text.key_check_l_title,
    config.text.key_check_l_text,
    "key_check_l"
  );

  function makeAxSequence(row, options) {
    const opts = options || {};
    const isGuidedPractice = opts.guidedPractice === true;
    const xDurationMs = state.durationMap.get(row.audio_X_url);
    const xTrialDurationMs = Math.ceil(
      xDurationMs + config.timing.response_window_after_x_ms
    );

    const fixation = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<div class="perception-fixation">+</div>',
      choices: "NO_KEYS",
      trial_duration: config.timing.fixation_ms,
      data: { ...baseData(row), trial_role: "fixation" }
    };

    const stimulusA = {
      type: jsPsychAudioKeyboardResponse,
      stimulus: row.audio_A_url,
      choices: "NO_KEYS",
      trial_ends_after_audio: true,
      prompt: `
        <div class="ax-listen-stage">
          <div class="ax-sound-pill">${U.escapeHtml(config.text.first_sound_label)}</div>
          <div class="ax-listen-copy">${U.escapeHtml(config.text.listen_label)}</div>
        </div>
      `,
      data: { ...baseData(row), trial_role: "stimulus_A" }
    };

    const isi = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<div class="ax-isi-blank" aria-hidden="true"></div>',
      choices: "NO_KEYS",
      trial_duration: row.isi_ms,
      data: { ...baseData(row), trial_role: "isi" }
    };

    const stimulusXResponse = {
      type: jsPsychAudioKeyboardResponse,
      stimulus: row.audio_X_url,
      choices: ["s", "l"],
      prompt: `
        <div class="ax-response-panel">
          <div class="ax-sound-pill">${U.escapeHtml(config.text.second_sound_label)}</div>
          <p class="ax-response-question">${U.escapeHtml(config.text.response_question)}</p>
          <div class="pcj-key-choice-grid ax-live-choices" aria-hidden="true">
            <div class="pcj-key-choice">
              <div class="pcj-keycap">S</div>
              <div class="pcj-key-choice-label">${U.escapeHtml(config.text.same_label)}</div>
            </div>
            <div class="pcj-key-choice">
              <div class="pcj-keycap">L</div>
              <div class="pcj-key-choice-label">${U.escapeHtml(config.text.different_label)}</div>
            </div>
          </div>
          <div class="ax-response-wait">${U.escapeHtml(config.text.response_wait)}</div>
        </div>
      `,
      response_allowed_while_playing: false,
      response_ends_trial: true,
      trial_duration: xTrialDurationMs,
      data: {
        ...baseData(row),
        trial_role: "stimulus_X_response",
        x_duration_metadata_ms: xDurationMs,
        x_duration_source: "HTMLMediaElement.loadedmetadata",
        response_window_after_x_ms: config.timing.response_window_after_x_ms,
        rt_anchor_planned: "X_offset",
        case_sensitive_responses: false,
        response_key_normalization: "lowercase"
      },
      on_finish: function (data) {
        const rawRt = data.rt;
        const derivedRt = rawRt == null ? null : rawRt - xDurationMs;
        const responseKey = data.response == null ? null : String(data.response).toLowerCase();
        const responseLabel = responseKey == null
          ? null
          : jsPsych.pluginAPI.compareKeys(responseKey, "s")
            ? "SAME"
            : jsPsych.pluginAPI.compareKeys(responseKey, "l")
              ? "DIFFERENT"
              : null;

        data.response_key = responseKey;
        data.response_key_normalized = responseKey;
        data.response_label = responseLabel;
        data.response_timeout = responseKey == null;
        data.correct = responseKey == null
          ? false
          : jsPsych.pluginAPI.compareKeys(responseKey, row.correct_key);
        data.plugin_rt_from_x_onset_ms = rawRt;
        data.rt_from_x_offset_ms = derivedRt;
        data.rt_anchor = "derived_from_plugin_audio_onset_minus_metadata_duration";
        data.rt_anchor_warning = derivedRt != null && derivedRt < -5;
        data.response_rt_comparable = true;
      }
    };

    const guidedStimulusX = {
      type: jsPsychAudioKeyboardResponse,
      stimulus: row.audio_X_url,
      choices: "NO_KEYS",
      trial_ends_after_audio: true,
      prompt: `
        <div class="ax-listen-stage">
          <div class="ax-sound-pill">${U.escapeHtml(config.text.second_sound_label)}</div>
          <div class="ax-listen-copy">${U.escapeHtml(config.text.listen_label)}</div>
        </div>
      `,
      data: {
        ...baseData(row),
        trial_role: "stimulus_X_guided_audio",
        x_duration_metadata_ms: xDurationMs,
        x_duration_source: "HTMLMediaElement.loadedmetadata",
        guided_practice: true
      }
    };

    const guidedResponse = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: U.makeGuidedPanel({
        kicker: config.text.guided_practice_kicker,
        title: config.text.guided_practice_title,
        lead: config.text.guided_practice_question,
        steps: [
          {
            title: `S = ${config.text.same_label}`,
            text: config.text.guided_practice_same_instruction
          },
          {
            title: `L = ${config.text.different_label}`,
            text: config.text.guided_practice_different_instruction
          }
        ],
        note: config.text.guided_practice_self_paced_note,
        extraHtml: makeKeyChoices()
      }),
      choices: ["s", "l"],
      data: {
        ...baseData(row),
        trial_role: "stimulus_X_response",
        guided_practice: true,
        x_duration_metadata_ms: xDurationMs,
        x_duration_source: "HTMLMediaElement.loadedmetadata",
        response_window_after_x_ms: null,
        rt_anchor_planned: "guided_response_screen_onset",
        case_sensitive_responses: false,
        response_key_normalization: "lowercase"
      },
      on_finish: function (data) {
        const responseKey = data.response == null ? null : String(data.response).toLowerCase();
        const responseLabel = responseKey == null
          ? null
          : jsPsych.pluginAPI.compareKeys(responseKey, "s")
            ? "SAME"
            : jsPsych.pluginAPI.compareKeys(responseKey, "l")
              ? "DIFFERENT"
              : null;

        data.response_key = responseKey;
        data.response_key_normalized = responseKey;
        data.response_label = responseLabel;
        data.response_timeout = responseKey == null;
        data.correct = responseKey == null
          ? false
          : jsPsych.pluginAPI.compareKeys(responseKey, row.correct_key);
        data.plugin_rt_from_x_onset_ms = null;
        data.rt_from_x_offset_ms = null;
        data.guided_response_rt_ms = data.rt;
        data.rt_anchor = "guided_response_screen_onset";
        data.rt_anchor_warning = false;
        data.response_rt_comparable = false;
      }
    };

    const sequence = isGuidedPractice
      ? [fixation, stimulusA, isi, guidedStimulusX, guidedResponse]
      : [fixation, stimulusA, isi, stimulusXResponse];

    if (opts.feedback === true) {
      sequence.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
          const last = jsPsych.data.get().filter({
            trial_role: "stimulus_X_response",
            trial_phase: "practice"
          }).last(1).values()[0];
          let message;
          if (!last || last.response_timeout) {
            message = config.text.practice_feedback_timeout;
          } else if (last.correct) {
            message = config.text.practice_feedback_correct;
          } else {
            message = row.same_different === "SAME"
              ? config.text.practice_feedback_incorrect_same
              : config.text.practice_feedback_incorrect_different;
          }
          return `<div class="ax-practice-feedback">${U.escapeHtml(message)}</div>`;
        },
        choices: "NO_KEYS",
        trial_duration: config.timing.practice_feedback_ms,
        data: { ...baseData(row), trial_role: "practice_feedback" }
      });
    }

    if (isGuidedPractice) {
      sequence.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: U.makeGuidedPanel({
          kicker: config.text.guided_practice_kicker,
          title: config.text.guided_practice_ready_title,
          lead: config.text.guided_practice_ready_lead,
          extraHtml: makeKeyChoices()
        }),
        choices: [config.text.continue_label],
        data: {
          ...baseData(row),
          trial_role: "guided_practice_transition",
          guided_practice: true
        }
      });
    }

    sequence.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "",
      choices: "NO_KEYS",
      trial_duration: config.timing.iti_ms,
      data: { ...baseData(row), trial_role: "iti" }
    });

    return sequence;
  }

  function chunkRows(rows, size) {
    const chunks = [];
    for (let i = 0; i < rows.length; i += size) {
      chunks.push(rows.slice(i, i + size));
    }
    return chunks;
  }

  function blockKicker(index, total) {
    return `${config.text.block_title} ${index} ${config.text.block_counter_separator} ${total}`;
  }

  function makeLlfCheckpointSaveTrial(label) {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function (done) {
        const displayElement = jsPsych.getDisplayElement();
        if (!displayElement) {
          done({
            success: false,
            label,
            error: "jsPsych display element is unavailable during LLF checkpoint save."
          });
          return;
        }
        displayElement.innerHTML = U.makePanel(
          config.text.checkpoint_save_title || "Sauvegarde…",
          [config.text.checkpoint_save_lead || "Veuillez patienter un instant."]
        );

        U.saveJsPsychLogs({
          jsPsych,
          participantId: state.participant.participant_id,
          taskCode: config.task.task_code,
          saveTarget: config.saving.log_save_target,
          saveBackend: config.saving.save_backend,
          saveConfigExtras: config.saving,
          savePhase: "checkpoint",
          saveLabel: label
        })
          .then((result) => {
            const record = { success: true, label, result };
            state.checkpointSaves.push(record);
            done(record);
          })
          .catch((error) => {
            console.error("[online_ax] LLF checkpoint save failed", error);
            const record = {
              success: false,
              label,
              error: error && error.message ? error.message : String(error)
            };
            state.checkpointSaves.push(record);
            done(record);
          });
      },
      data: {
        task: config.task.task_code,
        screen: `llf_save_${label}`,
        save_phase: "checkpoint"
      }
    };
  }

  const blocks = [...new Set(state.rows.map((row) => row.block_number))]
    .sort((a, b) => a - b)
    .map((blockNumber) => {
      const rows = state.rows.filter((row) => row.block_number === blockNumber);
      const isiValues = [...new Set(rows.map((row) => row.isi_ms))];
      if (isiValues.length !== 1) {
        throw new Error(`AX block ${blockNumber} contains more than one ISI.`);
      }
      return {
        blockNumber,
        isiMs: isiValues[0],
        rows
      };
    });

  const mainTimeline = [];
  blocks.forEach((block, index) => {
    mainTimeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: U.makeGuidedPanel({
        kicker: blockKicker(index + 1, blocks.length),
        title: index === 0 ? config.text.block_rest_title_first : config.text.block_rest_title_next,
        lead: config.text.block_rest_lead,
        steps: config.text.block_intro_steps,
        note: config.text.finger_instruction,
        extraHtml: makeKeyChoices()
      }),
      choices: [index === 0 ? config.text.block_start_button : config.text.resume_button],
      data: { task: config.task.task_code, screen: `block_${block.blockNumber}_intro` },
      on_finish: function (data) {
        data.ready_wait_ms = data.rt;
      }
    });

    mainTimeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: U.makeGuidedPanel({
        kicker: `${config.text.block_title} ${index + 1} · ${config.text.block_practice_suffix}`,
        title: config.text.practice_title,
        lead: config.text.practice_lead,
        steps: config.text.practice_steps,
        extraHtml: makeKeyChoices()
      }),
      choices: [config.text.practice_start_button],
      data: { task: config.task.task_code, screen: `block_${block.blockNumber}_practice_intro` }
    });

    state.practiceSets[index].forEach((practiceRow) => {
      const guidedPractice = index === 0 && practiceRow.practice_position === 1;
      const row = {
        ...practiceRow,
        block_number: block.blockNumber,
        block_isi_ms: block.isiMs,
        isi_ms: block.isiMs,
        trial_phase: "practice",
        guided_practice: guidedPractice
      };
      mainTimeline.push(...makeAxSequence(row, {
        feedback: true,
        guidedPractice
      }));
    });

    mainTimeline.push(makeButtonScreen(
      config.text.practice_complete_title,
      [config.text.practice_complete_lead],
      `block_${block.blockNumber}_practice_complete`,
      config.text.practice_complete_button
    ));

    const miniBlocks = chunkRows(block.rows, config.structure.mini_block_size);
    if (state.fullTechnicalRun && miniBlocks.length !== config.structure.mini_blocks_per_isi_block) {
      throw new Error(
        `Full AX block ${block.blockNumber} expected ${config.structure.mini_blocks_per_isi_block} mini-blocks, found ${miniBlocks.length}.`
      );
    }

    miniBlocks.forEach((miniRows, miniIndex) => {
      miniRows.forEach((row) => {
        const enriched = {
          ...row,
          trial_phase: "main",
          mini_block_number: miniIndex + 1
        };
        mainTimeline.push(...makeAxSequence(enriched));
      });

      const isFinalMiniBlock =
        index === blocks.length - 1 &&
        miniIndex === miniBlocks.length - 1;

      if (
        (config.saving.save_backend === "llf" || config.saving.save_backend === "datapipe") &&
        !isFinalMiniBlock
      ) {
        mainTimeline.push(
          makeLlfCheckpointSaveTrial(
            `checkpoint-b${block.blockNumber}-m${miniIndex + 1}`
          )
        );
      }

      if (miniIndex < miniBlocks.length - 1) {
        mainTimeline.push({
          type: jsPsychHtmlButtonResponse,
          stimulus: U.makeGuidedPanel({
            kicker: blockKicker(index + 1, blocks.length),
            title: config.text.mini_break_title,
            lead: config.text.mini_break_lead,
            steps: config.text.mini_break_steps
          }),
          choices: [config.text.resume_button],
          data: {
            task: config.task.task_code,
            screen: `block_${block.blockNumber}_mini_${miniIndex + 1}_break`,
            block_number: block.blockNumber,
            completed_mini_block: miniIndex + 1
          },
          on_finish: function (data) {
            data.break_duration_ms = data.rt;
          }
        });
      }
    });

    if (index < blocks.length - 1) {
      mainTimeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: U.makePanel(config.text.break_title, config.text.break_paragraphs),
        choices: [config.text.continue_label],
        data: { task: config.task.task_code, screen: `block_${block.blockNumber}_break` },
        on_finish: function (data) {
          data.break_duration_ms = data.rt;
        }
      });
    }
  });

  const saveTrial = {
    type: jsPsychCallFunction,
    async: true,
    func: function (done) {
      U.saveJsPsychLogs({
        jsPsych,
        participantId: state.participant.participant_id,
        taskCode: config.task.task_code,
        saveTarget: config.saving.log_save_target,
        saveBackend: config.saving.save_backend,
        saveConfigExtras: config.saving,
        savePhase: "final",
        saveLabel: "final"
      })
        .then((result) => {
          state.finalSave = { success: true, result };
          done(state.finalSave);
        })
        .catch((error) => {
          console.error("[online_ax] final save failed", error);
          state.finalSave = { success: false, error: error.message };
          done(state.finalSave);
        });
    },
    data: { task: config.task.task_code, screen: "save_final_logs" }
  };

  const completion = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
      const saveText = state.finalSave && state.finalSave.success
        ? config.text.save_success
        : `${config.text.save_failure_prefix} ${state.finalSave && state.finalSave.error ? state.finalSave.error : config.text.save_unknown_error}`;
      return U.makePanel(
        config.text.completion_title,
        config.text.completion_paragraphs,
        `<div class="pcj-tech-hint">${U.escapeHtml(saveText)}</div>`
      );
    },
    choices: "NO_KEYS",
    data: { task: config.task.task_code, screen: "completion" }
  };

  document.body.innerHTML = "";
  jsPsych.run([
    browserEnvironmentCheck,
    setup,
    preload,
    trialFlowIntro,
    responseIntro,
    keyCheckS,
    keyCheckL,
    ...mainTimeline,
    saveTrial,
    completion
  ]);
})();