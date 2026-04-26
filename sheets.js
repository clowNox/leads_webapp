/**
 * Google Sheets Integration Module for LeadArch
 * Handles OAuth2 sign-in and Sheets API export
 */
(function () {
  'use strict';

  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
  const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

  let tokenClient = null;
  let gapiInited = false;
  let gisInited = false;
  let accessToken = null;

  const $ = s => document.querySelector(s);

  // DOM elements
  const clientIdInput = $('#gsheet-client-id');
  const btnSaveClientId = $('#btn-save-client-id');
  const btnSignIn = $('#btn-google-signin');
  const btnPush = $('#btn-push-sheets');
  const btnShowGuide = $('#btn-show-setup-guide');
  const btnCloseGuide = $('#btn-close-guide');
  const setupGuide = $('#setup-guide');
  const step1 = $('#sheets-step-1');
  const step2 = $('#sheets-step-2');
  const step3 = $('#sheets-step-3');
  const statusDot = $('.sheets-status__dot');
  const statusText = $('#sheets-status-text');
  const userInfo = $('#google-user-info');
  const sheetsResult = $('#sheets-result');

  // ── Load saved Client ID ──
  const savedClientId = localStorage.getItem('leadarch_gsheet_client_id');
  if (savedClientId) {
    clientIdInput.value = savedClientId;
    unlockStep2();
    initGapi(savedClientId);
  }

  // ── Guide toggle ──
  btnShowGuide.addEventListener('click', () => setupGuide.classList.remove('hidden'));
  btnCloseGuide.addEventListener('click', () => setupGuide.classList.add('hidden'));
  setupGuide.addEventListener('click', e => { if (e.target === setupGuide) setupGuide.classList.add('hidden'); });

  // ── Step 1: Save Client ID ──
  btnSaveClientId.addEventListener('click', () => {
    const clientId = clientIdInput.value.trim();
    if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
      showToast('Please enter a valid OAuth Client ID ending in .apps.googleusercontent.com', 'error');
      return;
    }
    localStorage.setItem('leadarch_gsheet_client_id', clientId);
    showToast('Client ID saved!', 'success');
    step1.classList.add('sheets-step--done');
    unlockStep2();
    initGapi(clientId);
  });

  function unlockStep2() {
    step2.classList.remove('sheets-step--locked');
    btnSignIn.disabled = false;
  }

  // ── Initialize Google APIs ──
  function initGapi(clientId) {
    // Load GAPI client
    if (typeof gapi !== 'undefined') {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
          gapiInited = true;
          maybeEnableButtons();
        } catch (e) {
          console.error('GAPI init error:', e);
        }
      });
    } else {
      // Retry after script loads
      setTimeout(() => initGapi(clientId), 1000);
      return;
    }

    // Initialize GIS token client
    if (typeof google !== 'undefined' && google.accounts) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: handleTokenResponse
      });
      gisInited = true;
      maybeEnableButtons();
    } else {
      setTimeout(() => initGapi(clientId), 1000);
    }
  }

  function maybeEnableButtons() {
    if (gapiInited && gisInited) {
      btnSignIn.disabled = false;
    }
  }

  // ── Step 2: Sign In ──
  btnSignIn.addEventListener('click', () => {
    if (!tokenClient) {
      showToast('Google API not initialized. Check your Client ID.', 'error');
      return;
    }
    if (accessToken) {
      // Already signed in, revoke
      google.accounts.oauth2.revoke(accessToken, () => {
        accessToken = null;
        gapi.client.setToken(null);
        updateConnectionStatus(false);
        step3.classList.add('sheets-step--locked');
        btnPush.disabled = true;
        btnSignIn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 009 18z" fill="#34A853"/><path d="M3.96 10.71A5.41 5.41 0 013.68 9c0-.59.1-1.16.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg> Sign in with Google`;
        userInfo.textContent = '';
        showToast('Signed out from Google.', 'info');
      });
    } else {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });

  function handleTokenResponse(resp) {
    if (resp.error) {
      console.error('Token error:', resp);
      showToast('Google sign-in failed. Try again.', 'error');
      return;
    }
    accessToken = resp.access_token;
    updateConnectionStatus(true);
    step2.classList.add('sheets-step--done');
    step3.classList.remove('sheets-step--locked');
    btnPush.disabled = false;
    btnSignIn.textContent = '✓ Connected — Click to Sign Out';
    userInfo.textContent = 'Signed in successfully. You can now export leads.';
    showToast('Connected to Google!', 'success');
  }

  function updateConnectionStatus(connected) {
    statusDot.className = 'sheets-status__dot ' + (connected ? 'sheets-status__dot--connected' : 'sheets-status__dot--disconnected');
    statusText.textContent = connected ? 'Connected' : 'Not connected';
  }

  // ── Step 3: Push to Google Sheets ──
  btnPush.addEventListener('click', async () => {
    if (!accessToken) {
      showToast('Please sign in with Google first.', 'error');
      return;
    }

    // Get leads from the main app
    const allLeads = window.__leadarchLeads || [];
    if (!allLeads.length) {
      showToast('No leads to export. Generate leads first!', 'error');
      return;
    }

    const sheetName = $('#gsheet-name').value.trim() || 'LeadArch Export';
    sheetsResult.innerHTML = '⏳ Creating spreadsheet...';
    btnPush.disabled = true;

    try {
      // Create spreadsheet
      const createResp = await gapi.client.sheets.spreadsheets.create({
        properties: { title: sheetName },
        sheets: [{ properties: { title: 'Leads' } }]
      });

      const spreadsheetId = createResp.result.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      // Build data rows
      const headers = ['Business Name', 'Industry', 'Location', 'Score', 'Score Label', 'Rating', 'Reviews', 'Photos', 'Phone', 'Email', 'Website', 'Domain', 'Social Media', 'Digital Gaps', 'Contact Info'];
      const rows = allLeads.map(l => [
        l.name,
        l.industry,
        l.city || '',
        l.score,
        l.scoreLabel || '',
        l.profile ? l.profile.rating : '',
        l.profile ? l.profile.reviewCount : '',
        l.profile ? l.profile.photoCount : '',
        l.profile ? (l.profile.hasPhone ? 'Yes' : 'No') : '',
        l.profile ? (l.profile.hasEmail ? 'Yes' : 'No') : '',
        l.profile ? (l.profile.hasWebsite ? 'Yes' : 'No') : '',
        l.profile ? (l.profile.hasDomain ? 'Yes' : 'No') : '',
        l.profile ? (!l.profile.hasSocialMedia ? 'None' : (l.profile.socialMediaActive ? 'Active' : 'Inactive')) : '',
        l.gaps ? l.gaps.join(', ') : '',
        l.contact || ''
      ]);

      // Write to sheet
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Leads!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });

      // Format header row (bold + color)
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.06, green: 0.62, blue: 0.35 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: headers.length }
              }
            }
          ]
        }
      });

      sheetsResult.innerHTML = `✅ <strong>${allLeads.length} leads exported!</strong> <a href="${spreadsheetUrl}" target="_blank" rel="noopener">Open in Google Sheets →</a>`;
      showToast(`${allLeads.length} leads pushed to Google Sheets!`, 'success');

    } catch (err) {
      console.error('Sheets API error:', err);
      sheetsResult.innerHTML = '❌ Export failed. Check console for details.';
      showToast('Export failed: ' + (err.result?.error?.message || err.message || 'Unknown error'), 'error');
    } finally {
      btnPush.disabled = false;
    }
  });

  // ── Toast helper (delegate to main app) ──
  function showToast(msg, type) {
    const tc = document.querySelector('#toast-container');
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3600);
  }

})();
