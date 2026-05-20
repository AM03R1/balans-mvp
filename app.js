const STORAGE_KEY = "balans-mvp-checkins";
const THEME_STORAGE_KEY = "balans-mvp-theme";
const JOURNAL_STORAGE_KEY = "balans-mvp-journal";
const QUIT_TRACKER_STORAGE_KEY = "balans-mvp-quit-tracker";
const BUDDY_CRISIS_REPLY =
  "Het spijt me dat je je zo voelt. Je hoeft dit niet alleen te dragen. Neem nu direct contact op met iemand die je vertrouwt of bel 112 als je in direct gevaar bent. In Nederland kun je ook 113 Zelfmoordpreventie bereiken via 113 of 0800-0113.";
const BUDDY_SCOPE_REPLY =
  "Daar kan ik je niet goed mee helpen. Balans Buddy is er alleen om kort mee te denken over hoe je je voelt, je dagboek, je voortgang, gezondheid, slaap, focus, stemming, voeding of een kleine praktische stap.\n\nWil je vertellen wat dit met je doet, of hoe je je nu voelt?";
const BUDDY_UNCLEAR_REPLY =
  "Ik begrijp niet helemaal wat je bedoelt. Wil je het opnieuw in gewone woorden zeggen?";
const BUDDY_GREETING_REPLY =
  "Hey, hoe gaat het vandaag met je?";
const BUDDY_CAPABILITY_REPLY =
  "Ik kan kort met je meedenken over hoe je je voelt, je dagboek, voortgang, slaap, focus of een kleine volgende stap. Waar wil je nu even bij stilstaan?";
const BUDDY_THANKS_REPLY =
  "Graag gedaan. Wat wil je nu vooral vasthouden uit dit gesprek?";
const BUDDY_SAFETY_MESSAGE =
  "Balans Buddy is bedoeld om je te helpen reflecteren, maar is geen vervanging voor professionele hulp. Als je jezelf of iemand anders iets wilt aandoen, neem direct contact op met 112 of iemand die je vertrouwt.";
const BUDDY_LANGUAGE_REPLY =
  "Ik snap dat je misschien boos of gefrustreerd bent, maar ziektes als scheldwoord gebruiken is niet oké. Wil je het opnieuw zeggen zonder scheldwoorden? Dan kan ik beter met je meedenken.";
const nutritionButtons = [...document.querySelectorAll("[data-nutrition]")];
const focusButtons = [...document.querySelectorAll("[data-focus]")];
const moodButtons = [...document.querySelectorAll("[data-mood]")];
const darkModeToggle = document.querySelector("#dark-mode-toggle");
let selectedNutrition = "oke";
let selectedFocus = "prima";
let selectedMood = "neutraal";
let buddyChatOpen = false;
let buddyMessages = [];
let checkInEditMode = false;
let journalEditMode = false;
let selectedJournalDate = "";
let quitTrackerEditMode = false;

const screens = {
  today: document.querySelector("#screen-today"),
  journal: document.querySelector("#screen-journal"),
  checkin: document.querySelector("#screen-checkin"),
  result: document.querySelector("#screen-result"),
  week: document.querySelector("#screen-week"),
  buddy: document.querySelector("#screen-buddy"),
  settings: document.querySelector("#screen-settings"),
};

const today = todayKey();
selectedJournalDate = today;
const topbar = {
  shell: document.querySelector(".app-topbar"),
  eyebrow: document.querySelector("#topbar-eyebrow"),
  title: document.querySelector("#topbar-title"),
  date: document.querySelector("#topbar-date"),
};
const appShell = document.querySelector(".app-shell");
const screenHeadings = {
  today: { eyebrow: "Feelbetter", title: "Overzicht", date: formatDate(today) },
  journal: { eyebrow: "Dagboek", title: "Mijn dagboek", date: formatDate(today) },
  checkin: { eyebrow: "Daggegevens", title: "Gezondheid kort vastleggen", date: "" },
  result: { eyebrow: "Resultaat", title: "Je analyse", date: formatDate(today) },
  week: { eyebrow: "Voortgang", title: "Afkick voortgang", date: "" },
  buddy: { eyebrow: "Balans Buddy", title: "Wat wil je kwijt?", date: formatDate(today) },
  settings: { eyebrow: "Instellingen", title: "Maak Balans van jou", date: "" },
};

setText("#today-date", formatDate(today));
setText("#result-date", formatDate(today));
setText("#buddy-date", formatDate(today));

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

  resetBuddyChat();
  checkInEditMode = false;
  renderAll();
  showScreen("today");
});

document.addEventListener("submit", (event) => {
  if (event.target?.matches?.("#journal-form")) {
    saveJournalEntryFromForm(event);
  }

  if (event.target?.matches?.("#quit-tracker-form")) {
    saveQuitTrackerFromForm(event);
  }
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("public/sw.js").catch(() => undefined);
}

loadTodayIntoForm();
setTheme(readThemePreference());
renderAll();
updateTopbar("today");

function showScreen(name) {
  if (name === "checkin" && getCheckInByDate(today)) {
    checkInEditMode = false;
    renderCheckIn();
  }

  if (name === "buddy") {
    buddyChatOpen = true;
    renderBuddy();
  }

  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle("active", key === name);
  });

  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });

  updateTopbar(name);
  appShell?.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderToday();
  renderJournal();
  renderCheckIn();
  renderResult();
  renderWeek();
  renderBuddy();
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function updateTopbar(name) {
  const heading = screenHeadings[name] || screenHeadings.today;
  const dateText = name === "journal" ? formatDate(selectedJournalDate) : heading.date;

  if (topbar.eyebrow) topbar.eyebrow.textContent = heading.eyebrow;
  if (topbar.title) topbar.title.textContent = heading.title;

  if (topbar.date) {
    topbar.date.textContent = dateText;
    topbar.date.hidden = !dateText;
  }
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
  const journalEntry = getJournalEntryByDate(today);
  const checkIn = getCheckInByDate(today);
  const quitTracker = getQuitTracker();
  const journalStats = calculateJournalStats(getJournalEntries());
  const healthStats = calculateHealthDashboardStats(getCheckIns());
  const dailyLesson = getHomePracticalReminder({ checkIn, journalEntry, quitTracker });
  const daysStopped = quitTracker ? calculateDaysSince(quitTracker.startDate) : null;
  const target = document.querySelector("#today-content");

  target.innerHTML = `
    <div class="stack">
      ${startDayInsightCard(dailyLesson)}
      <div class="card dashboard-card">
        <p class="analysis-label">Overzicht</p>
        <h2 class="analysis-title">Je stand van vandaag</h2>
        <div class="metric-grid dashboard-grid">
          ${metric("Dagboek", journalEntry ? "Vandaag" : "Nog niet")}
          ${metric("Deze week", `${journalStats.entriesThisWeek}/7`)}
          ${metric("Doel", quitTracker ? escapeHtml(quitTracker.label) : "Niet ingesteld")}
        </div>
      </div>
      <div class="card dashboard-card">
        <p class="analysis-label">Gezondheid</p>
        <h2 class="analysis-title">${healthStats.title}</h2>
        <div class="metric-grid dashboard-grid">
          ${metric("Slaap", healthStats.sleep)}
          ${metric("Voeding", healthStats.nutrition)}
          ${metric("Balans", healthStats.balance)}
        </div>
        <p class="analysis-text">${healthStats.description}</p>
        ${healthStats.hasData ? "" : `<button class="secondary-button" type="button" onclick="showScreen('checkin')">Daggegevens invullen</button>`}
      </div>
      <div class="card dashboard-card">
        <p class="analysis-label">Afkick voortgang</p>
        <h2 class="analysis-title">${quitTracker ? getDashboardProgressTitle(quitTracker, daysStopped) : "Nog geen doel ingesteld"}</h2>
        <div class="week-grid">
          ${metric("Gestopt", quitTracker ? formatStoppedDuration(daysStopped) : "-")}
          ${metric("Sinds", quitTracker ? formatShortDate(quitTracker.startDate) : "-")}
        </div>
      </div>
    </div>
  `;
}

function renderJournal() {
  const journalEntry = getJournalEntryByDate(selectedJournalDate);
  const target = document.querySelector("#journal-content");

  target.innerHTML = `
    <div class="stack">
      ${journalDateNavigator()}
      ${journalCard(journalEntry, selectedJournalDate)}
    </div>
  `;
}

function renderCheckIn() {
  const checkIn = getCheckInByDate(today);
  const summary = document.querySelector("#checkin-summary");
  const form = document.querySelector("#checkin-form");

  if (!summary || !form) return;

  if (!checkIn) {
    summary.hidden = true;
    form.hidden = false;
    return;
  }

  summary.hidden = checkInEditMode;
  form.hidden = !checkInEditMode;

  if (checkInEditMode) {
    loadTodayIntoForm();
    return;
  }

  summary.innerHTML = `
    <div class="card">
      <p class="analysis-label">Vandaag ingevuld</p>
      <h2 class="analysis-title">Je daggegevens</h2>
      <div class="metric-grid checkin-summary-grid">
        ${metric("Slaap", `${checkIn.sleepHours}u`)}
        ${metric("Focus", getFocusLabel(checkIn.focus))}
        ${metric("Stemming", getMoodLabel(checkIn.mood))}
      </div>
      <div class="tip-box">
        <strong>Voeding</strong>
        <p>${getNutritionLabel(checkIn.nutrition)}</p>
      </div>
      ${
        checkIn.note
          ? `<div class="tip-box"><strong>Notitie</strong><p>${escapeHtml(checkIn.note)}</p></div>`
          : `<p class="analysis-text">Geen notitie ingevuld.</p>`
      }
    </div>
    <button class="primary-button" type="button" onclick="openCheckInEditor()">Wijzig</button>
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
    ${checkIn.note ? `<div class="card"><strong>Je notitie</strong><p>${escapeHtml(checkIn.note)}</p></div>` : ""}
    ${buddyChatCard(checkIn)}
    <button class="primary-button" type="button" onclick="showScreen('week')">Bekijk voortgang</button>
    <button class="secondary-button" type="button" onclick="showScreen('checkin')">Check-in bekijken</button>
  `;
}

function renderWeek() {
  const quitTracker = getQuitTracker();
  const target = document.querySelector("#week-content");

  target.innerHTML = `
    <div class="stack">
      ${quitTracker && !quitTrackerEditMode ? quitTrackerSummaryCard(quitTracker) : quitTrackerCard(quitTracker, { full: true })}
      ${quitTracker ? quitCalendarCard(quitTracker) : ""}
    </div>
  `;
}

