const STORAGE_KEY = "balans-mvp-checkins";
const THEME_STORAGE_KEY = "balans-mvp-theme";
const nutritionButtons = [...document.querySelectorAll("[data-nutrition]")];
const focusButtons = [...document.querySelectorAll("[data-focus]")];
const moodButtons = [...document.querySelectorAll("[data-mood]")];
const darkModeToggle = document.querySelector("#dark-mode-toggle");
let selectedNutrition = "oke";
let selectedFocus = "prima";
let selectedMood = "neutraal";

const screens = {
  today: document.querySelector("#screen-today"),
  checkin: document.querySelector("#screen-checkin"),
  result: document.querySelector("#screen-result"),
  week: document.querySelector("#screen-week"),
  settings: document.querySelector("#screen-settings"),
};

const today = todayKey();

document.querySelector("#today-date").textContent = formatDate(today);
document.querySelector("#result-date").textContent = formatDate(today);

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

nutritionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedNutrition = button.dataset.nutrition;
    nutritionButtons.forEach((item) => item.classList.toggle("selected", item === button));
  });
});

focusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedFocus = normalizeFocus(button.dataset.focus);
    focusButtons.forEach((item) => item.classList.toggle("selected", item === button));
  });
});

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMood = normalizeMood(button.dataset.mood);
    moodButtons.forEach((item) => item.classList.toggle("selected", item === button));
  });
});

darkModeToggle.addEventListener("change", () => {
  setTheme(darkModeToggle.checked ? "dark" : "light");
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
    focus: selectedFocus,
    mood: selectedMood,
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
setTheme(readThemePreference());
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

function readThemePreference() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme) {
  const isDarkMode = theme === "dark";

  document.body.classList.toggle("dark-mode", isDarkMode);
  darkModeToggle.checked = isDarkMode;
  localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDarkMode ? "#111827" : "#ffffff");
}

