/* Plato workouts: plan builder, workout player, exercise library.
   Uses helpers from index.html at call time ($, esc, Store, S, CONFIG, toast, render, openSheet, closeSheet …). */

const W = {
  mode: null,          // "none" (home) or "gym" for quick workouts and the library
  area: "all",
  heroCoach: null,
  sheetCoach: null,
  q: null,             // questionnaire draft
  qStep: 0,
  building: false,
};
const WSTORE = { plan: "wplan", answers: "wq", hist: "whist", mode: "wmode", sound: "wsound" };
const WEEKDAY = d => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" });

function wPlan() { return Store.get(WSTORE.plan, null); }
function wHist() { return Store.get(WSTORE.hist, []); }
function wMode() { if (!W.mode) W.mode = Store.get(WSTORE.mode, wPlan()?.place === "gym" ? "gym" : "none"); return W.mode; }
function ex(id) { return EXERCISES[id]; }
function thumb(id) { return `thumbs/${id}.webp`; }

/* ================= 3D coach loading ================= */
let coachLibPromise = null;
function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}
function loadCoachLib() {
  if (window.PlatoCoach) return Promise.resolve(window.PlatoCoach);
  if (!webglOK()) return Promise.reject(new Error("webgl"));
  if (!coachLibPromise) {
    coachLibPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "coach3d.js"; s.async = true;
      s.onload = () => (window.PlatoCoach ? res(window.PlatoCoach) : rej(new Error("load")));
      s.onerror = () => { coachLibPromise = null; rej(new Error("load")); };
      document.head.appendChild(s);
    });
  }
  return coachLibPromise;
}
// Shows the pre-rendered picture right away, then swaps in the live 3D coach.
async function mountCoach(el, id) {
  if (!el) return null;
  el.innerHTML = `<img class="stage-still" src="${thumb(id)}" alt="">`;
  try {
    const lib = await loadCoachLib();
    if (!el.isConnected) return null;
    const coach = lib.create(el);
    coach.play(id);
    el.querySelector(".stage-still")?.remove();
    el.classList.add("live");
    return coach;
  } catch (e) {
    return null; // stays on the still picture
  }
}

/* ================= views ================= */
function viewWorkout() {
  const plan = wPlan(), mode = wMode();
  return `
  <header class="top"><div class="brand">workout</div>${weekCount() ? `<span class="streak">💪 ${weekCount()} this week</span>` : ""}</header>
  ${plan ? planBlock(plan) : introBlock()}

  <h2 id="quick">Quick workouts</h2>
  <div class="seg" role="group" aria-label="Equipment" style="margin-bottom:12px">
    <button data-wmode="none" aria-pressed="${mode === "none"}">At home</button>
    <button data-wmode="gym" aria-pressed="${mode === "gym"}">At the gym</button>
  </div>
  <div class="qw-row">${QUICK_WORKOUTS[mode].map(q => `
    <button class="qw tone-${q.tone}" data-quick="${q.id}">
      <img src="${thumb(q.items[0])}" alt="" loading="lazy">
      <b>${esc(q.name)}</b>
      <span>${q.items.length} exercises, about ${quickMinutes(q)} min</span>
    </button>`).join("")}
  </div>

  <h2>Exercise guide</h2>
  <p class="muted small" style="margin:-4px 0 10px">${mode === "gym" ? "Gym moves, plus no-equipment moves you can do anywhere." : "Moves you can do with no equipment."} Tap one to watch the 3D coach.</p>
  <div class="chips" role="group" aria-label="Body area">${AREAS.map(([k, l]) => `<button class="chip ${W.area === k ? "on" : ""}" data-area="${k}">${l}</button>`).join("")}</div>
  <div class="ex-grid">${libraryList(mode).map(([id, e]) => `
    <button class="ex-card" data-exd="${id}">
      <img src="${thumb(id)}" alt="" loading="lazy">
      <b>${esc(e.name)}</b>
      <span>${esc(e.muscles)}</span>
    </button>`).join("") || `<p class="empty">No exercises in this area for this setting.</p>`}
  </div>
  <p class="muted small" style="margin-top:18px">Stop if you feel sharp pain, dizziness or chest pain. If you have a health condition, check with a doctor before starting a new routine.</p>`;
}

function libraryList(mode) {
  return Object.entries(EXERCISES).filter(([, e]) =>
    (mode === "gym" || e.eq === "none") && (W.area === "all" || e.area.includes(W.area)))
    .sort((a, b) => (a[1].eq === b[1].eq ? 0 : a[1].eq === "gym" ? -1 : 1));
}

function introBlock() {
  return `
  <section class="w-hero">
    <div class="w-hero-stage" id="heroStage"></div>
    <div class="w-hero-copy">
      <h1>A plan built around your goal</h1>
      <p>Answer a few questions and Plato builds your weekly routine. A 3D coach shows you every move.</p>
      <button class="btn light" data-wq-open>Build my plan</button>
    </div>
  </section>`;
}

