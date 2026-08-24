/**
 * Chrome Storage Helper Utility for Devnest Extension
 */

const DEFAULT_SERVER_URL = "http://localhost:3000";

export async function getSettings() {
  try {
    const data = await chrome.storage.sync.get(["apiKey", "serverUrl"]);
    let apiKey = data.apiKey ? data.apiKey.replace(/[^\x00-\x7F]/g, "").trim() : "";
    let serverUrl = data.serverUrl ? data.serverUrl.replace(/[^\x00-\x7F]/g, "").trim() : DEFAULT_SERVER_URL;
    serverUrl = serverUrl.replace(/\/+$/, "");
    return { apiKey, serverUrl };
  } catch (err) {
    console.error("Failed to read settings from storage:", err);
    return { apiKey: "", serverUrl: DEFAULT_SERVER_URL };
  }
}

export async function saveSettings({ apiKey, serverUrl }) {
  try {
    const cleanKey = apiKey ? apiKey.trim() : "";
    const cleanUrl = serverUrl ? serverUrl.trim().replace(/\/+$/, "") : DEFAULT_SERVER_URL;
    await chrome.storage.sync.set({ apiKey: cleanKey, serverUrl: cleanUrl });
    return true;
  } catch (err) {
    console.error("Failed to save settings to storage:", err);
    return false;
  }
}

export async function getCachedBookmarks() {
  try {
    const data = await chrome.storage.local.get(["cachedBookmarks", "bookmarksLastFetched"]);
    return {
      bookmarks: data.cachedBookmarks || [],
      lastFetched: data.bookmarksLastFetched || 0,
    };
  } catch {
    return { bookmarks: [], lastFetched: 0 };
  }
}

export async function setCachedBookmarks(bookmarks) {
  try {
    await chrome.storage.local.set({
      cachedBookmarks: bookmarks,
      bookmarksLastFetched: Date.now(),
    });
  } catch (err) {
    console.error("Failed to cache bookmarks:", err);
  }
}

export async function getCachedCategories() {
  try {
    const data = await chrome.storage.local.get(["cachedCategories"]);
    return data.cachedCategories || [];
  } catch {
    return [];
  }
}

export async function setCachedCategories(categories) {
  try {
    await chrome.storage.local.set({ cachedCategories: categories });
  } catch (err) {
    console.error("Failed to cache categories:", err);
  }
}

export async function getExpandedCategories() {
  try {
    const data = await chrome.storage.local.get(["expandedCategories"]);
    return data.expandedCategories || null;
  } catch {
    return null;
  }
}

export async function setExpandedCategories(expandedIds) {
  try {
    await chrome.storage.local.set({ expandedCategories: expandedIds });
  } catch (err) {
    console.error("Failed to save expanded category state:", err);
  }
}
