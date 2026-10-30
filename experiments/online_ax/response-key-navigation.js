(function installAxResponseKeyNavigation() {
  "use strict";

  const RESPONSE_KEYS = new Set(["s", "l"]);
  let responseKeyPhaseStarted = false;
  let waitingForRelease = false;
  let decorateQueued = false;

  function normalizedKey(event) {
    return event && typeof event.key === "string" ? event.key.toLowerCase() : "";
  }

  function continuationText() {
    return document.documentElement.lang === "vi"
      ? "Nhấn phím S hoặc L để tiếp tục."
      : "Appuyez sur la touche S ou L pour continuer.";
  }

  function currentButtonGroup() {
    return document.getElementById("jspsych-html-button-response-btngroup");
  }

  function currentContinueButton() {
    const group = currentButtonGroup();
    return group ? group.querySelector(".jspsych-btn") : null;
  }

  function decorateInitialScrollNotice() {
    const config = window.ONLINE_AX_CONFIG;
    if (!config || !config.text || !config.text.initial_scroll_note) return;
    if (!document.querySelector(".ax-welcome-mark")) return;
    if (document.querySelector(".ax-initial-scroll-note")) return;

    const panel = document.querySelector(".pcj-panel");
    if (!panel) return;

    const note = document.createElement("div");
    note.className = "pcj-friendly-note ax-initial-scroll-note";
    note.textContent = config.text.initial_scroll_note;
    panel.appendChild(note);
  }

  function decorateGuidedPracticeKicker() {
    const config = window.ONLINE_AX_CONFIG;
    if (!config || !config.text) return;

    const source = config.text.guided_practice_kicker;
    const replacement = config.text.guided_practice_display_kicker;
    if (!source || !replacement) return;

    const kicker = document.querySelector(".pcj-panel .pcj-study-kicker");
    if (!kicker || kicker.textContent.trim() !== source) return;

    kicker.textContent = replacement;
  }

  function decorateDeadlineEmphasis() {
    const config = window.ONLINE_AX_CONFIG;
    if (!config || !config.text) return;

    const title = document.querySelector(".pcj-panel .pcj-title");
    const lead = document.querySelector(".pcj-panel .pcj-study-lead");
    const expectedTitle = config.text.guided_practice_ready_title;
    const token = config.text.guided_practice_deadline_token;

    if (!title || !lead || !expectedTitle || !token) return;
    if (title.textContent.trim() !== expectedTitle) return;
    if (lead.querySelector(".ax-deadline-emphasis")) return;

    const text = lead.textContent;
    const index = text.indexOf(token);
    if (index < 0) return;

    lead.textContent = "";
    lead.appendChild(document.createTextNode(text.slice(0, index)));

    const emphasis = document.createElement("span");
    emphasis.className = "ax-deadline-emphasis";
    emphasis.textContent = token;
    lead.appendChild(emphasis);

    lead.appendChild(document.createTextNode(text.slice(index + token.length)));
  }

  function decorateCurrentScreen() {
    decorateQueued = false;

    decorateInitialScrollNotice();
    decorateGuidedPracticeKicker();
    decorateDeadlineEmphasis();

    /*
     * The response-instruction screen is the first participant-facing screen
     * that displays the S/L response-key affordance. From that point onward,
     * mouse navigation would force participants to move a hand away from the
     * response keys immediately before practice/main trials. Once this marker
     * has appeared, every html-button-response interstitial therefore becomes
     * keyboard-advanced with either S or L.
     */
    if (!responseKeyPhaseStarted && document.querySelector(".ax-guide-choices")) {
      responseKeyPhaseStarted = true;
    }

    if (!responseKeyPhaseStarted) return;

    const group = currentButtonGroup();
    const button = currentContinueButton();
    if (!group || !button) return;

    /*
     * jsPsych/CSS can assign display:flex to this group, which may override the
     * browser's default [hidden] rule. Force it out of layout so a screen never
     * shows both the S/L continuation instruction and a mouse button.
     */
    group.hidden = true;
    group.setAttribute("aria-hidden", "true");
    group.style.setProperty("display", "none", "important");

    if (!document.querySelector(".ax-response-key-continue-note")) {
      const note = document.createElement("div");
      note.className = "pcj-friendly-note ax-response-key-continue-note";
      note.textContent = continuationText();
      note.style.fontWeight = "700";

      const panel = document.querySelector(".pcj-panel");
      if (panel) {
        panel.appendChild(note);
      } else if (group.parentNode) {
        group.parentNode.insertBefore(note, group);
      }
    }
  }

  function queueDecoration() {
    if (decorateQueued) return;
    decorateQueued = true;
    window.requestAnimationFrame(decorateCurrentScreen);
  }

  document.addEventListener("keydown", function (event) {
    const key = normalizedKey(event);
    if (!responseKeyPhaseStarted || !RESPONSE_KEYS.has(key)) return;
    if (event.repeat || waitingForRelease) return;

    const button = currentContinueButton();
    if (!button || button.disabled) return;

    /*
     * Require a physical key release before another interstitial can advance.
     * This prevents a held S/L key or keyboard auto-repeat from skipping a
     * second consecutive instruction screen.
     */
    waitingForRelease = true;
    event.preventDefault();
    button.click();
  }, true);

  document.addEventListener("keyup", function (event) {
    if (RESPONSE_KEYS.has(normalizedKey(event))) {
      waitingForRelease = false;
    }
  }, true);

  const observer = new MutationObserver(queueDecoration);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  queueDecoration();
})();
