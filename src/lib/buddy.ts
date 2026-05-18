import type { CheckIn } from "./types";

export const BUDDY_CRISIS_REPLY =
  "Het spijt me dat je je zo voelt. Je hoeft dit niet alleen te dragen. Neem nu direct contact op met iemand die je vertrouwt of bel 112 als je in direct gevaar bent. In Nederland kun je ook 113 Zelfmoordpreventie bereiken via 113 of 0800-0113.";

export const BUDDY_SCOPE_REPLY =
  "Daar kan ik je niet goed mee helpen. Balans Buddy is er alleen om kort mee te denken over hoe je je voelt, je gezondheid, je check-in, slaap, focus, stemming, voeding of een kleine praktische stap.\n\nWil je vertellen wat dit met je doet, of hoe je je nu voelt?";

export const BUDDY_UNCLEAR_REPLY =
  "Ik begrijp niet helemaal wat je bedoelt. Wil je het opnieuw in gewone woorden zeggen?";

export const BUDDY_GREETING_REPLY =
  "Hey, hoe gaat het vandaag met je?";

export const BUDDY_CAPABILITY_REPLY =
  "Ik kan kort met je meedenken over hoe je je voelt, je slaap, focus, stemming, voeding of een kleine volgende stap. Waar wil je nu even bij stilstaan?";

export const BUDDY_THANKS_REPLY =
  "Graag gedaan. Wat wil je nu vooral vasthouden uit dit gesprek?";

type BuddyEntry = CheckIn & {
  focus?: string;
  mood?: string;
};

type BuddyHistoryMessage = {
  role: "buddy" | "user";
  text: string;
};

type BuddyConversationTopic = "body" | "pain" | "stress" | "mood" | "sleep" | "focus" | "food" | "";

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

export function detectGreetingMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(hoi|hallo|hey|heey|hi|hai|hello|yo|goedemorgen|goedemiddag|goedenavond)( buddy| balans buddy)?$/.test(text);
}

export function detectThanksMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(dankje|dank je|thanks|bedankt|thx|super bedankt|merci)( hoor)?$/.test(text);
}

export function detectCapabilityQuestion(message: string) {
  const text = normalizeMessage(message);
  return /wat kan je|wat kun je|waarmee kan je|waarmee kun je|help mij|kan je me helpen|kun je me helpen/.test(text);
}

export function detectBotFeelingQuestion(message: string) {
  const text = normalizeMessage(message);
  return /hoe gaat het met jou|hoe voel jij|hoe voel je je|alles goed met jou/.test(text);
}

export function detectUncertaintyMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(weet ik niet|ik weet het niet|geen idee|geen flauw idee|lastig|moeilijk te zeggen|ik weet niet)$/.test(text);
}

export function detectYesMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(ja|jazeker|yes|yep|klopt|ok|oke|is goed|prima)$/.test(text);
}

export function detectNoMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(nee|nope|niet echt|liever niet|nu niet)$/.test(text);
}

export function detectClarificationQuestion(message: string) {
  const text = normalizeMessage(message);
  return /wat bedoel je|hoe bedoel je|ik snap het niet|leg uit/.test(text);
}

export function detectPositiveWellbeingMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(goed|gaat goed|het gaat goed|prima|lekker|best goed|super|top|oke goed|wel goed)$/.test(text);
}

export function detectMixedWellbeingMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(gaat wel|het gaat wel|mwah|redelijk|niet slecht|kan beter|beetje wisselend|wisselend|matig|oke|ok)$/.test(text);
}

export function detectNegativeWellbeingMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(slecht|niet goed|het gaat niet goed|niet zo goed|rot|kut|waardeloos|down|somber|verdrietig|boos|bang|onrustig|gestrest)$/.test(text);
}

export function detectTiredMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(moe|heel moe|kapot|uitgeput|geen energie|weinig energie|ik ben moe|ik ben kapot|ik ben uitgeput)$/.test(text);
}

export function detectLifeDomainMessage(message: string) {
  const text = normalizeMessage(message).replace(/[!.?]+$/g, "");
  return /^(werk|school|studie|thuis|relatie|familie|vrienden|mijn werk|mijn studie|mijn relatie|mijn familie)$/.test(text);
}

