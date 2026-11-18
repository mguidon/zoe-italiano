// ─── Italian listening app ────────────────────────────────────────────────
// Uses the Web Speech API with real Italian (it-IT) voices.
// Two voices: a female (Anna) and a male (Luca). Prefers neural / "Natural"
// voices (Edge: "Elsa" + "Diego", Chrome: "Google italiano").

const $ = (sel) => document.querySelector(sel);

const screens = {
  topics: $("#topic-screen"),
  conversation: $("#conversation-screen"),
  words: $("#word-screen"),
  vocab: $("#vocab-screen"),
  quiz: $("#quiz-screen"),
};

let currentTopic = null;
let voiceFemale = null;
let voiceMale = null;
let utteranceToken = 0; // invalidates queued speech when stopping

// ─── Voice selection ───────────────────────────────────────────────────────

const FEMALE_NAMES = ["elsa", "isabella", "letizia", "lucia", "giulia", "chiara",
  "sonia", "cosima", "aria", "serena", "eva", "francesca", "sabrina"];
const MALE_NAMES = ["diego", "carlo", "bruno", "marco", "stefano", "enzo",
  "paolo", "fabrizio", "giuseppe", "antonio", "max"];

function voiceGender(v) {
  const n = v.name.toLowerCase();
  if (FEMALE_NAMES.some((f) => n.includes(f))) return "f";
  if (MALE_NAMES.some((m) => n.includes(m))) return "m";
  return null;
}

function scoreVoice(v) {
  let score = 0;
  const n = v.name.toLowerCase();
  if (/natural|neural|online/.test(n)) score += 100; // real neural Italian voice
  if (voiceGender(v)) score += 50;
  if (n.includes("google")) score += 30;
  if (v.localService) score -= 10; // prefer online/cloud voices (better accent)
  return score;
}

function pickItalianVoices() {
  const voices = speechSynthesis.getVoices();
  const itVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith("it")
  );
  if (itVoices.length === 0) {
    voiceFemale = voiceMale = null;
    showVoiceWarning();
    return;
  }
  itVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  voiceFemale = itVoices.find((v) => voiceGender(v) === "f") || null;
  voiceMale = itVoices.find((v) => voiceGender(v) === "m") || null;
  // Fall back to the best voice for any missing gender (differentiated by pitch).
  if (!voiceFemale) voiceFemale = voiceMale || itVoices[0];
  if (!voiceMale) voiceMale = voiceFemale;
  $("#voice-warning").classList.add("hidden");
  if (voiceFemale === voiceMale) showPitchFallbackHint();
}

function showPitchFallbackHint() {
  const w = $("#voice-warning");
  w.textContent =
    "ℹ️ Es wurde nur eine italienische Stimme gefunden – die andere wird durch eine " +
    "andere Tonhöhe unterschieden. Für zwei echte Stimmen (Anna + Luca) Microsoft Edge " +
    "öffnen: dort gibt es ‚Elsa' (weiblich) und ‚Diego' (männlich).";
  w.classList.remove("hidden");
}

function showVoiceWarning() {
  const w = $("#voice-warning");
  w.textContent =
    "⚠️ Keine italienische Stimme im Browser gefunden! Öffne diese Seite in Microsoft Edge " +
    "(Stimme ‚Microsoft Elsa Online Natural') oder installiere eine italienische Stimme in den " +
    "Windows-Einstellungen (Einstellungen → Zeit und Sprache → Sprache → Italienisch → Stimme hinzufügen).";
  w.classList.remove("hidden");
}

speechSynthesis.onvoiceschanged = pickItalianVoices;
pickItalianVoices();

// ─── Speech helpers ────────────────────────────────────────────────────────

// Returns {voice, pitch} for a speaker gender ("f" or "m").
function voiceFor(gender) {
  if (voiceFemale === voiceMale) {
    // Only one voice available: differentiate by pitch.
    return gender === "m"
      ? { voice: voiceMale, pitch: 0.75 }
      : { voice: voiceFemale, pitch: 1.25 };
  }
  return gender === "m"
    ? { voice: voiceMale, pitch: 1.0 }
    : { voice: voiceFemale, pitch: 1.0 };
}

