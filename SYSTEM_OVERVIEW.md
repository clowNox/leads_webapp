# LeadArch — Precision Architect

**LeadArch** is a premium, client-side web application designed for generating, scoring, and managing local business leads. It identifies digital gaps (like missing websites or inactive social media) and provides automated tools to pitch digital marketing services to those businesses.

## 🏗 System Architecture
The application is currently built as a **Single Page Application (SPA)** using pure HTML, CSS, and Vanilla JavaScript. It relies heavily on `localStorage` for state management, meaning all data is kept securely on the user's local machine without needing a backend server.

### File Structure & Responsibilities
- **`index.html`**: The structural shell of the app. It houses the sidebar navigation, top bar, and all hidden "page" sections (Dashboard, Generator, Pipeline, etc.).
- **`styles.css`**: The design system. It uses a modern "Soft Editorialism" aesthetic with CSS variables for dynamic theming, smooth transitions, and responsive grid layouts.
- **`app.js`**: The core controller. Manages page routing, the cascading location dropdowns (India → State → Area), global UI elements (toasts, modals), and the primary Lead Generation logic (interfacing with Google Maps API).
- **`locations.js`**: A static data dictionary containing states and cities for localized lead generation.
- **`pipeline.js`**: The CRM engine. Manages the drag-and-drop Kanban board, the Lead Detail Modal, and the daily Task/Follow-up widget.
- **`settings.js`**: The configuration hub. Handles persisting the user's pricing model, external API keys (Google & OpenAI), and team data imports (Excel parsing).
- **`ai.js`**: The intelligence module. Connects to the OpenAI API (ChatGPT) to dynamically write hyper-personalized cold emails and WhatsApp messages based on a lead's specific digital gaps.
- **`analytics.js`**: The visualization engine. Uses Chart.js to render actionable insights about the pipeline (win rates, industry breakdowns, score distributions).
- **`sheets.js`**: The export engine. Handles Google OAuth to push generated leads directly into Google Sheets.
- **`enrichment.js` & `domain.js`**: Auxiliary modules for checking domain availability and performing deeper analysis on a lead's digital presence.

---

## ✨ Core Features & Modules

### 1. Lead Generation (Google Maps Integration)
- **Live Search**: Users select an industry and geographic area. The app queries the real Google Places API to find businesses in that area.
- **Fallback Engine**: If the Google API key isn't provided or fails, the app uses a smart simulation engine to generate realistic local business data to keep the workflow moving.

### 2. Algorithmic Lead Scoring
- Leads are evaluated automatically based on their digital footprint:
  - Do they have a website?
  - Are they missing a custom domain?
  - Do they have active social media?
  - How many Google reviews do they have?
- Leads receive a score (0-100) and are categorized (Hot 🔥, Warm ⭐, Cool, Cold).

### 3. CRM Pipeline (Kanban)
- **Drag & Drop**: Leads are moved through stages (`New` → `Contacted` → `Pitched` → `Won` → `Lost`).
- **Lead Enrichment Modal**: Clicking a lead reveals a detailed breakdown of their digital gaps.
- **Pricing Calculator**: Automatically calculates a custom service bundle based on the specific gaps the business has.

### 4. AI-Powered Outreach
- **ChatGPT Integration**: Using an OpenAI API key, the app generates fully customized sales pitches on the fly. 
- It reads the business's gaps (e.g., "No website, but 45 great reviews") and crafts a contextual WhatsApp or Email message referencing the pricing configured in the settings.

### 5. Data Management
- **Excel Import/Export**: Users can export "Sellable" leads for external agencies or import leads updated by team members via Excel/CSV (using SheetJS).
- **Google Sheets Push**: Allows for 1-click exporting to a live Google Sheet for cloud backup and team sharing.

---

## 🚀 Current State & Future Potential

**What is completed:**
The frontend dashboard is completely fully functional. It operates as a highly responsive, standalone local tool. The AI integration, CRM logic, and UI are polished and working.

**Potential Future Expansions:**
1. **Cloud Database Migration**: Moving from `localStorage` to Firebase/Supabase to allow multi-device sync and team collaboration.
2. **Deep Web Scraping**: Implementing a backend service (Node.js/Python) to crawl websites and extract hidden contact info (emails/social links) that Google Maps misses.
3. **Automated Drip Campaigns**: Integrating an email API (like Resend) to automate follow-up sequences directly from the pipeline.