function renderToday() {
  const checkIns = getCheckIns();
  const checkIn = checkIns.find((entry) => entry.date === today) || null;
  const target = document.querySelector("#today-content");
  const personalInsight = getSimplePersonalInsight(checkIns);

  if (!checkIn) {
    target.innerHTML = `
      <div class="stack">
        <div class="card empty-state">
          <h2>Nog geen check-in vandaag</h2>
          <p>Je hoeft niet perfect te zijn. Consistentie telt.</p>
          <div class="actions">
            <button class="primary-button" type="button" onclick="showScreen('checkin')">Start check-in</button>
          </div>
        </div>
        ${personalInsightCard(personalInsight)}
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
          ${metric("Focus", getFocusLabel(checkIn.focus))}
        </div>
      </div>
      ${personalInsightCard(personalInsight)}
      ${insightCard(checkIn)}
      ${coachMomentCard(getDailyCoachMoment(checkIn, checkIns))}
      <button class="secondary-button" type="button" onclick="showScreen('checkin')">Check-in aanpassen</button>
    </div>
  `;
}

function renderResult() {
  const checkIns = getCheckIns();
  const checkIn = checkIns.find((entry) => entry.date === today) || null;
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
    ${coachMomentCard(getDailyCoachMoment(checkIn, checkIns))}
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
          ${metric("Focus", stats.averageFocus)}
          ${metric("Stemming", stats.averageMood)}
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

function personalInsightCard(insight) {
  return `
    <div class="card">
      <p class="analysis-label">Persoonlijk inzicht</p>
      <h2 class="analysis-title">${insight.title}</h2>
      <p class="analysis-text">${insight.explanation}</p>
      ${insight.action ? `<div class="tip-box"><strong>Coachactie</strong><p>${insight.action}</p></div>` : ""}
    </div>
  `;
}

function coachMomentCard(moment) {
  return `
    <div class="card">
      <p class="analysis-label">Dagelijks coachmoment</p>
      <h2 class="analysis-title">${moment.observation}</h2>
      <p class="analysis-text">${moment.explanation}</p>
      <div class="tip-box">
        <strong>Kleine stap voor vandaag</strong>
        <p>${moment.action}</p>
      </div>
    </div>
  `;
}

function getDailyCoachMoment(entry, entries) {
  const checkIn = normalizeCheckIn(entry);
  const safeEntries = Array.isArray(entries) ? entries.map(normalizeCheckIn).filter(Boolean) : [];

  if (!checkIn) {
    return {
      observation: "Je hoeft vandaag nog niets te verklaren.",
      explanation: "Een korte check-in is genoeg om iets meer zicht te krijgen op hoe je erbij zit.",
      action: "Kies straks een rustig moment om je basis eerlijk in te vullen.",
    };
  }

  const history = safeEntries.filter((item) => item.date !== checkIn.date);
  const balance = calculateBalanceScore(checkIn).score;
  const historyAverage = history.length ? average(history.map((item) => calculateBalanceScore(item).score)) : null;
  const isLowerThanUsual = historyAverage !== null && balance < historyAverage - 10;
  const hasShortSleep = checkIn.sleepHours > 0 && checkIn.sleepHours < 6;
  const hasLowFocus = checkIn.focus === "slecht" || checkIn.focus === "moeilijk";
  const hasLowMood = checkIn.mood === "slecht";

  if (hasShortSleep && hasLowMood) {
    return {
      observation: "Je stemming lijkt vandaag wat lager en je slaap was kort.",
      explanation: "Dat is geen falen, maar een signaal dat je systeem waarschijnlijk wat minder ruimte heeft.",
      action: "Doe het vandaag iets rustiger en kies een taak die klein genoeg voelt om te starten.",
    };
  }

  if (hasLowFocus) {
    return {
      observation: "Focussen lijkt vandaag wat meer moeite te kosten.",
      explanation: "Dat kan gebeuren op dagen waarop je hoofd voller is. Je hoeft niet alles tegelijk op te lossen.",
      action: "Kies een kleine taak en neem daarna bewust 10 minuten pauze zonder scherm.",
    };
  }

  if (hasLowMood) {
    return {
      observation: "Je stemming lijkt vandaag wat lager.",
      explanation: "Zie dit als informatie, niet als oordeel. Morgen kun je opnieuw bijsturen.",
      action: "Maak vandaag ruimte voor een rustig moment zonder iets te moeten verbeteren.",
    };
  }

  if (checkIn.nutrition === "slecht") {
    return {
      observation: "Je voeding lijkt vandaag wat minder steun te geven.",
      explanation: "Een dag hoeft niet perfect te zijn om toch een kleine herstelkeuze te maken.",
      action: "Kies vandaag een eenvoudige voedzame maaltijd of snack die weinig moeite kost.",
    };
  }

  if (isLowerThanUsual) {
    return {
      observation: "Vandaag lijkt wat zwaarder dan je gemiddelde dag.",
      explanation: "Dat verschil hoeft geen probleem te zijn. Het kan helpen om je tempo tijdelijk aan te passen.",
      action: "Maak je dag kleiner: kies een ding dat belangrijk is en laat de rest zachter worden.",
    };
  }

  if ((checkIn.mood === "goed" || checkIn.mood === "heel-goed") && (checkIn.focus === "prima" || checkIn.focus === "scherp")) {
    return {
      observation: "Je basis lijkt vandaag redelijk stevig.",
      explanation: "Dit is een goed moment om rustig momentum vast te houden zonder jezelf te overvragen.",
      action: "Gebruik je energie voor een kleine bewuste stap en stop voordat het te veel wordt.",
    };
  }

  return {
    observation: "Je check-in geeft vandaag een neutraal signaal.",
    explanation: "Niet elke dag hoeft een duidelijk patroon te hebben. Bewust opmerken is al waardevol.",
    action: "Kies vandaag een haalbare stap en kijk vanavond kort wat die met je deed.",
  };
}

function getSimplePersonalInsight(entries) {
  const validEntries = Array.isArray(entries)
    ? entries
        .map((entry) => ({
          ...entry,
          sleepHours: Number(entry?.sleepHours),
          focus: normalizeFocus(entry?.focus, entry?.stress),
          mood: normalizeMood(entry?.mood, entry?.energy),
          nutrition: normalizeNutrition(entry?.nutrition),
        }))
        .filter((entry) => {
          return (
            Number.isFinite(entry.sleepHours) &&
            entry.sleepHours >= 0 &&
            entry.focus &&
            entry.mood
          );
        })
    : [];

  if (validEntries.length < 3) {
    return {
      title: "Check nog een paar dagen in om persoonlijke patronen te ontdekken.",
      explanation: "Vanaf drie check-ins kan Balans simpele verbanden herkennen.",
      action: "",
    };
  }

  const patterns = [
    {
      matches: (entry) => entry.focus === "slecht" || entry.focus === "moeilijk",
      title: "Je balans lijkt lager op dagen waarop focussen lastig is.",
      explanation: "Op dagen met focus slecht of moeilijk scoor je gemiddeld lager.",
      action: "Kies vandaag een kleine taak en zet meldingen 10 minuten uit.",
    },
    {
      matches: (entry) => entry.sleepHours < 6,
      title: "Je balans lijkt lager na korte nachten.",
      explanation: "Op dagen met minder dan 6 uur slaap scoor je gemiddeld lager.",
      action: "Plan vanavond een vaste bedtijd en leg je scherm eerder weg.",
    },
    {
      matches: (entry) => entry.mood === "slecht",
      title: "Je balans lijkt lager op dagen met een slechte stemming.",
      explanation: "Op dagen waarop je stemming slecht is, scoor je gemiddeld lager.",
      action: "Maak vandaag ruimte voor iets kleins dat je hoofd rust geeft.",
    },
    {
      matches: (entry) => entry.nutrition === "slecht",
      title: "Je balans lijkt lager op dagen met slechte voeding.",
      explanation: "Op dagen waarop je voeding slecht invult, scoor je gemiddeld lager.",
      action: "Eet vandaag een normale maaltijd met genoeg eiwitten.",
    },
  ];

  const overallAverage = average(validEntries.map((entry) => calculateBalanceScore(entry).score));
  const candidates = patterns
    .map((pattern) => {
      const matchingEntries = validEntries.filter(pattern.matches);
      const matchingAverage = average(matchingEntries.map((entry) => calculateBalanceScore(entry).score));

      return {
        ...pattern,
        count: matchingEntries.length,
        impact: overallAverage - matchingAverage,
      };
    })
    .filter((pattern) => pattern.count > 0 && pattern.impact > 0)
    .sort((a, b) => b.impact - a.impact || b.count - a.count);

  if (!candidates.length) {
    return {
      title: "Je check-ins laten nog geen duidelijk risicopatroon zien.",
      explanation: "De opvallende signalen uit deze MVP komen nog weinig voor in je data.",
      action: "Blijf vandaag gewoon eerlijk inchecken, ook als het een normale dag is.",
    };
  }

  const strongestPattern = candidates[0];
  return {
    title: strongestPattern.title,
    explanation: strongestPattern.explanation,
    action: `Coachactie: ${strongestPattern.action}`,
  };
}

function createInsight(checkIn) {
  const balance = calculateBalanceScore(checkIn);
  return {
    title: getMoodScore(checkIn.mood) < 70 ? "Je basis vraagt om wat zachtheid" : "Je balans ziet er werkbaar uit",
    cause: balance.explanation,
    context: balance.factorText,
    tip: getDailyCoachAction(checkIn),
    balance,
  };
}

function calculateBalanceScore(checkIn) {
  const sleep = calculateSleepScore(checkIn.sleepHours);
  const focus = getFocusScore(checkIn.focus);
  const mood = getMoodScore(checkIn.mood);
  const nutrition = getNutritionScore(checkIn.nutrition);
  const score = clampScore(Math.round(sleep * 0.3 + focus * 0.3 + mood * 0.25 + nutrition * 0.15));
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
    { factor: "focus", gap: 100 - getFocusScore(checkIn.focus) },
    { factor: "stemming", gap: 100 - getMoodScore(checkIn.mood) },
    { factor: "voeding", gap: 100 - getNutritionScore(checkIn.nutrition) },
  ];

  return factors.sort((a, b) => b.gap - a.gap)[0].factor;
}

function getDailyCoachAction(checkIn) {
  const factor = getMainInfluencingFactor(checkIn);

  if (factor === "slaap" && checkIn.sleepHours < 7) return "Ga vanavond 30 minuten eerder naar bed.";
  if (factor === "focus" && (checkIn.focus === "slecht" || checkIn.focus === "moeilijk")) return "Kies een kleine taak en zet meldingen 10 minuten uit.";
  if (factor === "stemming" && checkIn.mood === "slecht") return "Maak vandaag ruimte voor iets kleins dat je hoofd rust geeft.";
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
  const focusDelta = Math.round(current.focus - previous.focus);
  const moodDelta = Math.round(current.mood - previous.mood);
  const balanceDelta = Math.round(current.balance - previous.balance);

  return {
    balanceDelta,
    sleepDeltaMinutes,
    focusDelta,
    moodDelta,
    bestImprovement: hasPreviousWeek
      ? getBestImprovement(sleepDeltaMinutes, focusDelta, moodDelta, balanceDelta)
      : `Je hebt ${currentEntries.length} ${currentEntries.length === 1 ? "dag" : "dagen"} ingecheckt deze week.`,
  };
}

function calculateWeeklyStats(checkIns) {
  const entries = getEntriesForKeys(checkIns, lastSevenDateKeys());
  const discipline = calculateDisciplineScore(checkIns);

  if (!entries.length) {
    return { averageSleep: 0, averageFocus: "-", averageMood: "-", averageBalanceScore: 0, averageDisciplineScore: discipline.score, daysFilled: 0 };
  }

  const averages = calculateAverages(entries);
  return {
    averageSleep: roundOne(averages.sleep),
    averageFocus: getFocusLabelFromScore(averages.focus),
    averageMood: getMoodLabelFromScore(averages.mood),
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
    focus: "Focus drukt vandaag het sterkst op je balans.",
    stemming: "Je stemming weegt vandaag duidelijk mee in je balans.",
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
    return sum + Math.abs(entry.sleepHours - averages.sleep) + Math.abs(getFocusScore(entry.focus) - averages.focus) / 10 + Math.abs(getMoodScore(entry.mood) - averages.mood) / 10;
  }, 0);

  return Math.max(0, 30 - drift);
}