function speak(text, rate, gender) {
  return new Promise((resolve) => {
    if (!voiceFemale || !text) return resolve();
    const { voice, pitch } = voiceFor(gender || "f");
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = "it-IT";
    u.rate = rate;
    u.pitch = pitch;
    const token = utteranceToken;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    const check = setInterval(() => {
      if (token !== utteranceToken) { clearInterval(check); speechSynthesis.cancel(); resolve(); }
    }, 100);
    u.onend = () => { clearInterval(check); if (token === utteranceToken) resolve(); };
    u.onerror = () => { clearInterval(check); resolve(); };
    speechSynthesis.speak(u);
  });
}

function stopSpeaking() {
  utteranceToken++;
  speechSynthesis.cancel();
  clearSpeakingHighlight();
}

function clearSpeakingHighlight() {
  document.querySelectorAll(".bubble.speaking").forEach((b) => b.classList.remove("speaking"));
}

function rate() { return parseFloat($("#speed").value); }

// ─── Navigation ────────────────────────────────────────────────────────────

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  window.scrollTo(0, 0);
}

$("#back-btn").addEventListener("click", () => { stopSpeaking(); show("topics"); });
$("#back-to-conv-btn").addEventListener("click", () => show("conversation"));
$("#back-to-conv-btn2").addEventListener("click", () => { stopSpeaking(); show("conversation"); });
$("#back-to-words-btn").addEventListener("click", () => { stopSpeaking(); show("words"); });

// ─── Topic screen ──────────────────────────────────────────────────────────

function renderTopics() {
  const list = $("#topic-list");
  list.innerHTML = "";
  for (const t of TOPICS) {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.innerHTML = `
      <div class="emoji">${t.emoji}</div>
      <h3>${t.title}</h3>
      <p>${t.description}</p>
      <span class="level">${t.level}</span>`;
    card.addEventListener("click", () => openTopic(t));
    list.appendChild(card);
  }
}

// ─── Conversation screen ───────────────────────────────────────────────────

function openTopic(topic) {
  stopSpeaking();
  currentTopic = topic;
  $("#conv-title").textContent = `${topic.emoji} ${topic.title}`;
  $("#quiz-btn").classList.add("hidden");
  $("#words-btn").classList.remove("hidden");
  $("#show-text").checked = false;
  renderDialogue(topic);
  applyTextVisibility();
  show("conversation");
  if (!voiceFemale) showVoiceWarning();
}

// Show/hide the dialogue text (listening practice) and the translation toggle.
function applyTextVisibility() {
  const showText = $("#show-text").checked;
  document.querySelectorAll(".dialogue").forEach((d) =>
    d.classList.toggle("text-hidden", !showText)
  );
  $("#translation-row").classList.toggle("hidden", !showText);
  if (!showText) {
    $("#show-translation").checked = false;
    document.querySelectorAll(".bubble .en").forEach((el) => el.classList.add("hidden"));
  } else if ($("#show-translation").checked) {
    document.querySelectorAll(".bubble .en").forEach((el) => el.classList.remove("hidden"));
  }
}

$("#show-text").addEventListener("change", applyTextVisibility);

function renderDialogue(topic) {
  const box = $("#dialogue");
  box.innerHTML = "";
  topic.lines.forEach((line, i) => {
    const spk = topic.speakers[line.s];
    const row = document.createElement("div");
    row.className = "bubble-row" + (i % 2 === 1 ? " right" : "");
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.dataset.index = i;
    bubble.innerHTML = `
      <div class="speaker" style="color:${spk.color}">${spk.label}</div>
      <div class="it"><span class="play-hint">🔊</span><span class="dialog-text">${line.it}</span><span class="ellipsis">…</span></div>
      <div class="en hidden">${line.en}</div>`;
    bubble.addEventListener("click", async () => {
      stopSpeaking();
      highlight(i);
      await speak(line.it, rate(), spk.gender);
      clearSpeakingHighlight();
    });
    box.appendChild(row);
    row.appendChild(bubble);
  });
}