function createPositiveWellbeingReply(text: string) {
  return "Fijn om te horen. Wat maakt dat het vandaag goed voelt?\n\nKleine stap: kies één ding dat je vandaag wilt vasthouden.";
}

function createMixedWellbeingReply(text: string) {
  return "Dat klinkt alsof het niet helemaal slecht is, maar ook niet vanzelf gaat. Wat maakt het vandaag vooral 'gaat wel'?\n\nKleine stap: maak één ding vandaag iets lichter voor jezelf.";
}

function createNegativeWellbeingReply(text: string) {
  if (/boos/.test(text)) {
    return "Dat klinkt alsof er spanning zit. Waar ben je vooral boos over?\n\nKleine stap: reageer niet meteen; schrijf eerst in één zin op wat je eigenlijk nodig hebt.";
  }

  if (/bang|onrustig|gestrest/.test(text)) {
    return "Dat klinkt onrustig. Wat vraagt nu de meeste ruimte in je hoofd?\n\nKleine stap: kies één ding dat je nu kunt vertragen of parkeren.";
  }

  return "Dat klinkt niet fijn. Wat drukt vandaag het meest op je: je hoofd, je lichaam of iets dat moet?\n\nKleine stap: kies één kleine handeling die nu haalbaar is.";
}

function createTiredReply(entry: BuddyEntry) {
  if (entry.sleepHours > 0 && entry.sleepHours < 6) {
    return "Dat past bij je korte slaap. Vandaag hoeft niet op volle kracht. Wat moet echt, en wat mag wachten?\n\nKleine stap: kies de lichtste versie van je belangrijkste taak.";
  }

  return "Moe zijn kan alles zwaarder maken. Denk je dat het vooral door slaap, drukte of spanning komt?\n\nKleine stap: maak je planning vandaag kleiner dan normaal.";
}

function createLifeDomainReply(text: string) {
  if (/werk|school|studie/.test(text)) {
    return "Dat kan veel druk geven. Gaat het vooral om te veel taken, mensen, deadlines of starten?\n\nKleine stap: kies één ding dat vandaag echt prioriteit heeft.";
  }

  if (/relatie|familie|vrienden|thuis/.test(text)) {
    return "Dat kan veel met je doen. Heb je nu vooral behoefte aan rust, duidelijkheid of steun?\n\nKleine stap: maak één kleine grens of vraag concreet om één ding.";
  }

  return "Vertel eens, wat maakt dat dit vandaag zo aanwezig is?\n\nKleine stap: benoem één ding dat je hierin nodig hebt.";
}

function createRelationshipStressReply(text: string) {
  if (/werk|collega|baas|manager/.test(text)) {
    return "Gedoe met mensen op werk kan veel energie kosten. Wat raakt je hierin het meest: de toon, de druk of onduidelijkheid?\n\nKleine stap: wacht even met reageren en schrijf op wat je concreet wilt zeggen.";
  }

  if (/vriendin|vriend|partner|relatie/.test(text)) {
    return "Dat kan dichtbij komen. Wat heb je nu vooral nodig: rust, duidelijkheid of even steun?\n\nKleine stap: formuleer één zin zonder verwijt, bijvoorbeeld wat jij merkt of nodig hebt.";
  }

  return "Dat klinkt alsof iemand of iets thuis/familie veel ruimte inneemt. Wat maakt het op dit moment het zwaarst?\n\nKleine stap: kies eerst rust voordat je iets probeert op te lossen.";
}

function createRuminationReply(text: string) {
  if (/nacht|slapen|wakker/.test(text)) {
    return "Piekeren kan je hoofd juist wakker houden. Wat blijft steeds terugkomen?\n\nKleine stap: schrijf het kort op en spreek met jezelf af wanneer je er morgen naar kijkt.";
  }

  return "Dat klinkt alsof je hoofd blijft herhalen. Wat is de gedachte die het vaakst terugkomt?\n\nKleine stap: zet die gedachte letterlijk op papier en kies daarna één kleine actie of pauze.";
}

