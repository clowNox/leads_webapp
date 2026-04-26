/**
 * AI Module — OpenAI integration for lead enrichment and pitch generation
 */
(function() {
'use strict';

window.__getOpenAIApiKey = function() {
  return localStorage.getItem('leadarch_openai_api_key') || '';
};

window.__generateAIPitch = async function(lead, type) {
  const apiKey = window.__getOpenAIApiKey();
  if (!apiKey) {
    return null; // Fallback to standard template
  }

  const p = window.__leadarchPrices || {website:15000,domain:800,social:5000,gmb:3000,photo:4000,bundle:20000};
  const gaps = (lead.gaps || []).join(', ') || 'No major gaps';
  
  let prompt = '';
  if (type === 'whatsapp') {
    prompt = `You are a friendly, professional digital marketing sales expert.
Write a short, engaging WhatsApp message to the business "${lead.name}" located in ${lead.city} (${lead.industry}).
Their digital presence has the following gaps: ${gaps}.
They have ${lead.profile.reviewCount} reviews with a ${lead.profile.rating} star rating.
Offer to help them grow online. Mention our pricing dynamically based on their gaps (Website: ₹${p.website}, Domain: ₹${p.domain}, Social Media: ₹${p.social}, GMB: ₹${p.gmb}, Complete bundle: ₹${p.bundle}).
Keep it under 100 words, use emojis, and end with a question to get a reply. Don't use placeholders.`;
  } else if (type === 'email') {
    prompt = `You are a digital marketing sales expert.
Write a professional, concise cold email to the team at "${lead.name}" in ${lead.city} (${lead.industry}).
Point out their specific digital gaps in a constructive way: ${gaps}.
They have ${lead.profile.reviewCount} reviews with a ${lead.profile.rating} star rating, mention this as a great foundation.
Pitch our services based on their gaps. Use these prices: Website: ₹${p.website}, Domain: ₹${p.domain}, Social Media: ₹${p.social}, GMB Optimization: ₹${p.gmb}, Complete bundle: ₹${p.bundle}.
Keep it under 150 words. Do not use placeholders, be direct and compelling. Return just the email body and subject line (format: "Subject: ...\n\nBody...").`;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      console.error('OpenAI Error:', errData);
      throw new Error('OpenAI API request failed');
    }
    
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI Generation Error:', err);
    return null;
  }
};

})();