function highlight(i) {
  clearSpeakingHighlight();
  const b = document.querySelector(`.bubble[data-index='${i}']`);
  if (b) { b.classList.add("speaking"); b.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
}

$("#play-all-btn").addEventListener("click", async () => {
  if (!currentTopic) return;
  stopSpeaking();
  const token = utteranceToken;
  $("#play-all-btn").disabled = true;
  const lines = currentTopic.lines;
  for (let i = 0; i < lines.length; i++) {
    if (token !== utteranceToken) break;
    highlight(i);
    const gender = currentTopic.speakers[lines[i].s].gender;
    await speak(lines[i].it, rate(), gender);
    if (token !== utteranceToken) break;
  }
  clearSpeakingHighlight();
  $("#play-all-btn").disabled = false;
  if (token === utteranceToken) $("#quiz-btn").classList.remove("hidden");
});

$("#stop-btn").addEventListener("click", stopSpeaking);

$("#show-translation").addEventListener("change", (e) => {
  document.querySelectorAll(".bubble .en").forEach((el) =>
    el.classList.toggle("hidden", !e.target.checked)
  );
});

$("#quiz-btn").addEventListener("click", () => {
  startQuiz();
  show("quiz");
});

// ─── Quiz ──────────────────────────────────────────────────────────────────

let quizIndex = 0;
let quizResults = [];

function startQuiz() {
  quizIndex = 0;
  quizResults = [];
  $("#quiz-title").textContent = `📝 ${currentTopic.title} – Quiz`;
  $("#quiz-result").classList.add("hidden");
  renderQuestion();
}

function renderQuizProgress() {
  const box = $("#quiz-progress");
  box.innerHTML = "";
  currentTopic.quiz.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot";
    if (i < quizResults.length) dot.classList.add(quizResults[i] ? "good" : "bad");
    else if (i === quizIndex) dot.classList.add("current");
    box.appendChild(dot);
  });
}

function renderQuestion() {
  renderQuizProgress();
  const card = $("#quiz-card");
  card.classList.remove("hidden");
  const q = currentTopic.quiz[quizIndex];
  card.innerHTML = `<h3>Frage ${quizIndex + 1} / ${currentTopic.quiz.length}</h3>
    <p style="font-size:1.15rem">${q.q}${q.qd ? `<br><span style="font-size:.9rem;color:#888;font-style:italic">${q.qd}</span>` : ""}</p>
    <div class="quiz-options"></div>
    <div class="quiz-feedback"></div>
    <div class="quiz-nav"></div>`;

  const optBox = card.querySelector(".quiz-options");
  const feedback = card.querySelector(".quiz-feedback");
  const nav = card.querySelector(".quiz-nav");

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", async () => {
      const correct = i === q.a;
      quizResults[quizIndex] = correct;
      optBox.querySelectorAll(".quiz-option").forEach((b, bi) => {
        b.disabled = true;
        if (bi === q.a) b.classList.add("correct");
        else if (bi === i) b.classList.add("wrong");
      });
      feedback.textContent = correct ? "✅ Richtig! Brava!" : `❌ Leider nicht! Die richtige Antwort ist: „${q.options[q.a]}“`;
      feedback.style.color = correct ? "#2e7d32" : "#c62828";
      renderQuizProgress();

      // Read the correct answer aloud in Italian
      await speak(q.options[q.a], rate());

      const next = document.createElement("button");
      next.className = "big-btn";
      next.textContent = quizIndex === currentTopic.quiz.length - 1 ? "🏁 Ergebnis" : "Weiter →";
      next.addEventListener("click", () => {
        if (quizIndex === currentTopic.quiz.length - 1) showResult();
        else { quizIndex++; renderQuestion(); }
      });
      nav.appendChild(next);
      next.focus();
    });
    optBox.appendChild(btn);
  });
}

