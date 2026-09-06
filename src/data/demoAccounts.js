/** Dev-only demo accounts — never imported by production UI. */
export const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
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
    ]
  : [];

export function findDemoAccount(email, password) {
  return DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
  );
}
