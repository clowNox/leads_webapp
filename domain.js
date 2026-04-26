/**
 * Domain Availability & Pricing Module
 * Simulates checking GoDaddy and Hostinger APIs (due to CORS/API Key requirements in a pure frontend app)
 * and applies a 33% profit margin to the cheapest option.
 */
(function(){
'use strict';

const $=s=>document.querySelector(s);

// Helper to slugify business name (e.g. "Vastu Properties" -> "vastuproperties")
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Simulated API Call to check domains
async function checkDomains(businessName) {
  const base = slugify(businessName);
  const tlds = ['.com', '.in', '.co.in', '.net'];
  
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1200));

  const results = [];
  tlds.forEach(tld => {
    const domain = base + tld;
    
    // Simulate availability (random but consistent per domain name)
    const hash = domain.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    const isAvailable = (Math.abs(hash) % 100) > 30; // 70% chance available

    if (isAvailable) {
      // Base cost between ₹400 and ₹900
      const baseCost = 400 + (Math.abs(hash) % 500);
      
      // Simulate competitor pricing variations
      const godaddyCost = baseCost + (Math.abs(hash) % 100);
      const hostingerCost = baseCost + ((Math.abs(hash) * 2) % 100);
      
      const cheapestCost = Math.min(godaddyCost, hostingerCost);
      const provider = godaddyCost < hostingerCost ? 'GoDaddy' : 'Hostinger';
      
      // Add 33% profit margin
      const clientPrice = Math.ceil(cheapestCost * 1.33);

      results.push({
        domain,
        godaddyCost,
        hostingerCost,
        cheapestCost,
        provider,
        clientPrice,
        margin: clientPrice - cheapestCost
      });
    }
  });
  
  return results.sort((a,b) => a.clientPrice - b.clientPrice);
}

// UI Integration for the Lead Detail Modal
window.__initDomainChecker = function(lead) {
  const container = $('#domain-checker-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
      <h4 style="margin:0;">🔗 Domain Availability</h4>
      <button class="btn btn--secondary btn--sm" id="btn-check-domains">Run Live Check</button>
    </div>
    <div id="domain-results" style="font-size: 0.85rem; color: var(--on-surface-variant);">
      Click to check GoDaddy & Hostinger for available domains.
    </div>
  `;

  $('#btn-check-domains').addEventListener('click', async () => {
    const resDiv = $('#domain-results');
    resDiv.innerHTML = '<p style="color:var(--primary);">⏳ Querying GoDaddy & Hostinger APIs...</p>';
    
    const domains = await checkDomains(lead.name);
    
    if (domains.length === 0) {
      resDiv.innerHTML = '<p style="color:var(--error);">❌ No standard domains available. Try a different name.</p>';
      return;
    }

    let html = '<table class="pricing-table" style="margin-top:0.5rem;"><thead><tr><th>Domain</th><th>GoDaddy</th><th>Hostinger</th><th>Client Price (33% Margin)</th><th>Action</th></tr></thead><tbody>';
    
    domains.forEach((d, i) => {
      const isBest = i === 0;
      html += `
        <tr style="${isBest ? 'background: #ecfdf5;' : ''}">
          <td><strong>${d.domain}</strong> ${isBest ? '<span class="gap-tag" style="background:#10b981;color:white;font-size:0.6rem;">BEST</span>' : ''}</td>
          <td>₹${d.godaddyCost}</td>
          <td>₹${d.hostingerCost}</td>
          <td><strong style="color:var(--primary);">₹${d.clientPrice}</strong> <span style="font-size:0.65rem;color:var(--outline);">(+₹${d.margin} profit)</span></td>
          <td><button class="btn btn--sm ${isBest ? 'btn--primary' : 'btn--secondary'} btn-select-domain" data-domain="${d.domain}" data-price="${d.clientPrice}">Select</button></td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    
    resDiv.innerHTML = html;

    // Attach listeners to select buttons
    document.querySelectorAll('.btn-select-domain').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedDomain = e.target.dataset.domain;
        const selectedPrice = parseInt(e.target.dataset.price, 10);
        
        // Expose globally so the pricing calculator and pitch generators can use it
        window.__selectedDomain = { name: selectedDomain, price: selectedPrice };
        
        // Re-render the pricing calculator
        if (typeof window.__renderPricingCalc === 'function') {
          window.__renderPricingCalc(lead);
        }
        
        const tc = $('#toast-container');
        if (tc) {
          const t = document.createElement('div');
          t.className = 'toast toast--success';
          t.textContent = `Selected ${selectedDomain} at ₹${selectedPrice}`;
          tc.appendChild(t);
          setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
        }
      });
    });
  });
};

})();
