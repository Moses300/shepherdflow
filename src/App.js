import { useState, useEffect, useCallback } from "react";

// ─── Supabase Config ────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bbbxhrnytijrzvashqqu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnhocm55dGlqcnp2YXNocXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDE2MTUsImV4cCI6MjA4NzY3NzYxNX0.ncL-SNENbniBuZ6qDvfae4bQ968dn1W4XLY1FgDn4EU";

// ─── Auth API ────────────────────────────────────────────────────────────────
const auth = {
  async signUp(email, password, fullName) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: { full_name: fullName } })
    });
    return res.json();
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  async signOut(accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    });
  },
  async getUser(accessToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    });
    return res.json();
  }
};

// ─── DB API (token-aware) ────────────────────────────────────────────────────
function makeDb(token) {
  const headers = (extra = {}) => ({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra
  });
  return {
    async get(table, params = "") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: headers() });
      return res.json();
    },
    async post(table, body) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: headers({ Prefer: "return=representation" }),
        body: JSON.stringify(body)
      });
      return res.json();
    },
    async patch(table, filter, body) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
        method: "PATCH",
        headers: headers({ Prefer: "return=representation" }),
        body: JSON.stringify(body)
      });
      return res.json();
    },
    async delete(table, filter) {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
        method: "DELETE",
        headers: headers()
      });
    },
    async upsert(table, body) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: headers({ Prefer: "return=representation,resolution=merge-duplicates" }),
        body: JSON.stringify(body)
      });
      return res.json();
    }
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DEPTS = ["None","Choir","Ushering","Media","Protocol","Children","Youth"];
const TAG_OPTIONS = [
  { key: "prayer", label: "Prayer Request", cls: "tag-prayer" },
  { key: "visit", label: "Needs Visit", cls: "tag-visit" },
  { key: "call", label: "Needs Call", cls: "tag-call" },
  { key: "firsttime", label: "First-Time", cls: "tag-firsttime" },
  { key: "newconvert", label: "New Convert", cls: "tag-newconvert" },
];
const ROLES = ["admin", "pastor", "worker", "viewer"];
const ROLE_COLORS = { admin: "#4A5635", pastor: "#6B7C4E", worker: "#C8813A", viewer: "#8B5E3C" };

const getWeeks = () => {
  const weeks = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }));
  }
  return weeks;
};
const WEEKS = getWeeks();

