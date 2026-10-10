/**
 * VaultKey Content Script
 * Automatically fills credentials into login forms on the active page
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'AUTOFILL') {
    const { username, password } = request;
    const filled = autofillPage(username, password);
    sendResponse({ success: filled });
  }
  return true;
});

function autofillPage(username, password) {
  let filledPassword = false;
  let filledUsername = false;

  // 1. Locate password fields
  const passwordInputs = Array.from(
    document.querySelectorAll('input[type="password"]')
  ).filter((el) => isVisible(el));

  if (passwordInputs.length > 0 && password) {
    const targetPass = passwordInputs[0];
    setNativeValue(targetPass, password);
    filledPassword = true;

    // 2. Locate corresponding username / email field within same form or nearby
    if (username) {
      const form = targetPass.closest('form') || document;
      const candidateInputs = Array.from(
        form.querySelectorAll(
          'input[type="text"], input[type="email"], input:not([type])'
        )
      ).filter(
        (el) =>
          isVisible(el) &&
          !el.readOnly &&
          !el.disabled &&
          matchesUsernameHints(el)
      );

      if (candidateInputs.length > 0) {
        setNativeValue(candidateInputs[0], username);
        filledUsername = true;
      } else {
        // Fallback: take previous visible text input before the password field
        const allInputs = Array.from(
          form.querySelectorAll('input:not([type="hidden"])')
        );
        const passIndex = allInputs.indexOf(targetPass);
        if (passIndex > 0) {
          const prev = allInputs[passIndex - 1];
          if (isVisible(prev) && !prev.readOnly) {
            setNativeValue(prev, username);
            filledUsername = true;
          }
        }
      }
    }
  }

  return filledPassword || filledUsername;
}

function matchesUsernameHints(el) {
  const hints = ['user', 'email', 'login', 'account', 'name', 'id'];
  const text = `${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('autocomplete') || ''}`.toLowerCase();
  return hints.some((h) => text.includes(h));
}

function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch events to notify reactive frontends
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
