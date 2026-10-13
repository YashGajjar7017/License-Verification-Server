/**
 * VaultKey Chrome Extension Logic
 * Connects directly to VaultKey License & Vault Backend API
 */

const DEFAULT_API_URL = 'http://localhost:5000/api';

// State
let currentTabInfo = { url: '', title: '', domain: '' };
let cachedVaultItems = [];
let generatedSecret = '';

// DOM Elements
const serverDot = document.getElementById('serverDot');
const statusLabel = document.getElementById('statusLabel');
const toastEl = document.getElementById('toast');
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');

// Save tab elements
const siteDomainEl = document.getElementById('siteDomain');
const saveLabel = document.getElementById('saveLabel');
const saveCategory = document.getElementById('saveCategory');
const saveUsername = document.getElementById('saveUsername');
const saveSecret = document.getElementById('saveSecret');
const saveWebsite = document.getElementById('saveWebsite');
const saveTags = document.getElementById('saveTags');
const saveForm = document.getElementById('saveForm');
const btnToggleSecretVis = document.getElementById('btnToggleSecretVis');
const btnQuickGenPass = document.getElementById('btnQuickGenPass');
const btnRefreshSite = document.getElementById('btnRefreshSite');

// Vault tab elements
const vaultSearch = document.getElementById('vaultSearch');
const vaultList = document.getElementById('vaultList');
const btnRefreshVault = document.getElementById('btnRefreshVault');

// Generator tab elements
const genResult = document.getElementById('genResult');
const btnCopyGen = document.getElementById('btnCopyGen');
const genLength = document.getElementById('genLength');
const genLengthVal = document.getElementById('genLengthVal');
const genUpper = document.getElementById('genUpper');
const genLower = document.getElementById('genLower');
const genNumbers = document.getElementById('genNumbers');
const genSymbols = document.getElementById('genSymbols');
const btnRegenPass = document.getElementById('btnRegenPass');
const btnGenLicenseKey = document.getElementById('btnGenLicenseKey');
const btnUseInSave = document.getElementById('btnUseInSave');

// Account tab elements
const authLoggedIn = document.getElementById('authLoggedIn');
const authLoggedOut = document.getElementById('authLoggedOut');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');
const loginBtnText = document.getElementById('loginBtnText');
const btnQuickDemoLogin = document.getElementById('btnQuickDemoLogin');
const serverApiUrl = document.getElementById('serverApiUrl');
const btnSaveServerUrl = document.getElementById('btnSaveServerUrl');
const btnTestServerUrl = document.getElementById('btnTestServerUrl');
const btnLogout = document.getElementById('btnLogout');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const userRoleEl = document.getElementById('userRole');
const userAvatarEl = document.getElementById('userAvatar');
const statLicCount = document.getElementById('statLicCount');
const statVaultCount = document.getElementById('statVaultCount');

// ---------------------------------------------------------------------------
// Helpers: Storage & Toast
// ---------------------------------------------------------------------------

function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  setTimeout(() => {
    toastEl.className = 'toast hidden';
  }, 3000);
}

async function getStoredData() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['token', 'user', 'apiUrl'], (res) => resolve(res || {}));
    } else {
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem('vk_user') || 'null');
      } catch {
        storedUser = null;
      }
      resolve({
        token: localStorage.getItem('vk_token'),
        user: storedUser,
        apiUrl: localStorage.getItem('vk_api_url') || DEFAULT_API_URL,
      });
    }
  });
}

async function setStoredData(data) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, resolve);
    } else {
      if ('token' in data) {
        if (data.token) localStorage.setItem('vk_token', data.token);
        else localStorage.removeItem('vk_token');
      }
      if ('user' in data) {
        if (data.user) localStorage.setItem('vk_user', JSON.stringify(data.user));
        else localStorage.removeItem('vk_user');
      }
      if ('apiUrl' in data) {
        if (data.apiUrl) localStorage.setItem('vk_api_url', data.apiUrl);
        else localStorage.removeItem('vk_api_url');
      }
      resolve();
    }
  });
}

async function clearStoredAuth() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['token', 'user'], resolve);
    } else {
      localStorage.removeItem('vk_token');
      localStorage.removeItem('vk_user');
      resolve();
    }
  });
}

async function getApiUrl() {
  const data = await getStoredData();
  return data.apiUrl || DEFAULT_API_URL;
}

async function getAuthToken() {
  const data = await getStoredData();
  return data.token || null;
}

// ---------------------------------------------------------------------------
// Active Tab Detection
// ---------------------------------------------------------------------------