function planBlock(plan) {
  const t = todayInfo(plan), day = plan.days[t.index];
  const done = doneDays(plan);
  const strip = plan.days.map((d, i) => {
    const date = addDays(t.weekStart, i), isToday = i === t.index, isDone = done.has(date);
    return `<div class="wd ${d.rest ? "rest" : ""} ${isToday ? "today" : ""} ${isDone ? "done" : ""}" title="${esc(d.rest ? "Rest" : d.name)}">
      <span>${WEEKDAY(date)}</span><b>${isDone ? "✓" : d.rest ? "–" : i + 1}</b></div>`;
  }).join("");
  const mins = day.rest ? 0 : sessionMinutes(day);
  return `
  <section class="plan-card">
    <div class="plan-top">
      <div><span class="plan-src">${plan.source === "ai" ? "Made by Gemini for you" : "Built-in plan"}</span><h3>${esc(plan.title)}</h3></div>
      <button class="iconbtn light" data-wq-open aria-label="Change my answers">⚙︎</button>
    </div>
    <div class="week" aria-label="This week">${strip}</div>
  </section>

  <section class="today-w ${day.rest ? "is-rest" : ""}">
    ${day.rest ? `
      <div class="today-w-copy">
        <span class="muted small">Today</span>
        <h3>Rest day</h3>
        <p class="muted small">Recovery is when your muscles get stronger. A walk or the stretch session below is a good idea.</p>
        <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-quick="home_stretch">Stretch for 10 min</button>${t.next !== null ? `<button class="btn sm" data-wstart="${t.next}">Start next workout</button>` : ""}</div>
      </div>` : `
      <div class="today-stage" id="heroStage"></div>
      <div class="today-w-copy">
        <span class="muted small">Today${done.has(dstr()) ? ", done ✓" : ""}</span>
        <h3>${esc(day.name)}</h3>
        <p class="muted small">${esc(day.focus || "")}${day.focus ? ". " : ""}${day.main.length} exercises, about ${mins} min</p>
        <button class="btn" data-wstart="${t.index}" style="margin-top:12px">${done.has(dstr()) ? "Do it again" : "Start workout"}</button>
      </div>`}
  </section>

  <details class="plan-week">
    <summary>See the whole week</summary>
    ${plan.summary ? `<p class="muted small">${esc(plan.summary)}</p>` : ""}
    ${plan.days.map((d, i) => `
      <div class="pw-day">
        <div class="pw-head"><b>Day ${i + 1}: ${esc(d.rest ? "Rest" : d.name)}</b>${d.rest ? "" : `<button class="btn ghost sm" data-wstart="${i}">Start</button>`}</div>
        ${d.rest ? "" : `<div class="pw-list">${d.main.map(m => `<button class="pw-ex" data-exd="${m.id}"><img src="${thumb(m.id)}" alt="" loading="lazy"><span>${esc(ex(m.id).name)}<small>${dose(m)}</small></span></button>`).join("")}</div>`}
      </div>`).join("")}
    ${plan.tips?.length ? `<div class="note" style="margin-top:12px"><b>Tips for you</b><ul class="tips">${plan.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-wq-open>Change my answers</button><button class="btn ghost sm" data-wplan-del>Remove plan</button></div>
  </details>`;
}

function dose(m) {
  const e = ex(m.id);
  if (e.type === "time" || m.secs) return `${m.sets > 1 ? m.sets + " × " : ""}${m.secs || e.secs} s`;
  return `${m.sets} × ${esc(String(m.reps || e.reps))}`;
}

/* ================= week helpers ================= */
function todayInfo(plan) {
  const start = plan.start || dstr();
  const diff = Math.max(0, Math.round((new Date(dstr() + "T12:00:00") - new Date(start + "T12:00:00")) / 864e5));
  const index = diff % 7;
  const weekStart = addDays(dstr(), -index);
  let next = null;
  for (let k = 1; k <= 7; k++) { const j = (index + k) % 7; if (!plan.days[j].rest) { next = j; break; } }
  return { index, weekStart, next };
}
function doneDays(plan) {
  const t = todayInfo(plan);
  return new Set(wHist().filter(h => h.date >= t.weekStart).map(h => h.date));
}
function weekCount() {
  const from = addDays(dstr(), -6);
  return wHist().filter(h => h.date >= from).length;
}

/* ================= bindings ================= */
function bindWorkout(app) {
  app.querySelectorAll("[data-wmode]").forEach(b => b.onclick = () => { W.mode = b.dataset.wmode; Store.set(WSTORE.mode, W.mode); W.area = "all"; render(); setTimeout(() => $("#quick")?.scrollIntoView(), 30); });
  app.querySelectorAll("[data-area]").forEach(b => b.onclick = () => {
    W.area = b.dataset.area;
    const y = window.scrollY; render(); window.scrollTo(0, y);
  });
  app.querySelectorAll("[data-exd]").forEach(b => b.onclick = () => openExerciseSheet(b.dataset.exd));
  app.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => openQuickSheet(b.dataset.quick));
  app.querySelectorAll("[data-wq-open]").forEach(b => b.onclick = () => openPlanQuestions());
  app.querySelectorAll("[data-wstart]").forEach(b => b.onclick = () => { const plan = wPlan(); const i = +b.dataset.wstart; startSession(plan.days[i], { planDay: i, title: plan.days[i].name }); });
  app.querySelectorAll("[data-wplan-del]").forEach(b => b.onclick = () => { if (!confirm("Remove your workout plan? Your workout history stays.")) return; Store.set(WSTORE.plan, null); render(); });
  // hero 3D coach
  W.heroCoach?.dispose(); W.heroCoach = null;
  const stage = app.querySelector("#heroStage");
  if (stage) {
    const plan = wPlan();
    const day = plan ? plan.days[todayInfo(plan).index] : null;
    const id = day && !day.rest ? day.main[0].id : "jumping_jack";
    mountCoach(stage, id).then(c => { if (c && stage.isConnected) W.heroCoach = c; else c?.dispose(); });
  }
}
// called by render() before the view is replaced
function leaveWorkout() { W.heroCoach?.dispose(); W.heroCoach = null; }
// called by closeSheet()
function onSheetClose() { W.sheetCoach?.dispose(); W.sheetCoach = null; W.building = false; }

/* ================= exercise detail ================= */
function openExerciseSheet(id) {
  const e = ex(id); if (!e) return;
  openSheet();
  $("#sheetBody").innerHTML = `
    <div class="grab"></div>
    <div class="sheet-head"><h3 id="sheetTitle">${esc(e.name)}</h3><button class="iconbtn" data-close aria-label="Close">✕</button></div>
    <div class="ex-stage" id="exStage"></div>
    <div class="stage-ctrl"><button class="chip" data-turn="-45" aria-label="Turn left">↺ Turn</button><button class="chip" data-pause>Pause</button><button class="chip" data-turn="45" aria-label="Turn right">Turn ↻</button></div>
    <p class="muted small" style="margin:8px 0 0">${esc(e.muscles)}${e.gear ? `. Needs: ${esc(e.gear)}` : ". No equipment needed"}.</p>
    <h2>How to do it</h2>
    <ol class="steps">${e.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <h2>Form tips</h2>
    <ul class="tips">${e.tips.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
    <div class="ez"><div><b>Easier</b><p>${esc(e.easier)}</p></div><div><b>Harder</b><p>${esc(e.harder)}</p></div></div>
    ${e.avoid.length ? `<p class="muted small">Take care or skip this one if you have ${e.avoid.map(a => a === "back" ? "lower back" : a).join(" or ")} pain.</p>` : ""}`;
  bindSheetCommon();
  W.sheetCoach?.dispose(); W.sheetCoach = null;
  mountCoach($("#exStage"), id).then(c => { if (c && $("#exStage")) W.sheetCoach = c; else c?.dispose(); });
  $("#sheetBody").querySelectorAll("[data-turn]").forEach(b => b.onclick = () => W.sheetCoach?.turn(+b.dataset.turn));
  const pb = $("#sheetBody").querySelector("[data-pause]");
  pb.onclick = () => { if (!W.sheetCoach) return; const on = W.sheetCoach.toggle(); pb.textContent = on ? "Pause" : "Play"; };
}
function bindSheetCommon() { $("#sheetBody").querySelectorAll("[data-close]").forEach(x => x.onclick = closeSheet); }

/* ================= quick workouts ================= */
function quickById(id) { return [...QUICK_WORKOUTS.none, ...QUICK_WORKOUTS.gym].find(q => q.id === id); }
function quickDay(q) {
  const main = q.items.map(id => {
    const e = ex(id);
    return e.type === "time" ? { id, sets: q.stretch ? 1 : 2, secs: e.secs, rest: 30 } : { id, sets: 3, reps: String(e.reps), rest: q.id.startsWith("gym") ? 75 : 45 };
  });
  return { name: q.name, focus: q.note, rest: false, warmup: q.stretch ? [] : defaultWarmup(q.id.startsWith("gym") ? "gym" : "home", []), main, cooldown: q.stretch ? [] : defaultCooldown([]) };
}
function quickMinutes(q) { return sessionMinutes(quickDay(q)); }
function openQuickSheet(id) {
  const q = quickById(id); if (!q) return;
  const day = quickDay(q);
  openSheet();
  $("#sheetBody").innerHTML = `
    <div class="grab"></div>
    <div class="sheet-head"><h3 id="sheetTitle">${esc(q.name)}</h3><button class="iconbtn" data-close aria-label="Close">✕</button></div>
    <p class="muted small" style="margin-top:0">${esc(q.note)}. About ${sessionMinutes(day)} minutes including a warm-up and cool-down.</p>
    <div class="pw-list col">${day.main.map(m => `<button class="pw-ex" data-exd2="${m.id}"><img src="${thumb(m.id)}" alt=""><span>${esc(ex(m.id).name)}<small>${dose(m)}</small></span></button>`).join("")}</div>
    <button class="btn" data-go-quick style="margin-top:14px">Start workout</button>`;
  bindSheetCommon();
  $("#sheetBody").querySelectorAll("[data-exd2]").forEach(b => b.onclick = () => openExerciseSheet(b.dataset.exd2));
  $("#sheetBody").querySelector("[data-go-quick]").onclick = () => { closeSheet(); startSession(day, { title: q.name }); };
}

/* ================= plan questions ================= */
const Q_STEPS = ["goal", "level", "place", "schedule", "focus", "limits", "safety"];
const GOAL_OPTS = [
  ["lose_fat", "Lose fat", "Burn more and keep your muscle", "🔥"],
  ["build_muscle", "Build muscle", "Get bigger and more defined", "💪"],
  ["get_stronger", "Get stronger", "Lift heavier, move better", "🏋️"],
  ["get_fit", "Get fit and healthy", "More energy for everyday life", "❤️"],
  ["endurance", "Build stamina", "Last longer without getting tired", "⚡"],
];
const LEVEL_OPTS = [
  ["beginner", "Beginner", "New to working out, or back after a long break"],
  ["intermediate", "Intermediate", "Working out regularly for 6 months or more"],
  ["advanced", "Advanced", "Training consistently for 2 years or more"],
];
const FOCUS_OPTS = [["full", "Full body"], ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["arms", "Arms"], ["core", "Core"], ["legs", "Legs"], ["glutes", "Glutes"]];
const LIMIT_OPTS = [["knees", "Knees"], ["back", "Lower back"], ["shoulders", "Shoulders"], ["wrists", "Wrists"]];

function openPlanQuestions() {
  const prev = Store.get(WSTORE.answers, null);
  W.q = prev ? { ...prev } : { goal: null, goalText: "", level: null, place: null, days: 3, minutes: 30, focus: ["full"], limits: [], gentle: null };
  W.qStep = 0;
  openSheet(); drawQuestions();
}
function drawQuestions() {
  const b = $("#sheetBody"), q = W.q, step = Q_STEPS[W.qStep];
  const dots = `<div class="steps-dots">${Q_STEPS.map((_, i) => `<i class="${i === W.qStep ? "on" : i < W.qStep ? "past" : ""}"></i>`).join("")}</div>`;
  const opt = (key, val, label, sub, icon, multi) => {
    const on = multi ? q[key].includes(val) : q[key] === val;
    return `<button class="opt ${on ? "on" : ""}" data-opt="${key}" data-val="${val}" ${multi ? 'data-multi="1"' : ""} aria-pressed="${on}">${icon ? `<span class="opt-ic">${icon}</span>` : ""}<span><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span></button>`;
  };
  let body = "", canNext = true;
  if (step === "goal") {
    body = `<h2 class="q-title">What's your main goal?</h2>${GOAL_OPTS.map(o => opt("goal", o[0], o[1], o[2], o[3])).join("")}
      <label class="f" for="qText" style="margin-top:14px">Describe your goal in your own words (optional)</label>
      <textarea class="inp" id="qText" rows="2" maxlength="300" placeholder="e.g. Lose 5 kg by December and keep up with my students on field day">${esc(q.goalText)}</textarea>
      <p class="muted small" style="margin:6px 0 0">Specific goals get better plans. A number and a date help.</p>`;
    canNext = !!q.goal;
  } else if (step === "level") {
    body = `<h2 class="q-title">How much experience do you have?</h2>${LEVEL_OPTS.map(o => opt("level", o[0], o[1], o[2])).join("")}`;
    canNext = !!q.level;
  } else if (step === "place") {
    body = `<h2 class="q-title">Where will you work out?</h2>
      ${opt("place", "home", "At home", "No equipment needed", "🏠")}
      ${opt("place", "gym", "At the gym", "Dumbbells, barbell, bench, cable machines", "🏋️")}`;
    canNext = !!q.place;
  } else if (step === "schedule") {
    body = `<h2 class="q-title">How much time can you really give it?</h2>
      <label class="f">Workout days per week</label>
      <div class="seg">${[2, 3, 4, 5, 6].map(n => `<button data-days="${n}" aria-pressed="${q.days === n}">${n}</button>`).join("")}</div>
      <label class="f" style="margin-top:14px">Minutes per workout</label>
      <div class="seg">${[15, 30, 45, 60].map(n => `<button data-mins="${n}" aria-pressed="${q.minutes === n}">${n}</button>`).join("")}</div>
      <p class="muted small" style="margin:10px 0 0">Pick what you can keep doing on a busy week. Consistency beats intensity.</p>`;
  } else if (step === "focus") {
    body = `<h2 class="q-title">Any areas you want to focus on?</h2><p class="muted small" style="margin-top:-4px">Pick as many as you like.</p>
      <div class="opt-grid">${FOCUS_OPTS.map(o => opt("focus", o[0], o[1], "", "", true)).join("")}</div>`;
    canNext = q.focus.length > 0;
  } else if (step === "limits") {
    body = `<h2 class="q-title">Any pain or injuries?</h2><p class="muted small" style="margin-top:-4px">Plato will leave out moves that load these areas.</p>
      <div class="opt-grid">${opt("limits", "none", "No, I'm good", "", "", true)}${LIMIT_OPTS.map(o => opt("limits", o[0], o[1], "", "", true)).join("")}</div>`;
  } else if (step === "safety") {
    body = `<h2 class="q-title">One safety question</h2>
      <p>Has a doctor told you to limit exercise, or do you get chest pain, faintness or dizziness when you're active?</p>
      ${opt("gentle", "no", "No", "")}${opt("gentle", "yes", "Yes", "")}
      ${q.gentle === "yes" ? `<div class="note warn" style="margin-top:12px">Please check with your doctor before starting. Plato will keep this plan gentle, with no jumping or high-intensity moves.</div>` : ""}`;
    canNext = q.gentle === "yes" || q.gentle === "no";
  }
  const last = W.qStep === Q_STEPS.length - 1;
  b.innerHTML = `<div class="grab"></div>
    <div class="sheet-head"><h3 id="sheetTitle">Your workout plan</h3><button class="iconbtn" data-close aria-label="Close">✕</button></div>
    ${dots}${body}
    <div class="row" style="margin-top:18px">${W.qStep ? `<button class="btn ghost" data-qback>Back</button>` : ""}<button class="btn" data-qnext ${canNext ? "" : "disabled"}>${last ? "Build my plan" : "Next"}</button></div>`;
  bindSheetCommon();
  const txt = $("#qText"); if (txt) txt.oninput = () => { q.goalText = txt.value; };
  b.querySelectorAll("[data-opt]").forEach(x => x.onclick = () => {
    const k = x.dataset.opt, v = x.dataset.val;
    if (x.dataset.multi) {
      if (k === "limits" && v === "none") q.limits = [];
      else if (k === "focus" && v === "full") q.focus = ["full"];
      else {
        let arr = q[k].filter(y => y !== "none" && !(k === "focus" && y === "full"));
        arr = arr.includes(v) ? arr.filter(y => y !== v) : [...arr, v];
        q[k] = arr.length ? arr : (k === "focus" ? ["full"] : []);
      }
      if (k === "limits" && v === "none") q.limitsNone = true;
    } else q[k] = v;
    drawQuestions();
  });
  b.querySelectorAll("[data-days]").forEach(x => x.onclick = () => { q.days = +x.dataset.days; drawQuestions(); });
  b.querySelectorAll("[data-mins]").forEach(x => x.onclick = () => { q.minutes = +x.dataset.mins; drawQuestions(); });
  const bk = b.querySelector("[data-qback]"); if (bk) bk.onclick = () => { W.qStep--; drawQuestions(); };
  b.querySelector("[data-qnext]").onclick = () => { if (last) buildPlan(); else { W.qStep++; drawQuestions(); b.closest(".sheet").scrollTop = 0; } };
  // the "No, I'm good" option shows as selected when no limits are chosen
  if (step === "limits" && !q.limits.length) b.querySelector('[data-val="none"]')?.classList.add("on");
}

async function buildPlan() {
  const q = W.q, b = $("#sheetBody");
  Store.set(WSTORE.answers, q);
  W.building = true;
  b.innerHTML = `<div class="grab"></div><div class="sheet-head"><h3 id="sheetTitle">Building your plan</h3><span></span></div>
    <div class="spinner"></div><p class="muted" style="text-align:center">Gemini is picking exercises, sets and rest days for you. This takes about 10–30 seconds.</p>`;
  let plan = null, note = "";
  if (CONFIG.WORKER_URL && navigator.onLine) {
    try {
      const res = await fetch(CONFIG.WORKER_URL.replace(/\/$/, "") + "/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: deviceId(), answers: planAnswers(q), catalog: planCatalog() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.plan) plan = normalizePlan(data.plan, q, "ai");
      else note = data.code === "plan_limit" ? "You've built today's maximum number of AI plans, so Plato made this one itself. You can rebuild with AI tomorrow."
        : data.code === "quota" ? "The free AI limit is used up for now, so Plato made this plan itself."
        : "The AI couldn't build a plan just now, so Plato made this one itself.";
    } catch (e) { note = "No connection to the AI, so Plato made this plan itself."; }
  } else note = CONFIG.WORKER_URL ? "You're offline, so Plato made this plan itself." : "";
  if (!W.building) return; // sheet was closed
  if (!plan || !plan.days.some(d => !d.rest)) plan = buildLocalPlan(q);
  plan.start = dstr();
  Store.set(WSTORE.plan, plan);
  W.mode = q.place === "gym" ? "gym" : "none"; Store.set(WSTORE.mode, W.mode);
  closeSheet();
  S.tab = "workout"; render();
  toast(note ? "Plan ready" : "Your plan is ready 💪");
  if (note) setTimeout(() => toast(note), 2600);
}
function planAnswers(q) {
  return { goal: q.goal, goalText: q.goalText, level: q.level, days: q.days, minutes: q.minutes, place: q.place, focus: q.focus, limits: q.limits, gentle: q.gentle === "yes", age: S.profile?.age, sex: S.profile?.sex };
}
function planCatalog() {
  return Object.entries(EXERCISES).map(([id, e]) => ({ id, name: e.name, eq: e.eq, role: e.role, type: e.type, area: e.area, avoid: e.avoid, intense: !!e.intense }));
}

/* ================= plan normalising + built-in builder ================= */
function allowedFor(q, id) {
  const e = ex(id); if (!e) return false;
  if (q.place !== "gym" && e.eq === "gym") return false;
  if (e.avoid.some(a => (q.limits || []).includes(a))) return false;
  if ((q.gentle === "yes" || q.gentle === true) && e.intense) return false;
  return true;
}
function substitute(q, id) {
  const e = ex(id);
  const areas = e ? e.area : ["core"];
  const cands = Object.keys(EXERCISES).filter(k => EXERCISES[k].role === "main" && allowedFor(q, k) && EXERCISES[k].area.some(a => areas.includes(a)));
  return cands[0] || ["glute_bridge", "bird_dog", "plank", "calf_raise"].find(k => allowedFor(q, k)) || "plank";
}
function clampInt(v, lo, hi, d) { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; }
function cleanItem(q, it, phase) {
  let id = String(it?.id || "");
  if (!ex(id) || !allowedFor(q, id)) id = phase === "main" ? substitute(q, id) : null;
  if (!id) return null;
  const e = ex(id);
  if (phase !== "main") return { id, secs: clampInt(it.secs, 20, 90, e.secs || 40) };
  const out = { id, sets: clampInt(it.sets, 1, 5, 3), rest: clampInt(it.rest, 15, 180, 60) };
  if (e.type === "time") out.secs = clampInt(it.secs, 15, 90, e.secs || 30);
  else out.reps = String(it.reps || e.reps).replace(/[^0-9\-–]/g, "").slice(0, 7) || String(e.reps);
  if (it.note) out.note = String(it.note).slice(0, 90);
  return out;
}
function defaultWarmup(place, limits) {
  const second = limits.includes("knees") ? "squat" : "jumping_jack";
  return [{ id: "arm_circles", secs: 40 }, { id: place === "gym" && !limits.includes("knees") ? "jumping_jack" : second, secs: 40 }];
}
function defaultCooldown(limits) {
  return [{ id: "forward_fold", secs: 45 }, { id: limits.includes("knees") ? "bird_dog" : "childs_pose", secs: 45 }].map(x => x.id === "bird_dog" ? { id: "forward_fold", secs: 45 } : x).slice(0, limits.includes("knees") ? 1 : 2);
}
function normalizePlan(raw, q, source) {
  const days = (Array.isArray(raw.days) ? raw.days : []).slice(0, 7);
  while (days.length < 7) days.push({ name: "Rest", rest: true });
  const out = days.map(d => {
    if (d.rest || !Array.isArray(d.main) || !d.main.length) return { name: "Rest", focus: "Recovery", rest: true };
    const main = d.main.slice(0, 8).map(it => cleanItem(q, it, "main")).filter(Boolean);
    // drop accidental duplicates
    const seen = new Set(); const uniq = main.filter(m => (seen.has(m.id) ? false : seen.add(m.id)));
    const want = ({ 15: 3, 30: 4, 45: 5, 60: 6 })[q.minutes] || 4;
    if (uniq.length < want) {
      const areas = new Set([...uniq.flatMap(m => ex(m.id).area), ...(q.focus || []).filter(f => f !== "full")]);
      const extra = Object.keys(EXERCISES).filter(k => EXERCISES[k].role === "main" && !seen.has(k) && allowedFor(q, k))
        .sort((a, b) => (EXERCISES[b].area.some(x => areas.has(x)) ? 1 : 0) - (EXERCISES[a].area.some(x => areas.has(x)) ? 1 : 0));
      const like = uniq[0] || { sets: 3, rest: 60 };
      for (const k of extra) {
        if (uniq.length >= want) break;
        const e = ex(k); seen.add(k);
        uniq.push(e.type === "time" ? { id: k, sets: like.sets, secs: e.secs, rest: Math.min(60, like.rest) } : { id: k, sets: like.sets, reps: String(like.reps || e.reps), rest: like.rest });
      }
    }
    let warmup = (Array.isArray(d.warmup) ? d.warmup : []).slice(0, 3).map(it => cleanItem(q, it, "warmup")).filter(Boolean);
    let cooldown = (Array.isArray(d.cooldown) ? d.cooldown : []).slice(0, 3).map(it => cleanItem(q, it, "cooldown")).filter(Boolean);
    if (!warmup.length) warmup = defaultWarmup(q.place, q.limits || []).filter(w => allowedFor(q, w.id));
    if (!cooldown.length) cooldown = defaultCooldown(q.limits || []).filter(w => allowedFor(q, w.id));
    return { name: String(d.name || "Workout").slice(0, 40), focus: String(d.focus || "").slice(0, 60), rest: false, warmup, main: uniq, cooldown };
  });
  return {
    title: String(raw.title || "Your weekly plan").slice(0, 60),
    summary: String(raw.summary || "").slice(0, 320),
    tips: (Array.isArray(raw.tips) ? raw.tips : []).slice(0, 4).map(t => String(t).slice(0, 160)),
    place: q.place, goal: q.goal, source, days: out, created: dstr(),
  };
}

const DOSE = {
  lose_fat: { sets: 3, reps: "12-15", rest: 40 },
  build_muscle: { sets: 3, reps: "8-12", rest: 75 },
  get_stronger: { sets: 4, reps: "5-6", rest: 120 },
  get_fit: { sets: 3, reps: "10-12", rest: 60 },
  endurance: { sets: 3, reps: "15", rest: 30 },
};
function buildLocalPlan(q) {
  const gentle = q.gentle === "yes";
  const P = q.place === "gym" ? {
    squat: q.level === "beginner" ? ["goblet_squat", "squat"] : ["barbell_back_squat", "goblet_squat", "squat"],
    hinge: [q.level === "advanced" ? "deadlift" : "romanian_deadlift", "hip_thrust", "glute_bridge"],
    lunge: ["db_lunge", "reverse_lunge", "calf_raise"],
    push: q.level === "beginner" ? ["db_bench_press", "pushup", "knee_pushup"] : ["db_bench_press", "pushup"],
    press: ["db_shoulder_press", "db_lateral_raise"],
    pull: ["lat_pulldown", "bent_over_row", "superman"],
    arms: ["db_curl", "tricep_pushdown"],
    glutes: ["hip_thrust", "glute_bridge"],
    core: ["plank", "crunch", "leg_raise", "bird_dog"],
    cardio: ["mountain_climber", "jumping_jack", "high_knees"],
    calf: ["calf_raise"],
  } : {
    squat: ["squat", "glute_bridge"],
    hinge: ["glute_bridge", "superman"],
    lunge: ["reverse_lunge", "calf_raise"],
    push: [q.level === "beginner" ? "knee_pushup" : "pushup", "knee_pushup"],
    press: [q.level === "beginner" ? "knee_pushup" : "pushup"],
    pull: ["superman", "bird_dog"],
    arms: ["knee_pushup", "pushup"],
    glutes: ["glute_bridge"],
    core: ["plank", "crunch", "bird_dog", "leg_raise"],
    cardio: ["mountain_climber", "jumping_jack", "high_knees", "burpee"],
    calf: ["calf_raise"],
  };
  // rotate the options a little each workout day so the week has variety
  let rot = 0;
  const pick = (slot, used) => {
    const pool = (P[slot] || []).filter(id => allowedFor(q, id));
    if (!pool.length) return null;
    const turn = ["core", "cardio", "pull", "arms", "press"].includes(slot) ? rot % pool.length : 0;
    const order = [...pool.slice(turn), ...pool.slice(0, turn)];
    return order.find(id => !used.has(id)) || null;
  };
  const n = { 15: 3, 30: 4, 45: 5, 60: 6 }[q.minutes] || 4;
  const focus = q.focus.filter(f => f !== "full");
  const focusSlot = { chest: "push", back: "pull", shoulders: "press", arms: "arms", core: "core", legs: "squat", glutes: "glutes" };
  const T = {
    full: { name: "Full body", focus: "Legs, push, pull and core", slots: ["squat", "push", "pull", "hinge", "core", "cardio"] },
    fullB: { name: "Full body B", focus: "Legs, shoulders, back and core", slots: ["lunge", "press", "pull", "glutes", "core", "calf"] },
    upper: { name: "Upper body", focus: "Chest, back, shoulders and arms", slots: ["push", "pull", "press", "arms", "core", "arms"] },
    lower: { name: "Lower body", focus: "Legs, glutes and core", slots: ["squat", "hinge", "lunge", "glutes", "calf", "core"] },
    push: { name: "Push day", focus: "Chest, shoulders and triceps", slots: ["push", "press", "arms", "core", "push"] },
    pull: { name: "Pull day", focus: "Back, biceps and core", slots: ["pull", "pull", "arms", "core", "hinge"] },
    legs: { name: "Leg day", focus: "Legs and glutes", slots: ["squat", "hinge", "lunge", "glutes", "calf"] },
    cond: { name: "Conditioning and core", focus: "Heart, lungs and abs", slots: ["cardio", "core", "squat", "cardio", "core", "glutes"] },
  };
  const pattern = { 2: [1, 0, 0, 1, 0, 0, 0], 3: [1, 0, 1, 0, 1, 0, 0], 4: [1, 1, 0, 1, 1, 0, 0], 5: [1, 1, 0, 1, 1, 1, 0], 6: [1, 1, 1, 0, 1, 1, 1] }[q.days];
  const split = { 2: ["full", "fullB"], 3: ["full", "fullB", "full"], 4: ["upper", "lower", "upper", "lower"], 5: ["upper", "lower", "cond", "upper", "lower"], 6: ["push", "pull", "legs", "push", "pull", "legs"] }[q.days];
  const FOCUS_FITS = {
    full: ["chest", "back", "shoulders", "arms", "core", "legs", "glutes"], fullB: ["chest", "back", "shoulders", "arms", "core", "legs", "glutes"],
    upper: ["chest", "back", "shoulders", "arms", "core"], lower: ["legs", "glutes", "core"],
    push: ["chest", "shoulders", "arms"], pull: ["back", "arms", "core"], legs: ["legs", "glutes"], cond: ["core"],
  };
  const d = DOSE[q.goal] || DOSE.get_fit;
  const sets = Math.max(2, d.sets - (q.level === "beginner" ? 1 : 0) + (q.level === "advanced" ? 1 : 0));
  let w = 0;
  const days = pattern.map(on => {
    if (!on) return { name: "Rest", focus: "Recovery", rest: true };
    rot = w; const t = T[split[w++]];
    let slots = [...t.slots];
    if (q.goal === "lose_fat" || q.goal === "endurance") slots = ["cardio", ...slots];
    const fits = FOCUS_FITS[split[w - 1]] || [];
    const dayFocus = focus.filter(f => fits.includes(f));
    if (dayFocus.length) slots.splice(1, 0, focusSlot[dayFocus[rot % dayFocus.length]]);
    if (gentle) slots = slots.filter(s => s !== "cardio");
    const used = new Set(), main = [];
    for (const s of slots) {
      if (main.length >= n) break;
      const id = pick(s, used); if (!id || used.has(id)) continue;
      used.add(id);
      const e = ex(id);
      const compound = ["squat", "hinge", "lunge", "push", "press", "pull", "glutes"].includes(s);
      const isCore = s === "core" || s === "cardio";
      const reps = compound ? d.reps : isCore ? "10-15" : (q.goal === "get_stronger" ? "10-12" : d.reps);
      const st = isCore ? Math.min(3, sets) : compound ? sets : Math.min(sets, 4);
      const rest = compound ? d.rest : Math.min(d.rest, 60);
      main.push(e.type === "time" ? { id, sets: st, secs: q.goal === "endurance" ? 40 : e.secs, rest: Math.min(60, d.rest) } : { id, sets: st, reps, rest });
    }
    // top up a day that came out short because of pain limits
    if (main.length < n) {
      const prefer = new Set(t.slots.flatMap(sl => (P[sl] || []).flatMap(id => ex(id)?.area || [])));
      const extra = Object.keys(EXERCISES).filter(k => EXERCISES[k].role === "main" && !used.has(k) && allowedFor(q, k) && !(gentle && EXERCISES[k].intense))
        .sort((a, b) => (EXERCISES[b].area.some(x => prefer.has(x)) ? 1 : 0) - (EXERCISES[a].area.some(x => prefer.has(x)) ? 1 : 0));
      for (const k of extra) {
        if (main.length >= n) break;
        used.add(k); const e = ex(k);
        main.push(e.type === "time" ? { id: k, sets: Math.min(3, sets), secs: e.secs, rest: Math.min(60, d.rest) } : { id: k, sets: Math.min(sets, 4), reps: q.goal === "get_stronger" ? "8-12" : d.reps, rest: Math.min(d.rest, 90) });
      }
    }
    // if pain rules out every pushing move, name the day for what it really trains
    let name = t.name, dfocus = t.focus;
    if (["push", "upper"].includes(split[w - 1]) && !main.some(m => ["db_bench_press", "pushup", "knee_pushup", "db_shoulder_press", "db_lateral_raise"].includes(m.id))) { name = "Arms and core"; dfocus = "Arms, back and core, easy on the shoulders"; }
    return { name, focus: dfocus, rest: false, warmup: defaultWarmup(q.place, q.limits).filter(x => allowedFor(q, x.id)), main, cooldown: defaultCooldown(q.limits).filter(x => allowedFor(q, x.id)) };
  });
  const goalName = (GOAL_OPTS.find(g => g[0] === q.goal) || GOAL_OPTS[3])[1].toLowerCase();
  return {
    title: `${q.days}-day plan to ${goalName}`,
    summary: `${q.days} workouts a week, about ${q.minutes} minutes each, ${q.place === "gym" ? "at the gym" : "at home with no equipment"}. Rest days are spread out so your body can recover.`,
    tips: [
      "When a set feels easy for two sessions in a row, add 1–2 reps or a little weight.",
      "Aim for 7–9 hours of sleep. That's when progress happens.",
      q.goal === "lose_fat" ? "Pair this plan with the calorie target on your Today tab for the best results." : "Eat enough protein. Your Today tab shows a daily target.",
    ],
    place: q.place, goal: q.goal, source: "local", days, created: dstr(),
  };
}

/* ================= session building ================= */
function sessionSteps(day) {
  const steps = [];
  const push = (it, phase) => {
    const e = ex(it.id); if (!e) return;
    const sets = phase === "main" ? it.sets || 1 : 1;
    for (let s = 1; s <= sets; s++) {
      steps.push({ id: it.id, phase, set: s, sets, kind: e.type === "time" || it.secs ? "time" : "reps", secs: it.secs || e.secs || 30, reps: it.reps || e.reps, rest: phase === "main" ? (s < sets ? it.rest || 60 : Math.min(it.rest || 60, 60)) : 10, note: it.note });
    }
  };
  (day.warmup || []).forEach(it => push(it, "warmup"));
  day.main.forEach(it => push(it, "main"));
  (day.cooldown || []).forEach(it => push(it, "cooldown"));
  if (steps.length) steps[steps.length - 1].rest = 0;
  return steps;
}
function stepSeconds(st) { const reps = parseInt(String(st.reps).split(/[-–]/).pop(), 10) || 10; return st.kind === "time" ? st.secs : reps * 3.2; }
function sessionMinutes(day) {
  const s = sessionSteps(day).reduce((a, st) => a + stepSeconds(st) + st.rest + 8, 0);
  return Math.max(5, Math.round(s / 60 / 5) * 5 || Math.round(s / 60));
}

/* ================= the player ================= */
let P = null;
function startSession(day, meta = {}) {
  if (!day || day.rest || !day.main?.length) return;
  const steps = sessionSteps(day);
  P = { steps, i: 0, mode: "ready", started: Date.now(), workMs: 0, kcal: 0, timerEnd: 0, paused: false, meta, coach: null, coachId: null, tick: 0, wake: null, sound: Store.get(WSTORE.sound, true) };
  const el = document.createElement("div");
  el.id = "wplayer"; el.className = "wp"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Workout");
  el.innerHTML = `
    <div class="wp-bars">${groupSegments().map(() => "<i></i>").join("")}</div>
    <div class="wp-head">
      <button class="iconbtn" data-wp="close" aria-label="End workout">✕</button>
      <div class="wp-count"><b id="wpCount"></b><span id="wpClock">0:00</span></div>
      <button class="iconbtn" data-wp="sound" aria-label="Sound on or off" id="wpSound">${P.sound ? "🔊" : "🔇"}</button>
    </div>
    <div class="wp-stage" id="wpStage"><span class="wp-tag" id="wpTag"></span><span class="wp-hint">Drag to turn</span></div>
    <div class="wp-body" id="wpBody"></div>`;
  document.body.appendChild(el);
  document.body.classList.add("playing");
  el.querySelector('[data-wp="close"]').onclick = () => { if (P.mode === "done" || confirm("End this workout? Progress so far won't be saved.")) endSession(false); };
  el.querySelector('[data-wp="sound"]').onclick = () => { P.sound = !P.sound; Store.set(WSTORE.sound, P.sound); $("#wpSound").textContent = P.sound ? "🔊" : "🔇"; };
  try { navigator.wakeLock?.request("screen").then(l => { if (P) P.wake = l; }).catch(() => {}); } catch (e) {}
  P.tick = setInterval(tick, 250);
  enterStep(0);
}
function groupSegments() {
  // one bar per exercise (sets of the same move share a bar)
  const g = []; P.steps.forEach((s, i) => { if (!i || s.id !== P.steps[i - 1].id || s.phase !== P.steps[i - 1].phase) g.push(i); }); return g;
}
function segIndexOf(i) { const g = groupSegments(); let k = 0; for (let j = 0; j < g.length; j++) if (g[j] <= i) k = j; return k; }
function showCoach(id) {
  const stage = $("#wpStage"); if (!stage || P.coachId === id) return;
  P.coachId = id;
  if (P.coach) { P.coach.play(id); return; }
  if (!stage.querySelector(".coach-slot")) stage.insertAdjacentHTML("afterbegin", `<div class="coach-slot"></div>`);
  const slot = stage.querySelector(".coach-slot");
  mountCoach(slot, id).then(c => {
    if (!P || !c) { c?.dispose(); return; }
    P.coach = c; if (P.coachId !== id) c.play(P.coachId);
  });
  if (!window.PlatoCoach) slot.innerHTML = `<img class="stage-still" src="${thumb(id)}" alt="">`;
}
function enterStep(i) {
  P.i = i;
  const st = P.steps[i];
  P.mode = st.kind === "time" ? "ready" : "reps";
  P.timerEnd = st.kind === "time" ? Date.now() + 5000 : 0; // 5-second "get ready" before timed moves
  showCoach(st.id);
  drawPlayer();
}
function drawPlayer() {
  if (!P) return;
  const st = P.steps[P.i], e = ex(st.id), body = $("#wpBody");
  const segs = document.querySelectorAll(".wp-bars i"), cur = segIndexOf(P.i);
  segs.forEach((s, k) => { s.className = k < cur ? "done" : k === cur ? "now" : ""; });
  const groups = groupSegments();
  $("#wpCount").textContent = P.mode === "done" ? "Workout complete" : `Exercise ${cur + 1} of ${groups.length}`;
  const phaseName = { warmup: "Warm-up", main: "Workout", cooldown: "Cool-down" }[st.phase];
  $("#wpTag").textContent = P.mode === "rest" ? "Up next" : phaseName;
  if (P.mode === "done") return drawDone();
  const next = P.steps[P.i + 1];
  if (P.mode === "rest") {
    const showId = next ? next.id : st.id;
    body.innerHTML = `
      <p class="wp-label">Rest</p>
      <div class="wp-big" id="wpBig" aria-live="polite">0:00</div>
      <p class="muted" style="margin:0">Next: <b style="color:var(--ink)">${esc(ex(showId).name)}</b>${next && next.sets > 1 ? `, set ${next.set} of ${next.sets}` : ""}</p>
      <div class="wp-ctrl"><button class="btn ghost" data-wp="more">+15 s</button><button class="btn" data-wp="skiprest">Skip rest</button></div>`;
  } else {
    body.innerHTML = `
      <h2 class="wp-name">${esc(e.name)}</h2>
      <p class="wp-set">${st.sets > 1 ? `Set ${st.set} of ${st.sets}` : phaseName}${e.gear && st.phase === "main" ? `. ${esc(e.gear)}` : ""}</p>
      ${st.kind === "time"
        ? `<p class="wp-label" id="wpLabel">${P.mode === "ready" ? "Get ready" : "Go"}</p><div class="wp-big" id="wpBig" aria-live="polite">0:00</div>`
        : `<div class="wp-big">${esc(String(st.reps))}<small> reps</small></div>`}
      ${st.note ? `<p class="wp-note">${esc(st.note)}</p>` : ""}
      <div class="wp-ctrl">
        <button class="iconbtn big" data-wp="prev" aria-label="Previous" ${P.i ? "" : "disabled"}>‹</button>
        <button class="btn wp-main" data-wp="main">${st.kind === "time" ? (P.mode === "ready" ? "Start now" : P.paused ? "Resume" : "Pause") : "✓ Done"}</button>
        <button class="iconbtn big" data-wp="next" aria-label="Skip">›</button>
      </div>
      <details class="wp-how"><summary>How to do it</summary><ol class="steps">${e.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol><ul class="tips">${e.tips.map(s => `<li>${esc(s)}</li>`).join("")}</ul><p class="muted small">Easier: ${esc(e.easier)}</p></details>`;
  }
  body.querySelectorAll("[data-wp]").forEach(b => b.onclick = () => act(b.dataset.wp));
  tick(true);
}
function act(a) {
  const st = P.steps[P.i];
  if (Date.now() - (P.autoAt || 0) < 700 && (a === "main" || a === "skiprest" || a === "next")) return; // tap raced an automatic change
  if (a === "main") {
    if (st.kind === "reps") { finishWork(stepSeconds(st)); return; }
    if (P.mode === "ready") { P.mode = "work"; P.timerEnd = Date.now() + st.secs * 1000; P.paused = false; beep(880, 0.12); drawPlayer(); return; }
    if (P.mode === "work") {
      if (!P.paused) { P.paused = true; P.left = P.timerEnd - Date.now(); }
      else { P.paused = false; P.timerEnd = Date.now() + P.left; }
      drawPlayer(); return;
    }
  }
  if (a === "next") { if (P.mode === "work") finishWork(st.secs - Math.max(0, (P.timerEnd - Date.now()) / 1000)); else goNext(); return; }
  if (a === "prev") { if (P.i > 0) enterStep(P.i - 1); return; }
  if (a === "more") { P.timerEnd += 15000; tick(true); return; }
  if (a === "skiprest") { goNext(); return; }
}
function finishWork(seconds) {
  const st = P.steps[P.i], e = ex(st.id);
  const kg = currentWeight() || 65;
  P.workMs += seconds * 1000;
  P.kcal += e.met * kg * (seconds / 3600);
  if (P.i >= P.steps.length - 1) { P.mode = "done"; beep(1046, 0.25); vibrate([60, 60, 120]); drawPlayer(); return; }
  if (st.rest > 0) { P.mode = "rest"; P.timerEnd = Date.now() + st.rest * 1000; showCoach(P.steps[P.i + 1].id); drawPlayer(); }
  else goNext();
}
function goNext() { if (P.i < P.steps.length - 1) enterStep(P.i + 1); else { P.mode = "done"; drawPlayer(); } }
function tick(force) {
  if (!P) return;
  const clock = $("#wpClock");
  if (clock && P.mode !== "done") clock.textContent = fmt((Date.now() - P.started) / 1000);
  const big = $("#wpBig");
  if (P.mode === "ready" || P.mode === "work" || P.mode === "rest") {
    const left = Math.max(0, (P.paused ? P.left : P.timerEnd - Date.now()) / 1000);
    if (big) big.textContent = fmt(Math.ceil(left));
    const whole = Math.ceil(left);
    if (!P.paused && whole !== P.lastWhole) {
      P.lastWhole = whole;
      if (whole <= 3 && whole > 0 && !force) beep(660, 0.08);
    }
    if (!P.paused && left <= 0) {
      P.autoAt = Date.now();
      if (P.mode === "ready") { P.mode = "work"; P.timerEnd = Date.now() + P.steps[P.i].secs * 1000; beep(880, 0.15); vibrate(80); drawPlayer(); }
      else if (P.mode === "work") { beep(1046, 0.2); vibrate([80, 60, 80]); finishWork(P.steps[P.i].secs); }
      else if (P.mode === "rest") { beep(880, 0.15); vibrate(80); goNext(); }
    }
  }
}
function fmt(s) { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function drawDone() {
  const mins = Math.max(1, Math.round((Date.now() - P.started) / 60000));
  P.totalMin = mins;
  const count = groupSegments().length;
  $("#wpStage").classList.add("done");
  $("#wpTag").textContent = "Nice work";
  P.coach?.play("stand");
  $("#wpBody").innerHTML = `
    <h2 class="wp-name">Workout complete 🎉</h2>
    <div class="wp-stats">
      <div><b>${mins}</b><span>minutes</span></div>
      <div><b>${count}</b><span>exercises</span></div>
      <div><b>${r0(P.kcal)}</b><span>kcal, est.</span></div>
    </div>
    <p class="wp-label" style="margin-top:16px">How did it feel?</p>
    <div class="seg" id="wpFeel">${[["easy", "Too easy"], ["right", "Just right"], ["hard", "Too hard"]].map(([k, l]) => `<button data-feel="${k}" aria-pressed="false">${l}</button>`).join("")}</div>
    <button class="btn" data-wp="save" style="margin-top:14px">Save workout</button>`;
  $("#wpBody").querySelectorAll("[data-feel]").forEach(b => b.onclick = () => { P.feel = b.dataset.feel; $("#wpBody").querySelectorAll("[data-feel]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("#wpBody").querySelector('[data-wp="save"]').onclick = () => endSession(true);
}
function endSession(save) {
  if (!P) return;
  if (save) {
    const h = wHist();
    h.push({ date: dstr(), title: P.meta.title || "Workout", minutes: P.totalMin || Math.max(1, Math.round((Date.now() - P.started) / 60000)), kcal: r0(P.kcal), count: groupSegments().length, planDay: P.meta.planDay ?? null, feel: P.feel || null });
    Store.set(WSTORE.hist, h.slice(-400));
    toast(P.feel === "easy" ? "Saved. Next time, add a rep or a little weight 💪" : P.feel === "hard" ? "Saved. Take it a bit easier next time, that's fine 👍" : "Workout saved 💪");
  }
  clearInterval(P.tick);
  try { P.wake?.release(); } catch (e) {}
  P.coach?.dispose();
  document.getElementById("wplayer")?.remove();
  document.body.classList.remove("playing");
  P = null;
  render();
}

/* ================= sound ================= */
let audioCtx = null;
function beep(freq, dur) {
  if (!P?.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.type = "sine";
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur + 0.02);
  } catch (e) {}
}
function vibrate(p) { try { navigator.vibrate?.(p); } catch (e) {} }

/* ================= progress + today helpers ================= */
function workoutProgressCard() {
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(dstr(), -i));
  const h = wHist(), mins = days.map(d => h.filter(x => x.date === d).reduce((a, x) => a + x.minutes, 0));
  const total = mins.reduce((a, b) => a + b, 0), sessions = h.filter(x => x.date >= days[0]).length, max = Math.max(30, ...mins);
  return `
  <div class="card">
    <div class="row" style="align-items:baseline"><div><b style="font-size:1.4rem">${total}</b> <span class="muted small">min this week</span></div><div style="text-align:right"><b style="font-size:1.4rem">${sessions}</b> <span class="muted small">workout${sessions === 1 ? "" : "s"}</span></div></div>
    <div class="wbars" aria-label="Workout minutes, last 7 days">${days.map((d, i) => `<div class="wbar"><i style="height:${Math.round(mins[i] / max * 100)}%" class="${mins[i] ? "" : "zero"}"></i><span>${WEEKDAY(d).slice(0, 2)}</span></div>`).join("")}</div>
    ${h.length ? `<p class="muted small" style="margin:8px 0 0">Last: ${esc(h[h.length - 1].title)}, ${h[h.length - 1].minutes} min, ${prettyDate(h[h.length - 1].date).toLowerCase()}.</p>` : `<p class="muted small" style="margin:8px 0 0">Finish a workout to see it here.</p>`}
  </div>`;
}
function todayWorkoutCard() {
  const plan = wPlan(); if (!plan) return "";
  const t = todayInfo(plan), day = plan.days[t.index], done = doneDays(plan).has(dstr());
  return `<button class="card today-link" data-go="workout">
    <img src="${thumb(day.rest ? "childs_pose" : day.main[0].id)}" alt="">
    <span><small class="muted">Today's workout</small><b>${day.rest ? "Rest day" : esc(day.name)}${done ? " ✓" : ""}</b><small class="muted">${day.rest ? "Recover and stretch" : `About ${sessionMinutes(day)} min`}</small></span><i aria-hidden="true">›</i></button>`;
}