function createOverstimulatedReply(text: string) {
  return "Overprikkeling kan maken dat alles te veel voelt. Wat is nu de grootste prikkel: geluid, mensen, taken of schermen?\n\nKleine stap: haal één prikkel weg voor 10 minuten.";
}

function createLowMotivationReply(text: string) {
  if (/moe|energie|uitgeput|kapot/.test(text)) {
    return "Als je energie laag is, voelt motivatie vaak ook laag. Wat is de kleinste versie die nog telt?\n\nKleine stap: doe alleen de eerste twee minuten en stop daarna bewust als dat nodig is.";
  }

  return "Geen motivatie betekent niet dat je faalt; soms is de start gewoon te groot. Waar loop je op vast?\n\nKleine stap: maak de taak zo klein dat beginnen bijna makkelijk wordt.";
}

function createAngerReply(text: string) {
  return "Boosheid zegt vaak dat er iets belangrijk voor je is. Wat werd er geraakt: je grens, je tijd, of je gevoel van respect?\n\nKleine stap: reageer pas nadat je één rustige zin hebt opgeschreven.";
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

export function generateBuddyReply(message: string, todayEntry: CheckIn, history: BuddyHistoryMessage[] = []) {
  if (detectCrisisMessage(message)) {
    return BUDDY_CRISIS_REPLY;
  }

  const entry = todayEntry as BuddyEntry;
  const text = normalizeMessage(message);
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

  if (detectUncertaintyMessage(message)) {
    return "Dat is oké. Je hoeft het niet meteen scherp te hebben. Als je één woord moest kiezen voor nu, welk woord past dan het best?";
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
    return createTiredReply(entry);
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
    return createContextualHealthReply(previousConversationTopic, text, entry);
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
    return createAdviceReply(entry);
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

  if (hasLowFocus(entry)) {
    return "Ik neem je check-in even mee: focus leek vandaag lastig. Speelt dat nu ook mee?\n\nKleine stap: kies alleen de eerste handeling, niet de hele taak.";
  }

  if (entry.sleepHours > 0 && entry.sleepHours < 6) {
    return "Ik neem je check-in even mee: met weinig slaap kan alles sneller zwaar voelen. Wat mag vandaag iets minder perfect?\n\nKleine stap: kies iets kleins dat ook moe haalbaar is.";
  }

  if (entry.stress >= 7) {
    return "Dat klinkt alsof je hoofd vol zit. Wat legt vandaag de meeste druk op je?\n\nKleine stap: kies een ding dat echt moet en laat een ander ding bewust wachten.";
  }

  if (hasLowMood(entry)) {
    return "Ik neem je check-in even mee: je stemming leek lager. Wat zou vandaag een klein beetje zachter maken?\n\nKleine stap: doe iets eenvoudigs dat geen prestatie hoeft te zijn.";
  }

  if (entry.nutrition === "slecht") {
    return "Ik neem je check-in even mee: voeding gaf vandaag weinig steun. Wat zou nu haalbaar zijn?\n\nKleine stap: kies iets simpels met water erbij, zonder er een perfecte maaltijd van te maken.";
  }

  if (entry.note) {
    return "Je notitie laat zien dat er iets speelt. Wat voelt op dit moment het meest aanwezig?\n\nKleine stap: benoem een ding dat je kunt doen en een ding dat even mag wachten.";
  }

  return "Dank je dat je dit opschrijft. Wat wil je vooral beter begrijpen aan dit gevoel?\n\nKleine stap: kies een rustige volgende handeling voor de komende 10 minuten.";
}

function getLastBuddyMessage(history: BuddyHistoryMessage[]) {
  return [...history].reverse().find((message) => message.role === "buddy")?.text ?? "";
}

function getRecentConversationText(history: BuddyHistoryMessage[]) {
  return history
    .slice(-6)
    .map((message) => message.text)
    .join(" ");
}

function inferConversationTopic(text: string, history: BuddyHistoryMessage[]): BuddyConversationTopic {
  const currentTopic = inferCurrentConversationTopic(text);

  if (currentTopic) return currentTopic;

  const recent = normalizeMessage(getRecentConversationText(history));
  return inferCurrentConversationTopic(recent);
}

function inferCurrentConversationTopic(text: string): BuddyConversationTopic {
  if (mentionsPhysicalSymptom(text)) return "body";
  if (mentionsPhysicalPain(text)) return "pain";
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

function isContextualHealthFollowUp(text: string) {
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

  const words = text.match(/[a-z0-9]+/g) ?? [];
  return words.length > 0 && words.length <= 14;
}

function createContextualHealthReply(topic: BuddyConversationTopic, text: string, entry: BuddyEntry) {
  if (topic === "body") return createBodyFollowUpReply(text);
  if (topic === "pain") return createPainFollowUpReply(text);
  if (topic === "stress") return createStressFollowUpReply(text);
  if (topic === "mood") return createMoodFollowUpReply(text);
  if (topic === "sleep") return createSleepFollowUpReply(text, entry);
  if (topic === "focus") return createFocusFollowUpReply(text);
  if (topic === "food") return createFoodFollowUpReply(text);

  return "Ik blijf even bij wat je net vertelde. Wat merk je nu het meest, en wat zou één kleine volgende stap kunnen zijn?";
}

function createPhysicalSymptomReply(text: string) {
  return createBodyFollowUpReply(text);
}

function createBodyFollowUpReply(text: string) {
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

function createPainFollowUpReply(text: string) {
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

function createStressFollowUpReply(text: string) {
  if (/werk|school|studie|deadline|drukte|taken|moet/.test(text)) {
    return "Dat klinkt alsof er veel tegelijk aan je trekt. Wat is het ene ding dat vandaag echt voorrang heeft?\n\nKleine stap: schrijf de rest op een parkeer-lijst voor later.";
  }

  if (/thuis|relatie|familie|ruzie|vriend|vriendin|partner/.test(text)) {
    return "Dat kan veel ruimte innemen in je hoofd. Wat heb je nu vooral nodig: rust, duidelijkheid of steun?\n\nKleine stap: stel één grens of vraag één concreet ding.";
  }

  return "Ik blijf even bij de druk. Waar voel je die het meest: in je hoofd, lichaam of agenda?\n\nKleine stap: kies één taak die mag wachten tot later.";
}

function createMoodFollowUpReply(text: string) {
  if (/alleen|eenzaam/.test(text)) {
    return "Eenzaamheid kan zwaar voelen. Is er één persoon bij wie je laagdrempelig iets kunt laten weten?\n\nKleine stap: stuur alleen een kort bericht, zonder alles te hoeven uitleggen.";
  }

  if (/schuld|schaam|falen|dom|stom|lui/.test(text)) {
    return "Je klinkt streng voor jezelf. Wat zou een mildere versie van die gedachte zijn?\n\nKleine stap: haal één eis van vandaag af.";
  }

  return "Ik blijf even bij je stemming. Is dit vooral verdriet, spanning, boosheid, leegte of iets anders?\n\nKleine stap: geef het één naam en maak je volgende stap klein.";
}

function createSleepFollowUpReply(text: string, entry: BuddyEntry) {
  if (/wakker|piekeren|gedachte|hoofd/.test(text)) {
    return "Piekeren kan slaap echt breken. Wat blijft er vooral rondgaan in je hoofd?\n\nKleine stap: schrijf het kort op en kies één vast moment morgen om erop terug te komen.";
  }

  if (entry.sleepHours > 0 && entry.sleepHours < 6) {
    return "Met weinig slaap hoeft vandaag niet perfect te zijn. Wat kan je vandaag lichter maken?\n\nKleine stap: plan één rustmoment zonder scherm.";
  }

  return "Ik blijf even bij slaap. Gaat het vooral om inslapen, doorslapen of uitgerust wakker worden?\n\nKleine stap: kies vanavond één rustig anker voor bedtijd.";
}

function createFocusFollowUpReply(text: string) {
  if (/telefoon|melding|afgeleid|social/.test(text)) {
    return "Afleiding maakt starten extra lastig. Wat kun je 10 minuten uit beeld leggen?\n\nKleine stap: leg je telefoon weg en start alleen de eerste handeling.";
  }

  if (/te veel|veel|overzicht|taken/.test(text)) {
    return "Te veel tegelijk maakt focus zwaar. Welke taak is nu het meest belangrijk?\n\nKleine stap: kies één taak en maak de eerste stap kleiner dan je normaal zou doen.";
  }

  return "Ik blijf even bij focus. Is het lastig om te starten, vol te houden, of te kiezen waar je begint?\n\nKleine stap: zet een timer op 10 minuten en stop daarna bewust.";
}

function createFoodFollowUpReply(text: string) {
  if (/geen honger|misselijk|vol/.test(text)) {
    return "Dan hoeft het niet groot of perfect. Wat zou klein en haalbaar zijn?\n\nKleine stap: neem iets simpels en drink wat water.";
  }

  if (/vergeten|druk|geen tijd/.test(text)) {
    return "Dat gebeurt snel op drukke dagen. Wat is de makkelijkste optie die je nu beschikbaar hebt?\n\nKleine stap: kies iets eenvoudigs dat genoeg energie geeft.";
  }

  return "Ik blijf even bij voeding. Gaat het vooral om te weinig eten, onregelmatig eten of weinig energie?\n\nKleine stap: kies één simpele eet- of drinkkeuze voor nu.";
}

function mentionsDuration(text: string) {
  return /sinds|vanaf|al |dagen|week|weken|maand|uur|uren|gisteren|vandaag|langer/.test(text);
}

function mentionsCause(text: string) {
  return /door |na |tijdens|sport|fitness|werk|slapen|gevallen|gestoten|getild|verkeerd|training|beweeg|bewegen|tillen|optillen|optil|draaien|bukken|arm omhoog/.test(text);
}

function mentionsSeverity(text: string) {
  return /[0-9]\s*(\/|op de|van de)?\s*10|licht|mild|erg|heftig|veel pijn|beetje pijn/.test(text);
}

function mentionsPhysicalRedFlag(text: string) {
  return /benauwd|pijn op de borst|borstpijn|tintel|tintelingen|doof|krachtverlies|uitstraalt|uitstraling|verlamming|niet bewegen|plots heel erg|hevige pijn/.test(text);
}

function createYesReply(previousBuddyMessage: string) {
  const previous = normalizeMessage(previousBuddyMessage);

  if (/vertellen|door je hoofd|wat er op dit moment/.test(previous)) {
    return "Neem je tijd. Begin maar met één zin: wat is er nu vooral aan de hand?";
  }

  if (/moeilijk om te beginnen|beginnen nu het moeilijkst/.test(previous)) {
    return "Oké. Wat is de eerste drempel: te veel taken, te weinig energie, of niet weten waar je moet starten?";
  }

  return "Oké. Vertel maar in één of twee zinnen wat er nu het meest speelt.";
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
  return /stress|druk|drukte|overweldig|hoofd vol|te veel|paniek|spanning|gespannen|onrust|onrustig|overprikkeld/.test(text);
}

function mentionsRelationshipStress(text: string) {
  return /ruzie|conflict|gedoe met|irritatie met|relatie|partner|vriendin|vriend|familie|ouders|thuis|collega|baas|manager/.test(text);
}

function mentionsRumination(text: string) {
  return /pieker|piekeren|malen|gedachten blijven|gedachte blijft|gedachtes|hoofd blijft|blijft rondgaan|blijft maar doorgaan|kan niet stoppen met denken|denken stopt niet|denk te veel|overdenken/.test(text);
}

function mentionsOverstimulated(text: string) {
  return /overprikkeld|prikkels|te veel geluid|veel geluid|drukte|alles komt binnen|kan niks hebben|snel geirriteerd|snel geprikkeld/.test(text);
}

function mentionsLowMotivation(text: string) {
  return /geen motivatie|weinig motivatie|geen zin|nergens zin|kom niet vooruit|niet vooruit|uitstellen|uitstelgedrag|lukt niet om te starten|kan niet beginnen/.test(text);
}

function mentionsAnger(text: string) {
  return /boos|kwaad|gefrustreerd|frustratie|irritatie|geirriteerd/.test(text);
}

function mentionsLowMood(text: string) {
  return /somber|verdriet|verdrietig|leeg|huil|down|waardeloos|alleen|eenzaam|rot|slecht|bang|angst|boos|onzeker/.test(text);
}

function mentionsFood(text: string) {
  return /eten|voeding|maaltijd|honger|snack|ontbijt|lunch|avondeten/.test(text);
}

function mentionsSelfCriticism(text: string) {
  return /faal|falen|dom|lui|schuld|schaam|niet goed genoeg|stom/.test(text);
}

function mentionsPhysicalPain(text: string) {
  return /pijn|zeur|stek|stijf|blessure|geblesseerd|last van|doet pijn|gevoelig|verrekking|spierpijn|kramp|zwelling|kloppend|brandend/.test(text);
}

function mentionsPhysicalSymptom(text: string) {
  return /misselijk|duizelig|ziek|koorts|benauwd|hartklopping|flauw|flauwvallen|tintel|tintelingen|doof|krachtverlies|uitstral|kortademig/.test(text);
}

function createPhysicalPainReply(text: string) {
  if (mentionsPhysicalRedFlag(text)) {
    return "Dat klinkt als iets om serieus te nemen. Bij benauwdheid, pijn op de borst, tintelingen, krachtverlies, uitstralende pijn of plots heftige pijn: neem direct contact op met een arts of bel 112 bij direct gevaar.";
  }

  const location = getPainLocation(text);
  const areaText = location ? `in je ${location}` : "in je lichaam";
  const safetyText =
    "Als de pijn heftig is, erger wordt, uitstraalt, of samengaat met benauwdheid, pijn op de borst, tintelingen of krachtverlies: neem contact op met een arts of bel 112 bij direct gevaar.";

  return `Dat klinkt vervelend. Pijn ${areaText} kan je dag behoorlijk beïnvloeden. Is het plots ontstaan, door bewegen/tillen, of speelt het al langer?\n\nKleine stap: ontlast die plek even en vermijd bewegingen die de pijn erger maken. ${safetyText}`;
}

function getPainLocation(text: string) {
  const locations: Array<[string, RegExp]> = [
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

  return locations.find(([, pattern]) => pattern.test(text))?.[0] ?? "";
}

function mentionsFeeling(text: string) {
  return /ik voel|voel me|voel mij|ik ben|ben vandaag|zit niet lekker|gaat niet lekker|onrustig|rusteloos|emotioneel|gespannen/.test(text);
}

function mentionsAdviceRequest(text: string) {
  return /advies|tip|wat moet ik doen|wat kan ik doen|help me|helpen|hoe pak ik|waar begin ik|volgende stap/.test(text);
}

function createAdviceReply(entry: BuddyEntry) {
  if (entry.sleepHours > 0 && entry.sleepHours < 6) {
    return "Mijn rustige advies: maak je dag kleiner dan normaal. Wat is één ding dat echt moet?\n\nKleine stap: kies de lichtste versie van die taak.";
  }

  if (hasLowFocus(entry)) {
    return "Mijn rustige advies: begin niet met alles, maar met de eerste zichtbare handeling. Wat is de kleinste start?\n\nKleine stap: zet 10 minuten aan en stop daarna bewust.";
  }

  if (hasLowMood(entry)) {
    return "Mijn rustige advies: probeer vandaag niet je hele stemming te repareren. Wat zou het één procent zachter maken?\n\nKleine stap: doe iets simpels zonder prestatiedruk.";
  }

  return "Mijn rustige advies: kies één ding dat nu helpt en houd het klein. Wat zou over 10 minuten al een beetje opluchting geven?\n\nKleine stap: schrijf één haalbare actie op en doe alleen die.";
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
    mentionsPhysicalPain(text) ||
    mentionsPhysicalSymptom(text) ||
    mentionsRelationshipStress(text) ||
    mentionsRumination(text) ||
    mentionsOverstimulated(text) ||
    mentionsLowMotivation(text) ||
    mentionsAnger(text) ||
    /voel|gevoel|gezond|gezondheid|lichaam|hoofd|energie|stemming|check-in|balans|rust|adem|beweeg|sport|schouder|nek|rug|buik|borst|arm|hand|been|voet|heup|knie|ziek|misselijk|duizelig|moeilijk|zwaar|advies|stap|helpen|hulp|aan de hand|mis met mij|mis met me/.test(text)
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
