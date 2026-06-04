(function () {
  'use strict';

  const LOCATIONS = window.INDIA_LOCATIONS;

  // ── Levenshtein for fuzzy dedup ──
  function levenshtein(a, b) {
    const m = [];
    for (let i = 0; i <= b.length; i++) {
      m[i] = [i];
      for (let j = 1; j <= a.length; j++)
        m[i][j] = i === 0 ? j : Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1));
    }
    return m[b.length][a.length];
  }

  // ── Property types Figment targets ──
  const INDUSTRIES = [
    'Shophouse', 'Colonial Bungalow', 'Heritage Villa',
    'Boutique Apartment', 'Conservation House', 'Pre-war Terrace',
    'Art Deco Flat', 'Garden Bungalow'
  ];

  const NAMES = {
    'Shophouse': [
      'The Straits Shophouse', 'Emerald Hill Unit', 'Duxton Road Property',
      'Club Street Heritage', 'Ann Siang Shophouse', 'Tanjong Pagar Row',
      'Keong Saik Corner Unit', 'Neil Road Terrace', 'Craig Road Shophouse',
      'Amoy Street Property', 'Telok Ayer Shophouse', 'South Bridge Heritage'
    ],
    'Colonial Bungalow': [
      'Nassim Road Bungalow', 'Cluny Court Estate', 'Whitley Residences',
      'Dalvey Estate Unit', 'Ridley Park Bungalow', 'Gallop Road Property',
      'Malcolm Road House', 'Swiss Club Lane', 'Adam Road Bungalow',
      'Bukit Timah Colonial', 'Rochalie Drive Estate', 'Holland Road Bungalow'
    ],
    'Heritage Villa': [
      'Joo Chiat Villa', 'Katong Heritage House', 'Geylang Serai Property',
      'East Coast Villa', 'Siglap Heritage', 'Mountbatten Road House',
      'Meyer Road Unit', 'Amber Road Property', 'Marine Parade Heritage',
      'Telok Kurau House', 'Koon Seng Road Villa', 'Joo Chiat Terrace'
    ],
    'Boutique Apartment': [
      'Chinatown Heritage Flat', 'Little India Apartment', 'Kampong Glam Unit',
      'Arab Street Property', 'Bali Lane Apartment', 'Haji Lane Corner',
      'Baghdad Street Unit', 'Muscat Street Flat', 'Kandahar Street Property',
      'Sultan Gate Apartment', 'Dickson Road Unit', 'Clive Street Heritage'
    ],
    'Conservation House': [
      'Blair Road House', 'Everton Park Unit', 'Spottiswoode Property',
      'Cantonment Road House', 'Henderson Road Heritage', 'Tanjong Pagar Conservation',
      'Neil Road Unit', 'Tras Street Property', 'Bukit Pasoh Heritage',
      'Peck Seah House', 'Teck Lim Road Unit', 'Keong Saik Conservation'
    ],
    'Pre-war Terrace': [
      'Jalan Besar Terrace', 'Balestier Road House', 'Serangoon Road Property',
      'Race Course Road Unit', 'Kitchener Road Heritage', 'Owen Road Terrace',
      'Hindoo Road House', 'Mayo Street Property', 'Veerasamy Road Unit',
      'Dunlop Street Heritage', 'Rowell Road Terrace', 'Roberts Lane House'
    ],
    'Art Deco Flat': [
      'Tiong Bahru Art Deco', 'Guan Chuan Street', 'Lim Liak Street Unit',
      'Eng Hoon Street', 'Moh Guan Terrace', 'Outram Park Flat',
      'Jalan Bukit Ho Swee', 'Kim Pong Road Unit', 'Boon Tiong Road Property',
      'Eu Chin Street Flat', 'Yong Siak Street Unit', 'Seng Poh Road Flat'
    ],
    'Garden Bungalow': [
      'Frankel Estate House', 'Kew Drive Bungalow', 'Siglap Park Property',
      'Bedok Rise Bungalow', 'Opera Estate House', 'Chai Chee Road Unit',
      'Haig Road Bungalow', 'Mountbatten Estate', 'Lorong K Telok Kurau',
      'Jalan Eunos Property', 'Dunbar Walk Bungalow', 'Margate Road Estate'
    ]
  };

  // ── Scoring: what makes a property owner a hot lead for Figment ──
  function scoreLead(profile) {
    let score = 0, gaps = [];

    // Reachability — can we actually contact them?
    if (profile.hasPhone) { score += 20; } else { gaps.push('No contact number'); }
    if (profile.hasEmail) { score += 15; } else { gaps.push('No email found'); }

    // Review volume — more reviews = established owner, higher trust
    if (profile.reviewCount >= 15) { score += 15; }
    else if (profile.reviewCount >= 6) { score += 8; gaps.push('Few reviews (' + profile.reviewCount + ')'); }
    else { score += 2; gaps.push('Very few reviews (' + profile.reviewCount + ')'); }

    // No website = owner likely agent-dependent = warmer to Figment's managed model
    if (!profile.hasWebsite) { score += 12; gaps.push('No website — likely agent-dependent'); }

    // Rating — well-rated properties easier to pitch and onboard
    if (profile.rating >= 4.5) { score += 12; }
    else if (profile.rating >= 4.0) { score += 8; }
    else if (profile.rating >= 3.5) { score += 4; gaps.push('Average rating — needs positioning help'); }
    else { gaps.push('Low rating — vacancy pressure possible'); }

    // Photos — more photos = owner is engaged, property is presentable
    if (profile.photoCount >= 8) { score += 8; }
    else if (profile.photoCount >= 4) { score += 4; }
    else { gaps.push('Few photos — property visibility low'); }

    // Listed address = property is real and locatable
    if (profile.hasLocation) { score += 5; }
    else { gaps.push('No address listed'); }

    // Heritage-fit bonus — pre-war / conservation / shophouse = Figment's exact sweet spot
    if (profile.isHeritageFit) { score += 8; gaps.push('Heritage-fit — high Figment match'); }

    // Vacancy signal — inactive listing suggests owner is open to new arrangements
    if (profile.appearsVacant) { score += 5; gaps.push('Appears under-utilised — open to offers'); }

    return { score: Math.min(score, 100), gaps };
  }

  function scoreLabel(s) {
    if (s >= 80) return { label: 'Hot Lead 🔥', cls: 'score--hot' };
    if (s >= 60) return { label: 'Warm Lead ⭐', cls: 'score--warm' };
    if (s >= 40) return { label: 'Cool Lead', cls: 'score--cool' };
    return { label: 'Cold Lead', cls: 'score--cold' };
  }

  // ── Fallback simulated data (no API key needed for demo) ──
  function generateLeads(area, state, industry) {
    const loc = area + ', ' + state;
    const count = 7 + Math.floor(Math.random() * 8);
    const leads = [], used = new Set();

    for (let i = 0; i < count; i++) {
      const ind = industry || INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
      const pool = NAMES[ind] || NAMES['Shophouse'];
      let name;
      do { name = pool[Math.floor(Math.random() * pool.length)]; }
      while (used.has(name) && used.size < pool.length);
      used.add(name);

      const profile = {
        businessName: name,
        hasWebsite: Math.random() < 0.25,
        hasDomain: Math.random() < 0.15,
        hasSocialMedia: Math.random() < 0.35,
        socialMediaActive: Math.random() < 0.2,
        hasPhone: Math.random() > 0.2,
        hasEmail: Math.random() > 0.45,
        hasLocation: Math.random() > 0.05,
        reviewCount: Math.floor(Math.random() * 30),
        photoCount: Math.floor(Math.random() * 10),
        rating: Math.round((3 + Math.random() * 2) * 10) / 10,
        isHeritageFit: Math.random() < 0.45,
        appearsVacant: Math.random() < 0.3
      };

      const { score, gaps } = scoreLead(profile);
      const { label, cls } = scoreLabel(score);

      leads.push({
        name, industry: ind, city: loc, profile, score,
        scoreLabel: label, scoreCls: cls, gaps,
        contact: profile.hasPhone ? (profile.hasEmail ? 'Phone & Email' : 'Phone only') : (profile.hasEmail ? 'Email only' : 'No contact'),
        time: ['Just now', '2m ago', '5m ago', '12m ago', '25m ago', '45m ago', '1h ago', '2h ago'][i % 8]
      });
    }

    leads.sort((a, b) => b.score - a.score);
    return leads;
  }

  // ── Real Google Maps API integration ──
  async function fetchRealGoogleLeads(area, state, industry) {
    return new Promise((resolve) => {
      if (!window.google || !google.maps || !google.maps.places) {
        resolve(null);
        return;
      }

      const map = new google.maps.Map(document.createElement('div'));
      const service = new google.maps.places.PlacesService(map);
      const query = industry + ' in ' + area + ', ' + state;

      service.textSearch({ query }, (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          resolve(null);
          return;
        }

        const leads = [];
        results.slice(0, 15).forEach((place, i) => {
          const profile = {
            businessName: place.name,
            hasWebsite: false,
            hasDomain: false,
            hasSocialMedia: false,
            socialMediaActive: false,
            hasPhone: false,
            hasEmail: false,
            hasLocation: !!place.formatted_address,
            reviewCount: place.user_ratings_total || 0,
            photoCount: place.photos ? place.photos.length : 0,
            rating: place.rating || 0,
            isHeritageFit: true, // Real Places results assumed heritage-adjacent
            appearsVacant: false
          };

          const { score, gaps } = scoreLead(profile);
          const { label, cls } = scoreLabel(score);

          leads.push({
            name: place.name,
            industry: industry,
            city: area + ', ' + state,
            profile, score,
            scoreLabel: label, scoreCls: cls, gaps,
            contact: 'Address only (enrichment needed)',
            time: ['Just now', '2m ago', '5m ago', '12m ago'][i % 4]
          });
        });

        leads.sort((a, b) => b.score - a.score);
        resolve(leads);
      });
    });
  }

  // ── DOM refs ──
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  let allLeads = [];
  window.__leadarchLeads = allLeads;

  const sidebar = $('#sidebar'), sidebarToggle = $('#sidebar-toggle');
  const navItems = $$('.nav-item[data-page]'), pages = $$('.page');
  const activityList = $('#activity-list'), resultsTbody = $('#results-tbody');
  const searchResults = $('#search-results'), toastContainer = $('#toast-container');
  const modalOverlay = $('#modal-overlay');
  const scanBar = $('#scan-progress-bar'), scanPct = $('#scan-percent');
  const locCountry = $('#loc-country'), locState = $('#loc-state'), locArea = $('#loc-area');
  const activeAreaText = $('#active-area-text');
  const genProg = $('#gen-progress'), genBar = $('#gen-progress-bar');
  const genTitle = $('#gen-progress-title'), genSub = $('#gen-progress-sub');
  const stepC = $('#step-country'), stepS = $('#step-state'), stepA = $('#step-area');

  // ── Navigation ──
  function switchPage(n) {
    pages.forEach(p => p.classList.add('hidden'));
    navItems.forEach(i => i.classList.remove('nav-item--active'));
    const t = $('#page-' + n), v = $('.nav-item[data-page="' + n + '"]');
    if (t) { t.classList.remove('hidden'); t.style.animation = 'none'; t.offsetHeight; t.style.animation = ''; }
    if (v) v.classList.add('nav-item--active');
    sidebar.classList.remove('sidebar--open');
    if (n === 'pipeline' && typeof window.__renderPipeline === 'function') window.__renderPipeline();
    if (n === 'analytics' && typeof window.__renderAnalytics === 'function') window.__renderAnalytics();
  }

  window.__switchPage = switchPage;
  navItems.forEach(i => i.addEventListener('click', e => { e.preventDefault(); switchPage(i.dataset.page); }));
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--open'));
  document.addEventListener('click', e => {
    if (innerWidth <= 768 && sidebar.classList.contains('sidebar--open') && !sidebar.contains(e.target) && e.target !== sidebarToggle)
      sidebar.classList.remove('sidebar--open');
  });

  // ── Location dropdowns ──
  function fillSel(sel, items, ph) {
    sel.innerHTML = '<option value="">' + ph + '</option>';
    items.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i; sel.appendChild(o); });
    sel.disabled = false;
  }
  function resetSel(sel, ph) { sel.innerHTML = '<option value="">' + ph + '</option>'; sel.disabled = true; }
  function upSteps() {
    const c = locCountry.value, s = locState.value, a = locArea.value;
    stepC.className = 'location-step' + (c ? ' location-step--done' : ' location-step--active');
    stepS.className = 'location-step' + (s ? ' location-step--done' : (c ? ' location-step--active' : ''));
    stepA.className = 'location-step' + (a ? ' location-step--done' : (s ? ' location-step--active' : ''));
  }

  fillSel(locState, Object.keys(LOCATIONS).sort(), 'Select Region');
  locState.disabled = false;
  locCountry.value = 'Singapore';
  activeAreaText.textContent = 'Singapore';
  upSteps();

  locCountry.addEventListener('change', () => {
    if (locCountry.value) fillSel(locState, Object.keys(LOCATIONS).sort(), 'Select Region');
    else resetSel(locState, 'Select region first');
    resetSel(locArea, 'Select district');
    activeAreaText.textContent = locCountry.value || 'No area selected';
    upSteps();
  });

  locState.addEventListener('change', () => {
    const st = locState.value;
    if (st && LOCATIONS[st]) fillSel(locArea, LOCATIONS[st], 'Select District');
    else resetSel(locArea, 'Select district');
    activeAreaText.textContent = st ? st + ', Singapore' : 'Singapore';
    upSteps();
  });

  locArea.addEventListener('change', () => {
    activeAreaText.textContent = locArea.value ? locArea.value + ', ' + locState.value : locState.value + ', Singapore';
    upSteps();
  });

  // ── Search trigger ──
  $('#btn-run-search').addEventListener('click', () => {
    const state = locState.value, area = locArea.value;
    if (!state) { showToast('Please select a state.', 'error'); return; }
    if (!area) { showToast('Please select a city/area.', 'error'); return; }

    const industry = $('#search-industry').value, priority = $('#search-priority').value;
    const fullLoc = area + ', ' + state;

    genProg.classList.remove('hidden');
    genBar.style.width = '0%';
    genTitle.textContent = 'Scanning ' + fullLoc + ' for properties...';
    genSub.textContent = 'Querying property listings';

    let pct = 0;
    const msgs = [
      'Identifying heritage-fit properties...',
      'Checking owner contact availability...',
      'Analysing review and rating signals...',
      'Scoring conversion fit for Figment...',
      'Finalising lead quality...'
    ];
    let mi = 0;
    const iv = setInterval(() => {
      pct += 8 + Math.random() * 12;
      if (pct > 95) pct = 95;
      genBar.style.width = pct + '%';
      if (mi < msgs.length && pct > (mi + 1) * 18) genSub.textContent = msgs[mi++];
    }, 400);

    setTimeout(async () => {
      clearInterval(iv);
      genBar.style.width = '100%';
      genSub.textContent = 'Complete!';

      let results = await fetchRealGoogleLeads(area, state, industry);
      if (!results) {
        console.log('Using simulated property data (no Google API key).');
        results = generateLeads(area, state, industry);
      } else {
        console.log('Using LIVE Google Places API data.');
      }

      if (priority === 'High') results = results.filter(l => l.score >= 70);
      else if (priority === 'Medium') results = results.filter(l => l.score >= 40 && l.score < 70);
      else if (priority === 'Low') results = results.filter(l => l.score < 40);

      let dupeCount = 0;
      results.forEach(r => {
        const isDupe = allLeads.some(l => {
          if (l.city === r.city && l.name === r.name) return true;
          if (l.city === r.city && levenshtein(l.name.toLowerCase(), r.name.toLowerCase()) <= 2) return true;
          return false;
        });
        if (!isDupe) allLeads.push(r); else dupeCount++;
      });

      if (dupeCount) showToast(dupeCount + ' duplicate property(s) filtered out.', 'info');
      allLeads.sort((a, b) => b.score - a.score);
      window.__leadarchLeads = allLeads;

      setTimeout(() => {
        genProg.classList.add('hidden');
        renderSearchResults(results, fullLoc);
        renderResultsTable(allLeads);
        renderActivityList(allLeads.slice(0, 8));
        updateKPIs();
        const st2 = $('.scan-card__title');
        if (st2) st2.textContent = 'Active Scan: ' + fullLoc + (window.google ? ' (LIVE)' : ' (SIM)');
        showToast(results.length + ' properties sourced for ' + fullLoc + '!', 'success');
      }, 500);
    }, 3000);
  });

  // ── Render: Activity list ──
  function renderActivityList(data) {
    activityList.innerHTML = '';
    data.forEach((l, i) => {
      const el = document.createElement('div');
      el.className = 'activity-item';
      el.style.animationDelay = i * 0.07 + 's';
      const { label, cls } = scoreLabel(l.score);
      el.innerHTML =
        '<div class="activity-item__avatar">' + l.name.charAt(0) + '</div>' +
        '<div class="activity-item__info">' +
          '<div class="activity-item__name">' + l.name + '</div>' +
          '<div class="activity-item__meta">' + l.industry + ' \u2022 ' + (l.time || '') + '</div>' +
        '</div>' +
        '<div class="activity-item__location">' +
          '<div class="activity-item__city">' + (l.city || '') + '</div>' +
          '<div class="activity-item__contact">' + l.contact + '</div>' +
        '</div>' +
        '<span class="score-badge ' + cls + '">' + l.score + '/100</span>';
      activityList.appendChild(el);
    });
  }

  // ── Render: Search result cards ──
  function renderSearchResults(results, area) {
    searchResults.innerHTML = '';
    if (!results.length) {
      searchResults.innerHTML = '<p class="search-results__empty">No properties found. Try a different area or property type.</p>';
      return;
    }

    const h = document.createElement('div');
    h.className = 'search-results__header';
    h.innerHTML = '<h3>\uD83D\uDCCD Properties in ' + area + '</h3><span class="search-results__count">' + results.length + ' properties sourced</span>';
    searchResults.appendChild(h);

    results.forEach((l, i) => {
      const el = document.createElement('div');
      el.className = 'lead-card';
      el.style.animationDelay = i * 0.06 + 's';
      const p = l.profile;
      const stars = '★'.repeat(Math.floor(p.rating)) + (p.rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(p.rating));

      el.innerHTML =
        '<div class="lead-card__top">' +
          '<div class="activity-item__avatar">' + l.name.charAt(0) + '</div>' +
          '<div class="lead-card__info">' +
            '<div class="activity-item__name">' + l.name + '</div>' +
            '<div class="activity-item__meta">' + l.industry + ' \u2022 ' + l.city + '</div>' +
          '</div>' +
          '<span class="score-badge ' + l.scoreCls + '" title="' + l.scoreLabel + '">' + l.score + '/100</span>' +
        '</div>' +
        '<div class="lead-card__profile">' +
          '<div class="profile-row"><span class="profile-label">Rating</span><span class="profile-value">' + stars + ' ' + p.rating + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Reviews</span><span class="profile-value">' + p.reviewCount + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Photos</span><span class="profile-value">' + p.photoCount + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Phone</span><span class="profile-value ' + (p.hasPhone ? 'pv--yes' : 'pv--no') + '">' + (p.hasPhone ? 'Available \u2713' : 'Not found \u2717') + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Email</span><span class="profile-value ' + (p.hasEmail ? 'pv--yes' : 'pv--no') + '">' + (p.hasEmail ? 'Available \u2713' : 'Not found \u2717') + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Listed Online</span><span class="profile-value ' + (!p.hasWebsite ? 'pv--no' : 'pv--yes') + '">' + (p.hasWebsite ? 'Has listing' : 'No online listing \u2717') + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Heritage Fit</span><span class="profile-value ' + (p.isHeritageFit ? 'pv--yes' : 'pv--warn') + '">' + (p.isHeritageFit ? 'High match \u2713' : 'Partial match') + '</span></div>' +
          '<div class="profile-row"><span class="profile-label">Vacancy Signal</span><span class="profile-value ' + (p.appearsVacant ? 'pv--warn' : 'pv--yes') + '">' + (p.appearsVacant ? 'Appears under-utilised \u26A0' : 'Active') + '</span></div>' +
        '</div>' +
        '<div class="lead-card__gaps">' + l.gaps.map(g => '<span class="gap-tag">' + g + '</span>').join('') + '</div>';

      searchResults.appendChild(el);
    });
  }

  // ── Render: Results table ──
  function renderResultsTable(data) {
    resultsTbody.innerHTML = '';
    data.forEach(l => {
      const tr = document.createElement('tr');
      const gapTags = l.gaps.slice(0, 3).map(g => '<span class="gap-tag gap-tag--sm">' + g + '</span>').join('');
      tr.innerHTML =
        '<td><strong>' + l.name + '</strong></td>' +
        '<td>' + l.industry + '</td>' +
        '<td>' + (l.city || '') + '</td>' +
        '<td><span class="score-badge score-badge--sm ' + l.scoreCls + '">' + l.score + '</span></td>' +
        '<td>' + gapTags + '</td>' +
        '<td>' + l.contact + '</td>' +
        '<td><button class="btn btn--sm btn--tertiary">View</button></td>';
      resultsTbody.appendChild(tr);
    });
  }

  // ── KPIs ──
  function updateKPIs() {
    const t = allLeads.length;
    const hot = allLeads.filter(l => l.score >= 80).length;
    const warm = allLeads.filter(l => l.score >= 60 && l.score < 80).length;
    const cool = allLeads.filter(l => l.score < 60).length;
    const vals = {
      'kpi-total-leads': t,
      'kpi-high-priority': hot,
      'kpi-exported': warm,
      'kpi-medium-priority': Math.floor(t * 0.74),
      'kpi-low-priority': cool
    };
    Object.entries(vals).forEach(([id, v]) => {
      const el = document.querySelector('#' + id + ' .kpi-card__value');
      if (el) { el.dataset.count = v; el.textContent = v.toLocaleString(); }
    });
  }

  // ── Counter animation ──
  function animateCounters() {
    $$('.kpi-card__value[data-count]').forEach(el => {
      const tgt = parseInt(el.dataset.count, 10), st = performance.now();
      (function f(n) {
        const p = Math.min((n - st) / 1800, 1);
        el.textContent = Math.floor((1 - Math.pow(1 - p, 4)) * tgt).toLocaleString();
        if (p < 1) requestAnimationFrame(f); else el.textContent = tgt.toLocaleString();
      })(st);
    });
  }

  // ── Global search ──
  const si = $('#search-input');
  let sto;
  si.addEventListener('input', () => {
    clearTimeout(sto);
    sto = setTimeout(() => {
      const q = si.value.trim().toLowerCase();
      if (!q) { renderActivityList(allLeads.slice(0, 8)); return; }
      const f = allLeads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q)
      );
      if (f.length) renderActivityList(f);
      else activityList.innerHTML = '<p class="search-results__empty" style="padding:2rem;">No matching properties.</p>';
    }, 250);
  });

  // ── Modal ──
  function openModal() { modalOverlay.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  function closeModal() { modalOverlay.classList.add('hidden'); document.body.style.overflow = ''; }

  $('#btn-new-campaign').addEventListener('click', openModal);
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-cancel').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  $('#modal-submit').addEventListener('click', () => {
    const n = $('#campaign-name').value.trim(), l = $('#campaign-location').value.trim(), ind = $('#campaign-industry').value;
    if (!n || !l || !ind) { showToast('Please fill all fields.', 'error'); return; }
    closeModal();
    showToast('Campaign "' + n + '" launched!', 'success');
    switchPage('search');
    $('#campaign-name').value = '';
    $('#campaign-location').value = '';
    $('#campaign-industry').value = '';
  });

  // ── Export ──
  $$('.export-card .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.textContent.trim();
      if (t.includes('CSV')) { downloadFile(buildCSV(), 'figment-leads.csv', 'text/csv'); showToast('CSV exported!', 'success'); }
      else if (t.includes('JSON')) { downloadFile(JSON.stringify(allLeads, null, 2), 'figment-leads.json', 'application/json'); showToast('JSON exported!', 'success'); }
      else showToast('Google Sheets coming soon!', 'info');
    });
  });

  function buildCSV() {
    const h = ['Property Name', 'Type', 'Location', 'Score', 'Online Listing', 'Heritage Fit', 'Vacancy Signal', 'Phone', 'Email', 'Reviews', 'Rating', 'Signals'];
    return [h, ...allLeads.map(l => [
      l.name, l.industry, l.city, l.score,
      l.profile.hasWebsite ? 'Yes' : 'No',
      l.profile.isHeritageFit ? 'Yes' : 'No',
      l.profile.appearsVacant ? 'Yes' : 'No',
      l.profile.hasPhone ? 'Yes' : 'No',
      l.profile.hasEmail ? 'Yes' : 'No',
      l.profile.reviewCount, l.profile.rating,
      l.gaps.join('; ')
    ])].map(r => r.map(c => '"' + c + '"').join(',')).join('\n');
  }

  function downloadFile(c, n, m) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([c], { type: m }));
    a.download = n;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Toast ──
  function showToast(msg, type) {
    type = type || 'info';
    const t = document.createElement('div');
    t.className = 'toast toast--' + type;
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3600);
  }

  // ── Scan progress sim ──
  let sp = 65;
  setInterval(() => {
    if (sp < 100) {
      sp += Math.random() * 1.2;
      sp = Math.min(sp, 100);
      scanBar.style.width = sp + '%';
      scanPct.textContent = Math.floor(sp) + '%';
      if (sp >= 100) {
        showToast('Property scan complete!', 'success');
        const t = $('.scan-card__title'), d = $('.scan-card__desc');
        if (t) t.textContent = 'Scan Complete';
        if (d) d.textContent = 'Properties added to pipeline.';
      }
    }
  }, 3000);

  // ── Misc ──
  $('#btn-notifications').addEventListener('click', () => {
    showToast('3 hot properties need follow-up!', 'info');
    const d = $('.notification-dot');
    if (d) d.style.display = 'none';
  });
  $('#view-all-leads').addEventListener('click', e => { e.preventDefault(); switchPage('results'); });

  // ── Init ──
  animateCounters();
  upSteps();

})();
