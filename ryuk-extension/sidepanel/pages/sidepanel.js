/**
 * Devnest Chrome Side Panel Logic
 * Features accordion categories, active tab detection, fast client search, inline bookmark creation, and integrated settings view.
 */

import {
  getSettings,
  saveSettings,
  getCachedBookmarks,
  setCachedBookmarks,
  getCachedCategories,
  setCachedCategories,
  getExpandedCategories,
  setExpandedCategories,
} from "../../lib/storage.js";

import {
  fetchBookmarks,
  fetchCategories,
  createBookmark,
  deleteBookmark,
} from "../../lib/api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements — Header & Nav
  const refreshBtn = document.getElementById("refreshBtn");
  const refreshIcon = document.getElementById("refreshIcon");
  const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
  const bookmarksViewContainer = document.getElementById("bookmarksViewContainer");
  const settingsViewContainer = document.getElementById("settingsViewContainer");
  const backFromSettingsBtn = document.getElementById("backFromSettingsBtn");

  // DOM Elements — Search & Add Form
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const toggleAddBtn = document.getElementById("toggleAddBtn");
  const addFormCard = document.getElementById("addFormCard");
  const closeAddFormBtn = document.getElementById("closeAddFormBtn");
  const cancelAddBtn = document.getElementById("cancelAddBtn");
  const saveBookmarkBtn = document.getElementById("saveBookmarkBtn");
  const saveBtnSpinner = document.getElementById("saveBtnSpinner");
  const saveBtnText = document.getElementById("saveBtnText");

  const activeFavicon = document.getElementById("activeFavicon");
  const addTitleInput = document.getElementById("addTitleInput");
  const activeUrlDisplay = document.getElementById("activeUrlDisplay");
  const addCategorySelect = document.getElementById("addCategorySelect");
  const addDescriptionInput = document.getElementById("addDescriptionInput");

  // DOM Elements — Content Views
  const mainContent = document.getElementById("mainContent");
  const loadingView = document.getElementById("loadingView");
  const accordionContainer = document.getElementById("accordionContainer");
  const emptyView = document.getElementById("emptyView");
  const emptyTitle = document.getElementById("emptyTitle");
  const emptyDesc = document.getElementById("emptyDesc");
  const emptyAddBtn = document.getElementById("emptyAddBtn");
  const errorView = document.getElementById("errorView");
  const errorTitle = document.getElementById("errorTitle");
  const errorDesc = document.getElementById("errorDesc");
  const errorRetryBtn = document.getElementById("errorRetryBtn");
  const errorOpenSettingsBtn = document.getElementById("errorOpenSettingsBtn");
  const unauthView = document.getElementById("unauthView");
  const connectKeyBtn = document.getElementById("connectKeyBtn");
  const sidepanelToast = document.getElementById("sidepanelToast");

  // DOM Elements — Settings View
  const sidepanelSettingsForm = document.getElementById("sidepanelSettingsForm");
  const settingsServerUrl = document.getElementById("settingsServerUrl");
  const settingsApiKey = document.getElementById("settingsApiKey");
  const toggleApiKeyVisibility = document.getElementById("toggleApiKeyVisibility");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const testServerBtn = document.getElementById("testServerBtn");
  const settingsStatusMsg = document.getElementById("settingsStatusMsg");

  // Extension State
  let allBookmarks = [];
  let allCategories = [];
  let expandedCategoryIds = new Set();
  let activeTabInfo = null;
  let searchQuery = "";
  let isAddFormOpen = false;

  // View Switcher (Bookmarks vs Settings)
  function showSettingsView() {
    loadSettingsIntoForm();
    bookmarksViewContainer.classList.add("hidden");
    settingsViewContainer.classList.remove("hidden");
  }

  function showBookmarksView() {
    settingsViewContainer.classList.add("hidden");
    bookmarksViewContainer.classList.remove("hidden");
  }

  toggleSettingsBtn.addEventListener("click", () => {
    if (settingsViewContainer.classList.contains("hidden")) {
      showSettingsView();
    } else {
      showBookmarksView();
    }
  });

  backFromSettingsBtn.addEventListener("click", () => {
    showBookmarksView();
    refreshData(false);
  });

  errorOpenSettingsBtn.addEventListener("click", showSettingsView);
  connectKeyBtn.addEventListener("click", showSettingsView);

  // Settings Form Management
  async function loadSettingsIntoForm() {
    const { apiKey, serverUrl } = await getSettings();
    settingsServerUrl.value = serverUrl || "http://localhost:3000";
    settingsApiKey.value = apiKey || "";
    hideSettingsStatus();
  }

  toggleApiKeyVisibility.addEventListener("click", () => {
    if (settingsApiKey.type === "password") {
      settingsApiKey.type = "text";
      toggleApiKeyVisibility.textContent = "Hide";
    } else {
      settingsApiKey.type = "password";
      toggleApiKeyVisibility.textContent = "Show";
    }
  });

  sidepanelSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideSettingsStatus();

    const serverUrl = settingsServerUrl.value.trim() || "http://localhost:3000";
    const apiKey = settingsApiKey.value.trim();

    if (!apiKey) {
      showSettingsStatus("API Key is required to connect to Devnest.", "error");
      return;
    }

    saveSettingsBtn.disabled = true;
    saveSettingsBtn.innerHTML = "<span>Saving...</span>";

    const success = await saveSettings({ apiKey, serverUrl });
    saveSettingsBtn.disabled = false;
    saveSettingsBtn.innerHTML = "<span>Save Settings</span>";

    if (success) {
      showSettingsStatus("✔ Credentials saved successfully!", "success");
      setTimeout(() => {
        showBookmarksView();
        refreshData(true);
      }, 1000);
    } else {
      showSettingsStatus("Failed to save settings.", "error");
    }
  });

  testServerBtn.addEventListener("click", async () => {
    hideSettingsStatus();
    let serverUrl = settingsServerUrl.value.trim() || "http://localhost:3000";
    serverUrl = serverUrl.replace(/\/+$/, "");

    testServerBtn.disabled = true;
    testServerBtn.innerHTML = "<span>Testing Connection...</span>";

    try {
      let res = await fetch(`${serverUrl}/api/bookmark/metadata?url=https://github.com`);
      if (!res.ok) {
        res = await fetch(`${serverUrl}/api/fetch-meta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "https://github.com" }),
        });
      }

      if (res.ok) {
        showSettingsStatus(`✔ Connection successful! Server reached at ${serverUrl}`, "success");
      } else {
        showSettingsStatus(`Server responded with status ${res.status}. Check URL.`, "error");
      }
    } catch (err) {
      showSettingsStatus(`Cannot connect to ${serverUrl} (${err.message}). Is dev server running?`, "error");
    } finally {
      testServerBtn.disabled = false;
      testServerBtn.innerHTML = "<span>Test Connection</span>";
    }
  });

  function showSettingsStatus(msg, type) {
    settingsStatusMsg.textContent = msg;
    settingsStatusMsg.className = `status-box ${type}`;
    settingsStatusMsg.classList.remove("hidden");
  }

  function hideSettingsStatus() {
    settingsStatusMsg.className = "status-box hidden";
    settingsStatusMsg.textContent = "";
  }

  // Initialize Extension Side Panel
  await initSidePanel();

  async function initSidePanel() {
    showStateView("loading");

    const { apiKey } = await getSettings();
    if (!apiKey) {
      showStateView("unauth");
      return;
    }

    // Load saved accordion state
    const savedExpanded = await getExpandedCategories();
    if (Array.isArray(savedExpanded)) {
      expandedCategoryIds = new Set(savedExpanded);
    } else {
      expandedCategoryIds = null;
    }

    // Load cached bookmarks & categories for instant rendering
    const cachedBms = await getCachedBookmarks();
    const cachedCats = await getCachedCategories();

    if (cachedBms.bookmarks.length > 0 || cachedCats.length > 0) {
      allBookmarks = cachedBms.bookmarks;
      allCategories = cachedCats;
      populateCategoryDropdown();
      renderAccordion();
      showStateView("accordion");
    }

    // Query active browser tab
    await updateActiveTabInfo();

    // Fetch fresh data from server
    await refreshData(false);
  }

  // Active Browser Tab Query
  async function updateActiveTabInfo() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        activeTabInfo = tabs[0];
        const tabUrl = activeTabInfo.url || "";
        const tabTitle = activeTabInfo.title || tabUrl;
        const iconUrl = activeTabInfo.favIconUrl || getDomainFavicon(tabUrl);

        addTitleInput.value = tabTitle;
        activeUrlDisplay.textContent = tabUrl;
        activeFavicon.src = iconUrl;
        activeFavicon.onerror = () => {
          activeFavicon.src = getDomainFavicon(tabUrl);
        };
      }
    } catch {
      // Ignore tab query error
    }
  }

  chrome.tabs.onActivated?.addListener(() => {
    if (isAddFormOpen) {
      updateActiveTabInfo();
    }
  });

  // Fetch Fresh Data from API
  async function refreshData(showSpin = true) {
    if (showSpin) {
      refreshIcon.classList.add("spin");
    }

    try {
      const [bms, cats] = await Promise.all([fetchBookmarks(), fetchCategories()]);

      allBookmarks = bms;
      allCategories = cats;

      await setCachedBookmarks(bms);
      await setCachedCategories(cats);

      populateCategoryDropdown();
      renderAccordion();

      if (allBookmarks.length === 0) {
        showStateView("empty");
      } else {
        showStateView("accordion");
      }
    } catch (err) {
      if (err.unauthenticated) {
        showStateView("unauth");
      } else if (allBookmarks.length === 0) {
        errorTitle.textContent = "Unable to Load Bookmarks";
        errorDesc.textContent = err.message || "Failed to connect to backend server.";
        showStateView("error");
      } else {
        showToast(err.message || "Refresh failed", "error");
      }
    } finally {
      refreshIcon.classList.remove("spin");
    }
  }

  refreshBtn.addEventListener("click", () => refreshData(true));
  errorRetryBtn.addEventListener("click", () => refreshData(true));

  // Populate Category Select Dropdown
  function populateCategoryDropdown() {
    addCategorySelect.innerHTML = `<option value="">📁 Uncategorized</option>`;
    allCategories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = `📁 ${cat.name}`;
      addCategorySelect.appendChild(opt);
    });
  }

  // Toggle Add Form Visibility
  function setAddFormVisible(visible) {
    isAddFormOpen = visible;
    if (visible) {
      updateActiveTabInfo();
      addFormCard.classList.remove("hidden");
      toggleAddBtn.classList.add("hidden");
    } else {
      addFormCard.classList.add("hidden");
      toggleAddBtn.classList.remove("hidden");
      addDescriptionInput.value = "";
    }
  }

  toggleAddBtn.addEventListener("click", () => setAddFormVisible(true));
  emptyAddBtn.addEventListener("click", () => setAddFormVisible(true));
  closeAddFormBtn.addEventListener("click", () => setAddFormVisible(false));
  cancelAddBtn.addEventListener("click", () => setAddFormVisible(false));

  // Save Bookmark Action
  saveBookmarkBtn.addEventListener("click", async () => {
    const title = addTitleInput.value.trim();
    const url = activeUrlDisplay.textContent.trim();
    const categoryId = addCategorySelect.value || null;
    const description = addDescriptionInput.value.trim() || null;
    const favicon = activeFavicon.src || getDomainFavicon(url);

    if (!title || !url || url.startsWith("chrome://")) {
      showToast("Cannot save empty or internal browser pages.", "error");
      return;
    }

    setSaveLoading(true);

    try {
      const newBm = await createBookmark({
        title,
        url,
        description,
        categoryId,
        favicon,
      });

      showToast("✔ Bookmark saved successfully!", "success");
      setAddFormVisible(false);

      allBookmarks.unshift(newBm);
      await setCachedBookmarks(allBookmarks);
      renderAccordion();
      showStateView("accordion");
    } catch (err) {
      showToast(err.message || "Failed to save bookmark", "error");
    } finally {
      setSaveLoading(false);
    }
  });

  function setSaveLoading(loading) {
    saveBookmarkBtn.disabled = loading;
    if (loading) {
      saveBtnSpinner.classList.remove("hidden");
      saveBtnText.textContent = "Saving...";
    } else {
      saveBtnSpinner.classList.add("hidden");
      saveBtnText.textContent = "Save Bookmark";
    }
  }

  // Fast Client Search
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    if (searchQuery) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }
    renderAccordion();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    renderAccordion();
  });

  // Render Accordion Categories & Bookmarks
  function renderAccordion() {
    accordionContainer.innerHTML = "";

    let filteredBms = allBookmarks;
    if (searchQuery) {
      filteredBms = allBookmarks.filter((bm) => {
        const titleMatch = bm.title?.toLowerCase().includes(searchQuery);
        const urlMatch = bm.url?.toLowerCase().includes(searchQuery);
        const domainMatch = getDomainFromUrl(bm.url)?.toLowerCase().includes(searchQuery);
        const categoryMatch = bm.category?.name?.toLowerCase().includes(searchQuery);
        return titleMatch || urlMatch || domainMatch || categoryMatch;
      });
    }

    if (filteredBms.length === 0) {
      if (searchQuery) {
        emptyTitle.textContent = "No Search Results";
        emptyDesc.textContent = `No bookmarks match "${searchQuery}".`;
        showStateView("empty");
      } else if (allBookmarks.length === 0) {
        emptyTitle.textContent = "No Bookmarks Found";
        emptyDesc.textContent = "Click '+ Add Bookmark' to save your first tab to Devnest.";
        showStateView("empty");
      }
      return;
    }

    showStateView("accordion");

    const categoryMap = new Map();

    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, {
        category: cat,
        bookmarks: [],
      });
    });

    const UNCATEGORIZED_ID = "uncategorized";
    categoryMap.set(UNCATEGORIZED_ID, {
      category: { id: UNCATEGORIZED_ID, name: "Uncategorized", color: "#64748b" },
      bookmarks: [],
    });

    filteredBms.forEach((bm) => {
      const catId = bm.categoryId || UNCATEGORIZED_ID;
      if (categoryMap.has(catId)) {
        categoryMap.get(catId).bookmarks.push(bm);
      } else {
        const catName = bm.category?.name || "Shared Category";
        categoryMap.set(catId, {
          category: { id: catId, name: catName, color: "#8b5cf6" },
          bookmarks: [bm],
        });
      }
    });

    if (expandedCategoryIds === null) {
      expandedCategoryIds = new Set();
      for (const [catId, group] of categoryMap.entries()) {
        if (group.bookmarks.length > 0) {
          expandedCategoryIds.add(catId);
        }
      }
    }

    let hasRenderedGroup = false;

    for (const [catId, group] of categoryMap.entries()) {
      if (group.bookmarks.length === 0) continue;

      hasRenderedGroup = true;
      const isExpanded = expandedCategoryIds.has(catId);

      const accordionEl = document.createElement("div");
      accordionEl.className = `category-accordion ${isExpanded ? "expanded" : ""}`;
      accordionEl.dataset.categoryId = catId;

      const headerEl = document.createElement("div");
      headerEl.className = "accordion-header";
      headerEl.innerHTML = `
        <div class="header-left">
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span class="category-dot" style="background-color: ${group.category.color || "#6366f1"};"></span>
          <span class="category-title">${escapeHtml(group.category.name)}</span>
        </div>
        <span class="category-count">${group.bookmarks.length}</span>
      `;

      headerEl.addEventListener("click", () => {
        const currentlyExpanded = accordionEl.classList.contains("expanded");
        if (currentlyExpanded) {
          accordionEl.classList.remove("expanded");
          expandedCategoryIds.delete(catId);
        } else {
          accordionEl.classList.add("expanded");
          expandedCategoryIds.add(catId);
        }
        setExpandedCategories(Array.from(expandedCategoryIds));
      });

      const bodyEl = document.createElement("div");
      bodyEl.className = "accordion-body";

      group.bookmarks.forEach((bm) => {
        const itemEl = createBookmarkItemEl(bm);
        bodyEl.appendChild(itemEl);
      });

      accordionEl.appendChild(headerEl);
      accordionEl.appendChild(bodyEl);
      accordionContainer.appendChild(accordionEl);
    }

    if (!hasRenderedGroup) {
      emptyTitle.textContent = "No Search Results";
      emptyDesc.textContent = `No bookmarks match "${searchQuery}".`;
      showStateView("empty");
    }
  }

  // Create Bookmark Row Element
  function createBookmarkItemEl(bm) {
    const domain = getDomainFromUrl(bm.url);
    const faviconUrl = bm.favicon || getDomainFavicon(bm.url);

    const itemEl = document.createElement("div");
    itemEl.className = "bookmark-item";
    itemEl.title = `${bm.title}\n${bm.url}`;

    itemEl.innerHTML = `
      <div class="item-left">
        <img class="item-favicon" src="${escapeHtml(faviconUrl)}" alt="">
        <div class="item-details">
          <span class="item-title">${escapeHtml(bm.title)}</span>
          <span class="item-domain">${escapeHtml(domain)}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="item-action-btn open-newtab-btn" title="Open in New Tab">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        <button class="item-action-btn copy-url-btn" title="Copy Link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="item-action-btn delete-btn" title="Delete Bookmark">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    const imgEl = itemEl.querySelector(".item-favicon");
    imgEl.onerror = () => {
      imgEl.src = getDomainFavicon(bm.url);
    };

    // Primary Click Action: Open URL in current active tab using Tabs API
    itemEl.addEventListener("click", (e) => {
      if (e.target.closest(".item-actions")) return;

      if (e.ctrlKey || e.metaKey || e.button === 1) {
        chrome.tabs.create({ url: bm.url, active: false });
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.update(tabs[0].id, { url: bm.url });
          } else {
            chrome.tabs.create({ url: bm.url });
          }
        }).catch(() => {
          chrome.tabs.create({ url: bm.url });
        });
      }
    });

    const openNewTabBtn = itemEl.querySelector(".open-newtab-btn");
    openNewTabBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: bm.url });
    });

    const copyUrlBtn = itemEl.querySelector(".copy-url-btn");
    copyUrlBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(bm.url);
      showToast("Link copied to clipboard!", "success");
    });

    const deleteBtn = itemEl.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete bookmark "${bm.title}"?`)) return;

      allBookmarks = allBookmarks.filter((b) => b.id !== bm.id);
      await setCachedBookmarks(allBookmarks);
      renderAccordion();

      try {
        await deleteBookmark(bm.id);
        showToast("Bookmark deleted", "success");
      } catch (err) {
        showToast(err.message || "Failed to delete bookmark", "error");
        refreshData(false);
      }
    });

    return itemEl;
  }

  // Background Messages
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "BOOKMARKS_UPDATED") {
      refreshData(false);
    }
  });

  // Sub-view Switcher inside Main Content
  function showStateView(viewName) {
    loadingView.classList.add("hidden");
    accordionContainer.classList.add("hidden");
    emptyView.classList.add("hidden");
    errorView.classList.add("hidden");
    unauthView.classList.add("hidden");

    if (viewName === "loading") loadingView.classList.remove("hidden");
    if (viewName === "accordion") accordionContainer.classList.remove("hidden");
    if (viewName === "empty") emptyView.classList.remove("hidden");
    if (viewName === "error") errorView.classList.remove("hidden");
    if (viewName === "unauth") unauthView.classList.remove("hidden");
  }

  // Toast Notification
  function showToast(message, type = "info") {
    sidepanelToast.textContent = message;
    sidepanelToast.className = `toast-banner ${type}`;
    sidepanelToast.classList.remove("hidden");

    setTimeout(() => {
      sidepanelToast.classList.add("hidden");
    }, 3000);
  }

  function getDomainFromUrl(urlStr) {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return urlStr || "";
    }
  }

  function getDomainFavicon(urlStr) {
    try {
      const domain = new URL(urlStr).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return "";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
