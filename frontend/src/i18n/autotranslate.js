import { useCallback, useSyncExternalStore } from 'react';
import { getLang } from './index.js';
import { traducirArticulo } from './articulo.js';

// Translation of database content (item names, equipment, levels...), done only in the browser.
// 1. The browser's on-device Translator API (Chrome/Edge 138+) gives a full translation, no server involved.
// 2. When it is not available, the local glossary in articulo.js is used.
// Data is never modified: only what is displayed changes, and results are cached in localStorage.

const SOURCE_LANG = 'es';
const STORE_KEY = 'inv_tr_cache_v1';
const MAX_ENTRIES = 3000;

const memory = new Map();
const queued = new Set();
const listeners = new Set();
const translators = new Map();
const failed = new Set();
let version = 0;
let pumping = false;
let notifyTimer = null;
let saveTimer = null;

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (Array.isArray(raw)) raw.forEach(([k, v]) => memory.set(k, v));
  } catch {
    // A corrupt cache is ignored and rebuilt.
  }
}

function saveStoreSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const entries = Array.from(memory.entries()).slice(-MAX_ENTRIES);
      localStorage.setItem(STORE_KEY, JSON.stringify(entries));
    } catch {
      // Storage full or blocked: the in-memory cache still works.
    }
  }, 500);
}

function notifySoon() {
  if (notifyTimer) return;
  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    version += 1;
    listeners.forEach((fn) => fn());
  }, 120);
}

const keyOf = (lang, text) => `${lang}\u0000${text}`;

// Skips numbers, codes and part numbers, which must be shown as they are.
function worthTranslating(text) {
  return typeof text === 'string' && /[A-Za-z\u00C0-\u00FF]{3,}/.test(text) && !/^[A-Z0-9\-_/.\s]+$/.test(text);
}

async function createTranslator(source, target) {
  try {
    const availability = await self.Translator.availability({ sourceLanguage: source, targetLanguage: target });
    if (availability === 'unavailable') return null;
    // The first model download needs a user gesture (the language selector click).
    if (availability !== 'available' && !navigator.userActivation?.isActive) return null;
    return await self.Translator.create({ sourceLanguage: source, targetLanguage: target });
  } catch {
    return null;
  }
}

async function buildTranslator(lang) {
  if (typeof self === 'undefined' || !('Translator' in self)) return null;
  const direct = await createTranslator(SOURCE_LANG, lang);
  if (direct) return (text) => direct.translate(text);
  if (lang === 'en') return null;
  // Some language pairs are only available through English.
  const toEn = await createTranslator(SOURCE_LANG, 'en');
  const fromEn = toEn ? await createTranslator('en', lang) : null;
  if (toEn && fromEn) return async (text) => fromEn.translate(await toEn.translate(text));
  return null;
}

function getTranslator(lang) {
  if (!translators.has(lang)) {
    const promise = buildTranslator(lang).then((fn) => {
      if (!fn) translators.delete(lang);
      return fn;
    });
    translators.set(lang, promise);
  }
  return translators.get(lang);
}

async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (queued.size) {
      const key = queued.values().next().value;
      queued.delete(key);
      if (memory.has(key)) continue;
      const [lang, text] = key.split('\u0000');
      const translate = await getTranslator(lang);
      if (!translate) {
        failed.add(lang);
        queued.clear();
        break;
      }
      try {
        const result = (await translate(text))?.trim();
        if (result) {
          memory.set(key, result);
          saveStoreSoon();
          notifySoon();
        }
      } catch {
        // This text keeps the glossary fallback.
      }
    }
  } finally {
    pumping = false;
  }
}

// Call from a click handler when the language changes so the browser may download the language model.
export function prepareAutoTranslate(lang = getLang()) {
  if (lang === SOURCE_LANG) return;
  failed.delete(lang);
  getTranslator(lang).then((fn) => {
    if (!fn) failed.add(lang);
    notifySoon();
  });
}

export function isAutoTranslateSupported() {
  return typeof self !== 'undefined' && 'Translator' in self;
}

// Returns the best translation available right now and schedules a better one when possible.
export function translateData(text, lang = getLang()) {
  if (!text || lang === SOURCE_LANG || !worthTranslating(text)) return text ?? '';
  const key = keyOf(lang, text);
  const cached = memory.get(key);
  if (cached !== undefined) return cached;
  if (isAutoTranslateSupported() && !failed.has(lang) && !queued.has(key)) {
    queued.add(key);
    queueMicrotask(pump);
  }
  return traducirArticulo(text, lang);
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Returns a function that translates database text and re-renders the component when new translations arrive.
export function useDataTranslation() {
  useSyncExternalStore(subscribe, () => version);
  const lang = getLang();
  return useCallback((text) => translateData(text, lang), [lang, version]);
}

loadStore();
