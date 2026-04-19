# Invisible Creator — Frontend

> **[invisiblecreator.video](https://invisiblecreator.video)** — Launch viral TikTok content in seconds, no face required.

---

## What is Invisible Creator?

Invisible Creator is an AI-powered bulk video generation platform built for faceless TikTok content creators and small businesses.

You give it a topic. It handles everything else:
- Writes the script (AI)
- Generates the voiceover (40+ voices)
- Adds animated subtitles with word-highlight effects
- Renders the final video over a background (Minecraft Smooth / GTA5 gameplay)
- Ready to post — no editing needed

**Free plan:** 15 videos/day, no credit card required.

---

## Screenshots

### Hero — Launch Viral Content in Seconds
![Hero page](Screenshot%20From%202026-04-19%2015-14-12.png)

### Free Video Generator (no account needed)
![Free generator](Screenshot%20From%202026-04-19%2015-14-20.png)

---

## Features

| Feature | Details |
|---------|---------|
| AI Script | Topic → script via Groq LLaMA |
| Voices | 40+ voices (English, Spanish, French, Italian, Portuguese, Chinese, Indian) |
| Subtitle Styles | Classic, Bold Pop, Clean, Neon, Typewriter, Impact |
| Word Effects | Scale pop, Glow, Box, Combo, Color only |
| Backgrounds | Minecraft Smooth, GTA5 gameplay |
| Bulk Generation | Up to 15 videos/day on free plan |
| No face required | 100% faceless content |

---

## Tech Stack

- **React + TypeScript** (Vite)
- **Tailwind CSS**
- **Supabase** (auth + storage)
- **Vercel** (deployment)

---

## Getting Started

```bash
npm install
cp .env.example .env   # fill in Supabase keys
npm run dev
```

---

## Related

- Backend repo: [faceless_backend](https://github.com/vasilealfredbrad/faceless_backend)
- Live platform: [invisiblecreator.video](https://invisiblecreator.video)