// ─── Styles ───────────────────────────────────────────────────────────────────
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Lato:wght@300;400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #F5EFE0; --linen: #EDE4CE; --sand: #D9C9A3;
    --olive: #6B7C4E; --olive-dark: #4A5635; --amber: #C8813A;
    --amber-light: #E8A55A; --brown: #6B4226; --brown-light: #8B5E3C;
    --text: #2C1810; --text-muted: #7A6552; --white: #FFFDF8;
    --shadow: rgba(44,24,16,0.12);
    --red: #C0392B; --red-light: rgba(192,57,43,0.1);
    --blue: #2980B9; --blue-light: rgba(41,128,185,0.1);
    --purple: #7B5EA7; --purple-light: rgba(123,94,167,0.1);
  }
  body { background: var(--cream); font-family: 'Lato', sans-serif; color: var(--text); min-height: 100vh; }

  /* ── Auth Screen ── */
  .auth-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at 20% 30%, rgba(107,124,78,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(200,129,58,0.12) 0%, transparent 60%), var(--cream); padding: 24px; }
  .auth-card { background: var(--white); border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 8px 40px rgba(44,24,16,0.15); border: 1px solid rgba(217,201,163,0.5); }
  .auth-logo { text-align: center; margin-bottom: 28px; }
  .auth-logo-icon { width: 56px; height: 56px; background: var(--amber); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 12px; }
  .auth-logo-name { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--olive-dark); }
  .auth-logo-sub { color: var(--text-muted); font-size: 0.75rem; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .auth-tabs { display: flex; gap: 4px; background: var(--linen); border-radius: 10px; padding: 4px; margin-bottom: 24px; }
  .auth-tab { flex: 1; padding: 8px; border: none; border-radius: 8px; background: transparent; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); transition: all 0.2s; }
  .auth-tab.active { background: var(--white); color: var(--olive-dark); box-shadow: 0 1px 6px rgba(44,24,16,0.1); }
  .auth-divider { text-align: center; color: var(--text-muted); font-size: 0.78rem; margin: 16px 0; position: relative; }
  .auth-divider::before, .auth-divider::after { content: ''; position: absolute; top: 50%; width: 42%; height: 1px; background: var(--sand); }
  .auth-divider::before { left: 0; } .auth-divider::after { right: 0; }
  .org-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--linen); }
  .org-section-title { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  .org-code-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; }

  /* ── App Layout ── */
  .app { display: flex; min-height: 100vh; background: radial-gradient(ellipse at 10% 20%, rgba(107,124,78,0.08) 0%, transparent 60%), radial-gradient(ellipse at 90% 80%, rgba(200,129,58,0.08) 0%, transparent 60%), var(--cream); }
  .sidebar { width: 240px; min-height: 100vh; background: var(--olive-dark); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; }
  .sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center; }
  .logo-icon { width: 44px; height: 44px; background: var(--amber); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 20px; }
  .logo-name { font-family: 'Playfair Display', serif; color: var(--cream); font-size: 1.2rem; font-weight: 700; }
  .logo-sub { color: rgba(255,255,255,0.45); font-size: 0.68rem; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .org-badge { margin-top: 8px; background: rgba(200,129,58,0.2); border: 1px solid rgba(200,129,58,0.3); border-radius: 6px; padding: 4px 10px; display: inline-block; font-size: 0.7rem; color: var(--amber-light); letter-spacing: 0.5px; }
  .nav { padding: 16px 0; flex: 1; }
  .nav-label { color: rgba(255,255,255,0.3); font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; padding: 0 24px; margin: 16px 0 6px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 24px; color: rgba(255,255,255,0.65); cursor: pointer; font-size: 0.88rem; transition: all 0.2s; border-left: 3px solid transparent; }
  .nav-item:hover { color: var(--cream); background: rgba(255,255,255,0.06); }
  .nav-item.active { color: var(--amber-light); background: rgba(200,129,58,0.12); border-left-color: var(--amber); font-weight: 600; }
  .sidebar-user { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.1); }
  .sidebar-user-info { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .sidebar-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--olive), var(--amber)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.78rem; flex-shrink: 0; }
  .sidebar-user-name { font-size: 0.82rem; font-weight: 600; color: var(--cream); line-height: 1.2; }
  .sidebar-user-role { font-size: 0.68rem; color: rgba(255,255,255,0.4); letter-spacing: 0.5px; }
  .signout-btn { width: 100%; padding: 7px; border: 1px solid rgba(255,255,255,0.15); border-radius: 7px; background: transparent; color: rgba(255,255,255,0.5); font-family: 'Lato', sans-serif; font-size: 0.78rem; cursor: pointer; transition: all 0.2s; }
  .signout-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
  .main { flex: 1; padding: 32px 36px; overflow-y: auto; }
  .page-header { margin-bottom: 28px; }
  .page-title { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 700; color: var(--olive-dark); }
  .page-sub { color: var(--text-muted); font-size: 0.88rem; margin-top: 4px; }

  /* ── Cards ── */
  .card { background: var(--white); border-radius: 14px; padding: 24px; box-shadow: 0 2px 12px var(--shadow); border: 1px solid rgba(217,201,163,0.4); }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 600; color: var(--olive-dark); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--linen); }

  /* ── Stats ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--white); border-radius: 14px; padding: 20px; box-shadow: 0 2px 12px var(--shadow); border: 1px solid rgba(217,201,163,0.4); position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gradient, var(--olive)); }
  .stat-label { font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
  .stat-value { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: var(--text); margin: 6px 0 4px; }
  .stat-change { font-size: 0.78rem; color: var(--olive); font-weight: 600; }

  /* ── Dashboard Quick Actions ── */
  .quick-actions { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .quick-action-btn { display: flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 10px; border: 1.5px solid; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; }
  .qa-primary { background: var(--olive-dark); color: var(--cream); border-color: var(--olive-dark); }
  .qa-primary:hover { background: var(--olive); border-color: var(--olive); }
  .qa-secondary { background: transparent; color: var(--olive-dark); border-color: var(--sand); }
  .qa-secondary:hover { background: var(--linen); }

  /* ── Today's Tasks ── */
  .tasks-panel { background: linear-gradient(135deg, var(--olive-dark), #3a4429); border-radius: 14px; padding: 22px; color: var(--cream); margin-bottom: 24px; }
  .tasks-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 600; margin-bottom: 14px; opacity: 0.9; display: flex; align-items: center; gap: 8px; }
  .task-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .task-item:last-child { border-bottom: none; }
  .task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .task-text { font-size: 0.85rem; opacity: 0.85; }
  .task-count { background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; margin-left: auto; }

  /* ── Dashboard Grid ── */
  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* ── Tables ── */
  .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .table th { text-align: left; padding: 8px 12px; background: var(--linen); color: var(--text-muted); font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
  .table th:first-child { border-radius: 8px 0 0 8px; } .table th:last-child { border-radius: 0 8px 8px 0; }
  .table td { padding: 11px 12px; border-bottom: 1px solid rgba(217,201,163,0.3); color: var(--text); }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: rgba(237,228,206,0.3); }

  /* ── Badges ── */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 600; }
  .badge-active { background: rgba(107,124,78,0.15); color: var(--olive-dark); }
  .badge-inactive { background: rgba(200,129,58,0.15); color: var(--brown); }
  .badge-visitor { background: rgba(107,66,38,0.1); color: var(--brown-light); }
  .badge-new { background: rgba(200,129,58,0.2); color: var(--amber); }
  .badge-role { padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: white; }

  /* ── Forms ── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
  .form-input, .form-select, .form-textarea { padding: 10px 14px; border: 1.5px solid var(--sand); border-radius: 8px; background: var(--cream); color: var(--text); font-family: 'Lato', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--olive); background: var(--white); }
  .form-textarea { resize: vertical; min-height: 80px; }

  /* ── Buttons ── */
  .btn { padding: 10px 22px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Lato', sans-serif; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--olive-dark); color: var(--cream); }
  .btn-primary:hover { background: var(--olive); }
  .btn-secondary { background: var(--linen); color: var(--text); }
  .btn-secondary:hover { background: var(--sand); }
  .btn-danger { background: rgba(192,57,43,0.1); color: var(--red); border: 1px solid rgba(192,57,43,0.3); }
  .btn-danger:hover { background: rgba(192,57,43,0.2); }
  .btn-sm { padding: 6px 14px; font-size: 0.78rem; }
  .btn-xs { padding: 4px 10px; font-size: 0.72rem; }
  .btn-row { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Next-Action buttons ── */
  .action-btns { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
  .action-btn { padding: 5px 12px; border-radius: 7px; border: 1.5px solid; font-family: 'Lato', sans-serif; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  .ab-call { color: var(--olive-dark); border-color: var(--olive); background: rgba(107,124,78,0.08); }
  .ab-call:hover { background: var(--olive); color: white; }
  .ab-whatsapp { color: #1a7a4a; border-color: #1a7a4a; background: rgba(26,122,74,0.08); }
  .ab-whatsapp:hover { background: #1a7a4a; color: white; }
  .ab-visit { color: var(--amber); border-color: var(--amber); background: rgba(200,129,58,0.08); }
  .ab-visit:hover { background: var(--amber); color: white; }
  .ab-resolve { color: var(--text-muted); border-color: var(--sand); background: transparent; }
  .ab-resolve:hover { background: var(--linen); }
  .ab-snooze { color: var(--purple); border-color: var(--purple); background: rgba(123,94,167,0.08); }
  .ab-snooze:hover { background: var(--purple); color: white; }

  /* ── Follow-up CRM ── */
  .followup-card { background: var(--white); border-radius: 14px; padding: 20px 22px; box-shadow: 0 2px 12px var(--shadow); border: 1px solid rgba(217,201,163,0.4); margin-bottom: 12px; }
  .priority-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; }
  .p-high { background: var(--red); }
  .p-medium { background: var(--amber); }
  .p-low { background: var(--olive); }
  .status-pill { padding: 3px 10px; border-radius: 99px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .s-open { background: rgba(200,129,58,0.15); color: var(--amber); }
  .s-inprogress { background: rgba(41,128,185,0.12); color: var(--blue); }
  .s-completed { background: rgba(107,124,78,0.15); color: var(--olive-dark); }

  /* ── Member row ── */
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(217,201,163,0.3); }
  .member-row:last-child { border-bottom: none; }
  .member-info { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--olive), var(--amber)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
  .member-name { font-weight: 600; font-size: 0.9rem; }
  .member-dept { font-size: 0.75rem; color: var(--text-muted); }

  /* ── Toggle ── */
  .toggle-btn { width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: background 0.2s; background: var(--sand); }
  .toggle-btn.on { background: var(--olive); }
  .toggle-btn::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  .toggle-btn.on::after { transform: translateX(20px); }

  /* ── Tags ── */
  .tag { padding: 5px 12px; border-radius: 99px; font-size: 0.78rem; font-weight: 600; border: 1.5px solid; cursor: pointer; transition: all 0.15s; }
  .tag.selected { color: white !important; }
  .tag-prayer { color: var(--olive-dark); border-color: var(--olive); } .tag-prayer.selected { background: var(--olive); }
  .tag-visit { color: var(--amber); border-color: var(--amber); } .tag-visit.selected { background: var(--amber); }
  .tag-call { color: var(--brown); border-color: var(--brown); } .tag-call.selected { background: var(--brown); }
  .tag-firsttime { color: #7B5EA7; border-color: #7B5EA7; } .tag-firsttime.selected { background: #7B5EA7; }
  .tag-newconvert { color: #C05C2A; border-color: #C05C2A; } .tag-newconvert.selected { background: #C05C2A; }
  .tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

  /* ── Alerts ── */
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; }
  .alert-success { background: rgba(107,124,78,0.12); color: var(--olive-dark); border: 1px solid rgba(107,124,78,0.3); }
  .alert-error { background: rgba(200,80,50,0.1); color: #a03020; border: 1px solid rgba(200,80,50,0.3); }
  .alert-info { background: var(--blue-light); color: var(--blue); border: 1px solid rgba(41,128,185,0.3); }
  .alert-warning { background: rgba(200,129,58,0.12); color: var(--brown); border: 1px solid rgba(200,129,58,0.3); }

  /* ── Search / Filter ── */
  .search-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .search-input { flex: 1; min-width: 200px; padding: 10px 16px; border: 1.5px solid var(--sand); border-radius: 8px; background: var(--white); font-family: 'Lato', sans-serif; font-size: 0.9rem; outline: none; }
  .search-input:focus { border-color: var(--olive); }
  .filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

  /* ── Week selector ── */
  .week-selector { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; background: var(--white); padding: 10px 16px; border-radius: 10px; border: 1px solid var(--sand); width: fit-content; }
  .week-label { font-weight: 600; font-size: 0.9rem; color: var(--olive-dark); }

  /* ── Role guard ── */
  .role-guard { background: var(--linen); border-radius: 14px; padding: 48px; text-align: center; border: 1.5px dashed var(--sand); }
  .role-guard-icon { font-size: 2.5rem; margin-bottom: 12px; }
  .role-guard-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: var(--text-muted); margin-bottom: 8px; }
  .role-guard-sub { font-size: 0.85rem; color: var(--text-muted); }

  /* ── Team members ── */
  .team-section { margin-top: 20px; }
  .team-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(217,201,163,0.3); }
  .team-row:last-child { border-bottom: none; }

  /* ── Misc ── */
  .loader { text-align: center; padding: 60px; color: var(--text-muted); font-size: 0.95rem; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 600; color: var(--olive-dark); }
  .empty-state { text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.85rem; }
  .divider { height: 1px; background: var(--linen); margin: 20px 0; }
  select.form-select option { font-family: 'Lato', sans-serif; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const initials = (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function RoleGuard({ role, allowed, children }) {
  if (!allowed.includes(role)) {
    return (
      <div className="role-guard">
        <div className="role-guard-icon">🔒</div>
        <div className="role-guard-title">Access Restricted</div>
        <div className="role-guard-sub">Your role ({role}) does not have permission to view this page.</div>
      </div>
    );
  }
  return children;
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", orgName: "", orgCode: "", createOrg: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const h = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSignIn = async () => {
    if (!form.email || !form.password) return setError("Email and password required.");
    setLoading(true); setError("");
    const res = await auth.signIn(form.email, form.password);
    if (res.error) { setError(res.error.message || "Sign in failed."); setLoading(false); return; }
    // Get user profile + org membership
    const db = makeDb(res.access_token);
    const profile = await db.get("profiles", `id=eq.${res.user.id}&select=*`);
    const orgMember = await db.get("organization_members", `user_id=eq.${res.user.id}&select=*,organizations(*)`);
    if (!orgMember || orgMember.length === 0) {
      setError("No church organization found for this account. Please sign up first.");
      setLoading(false); return;
    }
    const om = orgMember[0];
    onAuth({ user: res.user, token: res.access_token, org: om.organizations, role: om.role, profile: profile[0] });
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!form.email || !form.password || !form.fullName) return setError("Name, email, and password required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.createOrg && !form.orgName) return setError("Church name is required.");
    if (!form.createOrg && !form.orgCode) return setError("Church code is required to join.");
    setLoading(true); setError("");

    const res = await auth.signUp(form.email, form.password, form.fullName);
    if (res.error) { setError(res.error.message || "Sign up failed."); setLoading(false); return; }

    // Sign in immediately to get token
    const signIn = await auth.signIn(form.email, form.password);
    if (signIn.error) {
      setInfo("Account created! Please check your email to confirm, then sign in.");
      setTab("signin"); setLoading(false); return;
    }

    const db = makeDb(signIn.access_token);

    // Create or find profile
    await db.upsert("profiles", { id: signIn.user.id, full_name: form.fullName, email: form.email });

    let orgId;
    if (form.createOrg) {
      const code = form.orgName.toLowerCase().replace(/\s+/g, "-").slice(0, 20) + "-" + Math.random().toString(36).slice(2, 6);
      const orgRes = await db.post("organizations", { name: form.orgName, code });
      if (!orgRes || !orgRes[0]) { setError("Failed to create church. Try again."); setLoading(false); return; }
      orgId = orgRes[0].id;
      await db.post("organization_members", { user_id: signIn.user.id, org_id: orgId, role: "admin" });
      const org = orgRes[0];
      onAuth({ user: signIn.user, token: signIn.access_token, org, role: "admin", profile: { full_name: form.fullName } });
    } else {
      const orgs = await db.get("organizations", `code=eq.${form.orgCode.trim()}`);
      if (!orgs || orgs.length === 0) { setError("Church code not found. Check and try again."); setLoading(false); return; }
      orgId = orgs[0].id;
      await db.post("organization_members", { user_id: signIn.user.id, org_id: orgId, role: "worker" });
      onAuth({ user: signIn.user, token: signIn.access_token, org: orgs[0], role: "worker", profile: { full_name: form.fullName } });
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🕊️</div>
          <div className="auth-logo-name">ShepherdFlow</div>
          <div className="auth-logo-sub">Church Management</div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "signin" ? "active" : ""}`} onClick={() => { setTab("signin"); setError(""); }}>Sign In</button>
          <button className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setError(""); }}>Sign Up</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {info && <div className="alert alert-success">✅ {info}</div>}

        {tab === "signin" && (
          <div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => h("email", e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => h("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignIn()} />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSignIn} disabled={loading}>
              {loading ? "⏳ Signing in..." : "Sign In →"}
            </button>
          </div>
        )}

        {tab === "signup" && (
          <div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="e.g. Pastor James Adeyemi" value={form.fullName} onChange={e => h("fullName", e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => h("email", e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => h("password", e.target.value)} />
            </div>

            <div className="org-section">
              <div className="org-section-title">Church / Organization</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button className={`btn btn-sm ${form.createOrg ? "btn-primary" : "btn-secondary"}`} onClick={() => h("createOrg", true)}>🏛️ Create New</button>
                <button className={`btn btn-sm ${!form.createOrg ? "btn-primary" : "btn-secondary"}`} onClick={() => h("createOrg", false)}>🔗 Join Existing</button>
              </div>
              {form.createOrg ? (
                <div className="form-group">
                  <label className="form-label">Church Name</label>
                  <input className="form-input" placeholder="e.g. Grace Bible Church" value={form.orgName} onChange={e => h("orgName", e.target.value)} />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Church Code</label>
                  <input className="form-input" placeholder="e.g. grace-bible-ab12" value={form.orgCode} onChange={e => h("orgCode", e.target.value)} />
                  <div className="org-code-hint">Ask your church admin for the code.</div>
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 20 }} onClick={handleSignUp} disabled={loading}>
              {loading ? "⏳ Creating account..." : form.createOrg ? "Create Church Account →" : "Join Church →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ members, tags, role, profile, org, setPage }) {
  const active = members.filter(m => m.status === "active").length;
  const inactive = members.filter(m => m.status === "inactive").length;
  const visitors = members.filter(m => m.type === "visitor").length;
  const recent = [...members].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const withTags = members.filter(m => (tags[m.id] || []).length > 0).slice(0, 6);

  const thisMonth = members.filter(m => {
    const d = new Date(m.join_date || m.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const firstTimers = members.filter(m => (tags[m.id] || []).includes("firsttime")).length;
  const needsCall = members.filter(m => (tags[m.id] || []).includes("call")).length;
  const birthdays = 0; // placeholder

  const isAdmin = ["admin", "pastor"].includes(role);
  const isWorker = role === "worker";

  // Worker personal view
  if (isWorker) {
    const myTags = members.filter(m => (tags[m.id] || []).length > 0);
    return (
      <div>
        <div className="page-header">
          <div className="page-title">My Dashboard</div>
          <div className="page-sub">Welcome back, {profile?.full_name?.split(" ")[0] || "Worker"} 👋</div>
        </div>
        <div className="tasks-panel">
          <div className="tasks-title">📋 Your Tasks Today</div>
          {needsCall > 0 && <div className="task-item"><div className="task-dot" style={{ background: "#e74c3c" }} /><div className="task-text">Members needing a call</div><div className="task-count">{needsCall}</div></div>}
          {firstTimers > 0 && <div className="task-item"><div className="task-dot" style={{ background: "#e8a55a" }} /><div className="task-text">First-timers to follow up</div><div className="task-count">{firstTimers}</div></div>}
          {myTags.length === 0 && <div className="task-item"><div className="task-dot" style={{ background: "#6B7C4E" }} /><div className="task-text">No pending tasks — you're all caught up! 🎉</div></div>}
        </div>
        <div className="card">
          <div className="card-title">Follow-Up Queue</div>
          {myTags.length === 0 ? <div className="empty-state">No members tagged yet.</div> : myTags.slice(0, 5).map(m => (
            <div className="member-row" key={m.id}>
              <div className="member-info">
                <Avatar name={m.name} />
                <div><div className="member-name">{m.name}</div><div className="member-dept">{m.phone}</div></div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(tags[m.id] || []).map(t => {
                  const opt = TAG_OPTIONS.find(o => o.key === t);
                  return <span key={t} className="badge badge-inactive" style={{ fontSize: "0.65rem" }}>{opt?.label}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Admin / Pastor view
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">{new Date().toDateString()} · Welcome back, {profile?.full_name?.split(" ")[0] || "Admin"}!</div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="quick-action-btn qa-primary" onClick={() => setPage("register")}>✍️ Register Member</button>
        <button className="quick-action-btn qa-primary" onClick={() => setPage("attendance")}>📋 Record Attendance</button>
        <button className="quick-action-btn qa-primary" onClick={() => setPage("followup")}>🏷️ Follow-Up</button>
        <button className="quick-action-btn qa-secondary" onClick={() => setPage("team")}>👥 Manage Team</button>
      </div>

      {/* Today's Tasks */}
      <div className="tasks-panel">
        <div className="tasks-title">📋 Today's Tasks</div>
        {needsCall > 0 && <div className="task-item"><div className="task-dot" style={{ background: "#e74c3c" }} /><div className="task-text">Members needing a call</div><div className="task-count">{needsCall}</div></div>}
        {firstTimers > 0 && <div className="task-item"><div className="task-dot" style={{ background: "#e8a55a" }} /><div className="task-text">First-timer follow-ups</div><div className="task-count">{firstTimers}</div></div>}
        {birthdays > 0 && <div className="task-item"><div className="task-dot" style={{ background: "#9b59b6" }} /><div className="task-text">Birthdays this week</div><div className="task-count">{birthdays}</div></div>}
        {needsCall === 0 && firstTimers === 0 && <div className="task-item"><div className="task-dot" style={{ background: "#6B7C4E" }} /><div className="task-text">All clear! No pending follow-ups. 🎉</div></div>}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total Members", value: members.length, change: `+${thisMonth} this month`, color: "linear-gradient(90deg,#6B7C4E,#8B9E60)" },
          { label: "Active", value: active, change: members.length ? `${Math.round(active / members.length * 100)}% of congregation` : "—", color: "linear-gradient(90deg,#4A5635,#6B7C4E)" },
          { label: "Inactive", value: inactive, change: "Need follow-up", color: "linear-gradient(90deg,#C8813A,#E8A55A)" },
          { label: "Visitors", value: visitors, change: `${firstTimers} first-timers`, color: "linear-gradient(90deg,#6B4226,#8B5E3C)" },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ "--gradient": s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">Recent Additions</div>
          {recent.length === 0
            ? <div className="empty-state">No members yet. Register your first member!</div>
            : <table className="table">
              <thead><tr><th>Name</th><th>Type</th><th>Joined</th></tr></thead>
              <tbody>
                {recent.map(m => (
                  <tr key={m.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={m.name} />{m.name}</div></td>
                    <td><span className={`badge ${m.type === "visitor" ? "badge-visitor" : "badge-active"}`}>{m.type}</span></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{m.join_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>

        <div className="card">
          <div className="card-title">Needs Follow-Up</div>
          {withTags.length === 0
            ? <div className="empty-state">No follow-up tags yet.</div>
            : withTags.map(m => (
              <div className="member-row" key={m.id}>
                <div className="member-info">
                  <Avatar name={m.name} />
                  <div>
                    <div className="member-name">{m.name}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                      {(tags[m.id] || []).map(t => {
                        const opt = TAG_OPTIONS.find(o => o.key === t);
                        return <span key={t} className="badge" style={{ background: "rgba(107,124,78,0.1)", color: "var(--olive-dark)", fontSize: "0.65rem" }}>{opt?.label}</span>;
                      })}
                    </div>
                    <div className="action-btns">
                      {m.phone && <button className="action-btn ab-call" onClick={() => window.open(`tel:${m.phone}`)}>📞 Call</button>}
                      {m.phone && <button className="action-btn ab-whatsapp" onClick={() => window.open(`https://wa.me/${m.phone?.replace(/\D/g, "")}`)}>💬 WhatsApp</button>}
                      <button className="action-btn ab-visit">🏠 Visit</button>
                      <button className="action-btn ab-snooze">⏰ Snooze</button>
                    </div>
                  </div>
                </div>
                <span className={`badge ${m.status === "active" ? "badge-active" : "badge-inactive"}`}>{m.status}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────
function Registration({ onAdd, orgId, db, role }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", dept: "None", type: "member", notes: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const h = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.phone) return setError("Name and phone are required.");
    if (!["admin", "pastor", "worker"].includes(role)) return setError("You don't have permission to register members.");
    setLoading(true); setError("");
    try {
      const result = await db.post("members", {
        name: form.name, phone: form.phone, email: form.email,
        dept: form.dept, type: form.type, status: "active",
        notes: form.notes, join_date: new Date().toISOString().split("T")[0],
        org_id: orgId
      });
      if (result && result[0]) {
        onAdd(result[0]);
        setForm({ name: "", phone: "", email: "", dept: "None", type: "member", notes: "" });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else { setError("Something went wrong. Please try again."); }
    } catch (e) { setError("Connection error."); }
    setLoading(false);
  };

  return (
    <RoleGuard role={role} allowed={["admin", "pastor", "worker"]}>
      <div>
        <div className="page-header">
          <div className="page-title">Member Registration</div>
          <div className="page-sub">Register a new member or first-time visitor</div>
        </div>
        <div className="card">
          <div className="card-title">New Registration Form</div>
          {success && <div className="alert alert-success">✅ Member registered successfully!</div>}
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="e.g. Adaeze Okonkwo" value={form.name} onChange={e => h("name", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Phone Number *</label><input className="form-input" placeholder="08012345678" value={form.phone} onChange={e => h("phone", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" placeholder="name@email.com" value={form.email} onChange={e => h("email", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.dept} onChange={e => h("dept", e.target.value)}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Member Type</label><select className="form-select" value={form.type} onChange={e => h("type", e.target.value)}><option value="member">Member</option><option value="visitor">Visitor</option></select></div>
            <div className="form-group full"><label className="form-label">Notes (optional)</label><textarea className="form-textarea" placeholder="Any additional notes..." value={form.notes} onChange={e => h("notes", e.target.value)} /></div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? "⏳ Saving..." : "✅ Register Member"}</button>
            <button className="btn btn-secondary" onClick={() => setForm({ name: "", phone: "", email: "", dept: "None", type: "member", notes: "" })}>Clear</button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────
function Attendance({ members, db, orgId, role }) {
  const [week, setWeek] = useState(WEEKS.length - 1);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await db.get("attendance", `week_label=eq.${encodeURIComponent(WEEKS[week])}&org_id=eq.${orgId}&select=member_id,present`);
      const map = {};
      (data || []).forEach(r => { map[r.member_id] = r.present; });
      setAttendance(map);
      setLoading(false);
    };
    load();
  }, [week]);

  const toggle = async (memberId) => {
    if (!["admin", "pastor", "worker"].includes(role)) return;
    const newVal = !attendance[memberId];
    setAttendance(prev => ({ ...prev, [memberId]: newVal }));
    await db.upsert("attendance", { member_id: memberId, week_label: WEEKS[week], present: newVal, org_id: orgId });
  };

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const present = Object.values(attendance).filter(Boolean).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Attendance Tracking</div>
        <div className="page-sub">Mark weekly attendance — saves automatically</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div className="week-selector">
          <button className="btn btn-secondary btn-sm" onClick={() => setWeek(w => Math.max(0, w - 1))}>◀</button>
          <span className="week-label">📅 {WEEKS[week]}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setWeek(w => Math.min(WEEKS.length - 1, w + 1))}>▶</button>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--olive-dark)" }}>{present}</strong> / {members.length} present
        </div>
      </div>
      <div className="search-bar"><input className="search-input" placeholder="🔍 Search members..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      {loading ? <div className="loader">Loading attendance...</div> : (
        <div className="card">
          <div className="card-title">Members — {WEEKS[week]}</div>
          {filtered.length === 0 && <div className="empty-state">No members found.</div>}
          {filtered.map(m => (
            <div className="member-row" key={m.id}>
              <div className="member-info">
                <Avatar name={m.name} />
                <div><div className="member-name">{m.name}</div><div className="member-dept">{m.dept} · {m.type}</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.8rem", color: attendance[m.id] ? "var(--olive)" : "var(--text-muted)" }}>{attendance[m.id] ? "Present" : "Absent"}</span>
                {["admin", "pastor", "worker"].includes(role) && <button className={`toggle-btn ${attendance[m.id] ? "on" : ""}`} onClick={() => toggle(m.id)} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Follow-Up (mini CRM) ─────────────────────────────────────────────────────
function FollowUp({ members, tags, setTags, db, orgId, role }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const toggleTag = async (memberId, tagKey) => {
    if (!["admin", "pastor", "worker"].includes(role)) return;
    const current = tags[memberId] || [];
    const has = current.includes(tagKey);
    const updated = has ? current.filter(t => t !== tagKey) : [...current, tagKey];
    setTags(prev => ({ ...prev, [memberId]: updated }));
    if (has) { await db.delete("follow_up_tags", `member_id=eq.${memberId}&tag=eq.${tagKey}`); }
    else { await db.upsert("follow_up_tags", { member_id: memberId, tag: tagKey, org_id: orgId }); }
  };

  let filtered = members;
  if (filter === "tagged") filtered = filtered.filter(m => (tags[m.id] || []).length > 0);
  if (filter === "visitors") filtered = filtered.filter(m => m.type === "visitor");
  if (filter === "inactive") filtered = filtered.filter(m => m.status === "inactive");
  if (filter === "firsttime") filtered = filtered.filter(m => (tags[m.id] || []).includes("firsttime"));
  if (filter === "newconvert") filtered = filtered.filter(m => (tags[m.id] || []).includes("newconvert"));
  if (filter === "needscall") filtered = filtered.filter(m => (tags[m.id] || []).includes("call"));
  if (filter === "prayer") filtered = filtered.filter(m => (tags[m.id] || []).includes("prayer"));
  if (search) filtered = filtered.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const filters = [
    { key: "all", label: "All" },
    { key: "tagged", label: "🏷️ Tagged" },
    { key: "visitors", label: "👀 Visitors" },
    { key: "firsttime", label: "✨ First-Timers" },
    { key: "newconvert", label: "🕊️ New Converts" },
    { key: "needscall", label: "📞 Needs Call" },
    { key: "prayer", label: "🙏 Prayer Request" },
    { key: "inactive", label: "⚠️ Inactive" },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Follow-Up</div>
        <div className="page-sub">Tag members · take action · track outcomes</div>
      </div>
      <div className="filter-bar">
        {filters.map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>
      <div className="search-bar"><input className="search-input" placeholder="🔍 Search members..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(m => (
          <div className="followup-card" key={m.id}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div className="member-info">
                <Avatar name={m.name} />
                <div>
                  <div className="member-name">{m.name}</div>
                  <div className="member-dept">{m.phone} · {m.dept}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className={`badge ${m.status === "active" ? "badge-active" : "badge-inactive"}`}>{m.status}</span>
                <span className={`badge ${m.type === "visitor" ? "badge-visitor" : "badge-new"}`}>{m.type}</span>
              </div>
            </div>

            {/* Tags */}
            {["admin", "pastor", "worker"].includes(role) && (
              <>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Follow-Up Tags</div>
                <div className="tag-list" style={{ marginTop: 0 }}>
                  {TAG_OPTIONS.map(opt => (
                    <span key={opt.key} className={`tag ${opt.cls} ${(tags[m.id] || []).includes(opt.key) ? "selected" : ""}`} onClick={() => toggleTag(m.id, opt.key)}>
                      {(tags[m.id] || []).includes(opt.key) ? "✓ " : ""}{opt.label}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Next Actions */}
            {(tags[m.id] || []).length > 0 && (
              <>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Next Action</div>
                <div className="action-btns">
                  {m.phone && <button className="action-btn ab-call" onClick={() => window.open(`tel:${m.phone}`)}>📞 Call</button>}
                  {m.phone && <button className="action-btn ab-whatsapp" onClick={() => window.open(`https://wa.me/${m.phone?.replace(/\D/g, "")}`)}>💬 WhatsApp</button>}
                  <button className="action-btn ab-visit">🏠 Schedule Visit</button>
                  <button className="action-btn ab-resolve" onClick={() => {
                    TAG_OPTIONS.forEach(opt => {
                      if ((tags[m.id] || []).includes(opt.key)) toggleTag(m.id, opt.key);
                    });
                  }}>✅ Mark Resolved</button>
                  <button className="action-btn ab-snooze">⏰ Snooze</button>
                </div>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state" style={{ background: "var(--white)", borderRadius: 14, border: "1px solid rgba(217,201,163,0.4)" }}>No members match this filter.</div>}
      </div>
    </div>
  );
}

// ─── Members ──────────────────────────────────────────────────────────────────
function Members({ members, db, role }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editStatus, setEditStatus] = useState("");

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.dept || "").toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (m) => {
    if (!["admin", "pastor"].includes(role)) return;
    const newStatus = m.status === "active" ? "inactive" : "active";
    await db.patch("members", `id=eq.${m.id}`, { status: newStatus });
    m.status = newStatus;
    setEditId(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">All Members</div>
        <div className="page-sub">{members.length} total · {members.filter(m => m.status === "inactive").length} inactive</div>
      </div>
      <div className="search-bar">
        <input className="search-input" placeholder="🔍 Search by name or department..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card">
        {members.length === 0 && <div className="empty-state">No members yet. Go to Register to add your first member.</div>}
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Department</th><th>Type</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={m.name} /><span style={{ fontWeight: 600 }}>{m.name}</span></div></td>
                <td style={{ color: "var(--text-muted)" }}>{m.phone}</td>
                <td>{m.dept}</td>
                <td><span className={`badge ${m.type === "visitor" ? "badge-visitor" : "badge-new"}`}>{m.type}</span></td>
                <td>
                  {["admin", "pastor"].includes(role)
                    ? <span className={`badge ${m.status === "active" ? "badge-active" : "badge-inactive"}`} style={{ cursor: "pointer" }} onClick={() => updateStatus(m)}>{m.status} ✎</span>
                    : <span className={`badge ${m.status === "active" ? "badge-active" : "badge-inactive"}`}>{m.status}</span>
                  }
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{m.join_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Team Management ──────────────────────────────────────────────────────────
function Team({ org, db, role, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("worker");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await db.get("organization_members", `org_id=eq.${org.id}&select=*,profiles(*)`);
      setMembers(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateRole = async (userId, newRole) => {
    if (role !== "admin") return;
    await db.patch("organization_members", `user_id=eq.${userId}&org_id=eq.${org.id}`, { role: newRole });
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
  };

  return (
    <RoleGuard role={role} allowed={["admin", "pastor"]}>
      <div>
        <div className="page-header">
          <div className="page-title">Team Management</div>
          <div className="page-sub">{org.name} · Manage your church staff and workers</div>
        </div>

        {/* Church Code */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Church Invitation Code</div>
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            Share this code with workers to let them join your church: <strong style={{ letterSpacing: 1 }}>{org.code}</strong>
          </div>
        </div>

        {/* Team List */}
        <div className="card">
          <div className="card-title">Team Members ({members.length})</div>
          {loading ? <div className="loader">Loading team...</div> : (
            <div className="team-section">
              {members.map(m => (
                <div className="team-row" key={m.user_id}>
                  <div className="member-info">
                    <Avatar name={m.profiles?.full_name || m.profiles?.email || "?"} />
                    <div>
                      <div className="member-name">{m.profiles?.full_name || "—"}</div>
                      <div className="member-dept">{m.profiles?.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {role === "admin" && m.user_id !== currentUserId ? (
                      <select className="form-select" style={{ padding: "4px 10px", fontSize: "0.78rem" }} value={m.role} onChange={e => updateRole(m.user_id, e.target.value)}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="badge-role" style={{ background: ROLE_COLORS[m.role] || "#888" }}>{m.role}</span>
                    )}
                    {m.user_id === currentUserId && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>(you)</span>}
                  </div>
                </div>
              ))}
              {members.length === 0 && <div className="empty-state">No team members yet.</div>}
            </div>
          )}
        </div>

        {/* Roles explanation */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">Role Permissions</div>
          <table className="table">
            <thead><tr><th>Role</th><th>Dashboard</th><th>Members</th><th>Register</th><th>Attendance</th><th>Follow-Up</th><th>Team</th></tr></thead>
            <tbody>
              {[
                { r: "admin", d: "✅", m: "✅", reg: "✅", att: "✅", fu: "✅", t: "✅" },
                { r: "pastor", d: "✅", m: "✅", reg: "✅", att: "✅", fu: "✅", t: "✅ view" },
                { r: "worker", d: "Personal", m: "✅ view", reg: "✅", att: "✅", fu: "✅", t: "—" },
                { r: "viewer", d: "Personal", m: "✅ view", reg: "—", att: "—", fu: "—", t: "—" },
              ].map(row => (
                <tr key={row.r}>
                  <td><span className="badge-role" style={{ background: ROLE_COLORS[row.r] }}>{row.r}</span></td>
                  <td>{row.d}</td><td>{row.m}</td><td>{row.reg}</td><td>{row.att}</td><td>{row.fu}</td><td>{row.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_ALL = [
  { key: "dashboard", icon: "📊", label: "Dashboard", roles: ["admin", "pastor", "worker", "viewer"] },
  { key: "members", icon: "👥", label: "Members", roles: ["admin", "pastor", "worker", "viewer"] },
  { key: "register", icon: "✍️", label: "Register", roles: ["admin", "pastor", "worker"] },
  { key: "attendance", icon: "📋", label: "Attendance", roles: ["admin", "pastor", "worker"] },
  { key: "followup", icon: "🏷️", label: "Follow-Up", roles: ["admin", "pastor", "worker"] },
  { key: "team", icon: "🔑", label: "Team", roles: ["admin", "pastor"] },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null); // { user, token, org, role, profile }
  const [page, setPage] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [tags, setTags] = useState({});
  const [loading, setLoading] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sf_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token) setSession(parsed);
      }
    } catch {}
  }, []);

  // Load data when session is set
  useEffect(() => {
    if (!session) return;
    const db = makeDb(session.token);
    const loadData = async () => {
      setLoading(true);
      const [membersData, tagsData] = await Promise.all([
        db.get("members", `org_id=eq.${session.org.id}&order=created_at.desc`),
        db.get("follow_up_tags", `org_id=eq.${session.org.id}&select=member_id,tag`)
      ]);
      setMembers(membersData || []);
      const tagMap = {};
      (tagsData || []).forEach(r => {
        if (!tagMap[r.member_id]) tagMap[r.member_id] = [];
        tagMap[r.member_id].push(r.tag);
      });
      setTags(tagMap);
      setLoading(false);
    };
    loadData();
  }, [session]);

  const handleAuth = (sessionData) => {
    setSession(sessionData);
    try { localStorage.setItem("sf_session", JSON.stringify(sessionData)); } catch {}
  };

  const handleSignOut = async () => {
    if (session?.token) await auth.signOut(session.token);
    setSession(null);
    setMembers([]);
    setTags({});
    try { localStorage.removeItem("sf_session"); } catch {}
  };

  if (!session) return (
    <>
      <style>{style}</style>
      <AuthScreen onAuth={handleAuth} />
    </>
  );

  const db = makeDb(session.token);
  const { role, org, profile } = session;
  const nav = NAV_ALL.filter(n => n.roles.includes(role));

  const initials = (profile?.full_name || session.user?.email || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const renderPage = () => {
    if (loading) return <div className="loader">⏳ Loading ShepherdFlow...</div>;
    switch (page) {
      case "dashboard": return <Dashboard members={members} tags={tags} role={role} profile={profile} org={org} setPage={setPage} />;
      case "register": return <Registration onAdd={m => setMembers(prev => [m, ...prev])} orgId={org.id} db={db} role={role} />;
      case "attendance": return <Attendance members={members} db={db} orgId={org.id} role={role} />;
      case "followup": return <FollowUp members={members} tags={tags} setTags={setTags} db={db} orgId={org.id} role={role} />;
      case "members": return <Members members={members} db={db} role={role} />;
      case "team": return <Team org={org} db={db} role={role} currentUserId={session.user.id} />;
      default: return <Dashboard members={members} tags={tags} role={role} profile={profile} org={org} setPage={setPage} />;
    }
  };

  return (
    <>
      <style>{style}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🕊️</div>
            <div className="logo-name">ShepherdFlow</div>
            <div className="logo-sub">Church Management</div>
            <div className="org-badge">{org.name}</div>
          </div>
          <nav className="nav">
            <div className="nav-label">Main Menu</div>
            {nav.map(n => (
              <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
                <span>{n.icon}</span>{n.label}
              </div>
            ))}
          </nav>
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">{initials}</div>
              <div>
                <div className="sidebar-user-name">{profile?.full_name || session.user.email}</div>
                <div className="sidebar-user-role">{role} · {org.name}</div>
              </div>
            </div>
            <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
          </div>
        </aside>
        <main className="main">{renderPage()}</main>
      </div>
    </>
  );
}
