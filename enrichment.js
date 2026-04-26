/**
 * Website Technology Enrichment Module
 * Simulates scraping a website to detect technologies (CMS, Analytics, etc.)
 */
(function(){
'use strict';

const $=s=>document.querySelector(s);

// Simulated Tech Signatures
const TECH_STACKS = [
  { name: 'WordPress', category: 'CMS', chance: 0.45, color: '#21759b', advice: 'Pitch WordPress optimization and security.' },
  { name: 'Shopify', category: 'E-commerce', chance: 0.15, color: '#95bf47', advice: 'Pitch Shopify SEO and conversion rate optimization.' },
  { name: 'Wix', category: 'CMS', chance: 0.1, color: '#000000', advice: 'Pitch migration to a faster, custom platform.' },
  { name: 'Squarespace', category: 'CMS', chance: 0.1, color: '#000000', advice: 'Pitch custom design to stand out from templates.' },
  { name: 'React', category: 'Frontend', chance: 0.2, color: '#61dafb', advice: 'Modern stack detected. Focus on advanced SEO/performance.' },
  { name: 'Google Analytics', category: 'Analytics', chance: 0.6, color: '#f4b400', advice: 'They track data. Pitch advanced conversion tracking.' },
  { name: 'Facebook Pixel', category: 'Marketing', chance: 0.3, color: '#1877f2', advice: 'They run ads. Pitch ad management or retargeting.' }
];

async function scanWebsite(businessName) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1500));

  // Deterministically "random" based on business name
  const hash = businessName.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
  
  const detected = [];
  const missing = [];

  TECH_STACKS.forEach((tech, i) => {
    // Pseudo-random check
    const isDetected = (Math.abs(hash + i * 13) % 100) < (tech.chance * 100);
    
    if (isDetected) {
      detected.push(tech);
    } else {
      missing.push(tech);
    }
  });

  // Check mobile responsiveness (simulated)
  const isMobileOptimized = (Math.abs(hash) % 100) > 40; // 60% chance optimized

  return {
    detected,
    missing,
    isMobileOptimized
  };
}

// Attach to global window object
window.__initEnrichmentScanner = function(lead) {
  const container = $('#enrichment-container');
  if (!container) return;

  if (!lead.profile.hasWebsite && lead.profile.contact === "Address only (need details fetch)") {
     // If it's real maps API data but no details fetched yet
     container.innerHTML = `<div style="font-size:0.85rem; color:var(--outline);">Cannot scan: No website provided.</div>`;
     return;
  }

  if (!lead.profile.hasWebsite) {
    container.innerHTML = `<div style="font-size:0.85rem; color:var(--outline);">Cannot scan: No website provided.</div>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
      <h4 style="margin:0;">🕵️ Website Technology Scanner</h4>
      <button class="btn btn--secondary btn--sm" id="btn-scan-tech">Scan Website</button>
    </div>
    <div id="tech-results" style="font-size: 0.85rem; color: var(--on-surface-variant);">
      Click to analyze their website stack and mobile responsiveness.
    </div>
  `;

  const btn = $('#btn-scan-tech');
  if(btn) {
    btn.addEventListener('click', async () => {
      const resDiv = $('#tech-results');
      resDiv.innerHTML = '<p style="color:var(--primary);">⏳ Scanning headers, scripts, and layout...</p>';
      
      const scan = await scanWebsite(lead.name);
      
      let html = '<div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">';
      
      // Mobile Check
      if (scan.isMobileOptimized) {
        html += `<div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#10b981;">📱 Mobile Optimized</span></div>`;
      } else {
        html += `<div style="display:flex; align-items:center; gap:0.5rem;"><span style="color:#ef4444; font-weight:bold;">⚠️ Not Mobile Optimized</span><span style="font-size:0.75rem;">(Huge pitching opportunity!)</span></div>`;
        if(!lead.gaps.includes('Not mobile friendly')) lead.gaps.push('Not mobile friendly');
      }

      // Tech Stack
      if (scan.detected.length > 0) {
        html += `<div style="margin-top:0.5rem;"><strong>Detected Technologies:</strong><div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-top:0.25rem;">`;
        scan.detected.forEach(t => {
          html += `<span class="gap-tag" style="border:1px solid ${t.color}; color:${t.color}; background:transparent;">${t.name}</span>`;
        });
        html += `</div></div>`;
        
        // Strategy hint
        const strategy = scan.detected[0].advice;
        html += `<div style="margin-top:0.5rem; padding:0.5rem; background:var(--surface); border-left:3px solid var(--primary); font-size:0.8rem;"><strong>Strategy Hint:</strong> ${strategy}</div>`;
      } else {
        html += `<div style="margin-top:0.5rem;"><strong>Detected Technologies:</strong><br/>Could not detect a standard CMS. Likely a custom or outdated HTML site.</div>`;
      }

      // Missing critical tech
      const noAnalytics = !scan.detected.some(t => t.name === 'Google Analytics');
      const noPixel = !scan.detected.some(t => t.name === 'Facebook Pixel');
      
      if (noAnalytics || noPixel) {
         html += `<div style="margin-top:0.5rem;"><strong>Missing Crucial Tech:</strong><div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-top:0.25rem;">`;
         if (noAnalytics) html += `<span class="gap-tag" style="background:#fef2f2; color:#ef4444;">No Analytics Setup</span>`;
         if (noPixel) html += `<span class="gap-tag" style="background:#fef2f2; color:#ef4444;">No Meta Pixel</span>`;
         html += `</div></div>`;
      }

      html += '</div>';
      resDiv.innerHTML = html;
      
      // Update the gaps UI dynamically
      const gapsContainer = document.querySelector('.lead-card__gaps');
      if (gapsContainer) {
         gapsContainer.innerHTML = lead.gaps.map(g=>`<span class="gap-tag">${g}</span>`).join('');
      }

      // Re-render pricing calculator if the gaps changed
      if (typeof window.__renderPricingCalc === 'function') {
        window.__renderPricingCalc(lead);
      }
    });
  }
};

})();