function showResult() {
  $("#quiz-card").classList.add("hidden");
  renderQuizProgress();
  const correct = quizResults.filter(Boolean).length;
  const total = currentTopic.quiz.length;
  const box = $("#quiz-result");
  let msg, msgDe, stars;
  if (correct === total) { msg = "Perfetto! Sei bravissima! 🎉"; msgDe = "Perfekt! Du bist toll! 🎉"; stars = "⭐⭐⭐"; }
  else if (correct >= total * 0.7) { msg = "Molto bene! Quasi perfetto! 👏"; msgDe = "Sehr gut! Fast perfekt! 👏"; stars = "⭐⭐"; }
  else { msg = "Buon inizio! Riascolta la conversazione e riprova! 💪"; msgDe = "Guter Anfang! Hör noch mal zu und versuch es erneut! 💪"; stars = "⭐"; }
  box.innerHTML = `
    <div class="score">${correct} / ${total}</div>
    <div>${stars}</div>
    <p>${msg}</p>
    <p style="color:#777">${msgDe}</p>
    <button class="big-btn" id="retry-btn">🔁 Nochmal</button>
    <button class="big-btn secondary" id="relist-btn">🔊 Nochmal anhören</button>`;
  box.classList.remove("hidden");
  $("#retry-btn").addEventListener("click", startQuiz);
  $("#relist-btn").addEventListener("click", () => show("conversation"));
  speak(msg.replace(/🎉|👏|💪/g, ""), rate());
  if (correct === total) launchConfetti(60);
  else if (correct >= total * 0.7) launchConfetti(25);
}

// ─── Confetti ──────────────────────────────────────────────────────────────

function launchConfetti(count) {
  const layer = $("#confetti-layer");
  const pieces = ["🎉", "⭐", "🇮🇹", "🍕", "🎊", "❤️", "💚", "🤍", "❤"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    c.style.left = Math.random() * 100 + "vw";
    c.style.fontSize = (1 + Math.random() * 1.4) + "rem";
    c.style.animationDuration = (2.2 + Math.random() * 2.5) + "s";
    c.style.animationDelay = Math.random() * 0.9 + "s";
    layer.appendChild(c);
    setTimeout(() => c.remove(), 6000);
  }
}

// ─── Vocabulary: word list ─────────────────────────────────────────────────

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

$("#words-btn").addEventListener("click", () => {
  stopSpeaking();
  $("#word-title").textContent = `📚 ${currentTopic.title} – Wörter`;
  renderWordList();
  show("words");
});

function renderWordList() {
  const box = $("#word-list");
  box.innerHTML = "";
  const showDe = $("#show-de").checked;
  for (const w of currentTopic.words) {
    const card = document.createElement("div");
    card.className = "word-card";
    card.innerHTML = `
      <div class="wemoji">${w.emo}</div>
      <div class="w-it">${w.it} <span class="w-play">🔊</span></div>
      <div class="w-de ${showDe ? "" : "hidden"}">${w.de}</div>`;
    card.addEventListener("click", async () => {
      card.classList.add("speaking-word");
      await speak(w.it, rate(), "f");
      card.classList.remove("speaking-word");
    });
    box.appendChild(card);
  }
}

$("#show-de").addEventListener("change", () => {
  document.querySelectorAll(".word-card .w-de").forEach((el) =>
    el.classList.toggle("hidden", !$("#show-de").checked)
  );
});

// ─── Vocabulary quiz ───────────────────────────────────────────────────────

let vocabQuestions = [];
let vocabIndex = 0;
let vocabResults = [];

$("#vocab-quiz-btn").addEventListener("click", () => {
  startVocabQuiz();
  show("vocab");
});

function buildVocabQuestions() {
  const picked = shuffle(currentTopic.words).slice(0, Math.min(8, currentTopic.words.length));
  return picked.map((w, i) => {
    const others = shuffle(currentTopic.words.filter((x) => x.it !== w.it)).slice(0, 3);
    if (i % 2 === 0) {
      // listening: hear the Italian word, pick it among Italian options
      const options = shuffle([w, ...others]).map((x) => x.it);
      return { type: "listen", word: w, options, a: options.indexOf(w.it) };
    }
    // meaning: read the Italian word, pick the German meaning
    const options = shuffle([w, ...others]).map((x) => x.de);
    return { type: "meaning", word: w, options, a: options.indexOf(w.de) };
  });
}

function startVocabQuiz() {
  vocabQuestions = buildVocabQuestions();
  vocabIndex = 0;
  vocabResults = [];
  $("#vocab-title").textContent = `📖 ${currentTopic.title} – Wort-Quiz`;
  $("#vocab-result").classList.add("hidden");
  renderVocabQuestion();
}

function renderVocabProgress(box, results, index) {
  box.innerHTML = "";
  vocabQuestions.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot";
    if (i < results.length) dot.classList.add(results[i] ? "good" : "bad");
    else if (i === index) dot.classList.add("current");
    box.appendChild(dot);
  });
}

