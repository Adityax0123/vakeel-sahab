// Shared API helper for all frontend pages.
// Set this to wherever the backend is deployed (or http://localhost:5000 for local dev).
const API_BASE = window.API_BASE || 'http://localhost:5050/api';

function getToken() {
  return localStorage.getItem('vs_token');
}
function getUser() {
  const raw = localStorage.getItem('vs_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('vs_token', token);
  localStorage.setItem('vs_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('vs_token');
  localStorage.removeItem('vs_user');
}

// Redirects to login.html if there's no session, or to the correct
// dashboard if the logged-in user's role doesn't match the page they're on.
function guardPage(requiredRole) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = 'login.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = `dashboard-${user.role}.html`;
    return null;
  }
  return user;
}

async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      window.location.href = 'login.html';
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
