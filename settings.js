/**
 * Settings Module — Discord Webhooks, Pricing, Data Management
 */
(function(){
'use strict';
const $=s=>document.querySelector(s);

// ══════ Pricing Config (persisted) ══════
const DEFAULT_PRICES = {website:15000,domain:800,social:5000,gmb:3000,photo:4000,bundle:20000};
let prices = JSON.parse(localStorage.getItem('leadarch_prices')||'null') || {...DEFAULT_PRICES};

// Load saved prices into inputs
function loadPriceInputs() {
  Object.entries(prices).forEach(([k,v]) => {
    const el = $(`#price-${k}`);
    if (el) el.value = v;
  });
}
// Expose prices globally for outreach templates
window.__leadarchPrices = prices;

$('#btn-save-pricing').addEventListener('click', () => {
  ['website','domain','social','gmb','photo','bundle'].forEach(k => {
    const el = $(`#price-${k}`);
    if (el) prices[k] = parseInt(el.value, 10) || 0;
  });
  localStorage.setItem('leadarch_prices', JSON.stringify(prices));
  window.__leadarchPrices = prices;
  showToast('Pricing saved!', 'success');
});

loadPriceInputs();

// ══════ Excel Team Import ══════
$('#btn-download-template').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') {
    showToast('Excel library not loaded yet.', 'error');
    return;
  }
  const ws_data = [
    ['Name', 'City', 'Industry', 'Stage', 'Notes', 'Tags', 'Score', 'Phone', 'Email', 'Website'],
    ['Example Business', 'Pune, Maharashtra', 'Retail', 'contacted', 'Called them today', 'hot, callback', '85', 'Available', 'Not shared', 'No website']
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, 'LeadArch_Team_Template.xlsx');
  showToast('Template downloaded!', 'success');
});

