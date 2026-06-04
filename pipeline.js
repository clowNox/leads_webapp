/**
 * Pipeline CRM Module — Kanban board with drag-and-drop,
 * lead detail modal, notes/tags, WhatsApp/Email outreach,
 * pricing calculator, Discord notifications
 */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const STAGES=['new','contacted','pitched','won','lost'];
const STAGE_COLORS={new:'#6366f1',contacted:'#f59e0b',pitched:'#3b82f6',won:'#10b981',lost:'#ef4444'};

// Pipeline state — persisted in localStorage
let pipelineData = JSON.parse(localStorage.getItem('leadarch_pipeline')||'{}');
let currentDetailLead = null;

// ── Assign leads to pipeline ──
function ensureLeadInPipeline(lead) {
  const id = lead.name + '|' + lead.city;
  if (!pipelineData[id]) {
    pipelineData[id] = { stage: 'new', notes: '', tags: [], isSellable: false, followUpDate: '', movedAt: Date.now() };
  }
  return id;
}

function savePipeline() {
  localStorage.setItem('leadarch_pipeline', JSON.stringify(pipelineData));
}

function getPrices() {
  return window.__leadarchPrices || {website:15000,domain:800,social:5000,gmb:3000,photo:4000,bundle:20000};
}

// ── Find lead object by id ──
function findLeadById(id) {
  return (window.__leadarchLeads||[]).find(l => (l.name+'|'+l.city) === id);
}

// ── Render Kanban Board ──
window.__renderPipeline = function() {
  const allLeads = window.__leadarchLeads || [];
  if (!allLeads.length) {
    STAGES.forEach(s => {
      const container = $(`#stage-${s}`);
      if (container) container.innerHTML = '<p style="text-align:center;color:var(--outline);font-size:.78rem;padding:1rem;">Generate leads first</p>';
      const count = $(`#count-${s}`);
      if (count) count.textContent = '0';
    });
    return;
  }

  allLeads.forEach(l => ensureLeadInPipeline(l));
  savePipeline();

  const grouped = {};
  STAGES.forEach(s => grouped[s] = []);
  allLeads.forEach(l => {
    const id = l.name + '|' + l.city;
    const stage = pipelineData[id]?.stage || 'new';
    grouped[stage].push(l);
  });

  STAGES.forEach(stage => {
    const container = $(`#stage-${stage}`);
    const count = $(`#count-${stage}`);
    if (!container) return;
    container.innerHTML = '';
    count.textContent = grouped[stage].length;

    grouped[stage].forEach((lead, i) => {
      const id = lead.name + '|' + lead.city;
      const pd = pipelineData[id];
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.dataset.leadId = id;
      card.style.animationDelay = `${i * .05}s`;

      const tagsHtml = (pd.tags||[]).map(t => `<span class="kanban-tag kanban-tag--custom">${t}</span>`).join('');
      card.innerHTML = `
        <div class="kanban-card__name">${lead.name}</div>
        <div class="kanban-card__meta">${lead.industry} • ${lead.city}</div>
        <div class="kanban-card__bottom">
          <span class="score-badge score-badge--sm ${lead.scoreCls}">${lead.score}</span>
          <div class="kanban-card__tags">${tagsHtml}</div>
        </div>
        ${pd.notes ? '<div class="kanban-card__meta" style="margin-top:.3rem;font-style:italic;">📝 '+pd.notes.slice(0,40)+(pd.notes.length>40?'...':'')+'</div>' : ''}`;

      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => openLeadDetail(lead, id));
      container.appendChild(card);
    });

    // Drop zone
    container.addEventListener('dragover', e => { e.preventDefault(); container.classList.add('drag-over'); });
    container.addEventListener('dragleave', () => container.classList.remove('drag-over'));
    container.addEventListener('drop', e => {
      e.preventDefault();
      container.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      if (pipelineData[draggedId]) {
        const oldStage = pipelineData[draggedId].stage;
        if (oldStage !== stage) {
          pipelineData[draggedId].stage = stage;
          pipelineData[draggedId].movedAt = Date.now();
          savePipeline();
          showToast(`${draggedId.split('|')[0]} moved to ${stage.toUpperCase()}`, 'success');
        }
        window.__renderPipeline();
      }
    });
  });

  renderPipelineStats(grouped);
};