async function detectActiveTab() {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        let domain = '';
        try {
          const parsed = new URL(tab.url);
          domain = parsed.hostname.replace('www.', '');
        } catch {
          domain = tab.url;
        }

        currentTabInfo = {
          url: tab.url,
          title: tab.title || domain,
          domain: domain || 'New Tab',
        };

        siteDomainEl.textContent = currentTabInfo.domain;
        saveWebsite.value = tab.url.startsWith('http') ? tab.url : '';
        if (!saveLabel.value) {
          saveLabel.value = currentTabInfo.domain !== 'New Tab' ? currentTabInfo.domain : '';
        }
        return;
      }
    }
  } catch (e) {
    console.warn('Tab detection notice:', e);
  }

  siteDomainEl.textContent = 'Active Browser Window';
}

// ---------------------------------------------------------------------------
// Server Health & Auth State
// ---------------------------------------------------------------------------

async function checkServerHealth() {
  const apiUrl = await getApiUrl();
  if (serverApiUrl) serverApiUrl.value = apiUrl;

  try {
    const healthUrl = apiUrl.replace(/\/api\/?$/, '/health');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      serverDot.className = 'status-dot online';
      statusLabel.textContent = 'Online';
      return true;
    }
  } catch (err) {
    // Health check failed or timed out
  }

  serverDot.className = 'status-dot offline';
  statusLabel.textContent = 'Server Offline';
  return false;
}

async function updateAuthView() {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  if (!token) {
    authLoggedIn.classList.add('hidden');
    authLoggedOut.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const user = data.user;
      authLoggedIn.classList.remove('hidden');
      authLoggedOut.classList.add('hidden');

      userNameEl.textContent = user.name || 'User';
      userEmailEl.textContent = user.email || '';
      userRoleEl.textContent = `${(user.role || 'USER').toUpperCase()} • HS512 QUANTUM`;
      userAvatarEl.textContent = (user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U';

      fetchStats(apiUrl, token);
      return;
    } else if (res.status === 401) {
      // Session expired, clean local storage
      await clearStoredAuth();
    }
  } catch (err) {
    console.warn('Auth check error:', err);
  }

  // If token is invalid or request failed
  authLoggedIn.classList.add('hidden');
  authLoggedOut.classList.remove('hidden');
}

