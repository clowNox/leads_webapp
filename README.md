# LeadArch — Precision Architect

**LeadArch** is a premium, client-side web application designed for generating, scoring, and managing local business leads. It identifies digital gaps (like missing websites or inactive social media) and provides automated tools to pitch digital marketing services to those businesses.

## ✨ Features

- **Lead Generation**: Live search using Google Maps API with a smart fallback engine.
- **Algorithmic Lead Scoring**: Automatically scores leads (0-100) based on their digital footprint (missing website, custom domain, social media, reviews).
- **CRM Pipeline**: A drag-and-drop Kanban board to manage leads through sales stages.
- **AI-Powered Outreach**: Integrates with the OpenAI API (ChatGPT) to dynamically write hyper-personalized cold emails and WhatsApp messages based on a lead's specific digital gaps.
- **Data Export**: Export to Excel/CSV or push directly to Google Sheets.

## 🚀 Getting Started

Since LeadArch is built entirely as a Single Page Application using vanilla HTML/JS/CSS, there is no build step or backend required!

1. Clone the repository:
   ```bash
   git clone https://github.com/clowNox/leads_webapp.git
   ```
2. Open `index.html` in your web browser.
3. Configure your API keys (Google Maps & OpenAI) in the Settings panel to unlock full functionality.

## 🏗 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **State Management**: `localStorage`
- **Integrations**: Google Places API, OpenAI API, Chart.js, SheetJS

For a more detailed technical breakdown, please see the [System Overview](SYSTEM_OVERVIEW.md).
