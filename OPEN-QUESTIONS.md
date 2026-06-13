# OPEN-QUESTIONS — gamespark-ai-kids

High-stakes / product decisions that need Elad, logged instead of guessed.

## Decided autonomously (low risk, reversible)
- Added difficulty selector (קל/רגיל/קשה) + in-session level progression (3 levels per game) — pure client logic, no behavior loss.
- "המשחקים שלי" (My Games) gallery via `localStorage` — saves the kid's created games and replays them. No backend, no PII (only genre/character/world/idea choices).
- Share-a-creation via URL hash (`#play=<base64 of selection>`) — opening such a link auto-launches that exact game. No server.
- Progress stats (games created / games won / stars) in localStorage, shown in a small "ההישגים שלי" strip.
- Particle burst + screen-flash juice on pickup/win/lose (transform/opacity only, respects reduced-motion).

## Needs Elad's call (logged, NOT acted on)
1. **Dedicated domain?** Currently `gamespark-ai-kids.vercel.app`. Worth a real domain (e.g. gamespark.co.il)? — affects GEO canonical/JSON-LD URLs.
2. **Real AI generation?** Today the "AI" is a deterministic choices→config generator (free, no paid keys — per CLAUDE.md free-first rule). Do we ever want a paid LLM to turn the free-text idea into bespoke level layouts? Cost + safety-for-kids review needed first.
3. **Persistence across devices?** localStorage is per-browser. A real "my games that follow me" needs an account/backend — out of scope for the free, no-login, privacy-first promise. Confirm we want to keep it local-only.
4. **Sharing safety:** share links encode only the kid's abstract choices (no names/free-text beyond the idea string). If we ever surface shared games publicly, need a moderation pass on the idea text. Currently share is private link-only (no public listing) — safe.
5. **Sound on by default for kids?** Currently audio starts on first interaction (browser autoplay policy) and is on. Some parents/classrooms prefer muted-by-default. Leaving ON for now.