function calculateAverages(entries) {
  if (!entries.length) return { sleep: 0, focus: 0, mood: 0, balance: 0 };

  const totals = entries.reduce(
    (sum, entry) => ({
      sleep: sum.sleep + entry.sleepHours,
      focus: sum.focus + getFocusScore(entry.focus),
      mood: sum.mood + getMoodScore(entry.mood),
      balance: sum.balance + calculateBalanceScore(entry).score,
    }),
    { sleep: 0, focus: 0, mood: 0, balance: 0 },
  );

  return {
    sleep: totals.sleep / entries.length,
    focus: totals.focus / entries.length,
    mood: totals.mood / entries.length,
    balance: totals.balance / entries.length,
  };
}

function getBestImprovement(sleepDeltaMinutes, focusDelta, moodDelta, balanceDelta) {
  const improvements = [
    { value: sleepDeltaMinutes, text: sleepDeltaMinutes > 0 ? `Je slaap is gemiddeld ${sleepDeltaMinutes} minuten beter dan vorige week.` : "" },
    { value: focusDelta, text: focusDelta > 0 ? "Je focus is gemiddeld beter dan vorige week." : "" },
    { value: moodDelta, text: moodDelta > 0 ? "Je stemming is gemiddeld beter dan vorige week." : "" },
    { value: balanceDelta, text: balanceDelta > 0 ? "Je bent consistenter dan vorige week." : "" },
  ].filter((item) => item.text);

  return improvements.length ? improvements.sort((a, b) => b.value - a.value)[0].text : "Kleine verbetering is ook progressie. Blijf terugkomen.";
}

