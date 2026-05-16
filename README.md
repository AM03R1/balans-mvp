# Balans MVP

Een mobiele Next.js PWA voor dagelijkse balans check-ins. De MVP gebruikt alleen `localStorage`: geen database, geen login en geen backend.

## Starten

Installeer dependencies:

```bash
npm install
```

Start de lokale dev server:

```bash
npm run dev
```

Open daarna:

```text
http://localhost:3000
```

## Testen op iPhone

1. Zorg dat je computer en iPhone op hetzelfde wifi-netwerk zitten.
2. Start de app met:

```bash
npm run dev -- --hostname 0.0.0.0
```

3. Zoek het lokale IP-adres van je computer op.
4. Open op je iPhone in Safari:

```text
http://JOUW-IP-ADRES:3000
```

5. Tik op delen en kies **Zet op beginscherm**.

## Data

Check-ins worden opgeslagen in `localStorage` onder de sleutel `balans-mvp-checkins`. Iedere check-in heeft een datum. Een nieuwe check-in voor dezelfde datum werkt de bestaande invoer bij.

De data-laag staat los in `src/lib/storage.ts`, zodat Supabase later relatief makkelijk toegevoegd kan worden.

## MVP v2

De app bevat nu ook:

- Balans Score per dag op basis van slaap, stress, energie en voeding
- Discipline Score op basis van consistentie, streak, verbetering en stabiliteit
- Progressiescherm met weekgemiddelden en vergelijking met vorige week
- Een korte coachactie na iedere check-in
