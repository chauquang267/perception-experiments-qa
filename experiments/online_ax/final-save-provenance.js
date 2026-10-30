(function installAxFinalSaveProvenance() {
  "use strict";

  const U = window.ProsodyPerceptionRuntime;
  if (!U || typeof U.saveJsPsychLogs !== "function") {
    throw new Error("AX final-save provenance requires ProsodyPerceptionRuntime.saveJsPsychLogs.");
  }

  const originalSaveJsPsychLogs = U.saveJsPsychLogs;
  const SESSION_FIELDS = Object.freeze([
    "participant_id",
    "participant_serial",
    "task",
    "task_label",
    "task_family",
    "task_version",
    "task_mode",
    "instruction_language",
    "html_language",
    "order_number_assigned",
    "order_code",
    "order_file_url",
    "technical_placeholder_audio",
    "scientific_eligible_run",
    "debug_short_run",
    "source_order_total_rows",
    "executed_order_rows",
    "consent_acknowledged",
    "consent_acknowledged_at_iso",
    "setup_audio_language",
    "practice_trials_per_isi_block",
    "guided_practice_policy",
    "main_trials_per_isi_block",
    "mini_block_size",
    "mini_blocks_per_isi_block",
    "keyboard_case_sensitive_responses",
    "response_key_normalization"
  ]);

  function copySessionFields(source) {
    const copied = {};
    SESSION_FIELDS.forEach((field) => {
      if (source && Object.prototype.hasOwnProperty.call(source, field)) {
        copied[field] = source[field];
      }
    });
    return copied;
  }

  async function saveJsPsychLogsWithFinalCheckpoint(options) {
    if (options && options.savePhase === "checkpoint") {
      return originalSaveJsPsychLogs(options);
    }

    const jsPsych = options && options.jsPsych;
    if (!jsPsych || !jsPsych.data || typeof jsPsych.data.get !== "function") {
      throw new Error("AX final-save provenance requires a jsPsych data collection.");
    }

    const liveData = jsPsych.data.get();
    if (!liveData || typeof liveData.readOnly !== "function") {
      throw new Error("AX final-save provenance requires DataCollection.readOnly().");
    }

    const snapshot = liveData.readOnly();
    if (typeof snapshot.push !== "function" || typeof snapshot.values !== "function") {
      throw new Error("AX final-save provenance requires DataCollection.push() and values().");
    }

    const rows = snapshot.values();
    const lastCompletedRow = rows.length > 0 ? rows[rows.length - 1] : {};
    const checkpoint = {
      ...copySessionFields(lastCompletedRow),
      participant_id: lastCompletedRow.participant_id || options.participantId || null,
      task: options.taskCode || lastCompletedRow.task || "online_ax",
      trial_type: "provenance_marker",
      screen: "final_save_checkpoint",
      trial_role: "provenance_marker",
      provenance_event: true,
      provenance_event_type: "final_save_checkpoint",
      save_provenance_version: "ax_final_save_checkpoint_v1",
      experimental_timeline_complete: true,
      final_save_reached: true,
      final_save_status_at_snapshot: "attempt_started",
      final_save_snapshot_created_at_iso: new Date().toISOString(),
      final_save_expected_formats: "json,csv",
      saved_data_includes_save_trial: false,
      saved_data_includes_completion_screen: false,
      save_provenance_semantics: "Export-only checkpoint appended immediately before JSON/CSV serialization; file presence confirms that this checkpoint was reached, not that every configured backend write succeeded."
    };

    snapshot.push(checkpoint);

    const snapshotJsPsych = {
      data: {
        get: function () {
          return snapshot;
        }
      }
    };

    return originalSaveJsPsychLogs({
      ...options,
      jsPsych: snapshotJsPsych
    });
  }

  window.ProsodyPerceptionRuntime = Object.freeze({
    ...U,
    saveJsPsychLogs: saveJsPsychLogsWithFinalCheckpoint
  });
})();
