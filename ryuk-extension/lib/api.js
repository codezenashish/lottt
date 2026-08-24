/**
 * API Integration Library for Devnest Extension
 */

import { getSettings } from "./storage.js";

async function getHeaders() {
  const { apiKey } = await getSettings();
  if (!apiKey) {
    throw new Error("UNAUTHENTICATED");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

export async function fetchBookmarks() {
  const { serverUrl } = await getSettings();
  const headers = await getHeaders();
  
  // Try standard GET /api/bookmark first, fallback to /api/bookmark/external
  let res = await fetch(`${serverUrl}/api/bookmark`, { headers });
  if (res.status === 404) {
    res = await fetch(`${serverUrl}/api/bookmark/external`, { headers });
  }

  if (res.status === 401) {
    const err = new Error("Unauthorized. Please check your API Key in options.");
    err.unauthenticated = true;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch bookmarks (${res.status})`);
  }

  const data = await res.json();
  return data.bookmarks || [];
}

export async function fetchCategories() {
  const { serverUrl } = await getSettings();
  const headers = await getHeaders();

  const res = await fetch(`${serverUrl}/api/category`, { headers });
  if (res.status === 401) {
    const err = new Error("Unauthorized. Please check your API Key in options.");
    err.unauthenticated = true;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch categories (${res.status})`);
  }

  const data = await res.json();
  return data.categories || [];
}

export async function createBookmark({ title, url, description, categoryId, categoryName, favicon }) {
  const { serverUrl } = await getSettings();
  const headers = await getHeaders();

  const payload = {
    title,
    url,
    description: description || null,
    categoryId: categoryId || null,
    categoryName: categoryName || null,
    favicon: favicon || null,
  };

  let res = await fetch(`${serverUrl}/api/bookmark`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 404) {
    res = await fetch(`${serverUrl}/api/bookmark/external`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (res.status === 401) {
    const err = new Error("Unauthorized. Please check your API Key.");
    err.unauthenticated = true;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to create bookmark (${res.status})`);
  }

  return data.bookmark || data;
}

export async function deleteBookmark(id) {
  const { serverUrl } = await getSettings();
  const headers = await getHeaders();

  const res = await fetch(`${serverUrl}/api/bookmark/${id}`, {
    method: "DELETE",
    headers,
  });

  if (res.status === 401) {
    const err = new Error("Unauthorized. Please check your API Key.");
    err.unauthenticated = true;
    throw err;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to delete bookmark (${res.status})`);
  }

  return true;
}

export async function createCategory({ name, color, icon }) {
  const { serverUrl } = await getSettings();
  const headers = await getHeaders();

  const res = await fetch(`${serverUrl}/api/category`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, color: color || "#6366F1", icon: icon || "RiFolder5Line" }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to create category (${res.status})`);
  }

  const data = await res.json();
  return data.category;
}

export async function saveNoteSelection(payload) {
  const { serverUrl } = await getSettings();
  const headers = await getHeaders();

  let res = await fetch(`${serverUrl}/api/note/external`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 404) {
    res = await fetch(`${serverUrl}/api/notes/external`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to save note (${res.status})`);
  }

  return data;
}
