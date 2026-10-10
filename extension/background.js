/**
 * VaultKey Background Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  // Create context menus for fast access
  chrome.contextMenus.create({
    id: 'vaultkey-open-dashboard',
    title: 'Open VaultKey Web Dashboard',
    contexts: ['action'],
  });

  chrome.contextMenus.create({
    id: 'vaultkey-save-selection',
    title: 'Copy selection to VaultKey',
    contexts: ['selection'],
  });

  console.log('VaultKey Chrome Extension initialized');
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'vaultkey-open-dashboard') {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  } else if (info.menuItemId === 'vaultkey-save-selection') {
    // Open popup or save selection
    chrome.action.openPopup?.();
  }
});
