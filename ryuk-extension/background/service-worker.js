/**
 * Devnest Chrome Extension Background Service Worker
 * Handles Manifest V3 Side Panel API, Context Menus, and Extension Messaging.
 */

import { getSettings, setCachedBookmarks } from "../lib/storage.js";
import { createBookmark, saveNoteSelection, fetchBookmarks } from "../lib/api.js";

// Configure Chrome Side Panel Behavior
function configureSidePanel() {
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === "function") {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn("Failed to set side panel behavior:", err);
    });
  }
}

// Ensure Context Menus are registered
function ensureContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "ryuk-save-to-bookmarks",
      title: "Save page to Bookmarks",
      contexts: ["page", "link"],
    });

    chrome.contextMenus.create({
      id: "ryuk-save-to-notes",
      title: "Save selection to Notes",
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  configureSidePanel();
  ensureContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
  ensureContextMenus();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  const tabUrl = info.linkUrl || tab.url || info.pageUrl || "";
  const tabTitle = tab.title || "Webpage";

  // Ignore internal browser pages
  if (
    tabUrl.startsWith("chrome://") ||
    tabUrl.startsWith("chrome-extension://") ||
    tabUrl.startsWith("edge://")
  ) {
    showNotification(tab.id, "Cannot save internal browser pages.", "error");
    return;
  }

  const { apiKey } = await getSettings();
  if (!apiKey) {
    showNotification(tab.id, "API Key required. Please configure options.", "error");
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
    return;
  }

  if (info.menuItemId === "ryuk-save-to-bookmarks") {
    try {
      const favicon = tab.favIconUrl || getDomainFavicon(tabUrl);
      const newBookmark = await createBookmark({
        title: tabTitle,
        url: tabUrl,
        favicon: favicon,
      });

      showNotification(tab.id, "✔ Page saved to Bookmarks!", "success");

      // Notify side panel to refresh UI
      chrome.runtime.sendMessage({ action: "BOOKMARKS_UPDATED", bookmark: newBookmark }).catch(() => {});

      // Refresh cache
      try {
        const fresh = await fetchBookmarks();
        await setCachedBookmarks(fresh);
      } catch {}
    } catch (err) {
      showNotification(tab.id, err.message || "Failed to save bookmark.", "error");
    }
  } else if (info.menuItemId === "ryuk-save-to-notes") {
    // Request rich anchor selection from content script
    let anchorData = null;
    try {
      anchorData = await chrome.tabs.sendMessage(tab.id, { action: "GET_SELECTION_ANCHOR" });
    } catch {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content/content-script.js"],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["content/styles/content-style.css"],
        });
        anchorData = await chrome.tabs.sendMessage(tab.id, { action: "GET_SELECTION_ANCHOR" });
      } catch {}
    }

    const selectedText = (anchorData?.selectedText || info.selectionText || "").trim();
    if (!selectedText) {
      showNotification(tab.id, "No text selected to save.", "error");
      return;
    }

    const generateUUID = () => {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      return "ref_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
    };

    const referenceId = `ref_${generateUUID()}`;
    const payload = {
      title: `Selection from ${anchorData?.title || tabTitle}`,
      content: selectedText,
      sourceUrl: tabUrl,
      sourceTitle: anchorData?.title || tabTitle,
      selectedText: selectedText,
      sourceAnchor: anchorData
        ? {
            text: selectedText,
            prefix: anchorData.prefix || "",
            suffix: anchorData.suffix || "",
            selector: anchorData.selector || "",
            startOffset: anchorData.startOffset,
            endOffset: anchorData.endOffset,
          }
        : { text: selectedText, prefix: "", suffix: "", selector: "" },
      referenceId,
      tags: ["web-reference"],
    };

    try {
      await saveNoteSelection(payload);
      showNotification(tab.id, "✔ Selection saved to Notes!", "success");
    } catch (err) {
      showNotification(tab.id, err.message || "Failed to save selection to notes.", "error");
    }
  }
});

// Runtime Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      sendResponse(tabs[0] || null);
    }).catch(() => sendResponse(null));
    return true;
  }

  if (message.action === "OPEN_OPTIONS_PAGE") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
    sendResponse({ success: true });
    return false;
  }
});

function showNotification(tabId, message, type = "info") {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: "SHOW_TOAST", message, toastType: type }).catch(() => {
      triggerSystemNotification(message, type);
    });
  } else {
    triggerSystemNotification(message, type);
  }
}

function triggerSystemNotification(message, type = "info") {
  try {
    if (chrome.notifications && typeof chrome.notifications.create === "function") {
      chrome.notifications.create(`devnest_${Date.now()}`, {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon128.png"),
        title: type === "success" ? "Devnest Success" : "Devnest Extension",
        message: message,
      });
    }
  } catch {}
}

function getDomainFavicon(urlStr) {
  try {
    const domain = new URL(urlStr).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
}
