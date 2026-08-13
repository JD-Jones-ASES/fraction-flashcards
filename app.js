(function () {
  const SETTINGS_KEY = "fraction-sakura-settings";
  const THEME_KEY = "fraction-sakura-theme";
  const math = window.FractionMath;

  const els = {
    views: {
      setup: document.getElementById("view-setup"),
      play: document.getElementById("view-play"),
      summary: document.getElementById("view-summary"),
    },
    opGroup: document.getElementById("op-group"),
    rangeGroup: document.getElementById("range-group"),
    modeGroup: document.getElementById("mode-group"),
    startBtn: document.getElementById("start-btn"),
    endBtn: document.getElementById("end-btn"),
    againBtn: document.getElementById("again-btn"),
    settingsBtn: document.getElementById("settings-btn"),
    submitBtn: document.getElementById("submit-btn"),
    continueBtn: document.getElementById("continue-btn"),
    skipBtn: document.getElementById("skip-btn"),
    answerForm: document.getElementById("answer-form"),
    numInput: document.getElementById("num-input"),
    denInput: document.getElementById("den-input"),
    playActions: document.getElementById("play-actions"),
    feedback: document.getElementById("feedback"),
    equation: document.getElementById("equation"),
    prompt: document.getElementById("prompt"),
    timer: document.getElementById("stat-time"),
    streak: document.getElementById("stat-streak"),
    accuracy: document.getElementById("stat-accuracy"),
    answered: document.getElementById("stat-answered"),
    summaryTime: document.getElementById("summary-time"),
    summaryScore: document.getElementById("summary-score"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryStreak: document.getElementById("summary-streak"),
    live: document.getElementById("live"),
    themeBtn: document.getElementById("theme-btn"),
    themeLabel: document.getElementById("theme-label"),
  };

  const state = {
    view: "setup",
    theme: loadTheme(),
    config: math.normalizeConfig(loadSettings()),
    question: null,
    awaitingContinue: false,
    stats: emptyStats(),
    timerId: null,
    pausedAt: null,
  };

  function emptyStats() {
    return {
      startedAt: 0,
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
    };
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.config));
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === "dawn" || saved === "dusk" ? saved : "dusk";
    } catch {
      return "dusk";
    }
  }

  function applyTheme() {
    document.body.setAttribute("data-theme", state.theme);
    const dusk = state.theme === "dusk";
    els.themeBtn.setAttribute("aria-pressed", String(dusk));
    els.themeLabel.textContent = dusk ? "Dusk" : "Dawn";
    document.querySelector('meta[name="color-scheme"]').setAttribute(
      "content",
      dusk ? "dark" : "light"
    );
  }

  function toggleTheme() {
    state.theme = state.theme === "dusk" ? "dawn" : "dusk";
    applyTheme();
    try {
      localStorage.setItem(THEME_KEY, state.theme);
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  function showView(name) {
    state.view = name;
    Object.entries(els.views).forEach(([key, node]) => {
      const active = key === name;
      node.hidden = !active;
      node.classList.toggle("is-active", active);
    });
  }

  function renderChoices() {
    els.opGroup.innerHTML = "";
    Object.values(math.OPERATIONS).forEach((op) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.operation = op.id;
      btn.setAttribute("aria-pressed", String(state.config.operations.includes(op.id)));
      btn.innerHTML =
        '<span class="choice-symbol">' +
        op.symbol +
        '</span><span class="choice-label">' +
        op.label +
        '</span><span class="choice-blurb">' +
        op.blurb +
        "</span>";
      btn.addEventListener("click", () => toggleOperation(op.id));
      els.opGroup.appendChild(btn);
    });

    els.rangeGroup.innerHTML = "";
    math.RANGES.forEach((range) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice choice-compact";
      btn.dataset.range = range.id;
      btn.setAttribute("aria-pressed", String(state.config.range === range.id));
      btn.innerHTML =
        '<span class="choice-label">' +
        range.label +
        '</span><span class="choice-blurb">' +
        range.blurb +
        "</span>";
      btn.addEventListener("click", () => setRange(range.id));
      els.rangeGroup.appendChild(btn);
    });

    els.modeGroup.innerHTML = "";
    math.MODES.forEach((mode) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.mode = mode.id;
      btn.setAttribute("aria-pressed", String(state.config.mode === mode.id));
      btn.innerHTML =
        '<span class="choice-label">' +
        mode.label +
        '</span><span class="choice-example">' +
        mode.example +
        "</span>";
      btn.addEventListener("click", () => setMode(mode.id));
      els.modeGroup.appendChild(btn);
    });
  }

  function toggleOperation(id) {
    const selected = new Set(state.config.operations);
    if (selected.has(id)) {
      if (selected.size === 1) {
        announce("Keep at least one operation selected.");
        return;
      }
      selected.delete(id);
    } else {
      selected.add(id);
    }
    state.config.operations = Object.keys(math.OPERATIONS).filter((op) => selected.has(op));
    saveSettings();
    renderChoices();
  }

  function setRange(id) {
    state.config.range = id;
    saveSettings();
    renderChoices();
  }

  function setMode(id) {
    state.config.mode = id;
    saveSettings();
    renderChoices();
  }

  function announce(text) {
    els.live.textContent = text;
  }

  function startSession() {
    state.config = math.normalizeConfig(state.config);
    saveSettings();
    state.stats = emptyStats();
    state.stats.startedAt = Date.now();
    state.awaitingContinue = false;
    state.question = math.generateQuestion(state.config);
    showView("play");
    renderQuestion();
    updatePlayStats();
    startTimer();
    els.numInput.focus();
  }

  function endSession() {
    stopTimer();
    if (state.stats.total === 0 && state.view === "play") {
      showView("setup");
      return;
    }
    renderSummary();
    showView("summary");
  }

  function startTimer() {
    stopTimer();
    state.pausedAt = null;
    state.timerId = setInterval(updatePlayStats, 250);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function elapsedMs() {
    if (!state.stats.startedAt) {
      return 0;
    }
    if (state.pausedAt) {
      return state.pausedAt - state.stats.startedAt;
    }
    return Date.now() - state.stats.startedAt;
  }

  function updatePlayStats() {
    const stats = state.stats;
    els.timer.textContent = math.formatElapsed(elapsedMs());
    els.streak.textContent = String(stats.streak);
    els.answered.textContent = String(stats.total);
    els.accuracy.textContent = math.accuracyPercent(stats.correct, stats.total) + "%";
  }

  function fractionMarkup(frac, missing) {
    const card = document.createElement("div");
    card.className = "frac-card" + (missing ? " is-missing" : "");

    const stack = document.createElement("div");
    stack.className = "frac";
    const num = document.createElement("span");
    num.className = "num";
    const bar = document.createElement("span");
    bar.className = "bar";
    const den = document.createElement("span");
    den.className = "den";

    if (missing) {
      num.textContent = "?";
      den.textContent = "?";
    } else {
      num.textContent = String(frac.n);
      den.textContent = String(frac.d);
    }

    stack.append(num, bar, den);
    card.append(stack, barModelNode(frac, missing));
    return card;
  }

  function barModelNode(frac, missing) {
    const model = document.createElement("div");
    model.className = "bar-model" + (missing ? " is-unknown" : "");
    model.setAttribute("aria-hidden", "true");

    if (missing) {
      const strip = document.createElement("div");
      strip.className = "bar-strip";
      for (let i = 0; i < 4; i += 1) {
        strip.appendChild(cell(false));
      }
      model.appendChild(strip);
      return model;
    }

    const bars = math.barModel(frac);
    for (let i = 0; i < bars.wholes; i += 1) {
      const unit = document.createElement("div");
      unit.className = "bar-unit";
      model.appendChild(unit);
    }

    const leftover = bars.wholes === 0 ? Math.abs(frac.n) : bars.leftover;
    if (leftover > 0 || bars.wholes === 0) {
      const strip = document.createElement("div");
      strip.className = "bar-strip";
      for (let i = 0; i < bars.parts; i += 1) {
        strip.appendChild(cell(i < leftover));
      }
      model.appendChild(strip);
    }

    return model;
  }

  function cell(filled) {
    const node = document.createElement("span");
    node.className = "bar-cell" + (filled ? " is-filled" : "");
    return node;
  }

  function operatorNode(symbol) {
    const op = document.createElement("div");
    op.className = "op";
    op.setAttribute("aria-hidden", "true");
    op.textContent = symbol;
    return op;
  }

  function promptText(question) {
    if (question.hidden === "result") {
      return "Find the result";
    }
    if (question.hidden === "a") {
      return "Find the first fraction";
    }
    return "Find the second fraction";
  }

  function renderQuestion() {
    const q = state.question;
    els.equation.innerHTML = "";
    els.equation.classList.remove("is-correct", "is-wrong");
    els.equation.append(
      fractionMarkup(q.a, q.hidden === "a"),
      operatorNode(q.symbol),
      fractionMarkup(q.b, q.hidden === "b"),
      operatorNode("="),
      fractionMarkup(q.result, q.hidden === "result")
    );
    els.prompt.textContent = promptText(q);

    els.numInput.value = "";
    els.denInput.value = "";
    els.numInput.disabled = false;
    els.denInput.disabled = false;
    els.submitBtn.disabled = false;
    els.continueBtn.hidden = true;
    els.answerForm.hidden = false;
    els.playActions.hidden = false;
    hideFeedback();
    state.awaitingContinue = false;
  }

  function hideFeedback() {
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
  }

  function showFeedback(type, text) {
    els.feedback.hidden = false;
    els.feedback.className = "feedback is-" + type;
    els.feedback.textContent = text;
    announce(text);
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (state.view !== "play" || state.awaitingContinue) {
      return;
    }

    const result = math.checkAnswer(state.question, els.numInput.value, els.denInput.value);
    if (!result.valid) {
      showFeedback(
        "error",
        result.zeroDenominator ? "The denominator cannot be zero." : "Enter a numerator and a denominator."
      );
      els.numInput.focus();
      return;
    }

    state.stats.total += 1;
    if (result.correct) {
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      els.equation.classList.add("is-correct");
      const streakNote = state.stats.streak > 1 ? "  ·  streak " + state.stats.streak : "";
      showFeedback("success", "Correct" + streakNote);
      lockForContinue(true);
    } else {
      state.stats.streak = 0;
      els.equation.classList.add("is-wrong");
      showFeedback("error", "Answer: " + math.formatFraction(state.question.answer));
      lockForContinue(false);
    }
    updatePlayStats();
  }

  function lockForContinue(autoAdvance) {
    state.awaitingContinue = true;
    els.numInput.disabled = true;
    els.denInput.disabled = true;
    els.submitBtn.disabled = true;
    els.answerForm.hidden = true;
    els.playActions.hidden = true;
    els.continueBtn.hidden = false;
    els.continueBtn.focus();
    if (autoAdvance) {
      window.setTimeout(() => {
        if (state.view === "play" && state.awaitingContinue) {
          nextQuestion();
        }
      }, 800);
    }
  }

  function nextQuestion() {
    if (state.view !== "play") {
      return;
    }
    state.question = math.generateQuestion(state.config, math.createRng(), state.question);
    renderQuestion();
    els.numInput.focus();
  }

  function skipQuestion() {
    if (state.view !== "play" || state.awaitingContinue) {
      return;
    }
    nextQuestion();
  }

  function renderSummary() {
    const stats = state.stats;
    els.summaryTime.textContent = math.formatElapsed(elapsedMs());
    els.summaryScore.textContent = stats.correct + " / " + stats.total;
    els.summaryAccuracy.textContent = math.accuracyPercent(stats.correct, stats.total) + "%";
    els.summaryStreak.textContent = String(stats.bestStreak);
  }

  function onVisibility() {
    if (state.view !== "play") {
      return;
    }
    if (document.hidden) {
      if (!state.pausedAt) {
        state.pausedAt = Date.now();
        stopTimer();
      }
    } else if (state.pausedAt) {
      const pausedFor = Date.now() - state.pausedAt;
      state.stats.startedAt += pausedFor;
      state.pausedAt = null;
      startTimer();
    }
  }

  function onDocumentKey(event) {
    if (event.key === "Escape" && state.view === "play") {
      event.preventDefault();
      endSession();
    }
  }

  function onNumKey(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      els.denInput.focus();
    }
  }

  function init() {
    applyTheme();
    renderChoices();
    els.themeBtn.addEventListener("click", toggleTheme);
    els.startBtn.addEventListener("click", startSession);
    els.endBtn.addEventListener("click", endSession);
    els.againBtn.addEventListener("click", startSession);
    els.settingsBtn.addEventListener("click", () => showView("setup"));
    els.answerForm.addEventListener("submit", submitAnswer);
    els.continueBtn.addEventListener("click", nextQuestion);
    els.skipBtn.addEventListener("click", skipQuestion);
    els.numInput.addEventListener("keydown", onNumKey);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", onDocumentKey);
    showView("setup");
  }

  init();
})();