function loadTodayIntoForm() {
  const checkIn = getCheckInByDate(today);
  if (!checkIn) return;

  document.querySelector("#sleep-hours").value = checkIn.sleepHours;
  document.querySelector("#day-note").value = checkIn.note || "";
  selectedFocus = normalizeFocus(checkIn.focus);
  selectedMood = normalizeMood(checkIn.mood);
  selectedNutrition = normalizeNutrition(checkIn.nutrition);
  focusButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.focus === selectedFocus);
  });
  moodButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.mood === selectedMood);
  });
  nutritionButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.nutrition === selectedNutrition);
  });
}

function getCheckIns() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeCheckIn).filter(Boolean) : [];
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

function normalizeCheckIn(entry) {
  if (!entry || typeof entry !== "object") return null;

  const sleepHours = Number(entry.sleepHours);
  return {
    ...entry,
    sleepHours: Number.isFinite(sleepHours) ? sleepHours : 0,
    focus: normalizeFocus(entry.focus, entry.stress),
    mood: normalizeMood(entry.mood, entry.energy),
    nutrition: normalizeNutrition(entry.nutrition),
  };
}

function normalizeFocus(value, oldStress) {
  if (value === "slecht" || value === "moeilijk" || value === "prima" || value === "scherp") return value;

  const stress = Number(oldStress);
  if (Number.isFinite(stress)) {
    if (stress >= 9) return "slecht";
    if (stress >= 7) return "moeilijk";
    if (stress <= 3) return "scherp";
  }

  return "prima";
}

