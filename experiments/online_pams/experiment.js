(async function runPamsTechnicalBrowser() {
  "use strict";

  const config = window.ONLINE_PAMS_CONFIG;
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
    document.body.innerHTML = "<p>La configuration de la tâche est indisponible.</p>";
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
    allMainRows: [],
    mainRows: [],
    allPracticeRows: [],
    practiceRows: [],
    durationMap: null,
    fullTechnicalRun: false,
    latestCategoryByItem: new Map(),
    checkpointSaves: [],
    finalSave: null
  };
  window.ONLINE_PAMS_RUNTIME = state;

  function normalizeMainRow(row) {
    let out = coerceIntegerFields(row, [
      "order_number", "block_number", "position_in_block", "global_position"
    ]);
    out = coerceBooleanFields(out, ["technical_only", "scientific_eligible"]);
    out.audio_project_path = out.audio_path;
    out.audio_url = U.mapPerceptionAudioPath(
      out.audio_path,
      audioPathOptions
    );
    const expectedTechnicalOnly = !scientificStimuli;
    const expectedScientificEligible = scientificStimuli;
    if (
      out.technical_only !== expectedTechnicalOnly ||
      out.scientific_eligible !== expectedScientificEligible
    ) {
      throw new Error(
        `Mapping row ${out.item_id} eligibility mismatch for ${audioMode} mode.`
      );
    }
    return out;
  }

  function normalizePracticeRow(row, index) {
    let out = coerceBooleanFields(row, ["technical_only", "scientific_eligible"]);
    out.practice_position = index + 1;
    out.audio_project_path = out.audio_path;
    out.audio_url = U.mapPerceptionAudioPath(
      out.audio_path,
      audioPathOptions
    );
    const expectedTechnicalOnly = !scientificStimuli;
    const expectedScientificEligible = scientificStimuli;
    if (
      out.technical_only !== expectedTechnicalOnly ||
      out.scientific_eligible !== expectedScientificEligible
    ) {
      throw new Error(
        `Mapping practice row ${out.item_id} eligibility mismatch for ${audioMode} mode.`
      );
    }
    return out;
  }

  function baseData(row, taskStage) {
    return {
      task: config.task.task_code,
      task_label: config.task.task_label,
      task_family: config.task.task_family,
      task_version: config.task.task_version,
      task_mode: config.task.mode,
      instruction_language: config.locale.language,
      task_stage: taskStage,
      order_id: row.order_id || null,
      order_number: row.order_number || null,
      block_assignment_pattern: row.block_assignment_pattern || null,
      block_number: row.block_number || null,
      position_in_block: row.position_in_block || null,
      global_position: row.global_position || null,
      practice_position: row.practice_position || null,
      item_id: row.item_id,
      stimulus_token_id: row.stimulus_token_id,
      speaker_slot: row.speaker_slot,
      syllable_code: row.syllable_code,
      tone_code: row.tone_code,
      token_slot: row.token_slot,
      audio_project_path: row.audio_project_path,
      audio_url: row.audio_url,
      technical_only: row.technical_only,
      scientific_eligible: row.scientific_eligible
    };
  }

  function makeButtonScreen(title, paragraphs, screen, label) {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: U.makePanel(title, paragraphs),
      choices: [label || config.text.continue_label],
      data: { task: config.task.task_code, screen }
    };
  }

  function categoryPreview() {
    return `
      <div class="pams-category-preview" aria-label="Catégories de réponse">
        ${config.response.categories.map((label, index) => `
          <span class="pams-category-chip${index === config.response.uncertain_index ? " pams-category-chip--uncertain" : ""}">
            ${U.escapeHtml(label)}
          </span>
        `).join("")}
      </div>
    `;
  }

  function categoryGuide() {
    return `
      <div class="pams-category-guide" aria-label="Explication des catégories de réponse">
        ${config.response.categories.map((label, index) => `
          <div class="pams-category-guide-row${index === config.response.uncertain_index ? " pams-category-guide-row--uncertain" : ""}">
            <div class="pams-category-guide-label">${U.escapeHtml(label)}</div>
            <div class="pams-category-guide-description">${U.escapeHtml(config.response.category_descriptions[index])}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  try {
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
        allowedSiteCodes: ["33"],
        allowedPhaseCodes: ["0", "1"],
        allowedGroupCodes: ["1", "4"],
        allowedSexCodes: ["0", "1", "2", "9"],
        allowedSiteGroupPairs: ["33:1", "33:4"],
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

    state.allMainRows = (await loadCsvAsObjects(state.orderUrl)).map(normalizeMainRow);
    if (state.allMainRows.length !== config.structure.main_trials) {
      throw new Error(`Expected ${config.structure.main_trials} mapping main rows, found ${state.allMainRows.length}.`);
    }

    state.allPracticeRows = (await loadCsvAsObjects(config.runtime.practice_manifest_url))
      .map(normalizePracticeRow);
    if (state.allPracticeRows.length !== config.structure.practice_trials) {
      throw new Error(`Expected ${config.structure.practice_trials} mapping practice rows, found ${state.allPracticeRows.length}.`);
    }

    state.mainRows = state.fullTechnicalRun
      ? state.allMainRows.slice()
      : U.selectRowsPerBlock(state.allMainRows, config.debug.max_main_trials_per_block);
    state.practiceRows = state.fullTechnicalRun
      ? state.allPracticeRows.slice()
      : state.allPracticeRows.slice(0, config.debug.max_practice_trials);

    const blockIds = [...new Set(state.mainRows.map((row) => row.block_number))];
    if (blockIds.length !== config.structure.blocks) {
      throw new Error(`Mapping run must contain ${config.structure.blocks} blocks; found ${blockIds.length}.`);
    }

    if (state.fullTechnicalRun) {
      blockIds.forEach((blockNumber) => {
        const blockSize = state.mainRows.filter((row) => row.block_number === blockNumber).length;
        if (blockSize !== config.structure.main_trials_per_block) {
          throw new Error(`Full mapping block ${blockNumber} expected ${config.structure.main_trials_per_block} rows, found ${blockSize}.`);
        }
      });
    }

    state.durationMap = await U.loadDurationMap([
      ...state.practiceRows.map((row) => row.audio_url),
      ...state.mainRows.map((row) => row.audio_url)
    ]);
  } catch (error) {
    console.error("[online_pams] setup failed", error);
    U.renderFatalError(
      "Impossible de préparer la tâche",
      `${error.message}`
    );
    return;
  }

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    experiment_width: 1050
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
    source_main_order_total_rows: state.allMainRows.length,
    executed_main_rows: state.mainRows.length,
    source_practice_total_rows: state.allPracticeRows.length,
    executed_practice_rows: state.practiceRows.length,
    category_response_window_after_audio_ms: config.timing.category_window_after_audio_ms,
    category_explanation_policy: "written_french_category_descriptions_no_audio_prototypes",
    goodness_policy: "conditional_for_four_named_categories_only",
    uncertain_other_open_ended_policy: "optional_post_task_question"
  });

  const uniqueAudio = [...new Set([
    ...state.practiceRows.map((row) => row.audio_url),
    ...state.mainRows.map((row) => row.audio_url)
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

  const intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: U.makeGuidedPanel({
      kicker: config.text.intro_kicker,
      title: config.text.intro_title,
      lead: config.text.intro_lead,
      steps: config.text.intro_steps,
      note: config.text.intro_uncertain_note,
      extraHtml: `
        <div class="pams-interpretive-note">${U.escapeHtml(config.text.intro_interpretive_note)}</div>
        ${categoryGuide()}
      `
    }),
    choices: [config.text.continue_label],
    data: { task: config.task.task_code, screen: "task_intro" }
  };

  function makeMappingSequence(row, taskStage) {
    const audioDurationMs = state.durationMap.get(row.audio_url);
    const categoryTrialDurationMs = Math.ceil(
      audioDurationMs + config.timing.category_window_after_audio_ms
    );
    const itemKey = `${taskStage}|${row.item_id}`;

    const fixation = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<div class="perception-fixation">+</div>',
      choices: "NO_KEYS",
      trial_duration: config.timing.fixation_ms,
      data: { ...baseData(row, taskStage), trial_role: "fixation" }
    };

    const category = {
      type: jsPsychAudioButtonResponse,
      stimulus: row.audio_url,
      choices: config.response.categories,
      prompt: `
        <div class="pams-category-prompt">
          <div class="pams-listen-kicker">${U.escapeHtml(config.text.category_listen_kicker)}</div>
          <div class="pams-category-question">${U.escapeHtml(config.text.category_prompt)}</div>
        </div>
      `,
      response_allowed_while_playing: false,
      response_ends_trial: true,
      trial_duration: categoryTrialDurationMs,
      data: {
        ...baseData(row, taskStage),
        trial_role: "category_response",
        audio_duration_metadata_ms: audioDurationMs,
        audio_duration_source: "HTMLMediaElement.loadedmetadata",
        category_window_after_audio_ms: config.timing.category_window_after_audio_ms,
        category_rt_anchor_planned: "stimulus_offset"
      },
      on_finish: function (data) {
        const responseIndex = data.response == null ? null : Number(data.response);
        const responseLabel = responseIndex == null
          ? null
          : config.response.categories[responseIndex] || null;
        const derivedRt = data.rt == null ? null : data.rt - audioDurationMs;
        const needsGoodness = responseIndex != null && responseIndex !== config.response.uncertain_index;

        data.category_response_index = responseIndex;
        data.category_response_label = responseLabel;
        data.category_timeout = responseIndex == null;
        data.plugin_rt_from_audio_onset_ms = data.rt;
        data.category_rt_from_audio_offset_ms = derivedRt;
        data.category_rt_anchor = "derived_from_plugin_audio_onset_minus_metadata_duration";
        data.category_rt_anchor_warning = derivedRt != null && derivedRt < -5;
        data.goodness_required = needsGoodness;

        state.latestCategoryByItem.set(itemKey, {
          responseIndex,
          responseLabel,
          needsGoodness
        });
      }
    };

    const goodness = {
      type: jsPsychHtmlButtonResponse,
      stimulus: function () {
        const prior = state.latestCategoryByItem.get(itemKey);
        const label = prior && prior.responseLabel ? prior.responseLabel : "catégorie choisie";
        return `
          <div class="pcj-screen">
            <div class="pcj-panel pcj-panel--text pcj-center pams-goodness-panel">
              <div class="pcj-study-kicker">${U.escapeHtml(config.text.goodness_kicker)}</div>
              <p class="pams-selected-category">${U.escapeHtml(label)}</p>
              <h1 class="pcj-title pams-goodness-title">${U.escapeHtml(config.text.goodness_prompt)}</h1>
              <div class="pams-goodness-anchors">
                <span>${U.escapeHtml(config.text.goodness_low)}</span>
                <span>${U.escapeHtml(config.text.goodness_high)}</span>
              </div>
            </div>
          </div>
        `;
      },
      choices: config.response.goodness_choices,
      data: {
        ...baseData(row, taskStage),
        trial_role: "goodness_response"
      },
      on_finish: function (data) {
        const prior = state.latestCategoryByItem.get(itemKey);
        data.selected_category_index = prior ? prior.responseIndex : null;
        data.selected_category_label = prior ? prior.responseLabel : null;
        data.goodness_button_index = data.response == null ? null : Number(data.response);
        data.goodness_rating = data.response == null ? null : Number(data.response) + 1;
      }
    };

    const goodnessNode = {
      timeline: [goodness],
      conditional_function: function () {
        const prior = state.latestCategoryByItem.get(itemKey);
        return Boolean(prior && prior.needsGoodness);
      }
    };

    const iti = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "",
      choices: "NO_KEYS",
      trial_duration: config.timing.iti_ms,
      data: { ...baseData(row, taskStage), trial_role: "iti" }
    };

    return [fixation, category, goodnessNode, iti];
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
            console.error("[online_pams] LLF checkpoint save failed", error);
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

  const timeline = [browserEnvironmentCheck, preload, intro];

  if (state.practiceRows.length) {
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: U.makeGuidedPanel({
        kicker: "Entraînement",
        title: config.text.practice_title,
        lead: state.fullTechnicalRun ? config.text.practice_lead_full : config.text.practice_lead_debug,
        steps: config.text.practice_steps,
        note: config.text.practice_note,
        extraHtml: categoryPreview()
      }),
      choices: [config.text.practice_start_button],
      data: { task: config.task.task_code, screen: "practice_intro" }
    });
    state.practiceRows.forEach((row) => {
      timeline.push(...makeMappingSequence(row, "practice"));
    });
  }

  const blocks = [...new Set(state.mainRows.map((row) => row.block_number))]
    .sort((a, b) => a - b)
    .map((blockNumber) => ({
      blockNumber,
      rows: state.mainRows.filter((row) => row.block_number === blockNumber)
    }));

  blocks.forEach((block, index) => {
    const blockLead = state.fullTechnicalRun
      ? config.text.block_lead_full
      : `${config.text.block_lead_debug_prefix} ${block.rows.length} sons dans cette session de test.`;

    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: U.makeGuidedPanel({
        kicker: `${config.text.block_title} ${index + 1} sur ${blocks.length}`,
        title: index === 0 ? config.text.block_first_title : config.text.block_next_title,
        lead: blockLead,
        steps: config.text.block_steps,
        extraHtml: categoryPreview()
      }),
      choices: [index === 0 ? config.text.block_start_button : config.text.resume_button],
      data: { task: config.task.task_code, screen: `block_${block.blockNumber}_intro` }
    });

    block.rows.forEach((row) => timeline.push(...makeMappingSequence(row, "main")));

    if (
      (config.saving.save_backend === "llf" || config.saving.save_backend === "datapipe") &&
      index < blocks.length - 1
    ) {
      timeline.push(
        makeLlfCheckpointSaveTrial(
          `checkpoint-b${block.blockNumber}`
        )
      );
    }

    if (index < blocks.length - 1) {
      const blockBreak = makeButtonScreen(
        config.text.break_title,
        config.text.break_paragraphs,
        `block_${block.blockNumber}_break`,
        config.text.continue_label
      );
      blockBreak.on_finish = function (data) {
        data.break_duration_ms = data.rt;
      };
      timeline.push(blockBreak);
    }
  });

  timeline.push({
    type: jsPsychSurveyText,
    preamble: `
      <div class="pcj-screen">
        <section class="pcj-panel pcj-panel--text pcj-friendly-panel pams-open-ended-panel">
          <div class="pcj-study-kicker">Fin de la tâche</div>
          <h1 class="pcj-title pcj-friendly-title">${U.escapeHtml(config.text.open_ended_title)}</h1>
        </section>
      </div>
    `,
    questions: [{
      prompt: U.escapeHtml(config.text.open_ended_prompt),
      placeholder: config.text.open_ended_placeholder,
      rows: 5,
      columns: 60,
      required: false,
      name: "uncertain_other_comment"
    }],
    button_label: config.text.open_ended_button,
    autocomplete: false,
    data: {
      task: config.task.task_code,
      screen: "post_task_uncertain_other_comment",
      task_stage: "post_task",
      optional_response: true
    },
    on_finish: function (data) {
      const response = data.response && typeof data.response.uncertain_other_comment === "string"
        ? data.response.uncertain_other_comment.trim()
        : "";
      data.uncertain_other_comment = response;
      data.uncertain_other_comment_provided = response.length > 0;
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
          console.error("[online_pams] final save failed", error);
          state.finalSave = { success: false, error: error.message };
          done(state.finalSave);
        });
    },
    data: { task: config.task.task_code, screen: "save_final_logs" }
  };
  timeline.push(saveTrial);

  timeline.push({
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
  });

  document.body.innerHTML = "";
  jsPsych.run(timeline);
})();
