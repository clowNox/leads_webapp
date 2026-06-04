# LeadArch — Figment Property Sourcing Agent

**LeadArch** is an agentic property sourcing and outreach tool built for [Figment](https://www.figment.com.sg/) — Singapore's boutique heritage homes company. It identifies, scores, and generates hyper-personalised outreach to property owners across Singapore's conservation districts.

Built as a zero-dependency, client-side SPA. No backend. No build step. Opens in a browser and runs.

---

## What It Does

- **Property Discovery** — Scans Singapore districts (Central, East, North, North-East, West regions) for heritage-fit properties using Google Places API with a smart simulated fallback
- **Figment Scoring Engine** — Scores each property owner 0–100 based on reachability (phone/email), review signals, rating, vacancy indicators, heritage fit, and online listing status
- **AI Outreach Generation** — Generates hyper-personalised WhatsApp messages and cold emails pitched in Figment's voice — heritage pride, revenue share model, conservation mission
- **CRM Pipeline** — Kanban board to track properties from sourced → contacted → pitched → won
- **Data Export** — CSV and JSON export of all scored properties

---

## Scoring Logic

A property owner scores high when they are:

| Signal | Why It Matters |
|--------|---------------|
| Phone + Email available | Reachable — outreach is possible |
| No website | Likely agent-dependent — open to managed model |
| High review count | Established owner, higher trust |
| Heritage-fit property type | Shophouse, colonial, conservation — Figment's sweet spot |
| Appears under-utilised | Vacancy pressure — open to new arrangements |
| High rating | Property is presentable, easier to onboard |

---

## AI Outreach

Powered by OpenAI `gpt-4o-mini`. Prompts are written in Figment's brand voice:

- **WhatsApp** — Warm, personal, under 80 words, ends with one open question. Signed as Amit from Figment Acquisitions.
- **Email** — Professional cold outreach leading with heritage pride, not money. References Figment's NYT/WSJ/Travel+Leisure coverage. Under 130 words.

---

## Stack

- **Frontend** — HTML5, CSS3, Vanilla JavaScript (zero dependencies)
- **APIs** — Google Places API, OpenAI API
- **State** — localStorage
- **Libraries** — Chart.js, SheetJS

---

## Running Locally

```bash
git clone https://github.com/clowNox/leads_webapp.git
cd leads_webapp
python3 -m http.server 8080
```

Open `http://localhost:8080` in Chrome.

> Do not open `index.html` directly via `file://` — Google Maps API will block it.

---

## Configuration

Go to **Settings** in the sidebar:

1. **Google Places API key** — enables live property search (Maps JavaScript API + Places API must both be enabled in Google Cloud Console)
2. **OpenAI API key** — enables AI outreach generation

Both keys are stored in `localStorage` only. Never committed to the repo.

---

## Project Context

Built as part of a Figment-specific AI tooling stack. Maps directly to Figment's deal sourcing and supply acquisition requirements — identifying heritage property owners at scale and initiating personalised outreach automatically.

Related projects: [DC Agent Framework](https://github.com/clowNox) · [MahabharataOS](https://github.com/clowNox)