async function fetchStats(apiUrl, token) {
  try {
    const [licRes, vaultRes] = await Promise.all([
      fetch(`${apiUrl}/licenses?limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${apiUrl}/vault?limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (licRes.ok) {
      const licData = await licRes.json();
      statLicCount.textContent = licData.pagination?.total || '0';
    }
    if (vaultRes.ok) {
      const vaultData = await vaultRes.json();
      statVaultCount.textContent = vaultData.pagination?.total || '0';
    }
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// ---------------------------------------------------------------------------
// Save Credential to Vault
// ---------------------------------------------------------------------------

saveForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  if (!token) {
    showToast('Please sign in first in the Account tab', 'error');
    switchTab('tab-auth');
    return;
  }

  const btnText = document.getElementById('saveBtnText');
  const originalText = btnText.textContent;
  btnText.textContent = 'Encrypting & Saving...';

  const payload = {
    label: saveLabel.value.trim(),
    category: saveCategory.value,
    secretValue: saveSecret.value,
    username: saveUsername.value.trim() || undefined,
    website: saveWebsite.value.trim() || undefined,
    tags: saveTags.value
      ? saveTags.value.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
  };

  try {
    const res = await fetch(`${apiUrl}/vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Encrypted & saved to VaultKey! 🔐');
      saveForm.reset();
      detectActiveTab();
      fetchVaultList();
    } else {
      showToast(data.message || 'Failed to save credential', 'error');
    }
  } catch (err) {
    showToast('Network error saving to vault', 'error');
  } finally {
    btnText.textContent = originalText;
  }
});

// Toggle password visibility
btnToggleSecretVis.addEventListener('click', () => {
  if (saveSecret.type === 'password') {
    saveSecret.type = 'text';
    btnToggleSecretVis.textContent = '🔒';
  } else {
    saveSecret.type = 'password';
    btnToggleSecretVis.textContent = '👁️';
  }
});

// ---------------------------------------------------------------------------
// Vault List & Decrypt & Autofill
// ---------------------------------------------------------------------------

async function fetchVaultList() {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  if (!token) {
    vaultList.innerHTML = `
      <div class="empty-state">
        <p>Please log in under the Account tab to access your encrypted database.</p>
      </div>`;
    return;
  }

  vaultList.innerHTML = '<div class="empty-state">Loading secrets from database...</div>';

  try {
    const res = await fetch(`${apiUrl}/vault?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      cachedVaultItems = data.data || [];
      renderVaultItems(cachedVaultItems);
    } else {
      vaultList.innerHTML = '<div class="empty-state">Failed to load vault items.</div>';
    }
  } catch (err) {
    vaultList.innerHTML = '<div class="empty-state">Unable to connect to server.</div>';
  }
}

function renderVaultItems(items) {
  if (!items || items.length === 0) {
    vaultList.innerHTML = '<div class="empty-state">No credentials found in database.</div>';
    return;
  }

  vaultList.innerHTML = items
    .map((item) => {
      const catIcons = {
        api_key: '⚡',
        password: '🔑',
        license_key: '🛡️',
        token: '🎟️',
        certificate: '📜',
        ssh_key: '🔐',
        other: '📦',
      };
      const icon = catIcons[item.category] || '📦';

      return `
      <div class="vault-item-card" data-id="${item._id}">
        <div class="vault-item-head">
          <div class="item-title">${icon} ${escapeHtml(item.label)}</div>
          <span class="item-cat-badge">${item.category}</span>
        </div>
        ${item.username ? `<div class="item-sub">👤 ${escapeHtml(item.username)}</div>` : ''}
        ${item.website ? `<div class="item-sub" style="opacity:0.7">🌐 ${escapeHtml(item.website)}</div>` : ''}
        <div class="item-actions">
          <button class="item-action-btn btn-copy-secret" data-id="${item._id}">📋 Decrypt & Copy</button>
          <button class="item-action-btn btn-autofill" data-id="${item._id}" data-user="${escapeHtml(item.username || '')}">🚀 Autofill Page</button>
        </div>
      </div>
    `;
    })
    .join('');

  // Attach event handlers
  document.querySelectorAll('.btn-copy-secret').forEach((btn) => {
    btn.addEventListener('click', () => decryptAndCopy(btn.dataset.id));
  });

  document.querySelectorAll('.btn-autofill').forEach((btn) => {
    btn.addEventListener('click', () => autofillCredential(btn.dataset.id, btn.dataset.user));
  });
}

async function decryptAndCopy(id) {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/vault/${id}/decrypt`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const secret = data.data.secretValue;
      await navigator.clipboard.writeText(secret);
      showToast('Decrypted & copied to clipboard! 📋');
    } else {
      showToast('Decryption failed', 'error');
    }
  } catch {
    showToast('Failed to decrypt secret', 'error');
  }
}

async function autofillCredential(id, username) {
  const token = await getAuthToken();
  const apiUrl = await getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/vault/${id}/decrypt`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      const password = data.data.secretValue;

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          // If browser restricted page, copy directly
          if (
            tab.url &&
            (tab.url.startsWith('chrome://') ||
              tab.url.startsWith('chrome-extension://') ||
              tab.url.startsWith('edge://') ||
              tab.url.startsWith('about:'))
          ) {
            await navigator.clipboard.writeText(password);
            showToast('Browser system tab: password copied to clipboard! 📋');
            return;
          }

          // Send message to content script
          chrome.tabs.sendMessage(
            tab.id,
            { action: 'AUTOFILL', username, password },
            async (response) => {
              if (chrome.runtime.lastError || !response || !response.success) {
                // If content script was not injected on this tab yet, dynamically inject it
                if (chrome.scripting && tab.id) {
                  try {
                    await chrome.scripting.executeScript({
                      target: { tabId: tab.id },
                      files: ['content.js'],
                    });
                    // Retry autofill
                    chrome.tabs.sendMessage(
                      tab.id,
                      { action: 'AUTOFILL', username, password },
                      (retryRes) => {
                        if (retryRes && retryRes.success) {
                          showToast('Autofilled credentials into active page! 🚀');
                        } else {
                          navigator.clipboard.writeText(password);
                          showToast('Form filled & copied to clipboard! 📋');
                        }
                      }
                    );
                    return;
                  } catch {
                    // Script injection disallowed or tab closed
                  }
                }
                navigator.clipboard.writeText(password);
                showToast('Password copied to clipboard! 📋');
              } else {
                showToast('Autofilled credentials into active page! 🚀');
              }
            }
          );
          return;
        }
      }
      showToast('Password copied to clipboard! 📋');
    } else {
      showToast('Could not retrieve secret from vault', 'error');
    }
  } catch (e) {
    showToast('Autofill request failed', 'error');
  }
}

// Search filter
vaultSearch.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = cachedVaultItems.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      (item.username && item.username.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
  );
  renderVaultItems(filtered);
});

btnRefreshVault.addEventListener('click', fetchVaultList);

// ---------------------------------------------------------------------------
// Cryptographic Generator
// ---------------------------------------------------------------------------

function generatePassword() {
  const length = parseInt(genLength.value, 10);
  let charset = '';
  if (genLower.checked) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (genUpper.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (genNumbers.checked) charset += '0123456789';
  if (genSymbols.checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  generatedSecret = result;
  genResult.value = result;
  updateStrengthBar(result);
}

function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const parts = [];
  parts.push('VKPRO');

  for (let p = 0; p < 3; p++) {
    const randomValues = new Uint32Array(4);
    window.crypto.getRandomValues(randomValues);
    let chunk = '';
    for (let i = 0; i < 4; i++) {
      chunk += chars[randomValues[i] % chars.length];
    }
    parts.push(chunk);
  }

  const result = parts.join('-');
  generatedSecret = result;
  genResult.value = result;
  updateStrengthBar(result);
}

function updateStrengthBar(str) {
  const fill = document.getElementById('strengthFill');
  if (str.length >= 20) {
    fill.style.width = '100%';
    fill.style.background = '#10b981';
  } else if (str.length >= 12) {
    fill.style.width = '70%';
    fill.style.background = '#06b6d4';
  } else {
    fill.style.width = '40%';
    fill.style.background = '#f59e0b';
  }
}

genLength.addEventListener('input', (e) => {
  genLengthVal.textContent = e.target.value;
  generatePassword();
});

[genUpper, genLower, genNumbers, genSymbols].forEach((el) => {
  el.addEventListener('change', generatePassword);
});

btnRegenPass.addEventListener('click', generatePassword);
btnGenLicenseKey.addEventListener('click', generateLicenseKey);

btnCopyGen.addEventListener('click', async () => {
  if (genResult.value) {
    await navigator.clipboard.writeText(genResult.value);
    showToast('Secret copied to clipboard! 📋');
  }
});

btnUseInSave.addEventListener('click', () => {
  if (genResult.value) {
    saveSecret.value = genResult.value;
    switchTab('tab-save');
    showToast('Transferred secret to Save form! ⚡');
  }
});

btnQuickGenPass.addEventListener('click', () => {
  generatePassword();
  saveSecret.value = genResult.value;
  showToast('Generated strong password! 🔑');
});

// ---------------------------------------------------------------------------
// Account / Login Handling
// ---------------------------------------------------------------------------

// Quick Demo Button
if (btnQuickDemoLogin) {
  btnQuickDemoLogin.addEventListener('click', () => {
    loginEmail.value = 'admin@example.com';
    loginPassword.value = 'admin';
    showToast('Demo credentials populated! Click Sign In ⚡');
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiUrl = await getApiUrl();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  const originalText = loginBtnText ? loginBtnText.textContent : 'Sign In with HS512';
  if (btnLoginSubmit) btnLoginSubmit.disabled = true;
  if (loginBtnText) loginBtnText.textContent = 'Verifying HS512 Session...';

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      await setStoredData({ token: data.accessToken, user: data.user });
      showToast(`Signed in as ${data.user?.name || 'Administrator'}! 👋`);
      await updateAuthView();
      await fetchVaultList();
      switchTab('tab-vault');
    } else {
      const errMsg =
        data.message ||
        (data.errors && data.errors[0]?.msg) ||
        (res.status === 401 ? 'Invalid email or password' : 'Login failed');
      showToast(errMsg, 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast(`Cannot connect to server at ${apiUrl}. Check if backend is running.`, 'error');
  } finally {
    if (btnLoginSubmit) btnLoginSubmit.disabled = false;
    if (loginBtnText) loginBtnText.textContent = originalText;
  }
});

btnLogout.addEventListener('click', async () => {
  await clearStoredAuth();
  showToast('Logged out');
  updateAuthView();
  vaultList.innerHTML = '<div class="empty-state">Logged out.</div>';
});

btnSaveServerUrl.addEventListener('click', async () => {
  const url = serverApiUrl.value.trim();
  if (url) {
    await setStoredData({ apiUrl: url });
    showToast('API URL saved!');
    checkServerHealth();
  }
});

if (btnTestServerUrl) {
  btnTestServerUrl.addEventListener('click', async () => {
    const url = serverApiUrl.value.trim();
    if (url) {
      await setStoredData({ apiUrl: url });
    }
    showToast('Pinging backend server...');
    const isOnline = await checkServerHealth();
    if (isOnline) {
      showToast('Server is ONLINE & connected! ⚡', 'success');
    } else {
      showToast('Server is OFFLINE or unreachable.', 'error');
    }
  });
}

btnRefreshSite.addEventListener('click', detectActiveTab);

// ---------------------------------------------------------------------------
// Tabs Navigation
// ---------------------------------------------------------------------------

function switchTab(targetTabId) {
  tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === targetTabId);
  });
  panels.forEach((p) => {
    p.classList.toggle('active', p.id === targetTabId);
  });

  if (targetTabId === 'tab-vault') {
    fetchVaultList();
  } else if (targetTabId === 'tab-save') {
    detectActiveTab();
  } else if (targetTabId === 'tab-auth') {
    updateAuthView();
  }
}

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  await checkServerHealth();
  await detectActiveTab();
  await updateAuthView();
  generatePassword();
});
