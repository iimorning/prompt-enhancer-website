// Stores all language messages
const messages = {};

/**
 * Fetches and loads the message files for the given languages.
 * @param {string[]} languages - An array of language codes (e.g., ['en', 'zh_CN']).
 * @returns {Promise<void>}
 */
async function loadMessages(languages) {
  for (const lang of languages) {
    try {
      const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
      console.log(`Attempting to load messages from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to load messages for ${lang}: ${response.statusText} (Status: ${response.status})`);
        throw new Error(`Failed to load messages for ${lang}: ${response.statusText}`);
      }
      const data = await response.json();
      messages[lang] = {};
      // Flatten the message structure from { key: { message: '...' } } to { key: '...' }
      for (const key in data) {
        if (data[key] && data[key].message) {
          messages[lang][key] = data[key].message;
        }
      }
      console.log(`Successfully loaded messages for ${lang}. Keys loaded: ${Object.keys(messages[lang]).length}`);
    } catch (error) {
      console.error(`Error loading messages for ${lang}:`, error);
    }
  }
}

/**
 * Gets a translated message for the given key and language.
 * @param {string} key - The message key.
 * @param {string} lang - The language code (e.g., 'en', 'zh_CN').
 * @returns {string} The translated message or the key if not found.
 */
function getMessage(key, lang) {
  if (!messages[lang] || !messages[lang][key]) {
    console.warn(`Translation for key '${key}' in language '${lang}' not found.`);
    return key; // Return the key as fallback
  }
  return messages[lang][key];
}

/**
 * Applies translations to the DOM based on the selected language.
 * @param {string} lang - The language code to apply (e.g., 'en', 'zh_CN').
 */
function applyI18n(lang) {
  if (!messages[lang]) {
    console.warn(`Translations for language '${lang}' not loaded.`);
    return;
  }

  const translations = messages[lang];

  // Update text content
  document.querySelectorAll('[data-i18n-key]').forEach(element => {
    const key = element.getAttribute('data-i18n-key');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });

  // Update title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (translations[key]) {
      element.setAttribute('title', translations[key]);
    }
  });

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      element.setAttribute('placeholder', translations[key]);
    }
  });

  // Trigger custom event for dynamic content updates
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

// 将函数挂载到 window 对象上，使其可以在全局访问
window.loadMessages = loadMessages;
window.applyI18n = applyI18n;
window.getMessage = getMessage;