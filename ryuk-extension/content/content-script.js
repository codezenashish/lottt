/**
 * Devnest Content Script
 * Captures webpage selection anchors & renders in-page toast notifications.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_SELECTION_ANCHOR") {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      sendResponse(null);
      return true;
    }

    try {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      if (!selectedText) {
        sendResponse(null);
        return true;
      }

      // Context prefix & suffix extraction
      const containerNode = range.commonAncestorContainer;
      const fullText = containerNode.textContent || "";
      const startOffset = Math.max(0, range.startOffset);
      const endOffset = Math.min(fullText.length, range.endOffset);

      const prefix = fullText.substring(Math.max(0, startOffset - 50), startOffset);
      const suffix = fullText.substring(endOffset, Math.min(fullText.length, endOffset + 50));
      const selector = getCssSelector(range.startContainer.parentElement);

      sendResponse({
        selectedText,
        prefix,
        suffix,
        selector,
        startOffset,
        endOffset,
        url: window.location.href,
        title: document.title,
      });
    } catch {
      sendResponse({
        selectedText: selection.toString().trim(),
        url: window.location.href,
        title: document.title,
      });
    }
    return true;
  }

  if (request.action === "SHOW_TOAST") {
    showInPageToast(request.message, request.toastType || "info");
    sendResponse({ success: true });
    return false;
  }
});

function getCssSelector(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
  if (el.id) return `#${el.id}`;
  if (el === document.body) return "body";
  const path = [];
  while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
    let selector = el.nodeName.toLowerCase();
    if (el.className && typeof el.className === "string") {
      const classes = el.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.slice(0, 2).join(".")}`;
      }
    }
    path.unshift(selector);
    el = el.parentElement;
  }
  return path.join(" > ");
}

function showInPageToast(message, type = "info") {
  const existing = document.getElementById("devnest-toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "devnest-toast-notification";
  toast.className = `devnest-toast devnest-toast-${type}`;

  const iconSvg = type === "success" 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      ${iconSvg}
      <span style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:500;color:#f8fafc;line-height:1.4;">${escapeHtml(message)}</span>
    </div>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("devnest-toast-visible"), 10);

  setTimeout(() => {
    toast.classList.remove("devnest-toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