function renderPipelineStats(grouped) {
  const stats = $('#pipeline-stats');
  if (!stats) return;
  const total = Object.values(grouped).reduce((a, b) => a + b.length, 0);
  const wonRate = total ? Math.round((grouped.won.length / total) * 100) : 0;
  stats.innerHTML = `
    <div class="pipeline-stat"><span style="color:#6366f1">●</span> ${grouped.new.length} New</div>
    <div class="pipeline-stat"><span style="color:#f59e0b">●</span> ${grouped.contacted.length} Contacted</div>
    <div class="pipeline-stat"><span style="color:#3b82f6">●</span> ${grouped.pitched.length} Pitched</div>
    <div class="pipeline-stat"><span style="color:#10b981">●</span> ${grouped.won.length} Won</div>
    <div class="pipeline-stat"><span style="color:#ef4444">●</span> ${grouped.lost.length} Lost</div>
    <div class="pipeline-stat" style="background:var(--tertiary-container);color:var(--on-tertiary-fixed);">Win Rate: ${wonRate}%</div>`;
}

// ── Build Pricing Calculator ──
function buildPricingCalc(lead) {
  const p = getPrices();
  const gaps = lead.gaps || [];
  const services = [];

  if (gaps.some(g => g.toLowerCase().includes('website'))) services.push({ name: '🌐 Website Design', price: p.website });
  
  if (window.__selectedDomain) {
    services.push({ name: `🔗 Domain: ${window.__selectedDomain.name}`, price: window.__selectedDomain.price });
  } else if (gaps.some(g => g.toLowerCase().includes('domain'))) {
    services.push({ name: '🔗 Domain Registration', price: p.domain });
  }
  
  if (gaps.some(g => g.toLowerCase().includes('social'))) services.push({ name: '📱 Social Media Setup', price: p.social });
  if (gaps.some(g => g.toLowerCase().includes('photo') || g.toLowerCase().includes('few'))) services.push({ name: '📸 Professional Photos', price: p.photo });
  if (!lead.profile.hasLocation) services.push({ name: '📊 GMB Optimization', price: p.gmb });

  const total = services.reduce((s, sv) => s + sv.price, 0);
  
  // Update bundle price to include the difference if a custom domain is selected
  let currentBundle = p.bundle;
  if (window.__selectedDomain) {
    currentBundle += (window.__selectedDomain.price - p.domain);
  }
  const bundleSaving = total > currentBundle ? total - currentBundle : 0;

  let html = '<div class="pricing-calc">';
  html += '<table class="pricing-table"><thead><tr><th>Service</th><th>Price</th></tr></thead><tbody>';
  services.forEach(s => {
    html += `<tr><td>${s.name}</td><td>₹${s.price.toLocaleString('en-IN')}</td></tr>`;
  });
  html += `</tbody><tfoot>`;
  html += `<tr class="pricing-total"><td><strong>Individual Total</strong></td><td><strong>₹${total.toLocaleString('en-IN')}</strong></td></tr>`;
  if (bundleSaving > 0) {
    html += `<tr class="pricing-bundle"><td>📦 Complete Bundle <span class="gap-tag" style="font-size:.65rem;">SAVE ₹${bundleSaving.toLocaleString('en-IN')}</span></td><td><strong style="color:#10b981;">₹${currentBundle.toLocaleString('en-IN')}</strong></td></tr>`;
  }
  html += '</tfoot></table></div>';
  return services.length ? html : '<p style="font-size:.82rem;color:var(--outline);">No service recommendations — this lead has minimal digital gaps.</p>';
}

window.__renderPricingCalc = function(lead) {
  const container = $('#pricing-calc-container');
  if (container) container.innerHTML = buildPricingCalc(lead);
};

