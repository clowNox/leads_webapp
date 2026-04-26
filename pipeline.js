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
function openLeadDetail(lead, id) {
  currentDetailLead = { lead, id };
  const pd = pipelineData[id] || { stage: 'new', notes: '', tags: [] };
  const p = lead.profile;

  window.__selectedDomain = null; // Reset on open

  $('#lead-detail-name').textContent = lead.name;
  $('#lead-detail-body').innerHTML = `
    <div class="lead-detail-grid">
      <div class="profile-row"><span class="profile-label">Industry</span><span class="profile-value">${lead.industry}</span></div>
      <div class="profile-row"><span class="profile-label">Location</span><span class="profile-value">${lead.city}</span></div>
      <div class="profile-row"><span class="profile-label">Score</span><span class="score-badge ${lead.scoreCls}">${lead.score}/100 ${lead.scoreLabel}</span></div>
      <div class="profile-row"><span class="profile-label">Stage</span>
        <select class="form-input" id="detail-stage" style="max-width:160px;padding:.35rem .5rem;font-size:.8rem;">
          ${STAGES.map(s => `<option value="${s}" ${pd.stage===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="profile-row"><span class="profile-label">Follow-up</span>
        <input type="date" class="form-input" id="detail-followup" value="${pd.followUpDate || ''}" style="max-width:160px;padding:.35rem .5rem;font-size:.8rem;" />
      </div>
      <div class="profile-row"><span class="profile-label">Rating</span><span class="profile-value">${p.rating} ★ (${p.reviewCount} reviews)</span></div>
      <div class="profile-row"><span class="profile-label">Phone</span><span class="profile-value ${p.hasPhone?'pv--yes':'pv--no'}">${p.hasPhone?'Available':'Not shared'}</span></div>
      <div class="profile-row"><span class="profile-label">Email</span><span class="profile-value ${p.hasEmail?'pv--yes':'pv--no'}">${p.hasEmail?'Available':'Not shared'}</span></div>
      <div class="profile-row"><span class="profile-label">Website</span><span class="profile-value ${!p.hasWebsite?'pv--no':'pv--yes'}">${p.hasWebsite?'Has website':'No website'}</span></div>
    </div>
    <div class="lead-card__gaps" style="margin-bottom:1rem;">${lead.gaps.map(g=>`<span class="gap-tag">${g}</span>`).join('')}</div>

    <div id="enrichment-container" style="margin-bottom:1rem; padding: 1rem; background: var(--surface-container-low); border-radius: var(--radius-md);"></div>

    <div id="domain-checker-container" style="margin-bottom:1rem; padding: 1rem; background: var(--surface-container-low); border-radius: var(--radius-md);"></div>

    <div class="lead-detail-section">
      <h4>💰 Pricing Calculator — Revenue Potential</h4>
      <div id="pricing-calc-container">${buildPricingCalc(lead)}</div>
    </div>

    <div class="lead-detail-section">
      <h4>📝 Notes</h4>
      <textarea class="lead-detail-notes" id="detail-notes" placeholder="Add notes about this lead...">${pd.notes||''}</textarea>
    </div>
    <div class="lead-detail-section" style="display:flex; justify-content:space-between; align-items:center;">
      <div style="flex:1; margin-right: 1rem;">
        <h4>🏷️ Tags</h4>
        <input class="lead-detail-tags-input" id="detail-tags" placeholder="Comma-separated: hot, callback, needs-logo" value="${(pd.tags||[]).join(', ')}" />
      </div>
      <div>
        <h4>💼 Lead Resale</h4>
        <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; cursor:pointer;">
          <input type="checkbox" id="detail-sellable" ${pd.isSellable ? 'checked' : ''} style="width:16px;height:16px;accent-color:#f59e0b;" />
          Mark as Sellable
        </label>
      </div>
    </div>`;

  const overlay = $('#lead-detail-overlay');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  if (typeof window.__initDomainChecker === 'function') {
    window.__initDomainChecker(lead);
  }
  
  if (typeof window.__initEnrichmentScanner === 'function') {
    window.__initEnrichmentScanner(lead);
  }
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

// ── WhatsApp Pitch (with dynamic pricing) ──
$('#lead-detail-whatsapp').addEventListener('click', async () => {
  if (!currentDetailLead) return;
  const { lead } = currentDetailLead;
  
  const btn = $('#lead-detail-whatsapp');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generating...';
  btn.disabled = true;

  try {
    let msg = '';
    if (window.__generateAIPitch && window.__getOpenAIApiKey && window.__getOpenAIApiKey()) {
      showToast('Generating AI Pitch...', 'info');
      const aiResponse = await window.__generateAIPitch(lead, 'whatsapp');
      if (aiResponse) {
        msg = encodeURIComponent(aiResponse);
      }
    }
    
    if (!msg) {
      const p = getPrices();
      const gapList = lead.gaps.join(', ');
      const domainText = window.__selectedDomain 
        ? `🔗 Domain: ${window.__selectedDomain.name} — ₹${window.__selectedDomain.price.toLocaleString('en-IN')}/year\n`
        : `🔗 Domain Registration — ₹${p.domain.toLocaleString('en-IN')}/year\n`;
      
      let currentBundle = p.bundle;
      if (window.__selectedDomain) currentBundle += (window.__selectedDomain.price - p.domain);

      msg = encodeURIComponent(
        `Hi! I noticed your business "${lead.name}" in ${lead.city} (${lead.industry}) on Google Maps.\n\n` +
        `I'd love to help you grow your online presence. I noticed you currently have: ${gapList}.\n\n` +
        `We offer affordable packages:\n` +
        `🌐 Professional Website — ₹${p.website.toLocaleString('en-IN')}\n` +
        domainText +
        `📱 Social Media Setup — ₹${p.social.toLocaleString('en-IN')}\n` +
        `📊 Google Business Optimization — ₹${p.gmb.toLocaleString('en-IN')}\n` +
        `📦 Complete Digital Bundle — ₹${currentBundle.toLocaleString('en-IN')} (best value!)\n\n` +
        `Would you like to discuss how we can help? Looking forward to hearing from you!`
      );
    }
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ── Email Pitch (with dynamic pricing) ──
$('#lead-detail-email').addEventListener('click', async () => {
  if (!currentDetailLead) return;
  const { lead } = currentDetailLead;
  
  const btn = $('#lead-detail-email');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generating...';
  btn.disabled = true;

  try {
    let subject = encodeURIComponent(`Grow ${lead.name}'s Online Presence — Special Offer`);
    let body = '';

    if (window.__generateAIPitch && window.__getOpenAIApiKey && window.__getOpenAIApiKey()) {
      showToast('Generating AI Pitch...', 'info');
      const aiResponse = await window.__generateAIPitch(lead, 'email');
      if (aiResponse) {
        const lines = aiResponse.split('\n');
        if (lines[0].toLowerCase().startsWith('subject:')) {
          subject = encodeURIComponent(lines[0].replace(/subject:\s*/i, '').trim());
          body = encodeURIComponent(lines.slice(1).join('\n').trim());
        } else {
          body = encodeURIComponent(aiResponse);
        }
      }
    }
    
    if (!body) {
      const p = getPrices();
      const domainText = window.__selectedDomain 
        ? `• Custom Domain (${window.__selectedDomain.name}) — ₹${window.__selectedDomain.price.toLocaleString('en-IN')}/year\n`
        : `• Custom Domain Registration — ₹${p.domain.toLocaleString('en-IN')}/year\n`;

      let currentBundle = p.bundle;
      if (window.__selectedDomain) currentBundle += (window.__selectedDomain.price - p.domain);

      body = encodeURIComponent(
        `Dear ${lead.name} Team,\n\n` +
        `I came across your business on Google Maps and noticed some opportunities to strengthen your digital presence:\n\n` +
        `Current gaps: ${lead.gaps.join(', ')}\n\n` +
        `We specialize in helping local businesses like yours get found online. Here are our affordable packages:\n\n` +
        `• Professional Website Design — ₹${p.website.toLocaleString('en-IN')}\n` +
        domainText +
        `• Social Media Setup & Management — ₹${p.social.toLocaleString('en-IN')}\n` +
        `• Google Business Profile Optimization — ₹${p.gmb.toLocaleString('en-IN')}\n` +
        `• Complete Digital Bundle — ₹${currentBundle.toLocaleString('en-IN')} (save more!)\n\n` +
        `Your business has ${lead.profile.reviewCount} reviews and a ${lead.profile.rating} rating — great foundation to build on!\n\n` +
        `Would you be open to a quick 10-minute call this week?\n\n` +
        `Best regards`
      );
    }
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
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