function renderVocabQuestion() {
  renderVocabProgress($("#vocab-progress"), vocabResults, vocabIndex);
  const card = $("#vocab-card");
  card.classList.remove("hidden");
  const q = vocabQuestions[vocabIndex];

  const head = q.type === "listen"
    ? `<h3>Frage ${vocabIndex + 1} / ${vocabQuestions.length}</h3>
       <p style="font-size:1.2rem">👂 Welches Wort hörst du?</p>
       <button class="big-btn secondary replay-btn" style="margin-bottom:6px">🔊 Nochmal hören</button>`
    : `<h3>Frage ${vocabIndex + 1} / ${vocabQuestions.length}</h3>
       <p style="font-size:1.2rem">Was bedeutet „${q.word.it}“?<br>
       <span style="font-size:.9rem;color:#888;font-style:italic">Wie heißt das auf Deutsch?</span></p>`;

  card.innerHTML = `${head}
    <div class="quiz-options"></div>
    <div class="quiz-feedback"></div>
    <div class="quiz-nav"></div>`;

  const optBox = card.querySelector(".quiz-options");
  const feedback = card.querySelector(".quiz-feedback");
  const nav = card.querySelector(".quiz-nav");

  const play = () => speak(q.word.it, rate(), "f");
  if (q.type === "listen") {
    card.querySelector(".replay-btn").addEventListener("click", (e) => { e.stopPropagation(); play(); });
    play();
  }

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", async () => {
      stopSpeaking();
      const correct = i === q.a;
      vocabResults[vocabIndex] = correct;
      optBox.querySelectorAll(".quiz-option").forEach((b, bi) => {
        b.disabled = true;
        if (bi === q.a) b.classList.add("correct");
        else if (bi === i) b.classList.add("wrong");
      });
      feedback.textContent = correct ? "✅ Richtig! Brava!" : `❌ Die richtige Antwort ist: „${q.options[q.a]}“`;
      feedback.style.color = correct ? "#2e7d32" : "#c62828";
      renderVocabProgress($("#vocab-progress"), vocabResults, vocabIndex);
      await play();

      const next = document.createElement("button");
      next.className = "big-btn";
      next.textContent = vocabIndex === vocabQuestions.length - 1 ? "🏁 Ergebnis" : "Weiter →";
      next.addEventListener("click", () => {
        if (vocabIndex === vocabQuestions.length - 1) showVocabResult();
        else { vocabIndex++; renderVocabQuestion(); }
      });
      nav.appendChild(next);
      next.focus();
    });
    optBox.appendChild(btn);
  });
}

function showVocabResult() {
  $("#vocab-card").classList.add("hidden");
  renderVocabProgress($("#vocab-progress"), vocabResults, vocabQuestions.length);
  const correct = vocabResults.filter(Boolean).length;
  const total = vocabQuestions.length;
  const box = $("#vocab-result");
  let msg, msgDe, stars;
  if (correct === total) { msg = "Fantastico! Tutti giusti! 🎉"; msgDe = "Fantastisch! Alle richtig! 🎉"; stars = "⭐⭐⭐"; }
  else if (correct >= total * 0.7) { msg = "Bravissima! 🏆"; msgDe = "Super gemacht! 🏆"; stars = "⭐⭐"; }
  else { msg = "Ripassa le parole e riprova! 💪"; msgDe = "Lern die Wörter noch mal und versuch es erneut! 💪"; stars = "⭐"; }
  box.innerHTML = `
    <div class="score">${correct} / ${total}</div>
    <div>${stars}</div>
    <p>${msg}</p>
    <p style="color:#777">${msgDe}</p>
    <button class="big-btn" id="vocab-retry-btn">🔁 Nochmal</button>
    <button class="big-btn secondary" id="vocab-words-btn">📚 Zu den Wörtern</button>`;
  box.classList.remove("hidden");
  $("#vocab-retry-btn").addEventListener("click", startVocabQuiz);
  $("#vocab-words-btn").addEventListener("click", () => show("words"));
  speak(msg.replace(/🎉|🏆|💪/g, ""), rate(), "f");
  if (correct === total) launchConfetti(60);
  else if (correct >= total * 0.7) launchConfetti(25);
}

// ─── Init ──────────────────────────────────────────────────────────────────
renderTopics();
show("topics");
