const STORAGE_KEY = "balans-mvp-checkins";
const nutritionButtons = [...document.querySelectorAll("[data-nutrition]")];
let selectedNutrition = "oke";

const screens = {
  today: document.querySelector("#screen-today"),
  checkin: document.querySelector("#screen-checkin"),
  result: document.querySelector("#screen-result"),
  week: document.querySelector("#screen-week"),
};

const today = todayKey();

document.querySelector("#today-date").textContent = formatDate(today);
document.querySelector("#result-date").textContent = formatDate(today);

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

document.querySelector("#stress-score").addEventListener("input", (event) => {
  document.querySelector("#stress-value").textContent = `${event.target.value}/10`;
});

document.querySelector("#energy-score").addEventListener("input", (event) => {
  document.querySelector("#energy-value").textContent = `${event.target.value}/10`;
});

nutritionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedNutrition = button.dataset.nutrition;
    nutritionButtons.forEach((item) => item.classList.toggle("selected", item === button));
  });
});

document.querySelector("#checkin-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const sleepHours = Number(document.querySelector("#sleep-hours").value);
  const error = document.querySelector("#form-error");

  if (Number.isNaN(sleepHours) || sleepHours < 0 || sleepHours > 14) {
    error.textContent = "Vul je slaapuren in tussen 0 en 14.";
    error.classList.add("visible");
    return;
  }

  error.classList.remove("visible");

  saveCheckIn({
    date: today,
    sleepHours,
    stress: Number(document.querySelector("#stress-score").value),
    energy: Number(document.querySelector("#energy-score").value),
    nutrition: selectedNutrition,
    note: document.querySelector("#day-note").value.trim(),
    updatedAt: new Date().toISOString(),
  });

  renderAll();
  showScreen("result");
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("public/sw.js").catch(() => undefined);
}

loadTodayIntoForm();
renderAll();

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle("active", key === name);
  });

  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderToday();
  renderResult();
  renderWeek();
}

function renderToday() {
  const checkIn = getCheckInByDate(today);
  const target = document.querySelector("#today-content");

  if (!checkIn) {
    target.innerHTML = `
      <div class="card empty-state">
        <h2>Nog geen check-in vandaag</h2>
        <p>Je hoeft niet perfect te zijn. Consistentie telt.</p>
        <div class="actions">
          <button class="primary-button" type="button" onclick="showScreen('checkin')">Start check-in</button>
        </div>
      </div>
    `;
    return;
  }

  const balance = calculateBalanceScore(checkIn);

  target.innerHTML = `
    <div class="stack">
      <div class="card">
        <p class="analysis-label">Vandaag ingevuld</p>
        <div class="metric-grid">
          ${metric("Score", balance.score)}
          ${metric("Slaap", `${checkIn.sleepHours}u`)}
          ${metric("Stress", checkIn.stress)}
        </div>
      </div>
      ${insightCard(checkIn)}
      <button class="secondary-button" type="button" onclick="showScreen('checkin')">Check-in aanpassen</button>
    </div>
  `;
}