$('#btn-import-excel').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') {
    showToast('Excel library not loaded yet.', 'error');
    return;
  }
  const fileInput = $('#excel-import-file');
  const file = fileInput.files[0];
  if (!file) {
    showToast('Please select an Excel or CSV file first.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const json = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;
      let updatedCount = 0;
      let pipelineData = JSON.parse(localStorage.getItem('leadarch_pipeline')||'{}');

      if (!window.__leadarchLeads) window.__leadarchLeads = [];

      json.forEach(row => {
        const name = row['Name'];
        const city = row['City'] || 'Unknown';
        if (!name) return;

        const id = name + '|' + city;
        let lead = window.__leadarchLeads.find(l => (l.name+'|'+l.city) === id);

        if (!lead) {
          // Create new lead if it doesn't exist
          lead = {
            name: name,
            city: city,
            industry: row['Industry'] || 'Unknown',
            score: parseInt(row['Score'], 10) || 50,
            scoreCls: 'score-badge--warm',
            scoreLabel: 'Warm Lead',
            gaps: ['Imported Lead'],
            profile: {
              rating: 'N/A', reviewCount: 0,
              hasLocation: true,
              hasPhone: row['Phone'] === 'Available',
              hasEmail: row['Email'] === 'Available',
              hasWebsite: row['Website'] !== 'No website'
            },
            contact: 'Imported',
            activity: 'Imported by team',
            activityTime: 'Just now'
          };
          window.__leadarchLeads.push(lead);
          importedCount++;
        } else {
          updatedCount++;
        }

        // Update pipeline data
        const stage = row['Stage'] ? row['Stage'].toLowerCase() : 'new';
        const tags = row['Tags'] ? row['Tags'].split(',').map(t => t.trim()).filter(Boolean) : [];
        const notes = row['Notes'] || '';

        pipelineData[id] = {
          stage: ['new','contacted','pitched','won','lost'].includes(stage) ? stage : 'new',
          notes: notes,
          tags: tags,
          movedAt: Date.now()
        };
      });

      localStorage.setItem('leadarch_pipeline', JSON.stringify(pipelineData));
      
      // Re-sort leads by score
      window.__leadarchLeads.sort((a,b)=>b.score-a.score);
      
      showToast(`Imported ${importedCount} new leads. Updated ${updatedCount} existing.`, 'success');
      
      // Re-render if on pipeline or analytics
      if (typeof window.__renderPipeline === 'function') window.__renderPipeline();
      if (typeof window.__renderAnalytics === 'function') window.__renderAnalytics();
      
      // Reset file input
      fileInput.value = '';

    } catch (err) {
      console.error(err);
      showToast('Error reading file. Ensure it is a valid Excel/CSV.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
});

// ══════ Google Maps API Key ══════
let googleApiKey = localStorage.getItem('leadarch_google_api_key') || '';
const googleInput = $('#google-api-key');
const googleStatus = $('#google-api-status');

if (googleApiKey) {
  googleInput.value = googleApiKey;
  googleStatus.textContent = '✅ API Key loaded';
  googleStatus.style.color = '#10b981';
  injectGoogleMapsScript(googleApiKey);
}

$('#btn-save-google-api').addEventListener('click', () => {
  const key = googleInput.value.trim();
  if (!key) {
    showToast('Please enter an API Key.', 'error');
    return;
  }
  localStorage.setItem('leadarch_google_api_key', key);
  googleApiKey = key;
  googleStatus.textContent = '✅ API Key saved! Refreshing...';
  googleStatus.style.color = '#10b981';
  showToast('Google API Key saved!', 'success');
  
  // Reload the page to properly initialize the Google Maps SDK
  setTimeout(() => window.location.reload(), 1500);
});

function injectGoogleMapsScript(key) {
  if (document.querySelector('#google-maps-script')) return;
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// ══════ OpenAI API Key ══════
let openaiApiKey = localStorage.getItem('leadarch_openai_api_key') || '';
const openaiInput = $('#openai-api-key');
const openaiStatus = $('#openai-api-status');

if (openaiApiKey) {
  openaiInput.value = openaiApiKey;
  openaiStatus.textContent = '✅ API Key loaded';
  openaiStatus.style.color = '#10b981';
}

$('#btn-save-openai-api').addEventListener('click', () => {
  const key = openaiInput.value.trim();
  if (!key) {
    showToast('Please enter an API Key.', 'error');
    return;
  }
  localStorage.setItem('leadarch_openai_api_key', key);
  openaiApiKey = key;
  openaiStatus.textContent = '✅ API Key saved!';
  openaiStatus.style.color = '#10b981';
  showToast('OpenAI API Key saved!', 'success');
});

// ══════ Data Management ══════
$('#btn-clear-leads').addEventListener('click', () => {
  if (!confirm('Clear all generated leads? This cannot be undone.')) return;
  window.__leadarchLeads = [];
  localStorage.removeItem('leadarch_pipeline');
  showToast('All leads cleared.', 'info');
});

$('#btn-clear-pipeline').addEventListener('click', () => {
  if (!confirm('Reset all pipeline stages to "New"?')) return;
  localStorage.removeItem('leadarch_pipeline');
  showToast('Pipeline reset.', 'info');
});

$('#btn-export-backup').addEventListener('click', () => {
  const backup = {
    leads: window.__leadarchLeads || [],
    pipeline: JSON.parse(localStorage.getItem('leadarch_pipeline')||'{}'),
    prices: prices,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `leadarch_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Backup exported!', 'success');
});

function exportExcel(leadsToExport, filename) {
  if (typeof XLSX === 'undefined') {
    showToast('Excel library not loaded yet.', 'error');
    return;
  }
  if (!leadsToExport || leadsToExport.length === 0) {
    showToast('No leads to export in this category.', 'warning');
    return;
  }

  const pipelineData = JSON.parse(localStorage.getItem('leadarch_pipeline')||'{}');
  
  const ws_data = [
    ['Name', 'City', 'Industry', 'Stage', 'Notes', 'Tags', 'Score', 'Phone', 'Email', 'Website']
  ];

  leadsToExport.forEach(l => {
    const id = l.name + '|' + l.city;
    const pd = pipelineData[id] || {};
    ws_data.push([
      l.name,
      l.city,
      l.industry,
      pd.stage || 'new',
      pd.notes || '',
      (pd.tags || []).join(', '),
      l.score,
      l.profile.hasPhone ? 'Available' : 'Not shared',
      l.profile.hasEmail ? 'Available' : 'Not shared',
      l.profile.hasWebsite ? 'Has website' : 'No website'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, filename);
  showToast(`Exported ${leadsToExport.length} leads!`, 'success');
}

$('#btn-export-sales').addEventListener('click', () => {
  const allLeads = window.__leadarchLeads || [];
  exportExcel(allLeads, `LeadArch_Sales_Distribution_${new Date().toISOString().slice(0,10)}.xlsx`);
});

$('#btn-export-resale').addEventListener('click', () => {
  const allLeads = window.__leadarchLeads || [];
  const pipelineData = JSON.parse(localStorage.getItem('leadarch_pipeline')||'{}');
  
  const sellableLeads = allLeads.filter(l => {
    const id = l.name + '|' + l.city;
    const pd = pipelineData[id] || {};
    return pd.isSellable === true;
  });

  exportExcel(sellableLeads, `LeadArch_Resale_Leads_${new Date().toISOString().slice(0,10)}.xlsx`);
});

function showToast(msg, type) {
  const tc = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3600);
}
})();
