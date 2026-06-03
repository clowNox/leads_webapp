/**
 * AI Module — OpenAI integration for Figment property acquisition outreach
 * Generates hyper-personalised outreach to property owners on behalf of Figment
 */
(function () {
  'use strict';

  window.__getOpenAIApiKey = function () {
    return localStorage.getItem('leadarch_openai_api_key') || '';
  };

  window.__generateAIPitch = async function (lead, type) {
    const apiKey = window.__getOpenAIApiKey();
    if (!apiKey) {
      return null; // Fallback to standard template in pipeline.js
    }

    const gaps = (lead.gaps || []).join(', ') || 'No major gaps identified';
    const propertyType = lead.industry || 'heritage property';
    const location = lead.city || 'Singapore';
    const reviewCount = lead.profile.reviewCount || 0;
    const rating = lead.profile.rating || 0;
    const isHeritageFit = lead.profile.isHeritageFit ? 'yes' : 'no';
    const appearsVacant = lead.profile.appearsVacant ? 'yes' : 'no';

    let prompt = '';

    if (type === 'whatsapp') {
      prompt = `You are a property acquisitions specialist at Figment — a boutique homes company in Singapore that conserves heritage shophouses, colonial bungalows, and pre-war properties and turns them into premium co-living spaces loved by global professionals. Figment has been called the "Picassos of Singapore's Built Heritage" by Travel + Leisure and featured in the NYT and WSJ.

Write a short, warm, human WhatsApp message to the owner of "${lead.name}", a ${propertyType} in ${location}.

Property signals:
- Heritage fit: ${isHeritageFit}
- Appears under-utilised or vacant: ${appearsVacant}
- Reviews: ${reviewCount}, Rating: ${rating} stars
- Signals: ${gaps}

Your goal is to open a genuine conversation — not to make a hard sell. Figment respects heritage, takes care of properties, and shares revenue with owners. Lead with curiosity and respect for the property.

Rules:
- Under 80 words
- Warm and personal, not corporate
- End with one open question
- No placeholders like [Name] or [Your Name]
- Write as if you are Amit from Figment's acquisitions team`;

    } else if (type === 'email') {
      prompt = `You are a property acquisitions specialist at Figment — a profitable, bootstrapped boutique homes company in Singapore conserving heritage shophouses, colonial bungalows, and pre-war properties. Figment has hosted 4,000+ members from companies like BCG, Grab, and Citi. Featured in NYT, WSJ, Travel + Leisure, and Channel NewsAsia.

Write a concise, professional cold email to the owner of "${lead.name}", a ${propertyType} in ${location}.

Property signals:
- Heritage fit: ${isHeritageFit}
- Appears under-utilised or vacant: ${appearsVacant}
- Reviews: ${reviewCount}, Rating: ${rating} stars
- Signals: ${gaps}

What Figment offers owners:
- Conservation and interior design at Figment's cost
- Revenue sharing model — owner earns without managing the property
- Access to a curated, professional membership community
- Preservation of the property's heritage character

Your goal: pitch a partnership conversation — listing, conservation management, or co-living conversion. Lead with pride in the property's heritage, not money. Be direct but respectful.

Rules:
- Under 130 words total
- No placeholders
- Return format exactly as: "Subject: ...\n\nBody..."
- Sign off as: Amit | Acquisitions, Figment`;
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.72
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('OpenAI Error:', errData);
        throw new Error('OpenAI API request failed: ' + (errData.error && errData.error.message ? errData.error.message : 'Unknown error'));
      }

      const data = await res.json();
      return data.choices[0].message.content.trim();

    } catch (err) {
      console.error('AI Generation Error:', err);
      return null;
    }
  };

})();
