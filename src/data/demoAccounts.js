/** Demo / seed accounts for the Spring Boot API. */
export const DEMO_ACCOUNTS = [
  {
    email: "user@wandr.test",
    password: "wandr123",
    displayName: "Aanya Explorer",
    role: "user",
    uid: "demo-user",
  },
  {
    email: "owner@wandr.test",
    password: "wandr123",
    displayName: "Rahul Owner",
    role: "owner",
    uid: "demo-owner",
  },
  {
    email: "admin@wandr.test",
    password: "wandr123",
    displayName: "Kajal Admin",
    role: "admin",
    uid: "demo-admin",
  },
];

const SESSION_KEY = "wandr_demo_session";

export function findDemoAccount(email, password) {
  return DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
  );
}

export function toDemoUser(account) {
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    isDemo: true,
  };
}

export function saveDemoSession(account) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email: account.email, uid: account.uid })
  );
}

export function loadDemoSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { email } = JSON.parse(raw);
    return DEMO_ACCOUNTS.find((a) => a.email === email) || null;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  localStorage.removeItem(SESSION_KEY);
}