function renderResult() {
  const checkIn = getCheckInByDate(today);
  const target = document.querySelector("#result-content");

  if (!checkIn) {
    target.innerHTML = `
      <div class="card empty-state">
        <h2>Nog geen analyse</h2>
        <p>Vul eerst je check-in in voor vandaag.</p>
        <button class="primary-button" type="button" onclick="showScreen('checkin')">Check-in invullen</button>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    ${insightCard(checkIn)}
    ${checkIn.note ? `<div class="card"><strong>Je notitie</strong><p>${escapeHtml(checkIn.note)}</p></div>` : ""}
    <button class="primary-button" type="button" onclick="showScreen('week')">Bekijk progressie</button>
    <button class="secondary-button" type="button" onclick="showScreen('checkin')">Aanpassen</button>
  `;
}

function renderWeek() {
  const checkIns = getCheckIns();
  const stats = calculateWeeklyStats(checkIns);
  const discipline = calculateDisciplineScore(checkIns);
  const comparison = compareWithPreviousWeek(checkIns);
  const target = document.querySelector("#week-content");

  if (stats.daysFilled === 0) {
    target.innerHTML = `
      <div class="card empty-state">
        <h2>Nog geen progressie</h2>
        <p>Je bouwt discipline door terug te komen, niet door perfecte dagen.</p>
        <button class="primary-button" type="button" onclick="showScreen('checkin')">Eerste check-in invullen</button>
      </div>
    `;
    return;
  }

  target.innerHTML = `
    <div class="stack">
      <div class="card">
        <p class="analysis-label">Deze week</p>
        <div class="week-grid">
          ${metric("Streak", `${discipline.streak} dagen`)}
          ${metric("Check-ins", `${discipline.checkInsThisWeek}/7`)}
          ${metric("Balans", stats.averageBalanceScore)}
          ${metric("Discipline", discipline.score)}
        </div>
      </div>
      <div class="card dark">
        <p class="analysis-label">Progressie</p>
        <h2>${comparison.bestImprovement}</h2>
        <p class="analysis-text">${discipline.explanation}</p>
      </div>
      <div class="card">
        <div class="week-grid">
          ${metric("Slaap", `${stats.averageSleep}u`)}
          ${metric("Stress", `${stats.averageStress}/10`)}
          ${metric("Energie", `${stats.averageEnergy}/10`)}
          ${metric("Verschil", formatDelta(comparison.balanceDelta))}
        </div>
      </div>
    </div>
  `;
}

function insightCard(checkIn) {
  const insight = createInsight(checkIn);

  return `
    <div class="card dark">
      <div class="score-row">
        <div>
          <p class="analysis-label">Balans Score</p>
          <strong class="score-number">${insight.balance.score}</strong>
        </div>
        <div class="score-meter"><span style="width: ${insight.balance.score}%"></span></div>
      </div>
      <p class="analysis-label">Analyse</p>
      <h2 class="analysis-title">${insight.title}</h2>
      <p class="analysis-text">${insight.cause}</p>
      <p class="analysis-text">${insight.context}</p>
      <div class="tip-box">
        <strong>Coachactie vandaag</strong>
        <p>${insight.tip}</p>
      </div>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function createInsight(checkIn) {
  const balance = calculateBalanceScore(checkIn);
  return {
    title: checkIn.energy <= 5 ? "Je lichaam vraagt om herstel" : "Je balans ziet er werkbaar uit",
    cause: balance.explanation,
    context: balance.factorText,
    tip: getDailyCoachAction(checkIn),
    balance,
  };
}

function calculateBalanceScore(checkIn) {
  const sleep = calculateSleepScore(checkIn.sleepHours);
  const stress = clampScore((10 - checkIn.stress) * 10 + 10);
  const energy = clampScore(checkIn.energy * 10);
  const nutrition = getNutritionScore(checkIn.nutrition);
  const score = clampScore(Math.round(sleep * 0.3 + stress * 0.3 + energy * 0.25 + nutrition * 0.15));
  const mainFactor = getMainInfluencingFactor(checkIn);

  return {
    score,
    mainFactor,
    factorText: createFactorText(mainFactor),
    explanation: createBalanceExplanation(score, mainFactor),
  };
}

function calculateDisciplineScore(checkIns) {
  const currentEntries = getEntriesForKeys(checkIns, lastSevenDateKeys());
  const previousEntries = getEntriesForKeys(checkIns, previousSevenDateKeys());
  const comparison = compareWithPreviousWeek(checkIns);
  const streak = calculateStreak(checkIns);
  const consistencyScore = (currentEntries.length / 7) * 45;
  const streakScore = Math.min(streak, 7) * 5;
  const improvementScore = comparison.balanceDelta > 0 ? Math.min(comparison.balanceDelta, 15) : 0;
  const stabilityScore = calculateStabilityScore(currentEntries, previousEntries);
  const score = clampScore(Math.round(consistencyScore + streakScore + improvementScore + stabilityScore));

  return {
    score,
    streak,
    checkInsThisWeek: currentEntries.length,
    explanation:
      currentEntries.length >= 5
        ? "Je bouwt discipline door terug te komen, niet door perfecte dagen."
        : "Je hoeft niet perfect te zijn. Consistentie telt.",
  };
}

function getMainInfluencingFactor(checkIn) {
  const factors = [
    { factor: "slaap", gap: 100 - calculateSleepScore(checkIn.sleepHours) },
    { factor: "stress", gap: 100 - clampScore((10 - checkIn.stress) * 10 + 10) },
    { factor: "energie", gap: 100 - clampScore(checkIn.energy * 10) },
    { factor: "voeding", gap: 100 - getNutritionScore(checkIn.nutrition) },
  ];

  return factors.sort((a, b) => b.gap - a.gap)[0].factor;
}

function getDailyCoachAction(checkIn) {
  const factor = getMainInfluencingFactor(checkIn);

  if (factor === "slaap" && checkIn.sleepHours < 7) return "Ga vanavond 30 minuten eerder naar bed.";
  if (factor === "stress" && checkIn.stress > 6) return "Plan vandaag 10 minuten zonder scherm.";
  if (factor === "energie" && checkIn.energy < 7) return "Kies een belangrijke taak en laat de rest even liggen.";
  if (factor === "voeding" && checkIn.nutrition !== "goed") return "Eet vandaag een normale maaltijd met genoeg eiwitten.";
  return "Houd hetzelfde ritme morgen vast.";
}

function compareWithPreviousWeek(checkIns) {
  const currentEntries = getEntriesForKeys(checkIns, lastSevenDateKeys());
  const previousEntries = getEntriesForKeys(checkIns, previousSevenDateKeys());
  const current = calculateAverages(currentEntries);
  const previous = calculateAverages(previousEntries);
  const hasPreviousWeek = previousEntries.length > 0;
  const sleepDeltaMinutes = Math.round((current.sleep - previous.sleep) * 60);
  const stressDelta = roundOne(previous.stress - current.stress);
  const energyDelta = roundOne(current.energy - previous.energy);
  const balanceDelta = Math.round(current.balance - previous.balance);

  return {
    balanceDelta,
    sleepDeltaMinutes,
    stressDelta,
    energyDelta,
    bestImprovement: hasPreviousWeek
      ? getBestImprovement(sleepDeltaMinutes, stressDelta, energyDelta, balanceDelta)
      : `Je hebt ${currentEntries.length} ${currentEntries.length === 1 ? "dag" : "dagen"} ingecheckt deze week.`,
  };
}

function calculateWeeklyStats(checkIns) {
  const entries = getEntriesForKeys(checkIns, lastSevenDateKeys());
  const discipline = calculateDisciplineScore(checkIns);

  if (!entries.length) {
    return { averageSleep: 0, averageStress: 0, averageEnergy: 0, averageBalanceScore: 0, averageDisciplineScore: discipline.score, daysFilled: 0 };
  }

  const averages = calculateAverages(entries);
  return {
    averageSleep: roundOne(averages.sleep),
    averageStress: roundOne(averages.stress),
    averageEnergy: roundOne(averages.energy),
    averageBalanceScore: Math.round(averages.balance),
    averageDisciplineScore: discipline.score,
    daysFilled: entries.length,
  };
}

function calculateSleepScore(hours) {
  if (hours >= 7 && hours <= 9) return 100;
  if (hours < 6) return clampScore(hours * 12);
  if (hours < 7) return 78 + (hours - 6) * 18;
  return clampScore(100 - (hours - 9) * 15);
}

function getNutritionScore(nutrition) {
  if (nutrition === "goed") return 100;
  if (nutrition === "oke") return 72;
  return 38;
}

function createBalanceExplanation(score, factor) {
  if (score >= 80) return `Je Balans Score is sterk. ${createFactorText(factor)}`;
  if (score >= 60) return `Je basis is redelijk, maar ${factor} trekt je score vandaag omlaag.`;
  return `Je lichaam vraagt om herstel. Vandaag lijkt ${factor} je balans het meest te beinvloeden.`;
}

function createFactorText(factor) {
  const text = {
    slaap: "Slaap heeft vandaag de meeste invloed op je score.",
    stress: "Vandaag lijkt je stress je energie het meest te beinvloeden.",
    energie: "Je energieniveau drukt vandaag het sterkst op je balans.",
    voeding: "Voeding is vandaag de factor met de meeste ruimte voor verbetering.",
  };

  return text[factor];
}

function calculateStreak(checkIns) {
  const dates = new Set(checkIns.map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date();

  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateStabilityScore(currentEntries, previousEntries) {
  if (currentEntries.length < 3) return 4;
  const current = calculateVarianceScore(currentEntries);
  const previous = previousEntries.length >= 3 ? calculateVarianceScore(previousEntries) : current;
  return current >= previous ? 15 : 9;
}

function calculateVarianceScore(entries) {
  const averages = calculateAverages(entries);
  const drift = entries.reduce((sum, entry) => {
    return sum + Math.abs(entry.sleepHours - averages.sleep) + Math.abs(entry.stress - averages.stress) + Math.abs(entry.energy - averages.energy);
  }, 0);

  return Math.max(0, 30 - drift);
}

function calculateAverages(entries) {
  if (!entries.length) return { sleep: 0, stress: 0, energy: 0, balance: 0 };

  const totals = entries.reduce(
    (sum, entry) => ({
      sleep: sum.sleep + entry.sleepHours,
      stress: sum.stress + entry.stress,
      energy: sum.energy + entry.energy,
      balance: sum.balance + calculateBalanceScore(entry).score,
    }),
    { sleep: 0, stress: 0, energy: 0, balance: 0 },
  );

  return {
    sleep: totals.sleep / entries.length,
    stress: totals.stress / entries.length,
    energy: totals.energy / entries.length,
    balance: totals.balance / entries.length,
  };
}

function getBestImprovement(sleepDeltaMinutes, stressDelta, energyDelta, balanceDelta) {
  const improvements = [
    { value: sleepDeltaMinutes, text: sleepDeltaMinutes > 0 ? `Je slaap is gemiddeld ${sleepDeltaMinutes} minuten beter dan vorige week.` : "" },
    { value: stressDelta * 30, text: stressDelta > 0 ? `Je stress is ${stressDelta} punten lager dan vorige week.` : "" },
    { value: energyDelta * 30, text: energyDelta > 0 ? `Je energie is ${energyDelta} punten hoger dan vorige week.` : "" },
    { value: balanceDelta, text: balanceDelta > 0 ? "Je bent consistenter dan vorige week." : "" },
  ].filter((item) => item.text);

  return improvements.length ? improvements.sort((a, b) => b.value - a.value)[0].text : "Kleine verbetering is ook progressie. Blijf terugkomen.";
}

function loadTodayIntoForm() {
  const checkIn = getCheckInByDate(today);
  if (!checkIn) return;

  document.querySelector("#sleep-hours").value = checkIn.sleepHours;
  document.querySelector("#stress-score").value = checkIn.stress;
  document.querySelector("#energy-score").value = checkIn.energy;
  document.querySelector("#day-note").value = checkIn.note || "";
  document.querySelector("#stress-value").textContent = `${checkIn.stress}/10`;
  document.querySelector("#energy-value").textContent = `${checkIn.energy}/10`;
  selectedNutrition = normalizeNutrition(checkIn.nutrition);
  nutritionButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.nutrition === selectedNutrition);
  });
}

function getCheckIns() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map((entry) => ({ ...entry, nutrition: normalizeNutrition(entry.nutrition) })) : [];
  } catch {
    return [];
  }
}

function getCheckInByDate(date) {
  return getCheckIns().find((entry) => entry.date === date) || null;
}

function saveCheckIn(input) {
  const entries = getCheckIns();
  const existing = entries.find((entry) => entry.date === input.date);
  const next = {
    ...input,
    nutrition: normalizeNutrition(input.nutrition),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const updated = [next, ...entries.filter((entry) => entry.date !== input.date)].sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function getEntriesForKeys(checkIns, keys) {
  const keySet = new Set(keys);
  return checkIns.filter((entry) => keySet.has(entry.date));
}

function todayKey() {
  return toDateKey(new Date());
}

function lastSevenDateKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return toDateKey(date);
  }).reverse();
}

function previousSevenDateKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index - 7);
    return toDateKey(date);
  }).reverse();
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function normalizeNutrition(value) {
  return value === "goed" || value === "slecht" ? value : "oke";
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[character];
  });
}
