import type { CheckIn } from "./types";

export const BUDDY_CRISIS_REPLY =
  "Het spijt me dat je je zo voelt. Je hoeft dit niet alleen te dragen. Neem nu direct contact op met iemand die je vertrouwt of bel 112 als je in direct gevaar bent. In Nederland kun je ook 113 Zelfmoordpreventie bereiken via 113 of 0800-0113.";

export const BUDDY_SCOPE_REPLY =
  "Daar kan ik je niet goed mee helpen. Balans Buddy is er alleen om kort mee te denken over hoe je je voelt, je gezondheid, je check-in, slaap, focus, stemming, voeding of een kleine praktische stap.\n\nWil je vertellen wat dit met je doet, of hoe je je nu voelt?";

export const BUDDY_UNCLEAR_REPLY =
  "Ik begrijp niet helemaal wat je bedoelt. Wil je het opnieuw in gewone woorden zeggen?";

type BuddyEntry = CheckIn & {
  focus?: string;
  mood?: string;
};

const CRISIS_PATTERNS = [
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

export function detectCrisisMessage(message: string) {
  const text = normalizeMessage(message);
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

export function detectOutOfScopeMessage(message: string) {
  const text = normalizeMessage(message);

  if (isShortContinuation(text)) {
    return false;
  }

  return (mentionsOffTopicRequest(text) || looksLikeGeneralQuestion(text)) && !mentionsBuddyScope(text);
}

export function detectUnclearMessage(message: string) {
  const text = normalizeMessage(message);

  if (!text || isShortContinuation(text)) {
    return false;
  }

  const words = text.match(/[a-z]+/g) ?? [];

  if (words.length === 0) {
    return true;
  }

  const checkableWords = words.filter((word) => word.length >= 4);

  if (checkableWords.length === 0) {
    return false;
  }

  const unclearWords = checkableWords.filter(isUnclearWord);
  return unclearWords.length > 0 && unclearWords.length / checkableWords.length >= 0.5;
}

export function generateBuddyOpening(todayEntry: CheckIn) {
  const entry = todayEntry as BuddyEntry;

  if (hasLowMood(entry)) {
    return "Je stemming lijkt vandaag wat lager. Wil je vertellen wat er door je hoofd gaat?";
  }

  if (hasLowFocus(entry)) {
    return "Het klinkt alsof concentreren vandaag lastig is. Wat maakt het moeilijk om te beginnen?";
  }

  if (entry.sleepHours > 0 && entry.sleepHours < 6) {
    return "Met weinig slaap kan alles zwaarder voelen. Misschien hoeft vandaag niet perfect te zijn.";
  }

  if (entry.stress >= 7) {
    return "Er lijkt vandaag best wat druk op je systeem te staan. Wat vraagt nu het meeste aandacht?";
  }

  if (entry.nutrition === "slecht") {
    return "Je voeding gaf vandaag weinig steun. Wil je vertellen hoe je dag tot nu toe loopt?";
  }

  return "Je check-in is binnen. Wil je kort vertellen wat er op dit moment door je hoofd gaat?";
}

export function generateBuddyReply(message: string, todayEntry: CheckIn) {
  if (detectCrisisMessage(message)) {
    return BUDDY_CRISIS_REPLY;
  }

  const entry = todayEntry as BuddyEntry;
  const text = normalizeMessage(message);

  if (detectUnclearMessage(message)) {
    return BUDDY_UNCLEAR_REPLY;
  }

  if (detectOutOfScopeMessage(message)) {
    return BUDDY_SCOPE_REPLY;
  }

  if (text.length < 3) {
    return `${generateBuddyOpening(todayEntry)}\n\nKleine stap: schrijf een paar woorden op zonder ze meteen te hoeven oplossen.`;
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

  if (hasLowFocus(entry)) {
    return "Het klinkt alsof concentreren vandaag lastig is. Wat maakt beginnen nu het moeilijkst?\n\nKleine stap: zet een timer op 10 minuten en kies alleen de eerste handeling.";
  }

  if (entry.sleepHours > 0 && entry.sleepHours < 6) {
    return "Met weinig slaap kan alles sneller zwaar voelen. Wat mag vandaag iets minder perfect?\n\nKleine stap: kies een taak die klein genoeg is om moe te kunnen doen.";
  }

  if (entry.stress >= 7) {
    return "Dat klinkt alsof je hoofd vol zit. Wat legt vandaag de meeste druk op je?\n\nKleine stap: kies een ding dat echt moet en laat een ander ding bewust wachten.";
  }

  if (hasLowMood(entry)) {
    return "Dat klinkt zwaar, en het is logisch dat je dan minder ruimte voelt. Wat zou vandaag een klein beetje zachter maken?\n\nKleine stap: doe iets eenvoudigs dat geen prestatie hoeft te zijn.";
  }

  if (entry.nutrition === "slecht") {
    return "Als eten vandaag minder lukte, kan je energie ook wiebeliger voelen. Wat zou nu haalbaar zijn?\n\nKleine stap: kies iets simpels met water erbij, zonder er een perfecte maaltijd van te maken.";
  }

  if (entry.note) {
    return "Je notitie laat zien dat er iets speelt. Wat voelt op dit moment het meest aanwezig?\n\nKleine stap: benoem een ding dat je kunt doen en een ding dat even mag wachten.";
  }

  return "Dank je dat je dit opschrijft. Wat wil je vooral beter begrijpen aan dit gevoel?\n\nKleine stap: kies een rustige volgende handeling voor de komende 10 minuten.";
}

function normalizeMessage(message: string) {
  return message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasLowFocus(entry: BuddyEntry) {
  return entry.focus === "slecht" || entry.focus === "moeilijk";
}

function hasLowMood(entry: BuddyEntry) {
  return entry.mood === "slecht" || entry.energy <= 4;
}

function mentionsFocus(text: string) {
  return /focus|concentr|beginnen|uitstel|afgeleid|vastlopen|starten/.test(text);
}

function mentionsSleep(text: string) {
  return /moe|slaap|geslapen|uitgeput|kapot|wakker|nacht/.test(text);
}

function mentionsPressure(text: string) {
  return /stress|druk|drukte|overweldig|hoofd vol|te veel|paniek|spanning/.test(text);
}

function mentionsLowMood(text: string) {
  return /somber|verdriet|leeg|huil|down|waardeloos|alleen|eenzaam|rot|slecht/.test(text);
}

function mentionsFood(text: string) {
  return /eten|voeding|maaltijd|honger|snack|ontbijt|lunch|avondeten/.test(text);
}

function mentionsSelfCriticism(text: string) {
  return /faal|falen|dom|lui|schuld|schaam|niet goed genoeg|stom/.test(text);
}

function isShortContinuation(text: string) {
  return /^(ja|nee|ok|oke|geen idee|weet ik niet|misschien|klopt|denk het|ja misschien|niet echt|h+m+|pff+|oei)$/.test(text);
}

function mentionsBuddyScope(text: string) {
  return (
    mentionsFocus(text) ||
    mentionsSleep(text) ||
    mentionsPressure(text) ||
    mentionsLowMood(text) ||
    mentionsFood(text) ||
    mentionsSelfCriticism(text) ||
    /voel|gevoel|gezond|gezondheid|lichaam|hoofd|energie|stemming|check-in|balans|rust|adem|beweeg|sport|pijn|ziek|moeilijk|zwaar|advies|stap|helpen|hulp|aan de hand|mis met mij|mis met me/.test(text)
  );
}

function mentionsOffTopicRequest(text: string) {
  return /taart|cake|recept|bakken|koken|weer|temperatuur|regen|zon|nieuws|voetbal|film|serie|muziek|programmeer|code|javascript|python|huiswerk|vertalen|samenvatten|rekensom|grap|verhaal|restaurant|hotel|vlucht|reis|auto|belasting|crypto|aandeel|sollicitatiebrief|email/.test(text);
}

function looksLikeGeneralQuestion(text: string) {
  return /^(wat is|wie is|waar is|wanneer|hoe maak|hoe werkt|kun je|kan je|geef|vertel me|schrijf|maak|bereken|vertaal|zoek)\b/.test(text);
}

function isUnclearWord(word: string) {
  if (/^[a-z]*[aeiouy][a-z]*$/.test(word) && !mentionsKeyboardMash(word)) {
    return false;
  }

  return !/[aeiouy]/.test(word) || /[bcdfghjklmnpqrstvwxyz]{5,}/.test(word) || mentionsKeyboardMash(word);
}

function mentionsKeyboardMash(text: string) {
  return /(asdf|qwer|zxcv|sdf|dfg|fgh|ghj|hjk|jkl|asd|fgj|gfg|dgd|gdg)/.test(text);
}