function normalizeMood(value, oldEnergy) {
  if (value === "slecht" || value === "neutraal" || value === "goed" || value === "heel-goed") return value;

  const energy = Number(oldEnergy);
  if (Number.isFinite(energy)) {
    if (energy <= 4) return "slecht";
    if (energy <= 6) return "neutraal";
    if (energy <= 8) return "goed";
    return "heel-goed";
  }

  return "neutraal";
}

function getFocusScore(focus) {
  return {
    slecht: 35,
    moeilijk: 60,
    prima: 78,
    scherp: 100,
  }[normalizeFocus(focus)];
}

function getMoodScore(mood) {
  return {
    slecht: 35,
    neutraal: 62,
    goed: 82,
    "heel-goed": 100,
  }[normalizeMood(mood)];
}

function getFocusLabel(focus) {
  return {
    slecht: "Slecht",
    moeilijk: "Moeilijk",
    prima: "Prima",
    scherp: "Scherp",
  }[normalizeFocus(focus)];
}

function getMoodLabel(mood) {
  return {
    slecht: "Slecht",
    neutraal: "Neutraal",
    goed: "Goed",
    "heel-goed": "Heel goed",
  }[normalizeMood(mood)];
}

function getFocusLabelFromScore(score) {
  if (score >= 90) return "Scherp";
  if (score >= 70) return "Prima";
  if (score >= 48) return "Moeilijk";
  return "Slecht";
}

function getMoodLabelFromScore(score) {
  if (score >= 91) return "Heel goed";
  if (score >= 72) return "Goed";
  if (score >= 48) return "Neutraal";
  return "Slecht";
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (!validValues.length) return 0;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
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