// ── Lead Detail Modal ──
window.__openLeadDetail = function openLeadDetail(lead, id) {
  currentDetailLead = { lead, id };
  const pd = pipelineData[id] || { stage: 'new', notes: '', tags: [], followUpDate: '' };
  const p = lead.profile;

  $('#lead-detail-name').textContent = lead.name;
  $('#lead-detail-body').innerHTML = `
    <div class="lead-detail-grid">
      <div class="profile-row"><span class="profile-label">Property Type</span><span class="profile-value">${lead.industry}</span></div>
      <div class="profile-row"><span class="profile-label">Location</span><span class="profile-value">${lead.city}</span></div>
      <div class="profile-row"><span class="profile-label">Score</span><span class="score-badge ${lead.scoreCls}">${lead.score}/100 ${lead.scoreLabel}</span></div>
      <div class="profile-row"><span class="profile-label">Heritage Fit</span><span class="profile-value ${p.isHeritageFit?'pv--yes':'pv--warn'}">${p.isHeritageFit?'High match ✓':'Partial match'}</span></div>
      <div class="profile-row"><span class="profile-label">Vacancy Signal</span><span class="profile-value ${p.appearsVacant?'pv--warn':'pv--yes'}">${p.appearsVacant?'Under-utilised ⚠':'Active'}</span></div>
      <div class="profile-row"><span class="profile-label">Rating</span><span class="profile-value">${p.rating} ★ (${p.reviewCount} reviews)</span></div>
      <div class="profile-row"><span class="profile-label">Phone</span><span class="profile-value ${p.hasPhone?'pv--yes':'pv--no'}">${p.hasPhone?'Available ✓':'Not found ✗'}</span></div>
      <div class="profile-row"><span class="profile-label">Email</span><span class="profile-value ${p.hasEmail?'pv--yes':'pv--no'}">${p.hasEmail?'Available ✓':'Not found ✗'}</span></div>
      <div class="profile-row"><span class="profile-label">Pipeline Stage</span>
        <select class="form-input" id="detail-stage" style="max-width:160px;padding:.35rem .5rem;font-size:.8rem;">
          ${STAGES.map(s => `<option value="${s}" ${pd.stage===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="profile-row"><span class="profile-label">Follow-up Date</span>
        <input type="date" class="form-input" id="detail-followup" value="${pd.followUpDate || ''}" style="max-width:160px;padding:.35rem .5rem;font-size:.8rem;" />
      </div>
    </div>

    <div class="lead-card__gaps" style="margin-bottom:1rem;">${lead.gaps.map(g=>`<span class="gap-tag">${g}</span>`).join('')}</div>

    <div class="lead-detail-section">
      <h4>🤖 AI Outreach Generator</h4>
      <p style="font-size:0.8rem;color:var(--on-surface-variant);margin-bottom:0.75rem;">Generate a personalised message to this property owner in Figment's voice.</p>
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
        <button class="btn btn--primary" id="lead-detail-whatsapp" style="flex:1;">💬 WhatsApp Pitch</button>
        <button class="btn btn--secondary" id="lead-detail-email" style="flex:1;">📧 Email Pitch</button>
      </div>
      <div id="ai-pitch-output" style="display:none;background:var(--surface-container-low);border-radius:var(--radius-md);padding:1rem;font-size:0.85rem;line-height:1.7;white-space:pre-wrap;"></div>
      <button id="copy-pitch-btn" style="display:none;margin-top:0.5rem;" class="btn btn--tertiary btn--sm">Copy to Clipboard</button>
    </div>

    <div class="lead-detail-section">
      <h4>📝 Notes</h4>
      <textarea class="lead-detail-notes" id="detail-notes" placeholder="Add acquisition notes...">${pd.notes||''}</textarea>
    </div>

    <div class="lead-detail-section">
      <h4>🏷️ Tags</h4>
      <input class="lead-detail-tags-input" id="detail-tags" placeholder="e.g. hot, follow-up, heritage-confirmed" value="${(pd.tags||[]).join(', ')}" />
    </div>`;

  $('#lead-detail-whatsapp').addEventListener('click', async () => {
    const btn = $('#lead-detail-whatsapp');
    const output = $('#ai-pitch-output');
    const copyBtn = $('#copy-pitch-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;
    const aiResponse = await window.__generateAIPitch(lead, 'whatsapp');
    btn.textContent = '💬 WhatsApp Pitch';
    btn.disabled = false;
    output.textContent = aiResponse || `Hi! I came across ${lead.name} and wanted to reach out. We at Figment conserve heritage properties across Singapore and partner with owners on a revenue-share model. Would you be open to a quick chat?`;
    output.style.display = 'block';
    copyBtn.style.display = 'inline-block';
  });

  $('#lead-detail-email').addEventListener('click', async () => {
    const btn = $('#lead-detail-email');
    const output = $('#ai-pitch-output');
    const copyBtn = $('#copy-pitch-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;
    const aiResponse = await window.__generateAIPitch(lead, 'email');
    btn.textContent = '📧 Email Pitch';
    btn.disabled = false;
    output.textContent = aiResponse || `Subject: Partnership opportunity — ${lead.name}\n\nDear Owner,\n\nI'm reaching out from Figment, Singapore's heritage homes company featured in NYT and Travel + Leisure. We'd love to explore a conservation partnership for your property.\n\nBest,\nAmit | Acquisitions, Figment`;
    output.style.display = 'block';
    copyBtn.style.display = 'inline-block';
  });

  $('#copy-pitch-btn').addEventListener('click', () => {
    navigator.clipboard.writeText($('#ai-pitch-output').textContent).then(() => {
      $('#copy-pitch-btn').textContent = 'Copied ✓';
      setTimeout(() => { $('#copy-pitch-btn').textContent = 'Copy to Clipboard'; }, 2000);
    });
  });

  $('#lead-detail-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Close detail modal
$('#lead-detail-close').addEventListener('click', closeDetail);
$('#lead-detail-overlay').addEventListener('click', e => { if (e.target.id === 'lead-detail-overlay') closeDetail(); });

function closeDetail() {
  $('#lead-detail-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  currentDetailLead = null;
}

// Save changes
$('#lead-detail-save').addEventListener('click', () => {
  if (!currentDetailLead) return;
  const { id, lead } = currentDetailLead;
  const oldStage = pipelineData[id].stage;
  const newStage = $('#detail-stage').value;
  pipelineData[id].stage = newStage;
  pipelineData[id].followUpDate = $('#detail-followup').value;
  pipelineData[id].notes = $('#detail-notes').value;
  pipelineData[id].tags = $('#detail-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  pipelineData[id].isSellable = $('#detail-sellable').checked;
  pipelineData[id].movedAt = Date.now();
  savePipeline();

  window.__renderPipeline();
  closeDetail();
  showToast('Lead updated!', 'success');
});


function showToast(msg, type) {
  const tc = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3600);
}

// ── Tasks Widget Renderer ──
window.__renderTasksWidget = function() {
  const widget = $('#tasks-widget');
  const list = $('#tasks-list');
  const countSpan = $('#tasks-count');
  if (!widget || !list || !countSpan) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const allLeads = window.__leadarchLeads || [];
  
  const dueTasks = [];
  allLeads.forEach(lead => {
    const id = lead.name + '|' + lead.city;
    const pd = pipelineData[id];
    if (pd && pd.followUpDate) {
      if (pd.followUpDate <= todayStr) {
        dueTasks.push({ lead, pd });
      }
    }
  });

  if (dueTasks.length === 0) {
    widget.style.display = 'none';
    return;
  }

  widget.style.display = 'block';
  countSpan.textContent = `${dueTasks.length} task${dueTasks.length > 1 ? 's' : ''}`;
  
  list.innerHTML = dueTasks.map(t => {
    const isOverdue = t.pd.followUpDate < todayStr;
    const dateLabel = isOverdue ? `<span style="color:#ef4444; font-weight:600;">Overdue (${t.pd.followUpDate})</span>` : `<span>Today</span>`;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--outline-variant);">
        <div>
          <strong style="display:block; color:var(--on-surface); font-size:0.95rem;">${t.lead.name}</strong>
          <div style="font-size:0.8rem; color:var(--on-surface-variant); margin-top:0.25rem;">
            ${dateLabel} • Stage: <span style="text-transform:capitalize;">${t.pd.stage}</span>
          </div>
        </div>
        <button class="btn btn--secondary btn--sm btn-open-task" data-id="${t.lead.name}|${t.lead.city}">Open</button>
      </div>
    `;
  }).join('');

  // Add listeners
  document.querySelectorAll('.btn-open-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const lead = allLeads.find(l => (l.name + '|' + l.city) === id);
      if (lead) openLeadDetail(lead, id);
    });
  });
};

// Call renderTasksWidget whenever pipeline renders
const originalRenderPipeline = window.__renderPipeline;
window.__renderPipeline = function() {
  if (originalRenderPipeline) originalRenderPipeline();
  window.__renderTasksWidget();
};

})();