function recentJournalEntriesCard(entries) {
  const recentEntries = entries
    .filter((entry) => lastSevenDateKeys().includes(entry.date))
    .slice(0, 7);

  if (!recentEntries.length) {
    return `
      <div class="card empty-state">
        <p class="analysis-label">Dagboek</p>
        <h2>Nog niets opgeschreven deze week</h2>
        <p>Begin met één kort dagboekmoment. Teruglezen wordt pas waardevol als je een paar dagen hebt vastgelegd.</p>
        <button class="primary-button" type="button" onclick="showScreen('journal')">Vandaag opschrijven</button>
      </div>
    `;
  }

  return `
    <div class="card">
      <p class="analysis-label">Dagboek deze week</p>
      <h2 class="analysis-title">${recentEntries.length} ${recentEntries.length === 1 ? "moment" : "momenten"} vastgelegd</h2>
      <div class="journal-list">
        ${recentEntries
          .map((entry) => {
            return `
              <div class="journal-list-item">
                <strong>${formatDate(entry.date)}</strong>
                <p>${escapeHtml(entry.text)}</p>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="tip-box">
        <strong>Meenemen</strong>
        <p>${createJournalTakeaway(recentEntries)}</p>
      </div>
    </div>
  `;
}

function createJournalTakeaway(entries) {
  if (entries.length >= 4) {
    return "Je bouwt overzicht op door terug te schrijven. Let komende week op wat je helpt om moeilijke momenten door te komen.";
  }

  return "Schrijf nog een paar dagen door. Daarna zie je beter wat vaak terugkomt.";
}

function renderBuddy() {
  const checkIn = getCheckInByDate(today);
  const target = document.querySelector("#buddy-content");

  target.innerHTML = buddyChatCard(checkIn);
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

function calculateJournalStats(entries) {
  const weeklyEntries = entries.filter((entry) => lastSevenDateKeys().includes(entry.date));

  return {
    entriesThisWeek: weeklyEntries.length,
  };
}

function calculateHealthDashboardStats(checkIns) {
  const todayEntry = getCheckInByDate(today);
  const weeklyEntries = getEntriesForKeys(checkIns, lastSevenDateKeys()).sort((a, b) => a.date.localeCompare(b.date));
  const source = todayEntry || weeklyEntries[weeklyEntries.length - 1] || null;

  if (!source) {
    return {
      title: "Nog geen gezondheidsdata",
      sleep: "Niet ingevuld",
      nutrition: "Niet ingevuld",
      balance: "Niet ingevuld",
      description: "Deze kaart blijft leeg tot de gebruiker zelf slaap, voeding, focus en stemming invult.",
      hasData: false,
    };
  }

  const sleepValue = todayEntry ? source.sleepHours : roundOne(average(weeklyEntries.map((entry) => entry.sleepHours)));
  const balance = calculateBalanceScore(source).score;
  const balanceLabel = balance >= 75 ? "Sterk" : balance >= 60 ? "Oké" : "Laag";

  return {
    title: todayEntry ? "Vandaag ingevuld" : "Laatste 7 dagen",
    sleep: `${sleepValue}u`,
    nutrition: getNutritionLabel(source.nutrition),
    balance: balanceLabel,
    description: todayEntry
      ? "Gebaseerd op de daggegevens die vandaag zijn ingevuld: slaap, voeding, focus en stemming."
      : "Gebaseerd op de meest recente daggegevens uit de afgelopen 7 dagen.",
    hasData: true,
  };
}

function getDashboardProgressTitle(tracker, daysStopped) {
  if (daysStopped === 0) return `Vandaag gestart met ${escapeHtml(tracker.label)}`;
  return `${formatDayCount(daysStopped)} gestopt met ${escapeHtml(tracker.label)}`;
}

function journalDateNavigator() {
  const isTodaySelected = selectedJournalDate === today;

  return `
    <div class="diary-nav" aria-label="Dagboek dagen">
      <button class="secondary-button diary-nav-button" type="button" onclick="goToPreviousJournalDay()" aria-label="Vorige dag">‹</button>
      <div>
        <p class="analysis-label">Bladeren</p>
        <strong>${formatDate(selectedJournalDate)}</strong>
      </div>
      <button class="secondary-button diary-nav-button" type="button" onclick="goToNextJournalDay()" ${isTodaySelected ? "disabled" : ""} aria-label="Volgende dag">›</button>
    </div>
  `;
}

function journalCard(entry, dateKey = selectedJournalDate) {
  if (entry && !journalEditMode) {
    return `
      <div class="card journal-card diary-card">
        <div class="diary-header">
          <p class="analysis-label">Dagboek</p>
          <h2 class="analysis-title">Mijn dag</h2>
          <span class="diary-date">${formatDate(entry.date)}</span>
        </div>
        <p class="journal-entry-text diary-page">${escapeHtml(entry.text)}</p>
        <div class="actions">
          <button class="primary-button" type="button" onclick="openJournalEditor()">Wijzig dagboek</button>
          <button class="secondary-button" type="button" onclick="showScreen('buddy')">Praat hierover</button>
        </div>
      </div>
    `;
  }

  return `
    <form class="card journal-card diary-card" id="journal-form">
      <div class="diary-header">
        <p class="analysis-label">Dagboek</p>
        <h2 class="analysis-title">Mijn dag</h2>
        <span class="diary-date">${formatDate(dateKey)}</span>
      </div>
      <label class="field diary-field">
        <span>Schrijfmoment</span>
        <textarea class="diary-textarea" id="journal-text" rows="7" maxlength="700" placeholder="${entry ? "Werk je dagboek bij..." : "Nog niets geschreven op deze dag..."}">${entry ? escapeHtml(entry.text) : ""}</textarea>
      </label>
      <p class="error-message" id="journal-error" role="alert"></p>
      <button class="primary-button" type="submit">${entry ? "Dagboek opslaan" : "Opschrijven"}</button>
    </form>
  `;
}

function quitTrackerCard(tracker, options = {}) {
  const isFull = options.full === true;

  if (tracker && !quitTrackerEditMode) {
    const daysStopped = calculateDaysSince(tracker.startDate);
    const headline = daysStopped === 0
      ? `Vandaag gestart met ${escapeHtml(tracker.label)}`
      : `${formatDayCount(daysStopped)} gestopt met ${escapeHtml(tracker.label)}`;
    return `
      <div class="card quit-card ${isFull ? "quit-card-full" : ""}">
        <div>
          <p class="analysis-label">Voortgang</p>
          <h2 class="analysis-title">${headline}</h2>
          <p class="analysis-text">Sinds ${formatDate(tracker.startDate)}. Elke dag telt, ook als een dag moeilijk voelt.</p>
        </div>
        <div class="metric-grid">
          ${metric("Gestopt", formatStoppedDuration(daysStopped))}
          ${metric("Sinds", formatShortDate(tracker.startDate))}
          ${metric("Vandaag", "Volhouden")}
        </div>
        <div class="tip-box">
          <strong>Bij een terugval</strong>
          <p>Je voortgang is niet waardeloos. Je kunt opnieuw beginnen zonder jezelf af te schrijven.</p>
        </div>
        <div class="actions">
          <button class="secondary-button" type="button" onclick="openQuitTrackerEditor()">Aanpassen</button>
          <button class="secondary-button" type="button" onclick="restartQuitTrackerToday()">Opnieuw starten vanaf vandaag</button>
        </div>
      </div>
    `;
  }

  return `
    <form class="card quit-card" id="quit-tracker-form">
      <div>
        <p class="analysis-label">Voortgang</p>
        <h2 class="analysis-title">Waar wil je mee stoppen?</h2>
        <p class="analysis-text">Houd simpel bij hoelang je ergens vanaf blijft. Dit kan gaan om roken, alcohol, blowen, gokken of iets anders.</p>
      </div>
      <label class="field">
        <span>Ik wil stoppen met</span>
        <input id="quit-label" type="text" maxlength="40" placeholder="Bijv. roken, alcohol, gokken" value="${tracker ? escapeAttribute(tracker.label) : ""}" />
      </label>
      <label class="field">
        <span>Sinds wanneer?</span>
        <input id="quit-start-date" type="date" max="${today}" value="${tracker?.startDate || today}" />
      </label>
      <p class="error-message" id="quit-tracker-error" role="alert"></p>
      <button class="primary-button" type="submit">${tracker ? "Voortgang opslaan" : "Start bijhouden"}</button>
    </form>
  `;
}

function quitTrackerSummaryCard(tracker) {
  return `
    <div class="card quit-card">
      <div>
        <p class="analysis-label">Verslaving</p>
        <h2 class="analysis-title">${escapeHtml(tracker.label)}</h2>
        <p class="analysis-text">Sinds ${formatDate(tracker.startDate)}</p>
      </div>
    </div>
  `;
}

function quitCalendarCard(tracker) {
  const calendarDays = getQuitCalendarDays(tracker.startDate);
  const monthTitle = new Intl.DateTimeFormat("nl-NL", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${today.slice(0, 7)}-01T12:00:00`));

  return `
    <div class="card quit-calendar-card">
      <div>
        <p class="analysis-label">Kalender</p>
        <h2 class="analysis-title">Afgevinkt sinds ${formatShortDate(tracker.startDate)}</h2>
        <p class="analysis-text">Elke afgevinkte dag telt vanaf je startdatum tot vandaag.</p>
      </div>
      <div class="quit-calendar">
        <div class="quit-calendar-header">${monthTitle}</div>
        <div class="quit-calendar-weekdays" aria-hidden="true">
          ${["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="quit-calendar-grid" aria-label="Afkick kalender">
          ${calendarDays
            .map((day) => {
              if (day.blank) {
                return `<span class="quit-calendar-day blank" aria-hidden="true"></span>`;
              }

              const status = day.checked ? "Afgevinkt" : day.future ? "Nog niet" : "Voor start";
              const classes = [
                "quit-calendar-day",
                day.checked ? "checked" : "",
                day.future ? "future" : "",
                day.beforeStart ? "before-start" : "",
                day.isToday ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return `
                <span class="${classes}" aria-label="${day.label}: ${status}">
                  <span>${day.dayNumber}</span>
                  ${day.checked ? `<strong aria-hidden="true">✓</strong>` : ""}
                </span>
              `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function getQuitCalendarDays(startDateKey) {
  const currentMonth = today.slice(0, 7);
  const monthStart = new Date(`${currentMonth}-01T12:00:00`);
  const month = monthStart.getMonth();
  const year = monthStart.getFullYear();
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayOffset }, () => ({ blank: true }));
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const dateKey = toDateKey(new Date(year, month, dayNumber, 12));
    const checked = dateKey >= startDateKey && dateKey <= today;

    return {
      dayNumber,
      dateKey,
      label: formatDate(dateKey),
      checked,
      beforeStart: dateKey < startDateKey,
      future: dateKey > today,
      isToday: dateKey === today,
    };
  });

  return [...blanks, ...days];
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

function startDayInsightCard(insight) {
  return `
    <div class="card">
      <p class="analysis-label">Praktisch vandaag</p>
      <h2 class="analysis-title">${insight.lesson}</h2>
      <div class="tip-box">
        <strong>Als het lastig wordt</strong>
        <p>${insight.action}</p>
      </div>
    </div>
  `;
}

function getBuddyIntroText(checkIn) {
  if (checkIn) {
    return "Een rustige plek om na je check-in te zeggen wat er echt speelt. Geen diagnose, geen therapie, wel luisteren en doorvragen.";
  }

  return "Een rustige plek om iets op te schrijven zonder oordeel. Geen diagnose, geen therapie, wel luisteren, ordenen en meedenken.";
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

function weeklyAnalysisCard(analysis) {
  return `
    <div class="card">
      <p class="analysis-label">Wekelijkse analyse</p>
      <h2 class="analysis-title">Laatste 7 dagen</h2>
      <div class="stack compact-stack">
        <div class="tip-box">
          <strong>Wat ging goed</strong>
          <p>${analysis.good}</p>
        </div>
        <div class="tip-box">
          <strong>Wat kan beter</strong>
          <p>${analysis.improve}</p>
        </div>
        <div class="tip-box">
          <strong>Focus voor komende week</strong>
          <p>${analysis.focus}</p>
        </div>
      </div>
    </div>
  `;
}

function buddyChatCard(checkIn) {
  if (!buddyChatOpen) {
    return `
      <div class="card buddy-card">
        <div>
          <p class="analysis-label">Balans Buddy</p>
          <h2 class="analysis-title">${checkIn ? "Even napraten over je check-in?" : "Wat wil je kwijt?"}</h2>
          <p class="analysis-text">${getBuddyIntroText(checkIn)}</p>
        </div>
        <button class="primary-button" type="button" onclick="openBuddyChat()">${checkIn ? "Praat erover" : "Gesprek starten"}</button>
      </div>
    `;
  }

  return `
    <div class="card buddy-card">
      <div class="buddy-header">
        <div>
          <p class="analysis-label">Balans Buddy</p>
          <h2 class="analysis-title">Wat wil je kwijt?</h2>
        </div>
        <button class="secondary-button buddy-close" type="button" onclick="closeBuddyChat()">Sluiten</button>
      </div>
      <p class="buddy-disclaimer">${BUDDY_SAFETY_MESSAGE}</p>
      ${checkIn ? `<p class="buddy-context-note">Je check-in van vandaag kan helpen als context, maar je mag ook gewoon vrij typen.</p>` : ""}
      ${
        buddyMessages.length
          ? `<div class="buddy-log" role="log" aria-live="polite">
              ${buddyMessages
                .map((message) => {
                  const crisisClass = message.role === "buddy" && message.text === BUDDY_CRISIS_REPLY ? " crisis" : "";
                  return `<div class="buddy-message ${message.role}${crisisClass}">${escapeHtml(message.text)}</div>`;
                })
                .join("")}
            </div>`
          : ""
      }
      <form class="buddy-input" onsubmit="sendBuddyMessage(event)">
        <label class="field">
          <span class="visually-hidden">Bericht aan Balans Buddy</span>
          <textarea data-buddy-message rows="3" maxlength="420" placeholder="Typ wat je kwijt wil..." onkeydown="handleBuddyMessageKeyDown(event)"></textarea>
        </label>
        <button class="primary-button" type="submit">Verstuur</button>
      </form>
    </div>
  `;
}

function openBuddyChat() {
  buddyChatOpen = true;
  renderToday();
  renderResult();
  renderBuddy();
  setTimeout(focusBuddyInput, 0);
}

function closeBuddyChat() {
  resetBuddyChat();
  renderResult();
  renderBuddy();
}

function openCheckInEditor() {
  checkInEditMode = true;
  loadTodayIntoForm();
  renderCheckIn();
  setTimeout(() => document.querySelector("#sleep-hours")?.focus(), 0);
}

function openJournalEditor() {
  journalEditMode = true;
  renderJournal();
  showScreen("journal");
  setTimeout(() => document.querySelector("#journal-text")?.focus(), 0);
}

function goToPreviousJournalDay() {
  selectedJournalDate = shiftDateKey(selectedJournalDate, -1);
  journalEditMode = false;
  renderJournal();
  updateTopbar("journal");
}

function goToNextJournalDay() {
  const nextDate = shiftDateKey(selectedJournalDate, 1);

  selectedJournalDate = nextDate > today ? today : nextDate;
  journalEditMode = false;
  renderJournal();
  updateTopbar("journal");
}

function saveJournalEntryFromForm(event) {
  event.preventDefault();

  const form = event.target;
  const text = form.querySelector("#journal-text")?.value.trim() || "";
  const error = form.querySelector("#journal-error");

  if (text.length < 3) {
    if (error) {
      error.textContent = "Schrijf minimaal één korte zin op.";
      error.classList.add("visible");
    }
    return;
  }

  error?.classList.remove("visible");
  saveJournalEntry({
    date: selectedJournalDate,
    text,
    updatedAt: new Date().toISOString(),
  });
  journalEditMode = false;
  renderAll();
  showScreen("journal");
}

function openQuitTrackerEditor() {
  quitTrackerEditMode = true;
  renderAll();
  showScreen("week");
  setTimeout(() => document.querySelector("#quit-label")?.focus(), 0);
}

function saveQuitTrackerFromForm(event) {
  event.preventDefault();

  const form = event.target;
  const label = form.querySelector("#quit-label")?.value.trim() || "";
  const startDate = form.querySelector("#quit-start-date")?.value || today;
  const error = form.querySelector("#quit-tracker-error");

  if (label.length < 2) {
    if (error) {
      error.textContent = "Vul kort in waarmee je wilt stoppen.";
      error.classList.add("visible");
    }
    return;
  }

  if (!isValidDateKey(startDate) || startDate > today) {
    if (error) {
      error.textContent = "Kies een geldige startdatum, niet in de toekomst.";
      error.classList.add("visible");
    }
    return;
  }

  error?.classList.remove("visible");
  saveQuitTracker({
    label,
    startDate,
    updatedAt: new Date().toISOString(),
  });
  quitTrackerEditMode = false;
  renderAll();
  showScreen("week");
}

function restartQuitTrackerToday() {
  const tracker = getQuitTracker();
  if (!tracker) return;

  saveQuitTracker({
    ...tracker,
    startDate: today,
    updatedAt: new Date().toISOString(),
  });
  quitTrackerEditMode = false;
  renderAll();
  showScreen("week");
}

function clearLocalAppData() {
  const confirmed = window.confirm("Weet je zeker dat je je dagboek, daggegevens en voortgang op dit apparaat wilt wissen?");

  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(JOURNAL_STORAGE_KEY);
  localStorage.removeItem(QUIT_TRACKER_STORAGE_KEY);
  buddyChatOpen = false;
  buddyMessages = [];
  checkInEditMode = false;
  journalEditMode = false;
  quitTrackerEditMode = false;
  renderAll();
  showScreen("today");
}

function sendBuddyMessage(event) {
  event.preventDefault();

  const input = getBuddyInput(event);
  const text = input?.value.trim();
  const checkIn = getCheckInByDate(today);

  if (!text) return;

  buddyMessages = [
    ...buddyMessages,
    { role: "user", text },
    { role: "buddy", text: generateBuddyReply(text, checkIn, buddyMessages) },
  ];
  renderResult();
  renderBuddy();
  setTimeout(focusBuddyInput, 0);
}

function handleBuddyMessageKeyDown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

  event.preventDefault();
  sendBuddyMessage(event);
}

function resetBuddyChat() {
  buddyChatOpen = false;
  buddyMessages = [];
}

function getBuddyInput(event) {
  const source = event?.currentTarget;
  const form = source?.closest?.("form") || document.querySelector(".screen.active .buddy-input");
  return form?.querySelector("[data-buddy-message]") || null;
}

function focusBuddyInput() {
  const log = document.querySelector(".screen.active .buddy-log");
  log?.scrollTo({ top: log.scrollHeight });
  document.querySelector(".screen.active [data-buddy-message]")?.focus();
}

function generateBuddyOpening(checkIn) {
  if (checkIn.mood === "slecht") {
    return "Je stemming lijkt vandaag wat lager. Wil je vertellen wat er door je hoofd gaat?";
  }

  if (checkIn.focus === "slecht" || checkIn.focus === "moeilijk") {
    return "Het klinkt alsof concentreren vandaag lastig is. Wat maakt het moeilijk om te beginnen?";
  }

  if (checkIn.sleepHours > 0 && checkIn.sleepHours < 6) {
    return "Met weinig slaap kan alles zwaarder voelen. Misschien hoeft vandaag niet perfect te zijn.";
  }

  if (checkIn.nutrition === "slecht") {
    return "Je voeding gaf vandaag weinig steun. Wil je vertellen hoe je dag tot nu toe loopt?";
  }

  return "Je check-in is binnen. Wil je kort vertellen wat er op dit moment door je hoofd gaat?";
}

function generateBuddyReply(message, todayEntry, history = []) {
  if (detectCrisisMessage(message)) {
    return BUDDY_CRISIS_REPLY;
  }

  if (detectDiseaseSwearMessage(message)) {
    return BUDDY_LANGUAGE_REPLY;
  }

  const text = normalizeBuddyText(message);
  const previousBuddyMessage = getLastBuddyMessage(history);
  const currentConversationTopic = inferCurrentConversationTopic(text);
  const previousConversationTopic = inferConversationTopic("", history);

  if (detectGreetingMessage(message)) {
    return BUDDY_GREETING_REPLY;
  }

  if (detectThanksMessage(message)) {
    return BUDDY_THANKS_REPLY;
  }

  if (detectCapabilityQuestion(message)) {
    return BUDDY_CAPABILITY_REPLY;
  }

  if (detectBotFeelingQuestion(message)) {
    return "Ik heb zelf geen gevoelens, maar ik ben er om rustig met jou mee te denken. Hoe is het nu met jou?";
  }

  if (mentionsMedicalDiseaseContext(text)) {
    return createMedicalDiseaseReply(text);
  }

  if (detectUncertaintyMessage(message)) {
    return "Dat is oké. Je hoeft het niet meteen scherp te hebben. Als je één woord moest kiezen voor nu, welk woord past dan het best?";
  }

  if (detectListeningPreference(message)) {
    return "Oké, dan hoef ik het niet meteen op te lossen. Vertel maar rustig: wat is het belangrijkste dat je even kwijt wil?";
  }

  if (detectOrderingPreference(message)) {
    return "Oké, dan maken we het overzichtelijk. Wat is er gebeurd, en wat gaat er vooral door je hoofd?";
  }

  if (detectActionPreference(message)) {
    return "Oké, dan zoeken we één haalbare stap. Wat zou over 10 minuten al iets lichter mogen voelen?";
  }

  if (mentionsTalkingBarrier(text)) {
    return "Dat je dit lastig vindt om te zeggen is begrijpelijk. Je hoeft het hier niet mooi te formuleren. Wat zou je willen dat iemand hiervan begreep?";
  }

  if (detectPositiveWellbeingMessage(message)) {
    return createPositiveWellbeingReply(text);
  }

  if (detectMixedWellbeingMessage(message)) {
    return createMixedWellbeingReply(text);
  }

  if (detectNegativeWellbeingMessage(message)) {
    return createNegativeWellbeingReply(text);
  }

  if (detectTiredMessage(message)) {
    return createTiredReply(todayEntry);
  }

  if (mentionsRelationshipStress(text)) {
    return createRelationshipStressReply(text);
  }

  if (mentionsRumination(text)) {
    return createRuminationReply(text);
  }

  if (mentionsOverstimulated(text)) {
    return createOverstimulatedReply(text);
  }

  if (mentionsRelapse(text)) {
    return createRelapseReply(text);
  }

  if (mentionsCraving(text)) {
    return createCravingReply(text);
  }

  if (mentionsLowMotivation(text)) {
    return createLowMotivationReply(text);
  }

  if (mentionsAnger(text)) {
    return createAngerReply(text);
  }

  if (detectLifeDomainMessage(message)) {
    return createLifeDomainReply(text);
  }

  if (detectYesMessage(message)) {
    return createYesReply(previousBuddyMessage);
  }

  if (detectNoMessage(message)) {
    return "Dat mag. Dan maken we het kleiner: wat merk je nu het meest, in je hoofd of in je lichaam?";
  }

  if (detectClarificationQuestion(message)) {
    return "Ik bedoel: kies één klein stukje van wat je voelt of denkt, zonder het meteen op te lossen. Wat is op dit moment het meest aanwezig?";
  }

  if (
    previousConversationTopic &&
    (!currentConversationTopic || currentConversationTopic === previousConversationTopic) &&
    isContextualHealthFollowUp(text)
  ) {
    return createContextualHealthReply(previousConversationTopic, text, todayEntry);
  }

  if (detectUnclearMessage(message)) {
    return BUDDY_UNCLEAR_REPLY;
  }

  if (detectOutOfScopeMessage(message)) {
    return BUDDY_SCOPE_REPLY;
  }

  if (text.length < 3) {
    return "Ik heb iets meer woorden nodig om je goed te volgen. Kun je in één korte zin zeggen hoe je je voelt?";
  }

  if (mentionsPhysicalSymptom(text)) {
    return createPhysicalSymptomReply(text);
  }

  if (mentionsPhysicalPain(text)) {
    return createPhysicalPainReply(text);
  }

  if (mentionsAdviceRequest(text)) {
    return createAdviceReply(todayEntry);
  }

  if (mentionsFocus(text)) {
    return "Het klinkt alsof concentreren vandaag lastig is. Wat maakt beginnen nu het moeilijkst?\n\nKleine stap: zet een timer op 10 minuten en kies alleen de eerste handeling.";
  }

  if (mentionsPressure(text)) {
    return "Dat klinkt alsof je hoofd vol zit. Wat legt vandaag de meeste druk op je?\n\nKleine stap: kies een ding dat echt moet en laat een ander ding bewust wachten.";
  }

  if (mentionsSelfCriticism(text)) {
    return "Je klinkt streng voor jezelf. Wat zou je tegen een vriend zeggen die dit zo vertelde?\n\nKleine stap: haal een eis van vandaag af en houd een haalbare volgende stap over.";
  }

  if (mentionsLowMood(text)) {
    return "Dat klinkt zwaar, en het is logisch dat je dan minder ruimte voelt. Wat zou vandaag een klein beetje zachter maken?\n\nKleine stap: doe iets eenvoudigs dat geen prestatie hoeft te zijn.";
  }

  if (mentionsSleep(text)) {
    return "Met weinig slaap kan alles sneller zwaar voelen. Wat mag vandaag iets minder perfect?\n\nKleine stap: kies een taak die klein genoeg is om moe te kunnen doen.";
  }

  if (mentionsFood(text)) {
    return "Als eten vandaag minder lukte, kan je energie ook wiebeliger voelen. Wat zou nu haalbaar zijn?\n\nKleine stap: kies iets simpels met water erbij, zonder er een perfecte maaltijd van te maken.";
  }

  if (mentionsFeeling(text)) {
    return "Ik hoor je. Wat voelt hierin het zwaarst of meest aanwezig?\n\nKleine stap: geef het gevoel eerst een naam, zonder het meteen te hoeven veranderen.";
  }

  if (todayEntry?.focus === "slecht" || todayEntry?.focus === "moeilijk") {
    return "Ik neem je check-in even mee: focus leek vandaag lastig. Speelt dat nu ook mee?\n\nKleine stap: kies alleen de eerste handeling, niet de hele taak.";
  }

  if (todayEntry?.sleepHours > 0 && todayEntry.sleepHours < 6) {
    return "Ik neem je check-in even mee: met weinig slaap kan alles sneller zwaar voelen. Wat mag vandaag iets minder perfect?\n\nKleine stap: kies iets kleins dat ook moe haalbaar is.";
  }

  if (todayEntry?.mood === "slecht") {
    return "Ik neem je check-in even mee: je stemming leek lager. Wat zou vandaag een klein beetje zachter maken?\n\nKleine stap: doe iets eenvoudigs dat geen prestatie hoeft te zijn.";
  }

  if (todayEntry?.nutrition === "slecht") {
    return "Ik neem je check-in even mee: voeding gaf vandaag weinig steun. Wat zou nu haalbaar zijn?\n\nKleine stap: kies iets simpels met water erbij, zonder er een perfecte maaltijd van te maken.";
  }

  if (todayEntry?.note) {
    return "Je notitie laat zien dat er iets speelt. Wat voelt op dit moment het meest aanwezig?\n\nKleine stap: benoem een ding dat je kunt doen en een ding dat even mag wachten.";
  }

  return "Dank je dat je dit opschrijft. Ik wil eerst goed begrijpen wat je bedoelt: wil je vooral dat ik luister, help ordenen, of meedenk over een stap?";
}

function getLastBuddyMessage(history) {
  return [...history].reverse().find((message) => message.role === "buddy")?.text || "";
}

function getRecentConversationText(history) {
  return history
    .slice(-6)
    .map((message) => message.text)
    .join(" ");
}

function inferConversationTopic(text, history) {
  const currentTopic = inferCurrentConversationTopic(text);

  if (currentTopic) return currentTopic;

  const recent = normalizeBuddyText(getRecentConversationText(history));
  return inferCurrentConversationTopic(recent);
}

function inferCurrentConversationTopic(text) {
  if (mentionsPhysicalSymptom(text)) return "body";
  if (mentionsPhysicalPain(text)) return "pain";
  if (mentionsCraving(text) || mentionsRelapse(text)) return "stress";
  if (mentionsRelationshipStress(text) || mentionsRumination(text) || mentionsOverstimulated(text)) return "stress";
  if (mentionsLowMotivation(text)) return "focus";
  if (mentionsAnger(text)) return "mood";
  if (mentionsPressure(text)) return "stress";
  if (mentionsLowMood(text) || mentionsSelfCriticism(text)) return "mood";
  if (mentionsSleep(text)) return "sleep";
  if (mentionsFocus(text)) return "focus";
  if (mentionsFood(text)) return "food";

  return "";
}

function isContextualHealthFollowUp(text) {
  if (!text) return false;
  if (
    detectGreetingMessage(text) ||
    detectThanksMessage(text) ||
    detectCapabilityQuestion(text) ||
    detectBotFeelingQuestion(text) ||
    detectUnclearMessage(text)
  ) {
    return false;
  }

  if (detectOutOfScopeMessage(text)) return false;
  if (
    mentionsPhysicalPain(text) ||
    mentionsPhysicalSymptom(text) ||
    mentionsRelationshipStress(text) ||
    mentionsRumination(text) ||
    mentionsOverstimulated(text) ||
    mentionsCraving(text) ||
    mentionsRelapse(text) ||
    mentionsLowMotivation(text) ||
    mentionsAnger(text) ||
    mentionsPressure(text) ||
    mentionsLowMood(text) ||
    mentionsSleep(text) ||
    mentionsFocus(text) ||
    mentionsFood(text) ||
    mentionsFeeling(text)
  ) return true;
  if (/^(ja|nee|ok|oke|weet ik niet|ik weet het niet|geen idee|misschien|klopt|niet echt|een beetje|best wel|heel erg|minder|meer)$/.test(text)) return true;
  if (/sinds|vanaf|al |dagen|week|weken|maand|uur|uren|gisteren|vandaag|net|plots|ineens|langzaam|door |na |tijdens|sport|werk|school|thuis|slapen|gevallen|gestoten|getild|bewegen|tillen|zitten|liggen|lopen|erger|minder|beter|uitstraalt|tintel|doof|kracht|benauwd|borst|[0-9]\s*(\/|op de|van de)?\s*10|links|rechts|linker|rechter|arm|been|hand|voet|schouder|nek|rug|hoofd|buik|knie/.test(text)) return true;

  const words = text.match(/[a-z0-9]+/g) || [];
  return words.length > 0 && words.length <= 14;
}

function createContextualHealthReply(topic, text, todayEntry) {
  if (topic === "body") return createBodyFollowUpReply(text);
  if (topic === "pain") return createPainFollowUpReply(text);
  if (topic === "stress") return createStressFollowUpReply(text);
  if (topic === "mood") return createMoodFollowUpReply(text);
  if (topic === "sleep") return createSleepFollowUpReply(text, todayEntry);
  if (topic === "focus") return createFocusFollowUpReply(text);
  if (topic === "food") return createFoodFollowUpReply(text);

  return "Ik blijf even bij wat je net vertelde. Wat merk je nu het meest, en wat zou één kleine volgende stap kunnen zijn?";
}

function createPhysicalSymptomReply(text) {
  return createBodyFollowUpReply(text);
}

function createBodyFollowUpReply(text) {
  if (mentionsPhysicalRedFlag(text)) {
    return "Dat klinkt als iets om serieus te nemen. Bij benauwdheid, pijn op de borst, flauwvallen, krachtverlies of plots heftige klachten: neem direct contact op met een arts of bel 112 bij direct gevaar.";
  }

  if (mentionsDuration(text)) {
    return "Als dit al langer speelt, is het verstandig om het niet te negeren. Is het hetzelfde gebleven, erger geworden of iets minder?\n\nKleine stap: neem rust en let op wat de klacht duidelijk verergert.";
  }

  if (/eten|maaltijd|honger|gedronken|water|misselijk/.test(text)) {
    return "Dat kan je energie flink beïnvloeden. Heb je vandaag genoeg gegeten en gedronken?\n\nKleine stap: drink rustig wat water en kies iets kleins als eten lukt.";
  }

  return "Dat klinkt vervelend. Merk je dit vooral in rust, bij bewegen, na eten of door drukte?\n\nKleine stap: doe het even rustiger en kijk of de klacht afneemt of juist erger wordt.";
}

function createPainFollowUpReply(text) {
  if (mentionsPhysicalRedFlag(text)) {
    return "Dat klinkt als iets om serieus te nemen. Bij benauwdheid, pijn op de borst, tintelingen, krachtverlies, uitstralende pijn of plots heftige pijn: neem direct contact op met een arts of bel 112 bij direct gevaar.";
  }

  if (mentionsDuration(text)) {
    return "Als het al langer speelt, is het goed om het niet weg te drukken. Is de pijn hetzelfde gebleven, erger geworden, of juist iets minder?\n\nKleine stap: vermijd vandaag bewegingen die het duidelijk verergeren.";
  }

  if (mentionsCause(text)) {
    return "Dat geeft wat context. Het kan helpen om te kijken welke beweging het triggert. Welke beweging maakt het erger?\n\nKleine stap: pauzeer die beweging vandaag en houd de plek rustig.";
  }

  if (mentionsSeverity(text)) {
    return "Dank je, dat helpt om het beter te plaatsen. Maakt de pijn normale beweging moeilijk, of kun je er nog rustig mee bewegen?\n\nKleine stap: kies voor lichte, pijnvrije beweging en forceer niets.";
  }

  return "Ik blijf even bij die pijn. Waar merk je het vooral bij: bewegen, rust, tillen, slapen of ademhalen?\n\nKleine stap: noteer wanneer het erger wordt, zodat je patroon ziet.";
}

function createStressFollowUpReply(text) {
  if (/werk|school|studie|deadline|drukte|taken|moet/.test(text)) {
    return "Dat klinkt alsof er veel tegelijk aan je trekt. Wat is het ene ding dat vandaag echt voorrang heeft?\n\nKleine stap: schrijf de rest op een parkeer-lijst voor later.";
  }

  if (/thuis|relatie|familie|ruzie|vriend|vriendin|partner/.test(text)) {
    return "Dat kan veel ruimte innemen in je hoofd. Wat heb je nu vooral nodig: rust, duidelijkheid of steun?\n\nKleine stap: stel één grens of vraag één concreet ding.";
  }

  return "Ik blijf even bij de druk. Waar voel je die het meest: in je hoofd, lichaam of agenda?\n\nKleine stap: kies één taak die mag wachten tot later.";
}

function createMoodFollowUpReply(text) {
  if (/alleen|eenzaam/.test(text)) {
    return "Eenzaamheid kan zwaar voelen. Is er één persoon bij wie je laagdrempelig iets kunt laten weten?\n\nKleine stap: stuur alleen een kort bericht, zonder alles te hoeven uitleggen.";
  }

  if (/schuld|schaam|falen|dom|stom|lui/.test(text)) {
    return "Je klinkt streng voor jezelf. Wat zou een mildere versie van die gedachte zijn?\n\nKleine stap: haal één eis van vandaag af.";
  }

  return "Ik blijf even bij je stemming. Is dit vooral verdriet, spanning, boosheid, leegte of iets anders?\n\nKleine stap: geef het één naam en maak je volgende stap klein.";
}

function createSleepFollowUpReply(text, todayEntry) {
  if (/wakker|piekeren|gedachte|hoofd/.test(text)) {
    return "Piekeren kan slaap echt breken. Wat blijft er vooral rondgaan in je hoofd?\n\nKleine stap: schrijf het kort op en kies één vast moment morgen om erop terug te komen.";
  }

  if (todayEntry?.sleepHours > 0 && todayEntry.sleepHours < 6) {
    return "Met weinig slaap hoeft vandaag niet perfect te zijn. Wat kan je vandaag lichter maken?\n\nKleine stap: plan één rustmoment zonder scherm.";
  }

  return "Ik blijf even bij slaap. Gaat het vooral om inslapen, doorslapen of uitgerust wakker worden?\n\nKleine stap: kies vanavond één rustig anker voor bedtijd.";
}

function createFocusFollowUpReply(text) {
  if (/telefoon|melding|afgeleid|social/.test(text)) {
    return "Afleiding maakt starten extra lastig. Wat kun je 10 minuten uit beeld leggen?\n\nKleine stap: leg je telefoon weg en start alleen de eerste handeling.";
  }

  if (/te veel|veel|overzicht|taken/.test(text)) {
    return "Te veel tegelijk maakt focus zwaar. Welke taak is nu het meest belangrijk?\n\nKleine stap: kies één taak en maak de eerste stap kleiner dan je normaal zou doen.";
  }

  return "Ik blijf even bij focus. Is het lastig om te starten, vol te houden, of te kiezen waar je begint?\n\nKleine stap: zet een timer op 10 minuten en stop daarna bewust.";
}

function createFoodFollowUpReply(text) {
  if (/geen honger|misselijk|vol/.test(text)) {
    return "Dan hoeft het niet groot of perfect. Wat zou klein en haalbaar zijn?\n\nKleine stap: neem iets simpels en drink wat water.";
  }

  if (/vergeten|druk|geen tijd/.test(text)) {
    return "Dat gebeurt snel op drukke dagen. Wat is de makkelijkste optie die je nu beschikbaar hebt?\n\nKleine stap: kies iets eenvoudigs dat genoeg energie geeft.";
  }

  return "Ik blijf even bij voeding. Gaat het vooral om te weinig eten, onregelmatig eten of weinig energie?\n\nKleine stap: kies één simpele eet- of drinkkeuze voor nu.";
}

function mentionsDuration(text) {
  return /\b(sinds|vanaf|al|dagen|week|weken|maand|uur|uren|gisteren|vandaag|langer)\b/.test(text);
}

function mentionsCause(text) {
  return /door |na |tijdens|sport|fitness|werk|slapen|gevallen|gestoten|getild|verkeerd|training|beweeg|bewegen|tillen|optillen|optil|draaien|bukken|arm omhoog/.test(text);
}

function mentionsSeverity(text) {
  return /[0-9]\s*(\/|op de|van de)?\s*10|licht|mild|erg|heftig|veel pijn|beetje pijn/.test(text);
}

function mentionsPhysicalRedFlag(text) {
  return /benauwd|pijn op de borst|borstpijn|tintel|tintelingen|doof|krachtverlies|uitstraalt|uitstraling|verlamming|niet bewegen|plots heel erg|hevige pijn/.test(text);
}

function detectCrisisMessage(message) {
  const text = normalizeBuddyText(message);
  const crisisPatterns = [
    /\bzelfmoord\b/,
    /\bsuicide\b/,
    /\bsuicidaal\b/,
    /\bsuicidale\b/,
    /\bik wil dood\b/,
    /\bik wil niet meer leven\b/,
    /\bniet meer willen leven\b/,
    /\bniet meer leven\b/,
    /\bmezelf dood\b/,
    /\bmijzelf dood\b/,
    /\beinde aan mijn leven\b/,
    /\ber een einde aan maken\b/,
    /\bmezelf iets aandoen\b/,
    /\bmijzelf iets aandoen\b/,
    /\bmezelf pijn doen\b/,
    /\bmijzelf pijn doen\b/,
    /\bzelfbeschadiging\b/,
    /\bautomutilatie\b/,
    /\bik snij mezelf\b/,
    /\biemand iets aandoen\b/,
    /\biemand pijn doen\b/,
    /\biemand vermoorden\b/,
    /\bvermoorden\b/,
    /\bdoodmaken\b/,
    /\bin direct gevaar\b/,
    /\bcrisis\b/,
  ];

  return crisisPatterns.some((pattern) => pattern.test(text));
}

function detectDiseaseSwearMessage(message) {
  const text = normalizeBuddyText(message);

  if (!text) return false;

  const diseaseWords = /\b(kanker|kk|kkr|tyfus|tering|pleuris|aids|corona|covid)\b/;

  if (!diseaseWords.test(text)) return false;
  if (mentionsMedicalDiseaseContext(text)) return false;

  return (
    /\b(kanker|kk|kkr|tyfus|tering|pleuris)\b/.test(text) ||
    /\b(aids|corona|covid)\s*(lijer|mongool|idioot|sukkel|debiel|hoer|wijf|vent)\b/.test(text)
  );
}

function mentionsMedicalDiseaseContext(text) {
  const diseaseWords = /\b(kanker|aids|corona|covid|tyfus|tering|pleuris)\b/;
  const medicalContext =
    /\b(ik|mijn|me|mn|familie|moeder|vader|broer|zus|vriend|vriendin|partner|oma|opa|iemand)\b.{0,50}\b(heb|heeft|had|kreeg|krijg|diagnose|gediagnosticeerd|ziek|ziekte|besmet|positief|test|getest|behandeling|arts|dokter|ziekenhuis|chemo|overleden|gestorven)\b/;
  const reverseMedicalContext =
    /\b(heb|heeft|had|kreeg|krijg|diagnose|gediagnosticeerd|ziek|ziekte|besmet|positief|test|getest|behandeling|arts|dokter|ziekenhuis|chemo|overleden|gestorven)\b.{0,50}\b(kanker|aids|corona|covid|tyfus|tering|pleuris)\b/;

  return diseaseWords.test(text) && (medicalContext.test(text) || reverseMedicalContext.test(text));
}

function detectOutOfScopeMessage(message) {
  const text = normalizeBuddyText(message);

  if (isShortContinuation(text)) return false;

  return (mentionsOffTopicRequest(text) || looksLikeGeneralQuestion(text)) && !mentionsBuddyScope(text);
}

function detectGreetingMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(hoi|hallo|hey|heey|hi|hai|hello|yo|goedemorgen|goedemiddag|goedenavond)( buddy| balans buddy)?$/.test(text);
}

function detectThanksMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(dankje|dank je|thanks|bedankt|thx|super bedankt|merci)( hoor)?$/.test(text);
}

function detectCapabilityQuestion(message) {
  const text = normalizeBuddyText(message);
  return /wat kan je|wat kun je|waarmee kan je|waarmee kun je|help mij|kan je me helpen|kun je me helpen/.test(text);
}

function detectBotFeelingQuestion(message) {
  const text = normalizeBuddyText(message);
  return /hoe gaat het met jou|hoe voel jij|hoe voel je je|alles goed met jou/.test(text);
}

function detectUncertaintyMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(weet ik niet|ik weet het niet|geen idee|geen flauw idee|lastig|moeilijk te zeggen|ik weet niet)$/.test(text);
}

function detectYesMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(ja|jazeker|yes|yep|klopt|ok|oke|is goed|prima)$/.test(text);
}

function detectNoMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(nee|nope|niet echt|liever niet|nu niet)$/.test(text);
}

function detectClarificationQuestion(message) {
  const text = normalizeBuddyText(message);
  return /wat bedoel je|hoe bedoel je|ik snap het niet|leg uit/.test(text);
}

function detectListeningPreference(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(luisteren|luister|alleen luisteren|vooral luisteren|gewoon luisteren|ik wil dat je luistert)$/.test(text);
}

function detectOrderingPreference(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(ordenen|help ordenen|overzicht|duidelijkheid|op een rijtje|rijtje maken|ik wil overzicht)$/.test(text);
}

function detectActionPreference(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(stap|een stap|volgende stap|actie|advies|meedenken|denk mee|wat kan ik doen)$/.test(text);
}

function detectPositiveWellbeingMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(goed|gaat goed|het gaat goed|prima|lekker|best goed|super|top|oke goed|wel goed)$/.test(text);
}

function detectMixedWellbeingMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(gaat wel|het gaat wel|mwah|redelijk|niet slecht|kan beter|beetje wisselend|wisselend|matig|oke|ok)$/.test(text);
}

function detectNegativeWellbeingMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(slecht|niet goed|het gaat niet goed|niet zo goed|rot|kut|waardeloos|down|somber|verdrietig|boos|bang|onrustig|gestrest)$/.test(text);
}

function detectTiredMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(moe|heel moe|kapot|uitgeput|geen energie|weinig energie|ik ben moe|ik ben kapot|ik ben uitgeput)$/.test(text);
}

function detectLifeDomainMessage(message) {
  const text = normalizeBuddyText(message).replace(/[!.?]+$/g, "");
  return /^(werk|school|studie|thuis|relatie|familie|vrienden|mijn werk|mijn studie|mijn relatie|mijn familie)$/.test(text);
}

function createPositiveWellbeingReply(text) {
  return "Fijn om te horen. Wat maakt dat het vandaag goed voelt?\n\nKleine stap: kies één ding dat je vandaag wilt vasthouden.";
}

function createMixedWellbeingReply(text) {
  return "Dat klinkt alsof het niet helemaal slecht is, maar ook niet vanzelf gaat. Wat maakt het vandaag vooral 'gaat wel'?\n\nKleine stap: maak één ding vandaag iets lichter voor jezelf.";
}

function createNegativeWellbeingReply(text) {
  if (/boos/.test(text)) {
    return "Dat klinkt alsof er spanning zit. Waar ben je vooral boos over?\n\nKleine stap: reageer niet meteen; schrijf eerst in één zin op wat je eigenlijk nodig hebt.";
  }

  if (/bang|onrustig|gestrest/.test(text)) {
    return "Dat klinkt onrustig. Wat vraagt nu de meeste ruimte in je hoofd?\n\nKleine stap: kies één ding dat je nu kunt vertragen of parkeren.";
  }

  return "Dat klinkt niet fijn. Wat drukt vandaag het meest op je: je hoofd, je lichaam of iets dat moet?\n\nKleine stap: kies één kleine handeling die nu haalbaar is.";
}

function createTiredReply(todayEntry) {
  if (todayEntry?.sleepHours > 0 && todayEntry.sleepHours < 6) {
    return "Dat past bij je korte slaap. Vandaag hoeft niet op volle kracht. Wat moet echt, en wat mag wachten?\n\nKleine stap: kies de lichtste versie van je belangrijkste taak.";
  }

  return "Moe zijn kan alles zwaarder maken. Denk je dat het vooral door slaap, drukte of spanning komt?\n\nKleine stap: maak je planning vandaag kleiner dan normaal.";
}

function createLifeDomainReply(text) {
  if (/werk|school|studie/.test(text)) {
    return "Dat kan veel druk geven. Gaat het vooral om te veel taken, mensen, deadlines of starten?\n\nKleine stap: kies één ding dat vandaag echt prioriteit heeft.";
  }

  if (/relatie|familie|vrienden|thuis/.test(text)) {
    return "Dat kan veel met je doen. Heb je nu vooral behoefte aan rust, duidelijkheid of steun?\n\nKleine stap: maak één kleine grens of vraag concreet om één ding.";
  }

  return "Vertel eens, wat maakt dat dit vandaag zo aanwezig is?\n\nKleine stap: benoem één ding dat je hierin nodig hebt.";
}

function createRelationshipStressReply(text) {
  if (/werk|collega|baas|manager/.test(text)) {
    return "Gedoe met mensen op werk kan veel energie kosten. Wat raakt je hierin het meest: de toon, de druk of onduidelijkheid?\n\nKleine stap: wacht even met reageren en schrijf op wat je concreet wilt zeggen.";
  }

  if (/vriendin|vriend|partner|relatie/.test(text)) {
    return "Dat kan dichtbij komen. Wat heb je nu vooral nodig: rust, duidelijkheid of even steun?\n\nKleine stap: formuleer één zin zonder verwijt, bijvoorbeeld wat jij merkt of nodig hebt.";
  }

  return "Dat klinkt alsof iemand of iets thuis/familie veel ruimte inneemt. Wat maakt het op dit moment het zwaarst?\n\nKleine stap: kies eerst rust voordat je iets probeert op te lossen.";
}

function createRuminationReply(text) {
  if (/nacht|slapen|wakker/.test(text)) {
    return "Piekeren kan je hoofd juist wakker houden. Wat blijft steeds terugkomen?\n\nKleine stap: schrijf het kort op en spreek met jezelf af wanneer je er morgen naar kijkt.";
  }

  return "Dat klinkt alsof je hoofd blijft herhalen. Wat is de gedachte die het vaakst terugkomt?\n\nKleine stap: zet die gedachte letterlijk op papier en kies daarna één kleine actie of pauze.";
}

function createOverstimulatedReply(text) {
  return "Overprikkeling kan maken dat alles te veel voelt. Wat is nu de grootste prikkel: geluid, mensen, taken of schermen?\n\nKleine stap: haal één prikkel weg voor 10 minuten.";
}

function createCravingReply(text) {
  return "Die verleiding kan heel dwingend voelen, maar je hoeft niet meteen te handelen. Wat triggert het nu vooral: plek, gevoel, persoon of gewoonte?\n\nKleine stap: stel 10 minuten uit en doe iets fysieks kleins, zoals water drinken, wandelen of iemand appen.";
}

function createRelapseReply(text) {
  return "Een terugval betekent niet dat alles mislukt is. Het is vooral informatie over een kwetsbaar moment. Wat gebeurde er vlak ervoor?\n\nKleine stap: schrijf één trigger op en kies wat je de volgende keer eerder kunt doen.";
}

function createLowMotivationReply(text) {
  if (/moe|energie|uitgeput|kapot/.test(text)) {
    return "Als je energie laag is, voelt motivatie vaak ook laag. Wat is de kleinste versie die nog telt?\n\nKleine stap: doe alleen de eerste twee minuten en stop daarna bewust als dat nodig is.";
  }

  return "Geen motivatie betekent niet dat je faalt; soms is de start gewoon te groot. Waar loop je op vast?\n\nKleine stap: maak de taak zo klein dat beginnen bijna makkelijk wordt.";
}

function createAngerReply(text) {
  return "Boosheid zegt vaak dat er iets belangrijk voor je is. Wat werd er geraakt: je grens, je tijd, of je gevoel van respect?\n\nKleine stap: reageer pas nadat je één rustige zin hebt opgeschreven.";
}

function createMedicalDiseaseReply(text) {
  if (/vader|moeder|broer|zus|vriend|vriendin|partner|oma|opa|familie|iemand/.test(text)) {
    return "Dat is heftig om mee te dragen. Wat maakt je nu het meest bezorgd: wat er kan gebeuren, hoe je ermee omgaat, of dat je je machteloos voelt?\n\nKleine stap: stuur of zeg één eerlijke zin tegen iemand die je vertrouwt.";
  }

  return "Dat klinkt als iets dat veel spanning kan geven. Wat merk je nu het meest: zorgen in je hoofd, spanning in je lichaam, of praktische vragen?\n\nKleine stap: schrijf één vraag op die je aan een arts of iemand die je vertrouwt kunt stellen.";
}

function createYesReply(previousBuddyMessage) {
  const previous = normalizeBuddyText(previousBuddyMessage);

  if (/vertellen|door je hoofd|wat er op dit moment/.test(previous)) {
    return "Neem je tijd. Begin maar met één zin: wat is er nu vooral aan de hand?";
  }

  if (/moeilijk om te beginnen|beginnen nu het moeilijkst/.test(previous)) {
    return "Oké. Wat is de eerste drempel: te veel taken, te weinig energie, of niet weten waar je moet starten?";
  }

  return "Oké. Vertel maar in één of twee zinnen wat er nu het meest speelt.";
}

function detectUnclearMessage(message) {
  const text = normalizeBuddyText(message);

  if (!text || isShortContinuation(text)) return false;

  const words = text.match(/[a-z]+/g) || [];

  if (words.length === 0) return true;

  const checkableWords = words.filter((word) => word.length >= 4);

  if (checkableWords.length === 0) return false;

  const unclearWords = checkableWords.filter(isUnclearWord);
  return unclearWords.length > 0 && unclearWords.length / checkableWords.length >= 0.5;
}

function normalizeBuddyText(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mentionsFocus(text) {
  return /focus|concentr|beginnen|uitstel|afgeleid|vastlopen|starten/.test(text);
}

function mentionsSleep(text) {
  return /moe|slaap|geslapen|uitgeput|kapot|wakker|nacht/.test(text);
}

function mentionsPressure(text) {
  return /stress|druk|drukte|overweldig|hoofd vol|te veel|paniek|spanning|gespannen|onrust|onrustig|overprikkeld/.test(text);
}

function mentionsRelationshipStress(text) {
  return /ruzie|conflict|gedoe met|irritatie met|relatie|partner|vriendin|vriend|familie|ouders|thuis|collega|baas|manager/.test(text);
}

function mentionsRumination(text) {
  return /pieker|piekeren|malen|gedachten blijven|gedachte blijft|gedachtes|hoofd blijft|blijft rondgaan|blijft maar doorgaan|kan niet stoppen met denken|denken stopt niet|denk te veel|overdenken/.test(text);
}

function mentionsOverstimulated(text) {
  return /overprikkeld|prikkels|te veel geluid|veel geluid|drukte|alles komt binnen|kan niks hebben|snel geirriteerd|snel geprikkeld/.test(text);
}

function mentionsCraving(text) {
  return /drang|trek|zin in|verlangen|craving|urge|wil gebruiken|bijna gebruiken|moeilijk om niet|kan het bijna niet laten/.test(text);
}

function mentionsRelapse(text) {
  return /terugval|weer gebruikt|toch gebruikt|opnieuw gebruikt|weer gerookt|toch gerookt|weer gedronken|toch gedronken|weer gegokt|toch gegokt/.test(text);
}

function mentionsLowMotivation(text) {
  return /geen motivatie|weinig motivatie|geen zin|nergens zin|kom niet vooruit|niet vooruit|uitstellen|uitstelgedrag|lukt niet om te starten|kan niet beginnen/.test(text);
}

function mentionsAnger(text) {
  return /boos|kwaad|gefrustreerd|frustratie|irritatie|geirriteerd/.test(text);
}

function mentionsTalkingBarrier(text) {
  return /praten lastig|moeilijk om te praten|moeilijk te zeggen|durf niet|schaam|schaamte|kan dit niet zeggen|weet niet (goed )?hoe ik (dit|het) moet zeggen|lastig om uit te leggen|bang voor oordeel|veroordeeld/.test(text);
}

function mentionsLowMood(text) {
  return /somber|verdriet|verdrietig|leeg|huil|down|waardeloos|alleen|eenzaam|rot|slecht|bang|angst|boos|onzeker/.test(text);
}

function mentionsFood(text) {
  return /eten|voeding|maaltijd|honger|snack|ontbijt|lunch|avondeten/.test(text);
}

function mentionsSelfCriticism(text) {
  return /faal|falen|dom|lui|schuld|schaam|niet goed genoeg|stom/.test(text);
}

function mentionsPhysicalPain(text) {
  return /pijn|zeur|stek|stijf|blessure|geblesseerd|last van|doet pijn|gevoelig|verrekking|spierpijn|kramp|zwelling|kloppend|brandend/.test(text);
}

function mentionsPhysicalSymptom(text) {
  return /misselijk|duizelig|ziek|koorts|benauwd|hartklopping|flauw|flauwvallen|tintel|tintelingen|doof|krachtverlies|uitstral|kortademig/.test(text);
}

function createPhysicalPainReply(text) {
  if (mentionsPhysicalRedFlag(text)) {
    return "Dat klinkt als iets om serieus te nemen. Bij benauwdheid, pijn op de borst, tintelingen, krachtverlies, uitstralende pijn of plots heftige pijn: neem direct contact op met een arts of bel 112 bij direct gevaar.";
  }

  const location = getPainLocation(text);
  const areaText = location ? `in je ${location}` : "in je lichaam";
  const safetyText =
    "Als de pijn heftig is, erger wordt, uitstraalt, of samengaat met benauwdheid, pijn op de borst, tintelingen of krachtverlies: neem contact op met een arts of bel 112 bij direct gevaar.";

  return `Dat klinkt vervelend. Pijn ${areaText} kan je dag behoorlijk beïnvloeden. Is het plots ontstaan, door bewegen/tillen, of speelt het al langer?\n\nKleine stap: ontlast die plek even en vermijd bewegingen die de pijn erger maken. ${safetyText}`;
}

function getPainLocation(text) {
  const locations = [
    ["schouder", /schouder/],
    ["nek", /nek/],
    ["rug", /rug/],
    ["hoofd", /hoofd|hoofdpijn/],
    ["buik", /buik|maag/],
    ["borst", /borst/],
    ["arm", /arm|elleboog/],
    ["hand", /hand|pols/],
    ["been", /been|bovenbeen|onderbeen/],
    ["knie", /knie/],
    ["voet", /voet|enkel/],
    ["heup", /heup/],
    ["kaak", /kaak/],
  ];

  return locations.find(([, pattern]) => pattern.test(text))?.[0] || "";
}

function mentionsFeeling(text) {
  return /ik voel|voel me|voel mij|ik ben|ben vandaag|zit niet lekker|gaat niet lekker|onrustig|rusteloos|emotioneel|gespannen/.test(text);
}

function mentionsAdviceRequest(text) {
  return /advies|tip|wat moet ik doen|wat kan ik doen|help me|helpen|hoe pak ik|waar begin ik|volgende stap/.test(text);
}

function createAdviceReply(todayEntry) {
  if (todayEntry?.sleepHours > 0 && todayEntry.sleepHours < 6) {
    return "Mijn rustige advies: maak je dag kleiner dan normaal. Wat is één ding dat echt moet?\n\nKleine stap: kies de lichtste versie van die taak.";
  }

  if (todayEntry?.focus === "slecht" || todayEntry?.focus === "moeilijk") {
    return "Mijn rustige advies: begin niet met alles, maar met de eerste zichtbare handeling. Wat is de kleinste start?\n\nKleine stap: zet 10 minuten aan en stop daarna bewust.";
  }

  if (todayEntry?.mood === "slecht") {
    return "Mijn rustige advies: probeer vandaag niet je hele stemming te repareren. Wat zou het één procent zachter maken?\n\nKleine stap: doe iets simpels zonder prestatiedruk.";
  }

  return "Mijn rustige advies: kies één ding dat nu helpt en houd het klein. Wat zou over 10 minuten al een beetje opluchting geven?\n\nKleine stap: schrijf één haalbare actie op en doe alleen die.";
}

function isShortContinuation(text) {
  return /^(ja|nee|ok|oke|geen idee|weet ik niet|misschien|klopt|denk het|ja misschien|niet echt|h+m+|pff+|oei)$/.test(text);
}

function mentionsBuddyScope(text) {
  return (
    mentionsFocus(text) ||
    mentionsSleep(text) ||
    mentionsPressure(text) ||
    mentionsLowMood(text) ||
    mentionsFood(text) ||
    mentionsSelfCriticism(text) ||
    mentionsPhysicalPain(text) ||
    mentionsPhysicalSymptom(text) ||
    mentionsRelationshipStress(text) ||
    mentionsRumination(text) ||
    mentionsOverstimulated(text) ||
    mentionsLowMotivation(text) ||
    mentionsAnger(text) ||
    /voel|gevoel|gezond|gezondheid|lichaam|hoofd|energie|stemming|check-in|dagboek|trek|zin in|terugval|gestopt|stoppen|verslaving|balans|rust|adem|beweeg|sport|schouder|nek|rug|buik|borst|arm|hand|been|voet|heup|knie|ziek|misselijk|duizelig|moeilijk|zwaar|advies|stap|helpen|hulp|aan de hand|mis met mij|mis met me/.test(text)
  );
}

function mentionsOffTopicRequest(text) {
  return /taart|cake|recept|bakken|koken|weer|temperatuur|regen|zon|nieuws|voetbal|film|serie|muziek|programmeer|code|javascript|python|huiswerk|vertalen|samenvatten|rekensom|grap|verhaal|restaurant|hotel|vlucht|reis|auto|belasting|crypto|aandeel|sollicitatiebrief|email/.test(text);
}

function looksLikeGeneralQuestion(text) {
  return /^(wat is|wie is|waar is|wanneer|hoe maak|hoe werkt|kun je|kan je|geef|vertel me|schrijf|maak|bereken|vertaal|zoek)\b/.test(text);
}

function isUnclearWord(word) {
  if (/^[a-z]*[aeiouy][a-z]*$/.test(word) && !mentionsKeyboardMash(word)) return false;

  return !/[aeiouy]/.test(word) || /[bcdfghjklmnpqrstvwxyz]{5,}/.test(word) || mentionsKeyboardMash(word);
}

function mentionsKeyboardMash(text) {
  return /(asdf|qwer|zxcv|sdf|dfg|fgh|ghj|hjk|jkl|asd|fgj|gfg|dgd|gdg)/.test(text);
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

function getHomePracticalReminder({ checkIn, journalEntry, quitTracker }) {
  const entry = checkIn ? normalizeCheckIn(checkIn) : null;
  if (entry?.sleepHours > 0 && entry.sleepHours < 6) {
    return {
      lesson: "Met weinig slaap is een kleinere planning vaak slimmer.",
      action: "Kies één taak die echt moet en laat één andere taak wachten.",
    };
  }

  if (entry?.focus === "slecht" || entry?.focus === "moeilijk") {
    return {
      lesson: "Als focus laag is, helpt starten met minder keuze.",
      action: "Leg één taak klaar en werk daar 10 minuten aan.",
    };
  }

  if (entry?.mood === "slecht") {
    return {
      lesson: "Een lage stemming vraagt om een haalbare dag.",
      action: "Doe eerst iets simpels dat je basis helpt: eten, douchen of lopen.",
    };
  }

  if (entry?.nutrition === "slecht") {
    return {
      lesson: "Als voeding weinig steun gaf, begin met iets simpels.",
      action: "Drink water en kies iets kleins dat je makkelijk kunt eten.",
    };
  }

  if (journalEntry) {
    return {
      lesson: "Je hebt vandaag al iets vastgelegd. Gebruik dat als signaal.",
      action: "Kies één concrete stap die past bij wat je hebt opgeschreven.",
    };
  }

  if (quitTracker) {
    return {
      lesson: "Je voortgang wordt sterker als je moeilijke momenten bijhoudt.",
      action: "Schrijf vandaag kort op wanneer het moeilijk wordt en wat je dan doet.",
    };
  }

  if (entry) {
    return {
      lesson: "Je daggegevens zijn ingevuld. Maak je volgende stap concreet.",
      action: "Kies één taak of één herstelmoment dat vandaag realistisch is.",
    };
  }

  return {
    lesson: "Je overzicht is nog leeg omdat er nog niets is ingevuld.",
    action: "Begin met één dagboekregel of vul je daggegevens kort in.",
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
    hasPreviousWeek,
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

function createWeeklyAnalysis(checkIns) {
  const entries = getEntriesForKeys(checkIns, lastSevenDateKeys()).map(normalizeCheckIn).filter(Boolean);
  const daysFilled = entries.length;

  if (!daysFilled) {
    return {
      good: "Je hebt nog geen check-ins deze week. Er is nog geen patroon om te bekijken.",
      improve: "Begin met één korte check-in. Daarna kan Balans betere weekinzichten tonen.",
      focus: "Vul vandaag je eerste check-in in.",
    };
  }

  const strongBalanceDays = entries.filter((entry) => calculateBalanceScore(entry).score >= 70).length;
  const enoughSleepDays = entries.filter((entry) => entry.sleepHours >= 7 && entry.sleepHours <= 9).length;
  const goodFocusDays = entries.filter((entry) => getFocusScore(entry.focus) >= 70).length;
  const goodMoodDays = entries.filter((entry) => getMoodScore(entry.mood) >= 70).length;
  const shortSleepDays = entries.filter((entry) => entry.sleepHours < 6.5).length;
  const lowFocusDays = entries.filter((entry) => getFocusScore(entry.focus) < 60).length;
  const lowMoodDays = entries.filter((entry) => getMoodScore(entry.mood) < 60).length;
  const weakNutritionDays = entries.filter((entry) => entry.nutrition === "slecht").length;
  const improvement = getWeeklyImprovement(shortSleepDays, lowFocusDays, lowMoodDays, weakNutritionDays, daysFilled);

  return {
    good: getWeeklyGoodInsight(daysFilled, strongBalanceDays, enoughSleepDays, goodFocusDays, goodMoodDays),
    improve: improvement.text,
    focus: improvement.action,
  };
}

function getWeeklyGoodInsight(daysFilled, strongBalanceDays, enoughSleepDays, goodFocusDays, goodMoodDays) {
  if (daysFilled >= 5) {
    return `Je hebt ${daysFilled} van de 7 dagen ingecheckt. Dat geeft genoeg ritme om patronen te zien.`;
  }

  if (strongBalanceDays >= Math.max(2, Math.ceil(daysFilled / 2))) {
    return `Op ${strongBalanceDays} ${strongBalanceDays === 1 ? "dag" : "dagen"} was je balans redelijk stevig. Dat is een goed signaal.`;
  }

  if (enoughSleepDays >= Math.max(2, Math.ceil(daysFilled / 2))) {
    return `Je slaap zat op ${enoughSleepDays} ${enoughSleepDays === 1 ? "dag" : "dagen"} in een gezonde range. Dat helpt je basis.`;
  }

  if (goodFocusDays >= Math.max(2, Math.ceil(daysFilled / 2))) {
    return "Je focus was op meerdere dagen werkbaar. Dat is iets om vast te houden.";
  }

  if (goodMoodDays >= Math.max(2, Math.ceil(daysFilled / 2))) {
    return "Je stemming bleef op meerdere dagen stabiel genoeg om op voort te bouwen.";
  }

  return `Je hebt ${daysFilled} ${daysFilled === 1 ? "dag" : "dagen"} data verzameld. Dat is de eerste stap naar betere weekinzichten.`;
}

function getWeeklyImprovement(shortSleepDays, lowFocusDays, lowMoodDays, weakNutritionDays, daysFilled) {
  const issues = [
    {
      count: shortSleepDays,
      text: `Op ${shortSleepDays} ${shortSleepDays === 1 ? "dag" : "dagen"} was je slaap kort. Dat lijkt je herstel het meest te raken.`,
      action: "Plan komende week twee avonden waarop je 30 minuten eerder afrondt.",
    },
    {
      count: lowFocusDays,
      text: `Op ${lowFocusDays} ${lowFocusDays === 1 ? "dag" : "dagen"} was focus lastig. Starten lijkt dan belangrijker dan harder werken.`,
      action: "Kies elke ochtend één hoofdtaak en maak de eerste stap kleiner dan normaal.",
    },
    {
      count: lowMoodDays,
      text: `Op ${lowMoodDays} ${lowMoodDays === 1 ? "dag" : "dagen"} was je stemming lager. Dat vraagt om mildere planning.`,
      action: "Plan drie kleine momenten zonder prestatiedruk, bijvoorbeeld wandelen of rustig opruimen.",
    },
    {
      count: weakNutritionDays,
      text: `Op ${weakNutritionDays} ${weakNutritionDays === 1 ? "dag" : "dagen"} gaf voeding weinig steun. Dat kan je energie onrustiger maken.`,
      action: "Leg twee simpele basismaaltijden klaar die weinig moeite kosten.",
    },
  ].sort((a, b) => b.count - a.count);

  const mainIssue = issues[0];

  if (mainIssue.count >= Math.max(2, Math.ceil(daysFilled / 3))) {
    return mainIssue;
  }

  if (daysFilled < 5) {
    return {
      text: "Er is nog te weinig weekdata voor een sterk patroon.",
      action: "Probeer komende week minstens 5 check-ins te halen.",
    };
  }

  return {
    text: "Er springt geen groot zwak punt uit. Je basis lijkt redelijk verdeeld.",
    action: "Houd je check-in ritme vast en kies één gewoon basisritme om te bewaken.",
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
  if (score >= 80) return "Je Balans Score is sterk.";
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

function getJournalEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(JOURNAL_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeJournalEntry).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getJournalEntryByDate(date) {
  return getJournalEntries().find((entry) => entry.date === date) || null;
}

function saveJournalEntry(input) {
  const entries = getJournalEntries();
  const existing = entries.find((entry) => entry.date === input.date);
  const next = {
    ...input,
    craving: normalizeCraving(input.craving),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const updated = [next, ...entries.filter((entry) => entry.date !== input.date)].sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
}

function normalizeJournalEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  const date = typeof entry.date === "string" && isValidDateKey(entry.date) ? entry.date : "";
  const text = typeof entry.text === "string" ? entry.text.trim() : "";
  const createdAt = typeof entry.createdAt === "string" ? entry.createdAt : `${date}T00:00:00.000Z`;

  if (!date || !text) return null;

  return {
    ...entry,
    date,
    text,
    craving: normalizeCraving(entry.craving),
    createdAt,
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : createdAt,
  };
}

function getQuitTracker() {
  try {
    return normalizeQuitTracker(JSON.parse(localStorage.getItem(QUIT_TRACKER_STORAGE_KEY) || "null"));
  } catch {
    return null;
  }
}

function saveQuitTracker(input) {
  const existing = getQuitTracker();
  const next = normalizeQuitTracker({
    ...input,
    createdAt: existing?.createdAt || new Date().toISOString(),
  });

  if (!next) return;

  localStorage.setItem(QUIT_TRACKER_STORAGE_KEY, JSON.stringify(next));
}

function normalizeQuitTracker(value) {
  if (!value || typeof value !== "object") return null;

  const label = typeof value.label === "string" ? value.label.trim() : "";
  const startDate = typeof value.startDate === "string" && isValidDateKey(value.startDate) ? value.startDate : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();

  if (!label || !startDate || startDate > today) return null;

  return {
    label: label.slice(0, 40),
    startDate,
    createdAt,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : createdAt,
  };
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

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;

  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

function shiftDateKey(dateKey, amount) {
  const baseDate = isValidDateKey(dateKey) ? new Date(`${dateKey}T12:00:00`) : new Date(`${today}T12:00:00`);
  baseDate.setDate(baseDate.getDate() + amount);
  return toDateKey(baseDate);
}

function calculateDaysSince(startDateKey, endDateKey = today) {
  if (!isValidDateKey(startDateKey) || !isValidDateKey(endDateKey)) return 0;

  const startDate = new Date(`${startDateKey}T12:00:00`);
  const endDate = new Date(`${endDateKey}T12:00:00`);
  const diff = Math.floor((endDate - startDate) / 86400000);
  return Math.max(0, diff);
}

function formatStoppedDuration(days) {
  const value = Math.max(0, Number(days) || 0);
  if (value === 0) return "Vandaag gestart";
  return formatDayCount(value);
}

function normalizeNutrition(value) {
  return value === "goed" || value === "slecht" ? value : "oke";
}

function normalizeCraving(value) {
  return ["geen", "laag", "middel", "hoog"].includes(value) ? value : "geen";
}

function normalizeCheckIn(entry) {
  if (!entry || typeof entry !== "object") return null;

  const date = typeof entry.date === "string" && entry.date ? entry.date : "";
  const sleepHours = Number(entry.sleepHours);
  const createdAt = typeof entry.createdAt === "string" ? entry.createdAt : `${date}T00:00:00.000Z`;

  if (!date) return null;

  return {
    ...entry,
    date,
    sleepHours: Number.isFinite(sleepHours) ? Math.max(0, Math.min(14, sleepHours)) : 0,
    focus: normalizeFocus(entry.focus, entry.stress),
    mood: normalizeMood(entry.mood, entry.energy),
    nutrition: normalizeNutrition(entry.nutrition),
    note: typeof entry.note === "string" ? entry.note : "",
    createdAt,
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : createdAt,
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

function getNutritionLabel(nutrition) {
  return {
    slecht: "Slecht",
    oke: "Oké",
    goed: "Goed",
  }[normalizeNutrition(nutrition)];
}

function getCravingLabel(craving) {
  return {
    geen: "Geen",
    laag: "Laag",
    middel: "Middel",
    hoog: "Hoog",
  }[normalizeCraving(craving)];
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

function formatDayCount(value) {
  return `${value} ${value === 1 ? "dag" : "dagen"}`;
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
  return String(value || "").replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[character];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
