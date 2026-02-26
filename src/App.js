import { useState, useEffect } from "react";

const SUPABASE_URL = "https://bbbxhrnytijrzvashqqu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnhocm55dGlqcnp2YXNocXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDE2MTUsImV4cCI6MjA4NzY3NzYxNX0.ncL-SNENbniBuZ6qDvfae4bQ968dn1W4XLY1FgDn4EU";

const db = {
  async get(table, params = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
  },
  async post(table, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async delete(table, filter) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  },
  async upsert(table, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(body)
    });
    return res.json();
  }
};

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Lato:wght@300;400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #F5EFE0; --linen: #EDE4CE; --sand: #D9C9A3;
    --olive: #6B7C4E; --olive-dark: #4A5635; --amber: #C8813A;
    --amber-light: #E8A55A; --brown: #6B4226; --brown-light: #8B5E3C;
    --text: #2C1810; --text-muted: #7A6552; --white: #FFFDF8;
    --shadow: rgba(44,24,16,0.12);
  }
  body { background: var(--cream); font-family: 'Lato', sans-serif; color: var(--text); min-height: 100vh; }
  .app { display: flex; min-height: 100vh; background: radial-gradient(ellipse at 10% 20%, rgba(107,124,78,0.08) 0%, transparent 60%), radial-gradient(ellipse at 90% 80%, rgba(200,129,58,0.08) 0%, transparent 60%), var(--cream); }
  .sidebar { width: 240px; min-height: 100vh; background: var(--olive-dark); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; }
  .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center; }
  .logo-icon { width: 44px; height: 44px; background: var(--amber); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 20px; }
  .logo-name { font-family: 'Playfair Display', serif; color: var(--cream); font-size: 1.2rem; font-weight: 700; }
  .logo-sub { color: rgba(255,255,255,0.45); font-size: 0.68rem; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .nav { padding: 20px 0; flex: 1; }
  .nav-label { color: rgba(255,255,255,0.3); font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; padding: 0 24px; margin: 16px 0 6px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 24px; color: rgba(255,255,255,0.65); cursor: pointer; font-size: 0.88rem; transition: all 0.2s; border-left: 3px solid transparent; }
  .nav-item:hover { color: var(--cream); background: rgba(255,255,255,0.06); }
  .nav-item.active { color: var(--amber-light); background: rgba(200,129,58,0.12); border-left-color: var(--amber); font-weight: 600; }
  .main { flex: 1; padding: 32px 36px; overflow-y: auto; }
  .page-header { margin-bottom: 28px; }
  .page-title { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 700; color: var(--olive-dark); }
  .page-sub { color: var(--text-muted); font-size: 0.88rem; margin-top: 4px; }
  .card { background: var(--white); border-radius: 14px; padding: 24px; box-shadow: 0 2px 12px var(--shadow); border: 1px solid rgba(217,201,163,0.4); }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 600; color: var(--olive-dark); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--linen); }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--white); border-radius: 14px; padding: 20px; box-shadow: 0 2px 12px var(--shadow); border: 1px solid rgba(217,201,163,0.4); position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gradient, var(--olive)); }
  .stat-label { font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
  .stat-value { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: var(--text); margin: 6px 0 4px; }
  .stat-change { font-size: 0.78rem; color: var(--olive); font-weight: 600; }
  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .table th { text-align: left; padding: 8px 12px; background: var(--linen); color: var(--text-muted); font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
  .table th:first-child { border-radius: 8px 0 0 8px; } .table th:last-child { border-radius: 0 8px 8px 0; }
  .table td { padding: 11px 12px; border-bottom: 1px solid rgba(217,201,163,0.3); color: var(--text); }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: rgba(237,228,206,0.3); }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 600; }
  .badge-active { background: rgba(107,124,78,0.15); color: var(--olive-dark); }
  .badge-inactive { background: rgba(200,129,58,0.15); color: var(--brown); }
  .badge-visitor { background: rgba(107,66,38,0.1); color: var(--brown-light); }
  .badge-new { background: rgba(200,129,58,0.2); color: var(--amber); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
  .form-input, .form-select, .form-textarea { padding: 10px 14px; border: 1.5px solid var(--sand); border-radius: 8px; background: var(--cream); color: var(--text); font-family: 'Lato', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--olive); background: var(--white); }
  .form-textarea { resize: vertical; min-height: 80px; }
  .btn { padding: 10px 22px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Lato', sans-serif; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--olive-dark); color: var(--cream); }
  .btn-primary:hover { background: var(--olive); }
  .btn-secondary { background: var(--linen); color: var(--text); }
  .btn-secondary:hover { background: var(--sand); }
  .btn-sm { padding: 6px 14px; font-size: 0.78rem; }
  .btn-row { display: flex; gap: 10px; margin-top: 20px; }
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(217,201,163,0.3); }
  .member-row:last-child { border-bottom: none; }
  .member-info { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--olive), var(--amber)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.85rem; }
  .member-name { font-weight: 600; font-size: 0.9rem; }
  .member-dept { font-size: 0.75rem; color: var(--text-muted); }
  .toggle-btn { width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: background 0.2s; background: var(--sand); }
  .toggle-btn.on { background: var(--olive); }
  .toggle-btn::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  .toggle-btn.on::after { transform: translateX(20px); }
  .tag { padding: 5px 12px; border-radius: 99px; font-size: 0.78rem; font-weight: 600; border: 1.5px solid; cursor: pointer; transition: all 0.15s; }
  .tag.selected { color: white !important; }
  .tag-prayer { color: var(--olive-dark); border-color: var(--olive); } .tag-prayer.selected { background: var(--olive); }
  .tag-visit { color: var(--amber); border-color: var(--amber); } .tag-visit.selected { background: var(--amber); }
  .tag-call { color: var(--brown); border-color: var(--brown); } .tag-call.selected { background: var(--brown); }
  .tag-firsttime { color: #7B5EA7; border-color: #7B5EA7; } .tag-firsttime.selected { background: #7B5EA7; }
  .tag-newconvert { color: #C05C2A; border-color: #C05C2A; } .tag-newconvert.selected { background: #C05C2A; }
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; }
  .alert-success { background: rgba(107,124,78,0.12); color: var(--olive-dark); border: 1px solid rgba(107,124,78,0.3); }
  .alert-error { background: rgba(200,80,50,0.1); color: #a03020; border: 1px solid rgba(200,80,50,0.3); }
  .search-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .search-input { flex: 1; padding: 10px 16px; border: 1.5px solid var(--sand); border-radius: 8px; background: var(--white); font-family: 'Lato', sans-serif; font-size: 0.9rem; outline: none; }
  .search-input:focus { border-color: var(--olive); }
  .week-selector { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; background: var(--white); padding: 10px 16px; border-radius: 10px; border: 1px solid var(--sand); width: fit-content; }
  .week-label { font-weight: 600; font-size: 0.9rem; color: var(--olive-dark); }
  .loader { text-align: center; padding: 60px; color: var(--text-muted); font-size: 0.95rem; }
  .tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
`;

const depts = ["None","Choir","Ushering","Media","Protocol","Children","Youth"];
const TAG_OPTIONS = [
  { key: "prayer", label: "Prayer Request", cls: "tag-prayer" },
  { key: "visit", label: "Needs Visit", cls: "tag-visit" },
  { key: "call", label: "Needs Call", cls: "tag-call" },
  { key: "firsttime", label: "First-Time", cls: "tag-firsttime" },
  { key: "newconvert", label: "New Convert", cls: "tag-newconvert" },
];

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

function Avatar({ name }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  return <div className="avatar">{initials}</div>;
}

function Dashboard({ members, tags }) {
  const active = members.filter(m => m.status === "active").length;
  const inactive = members.filter(m => m.status === "inactive").length;
  const visitors = members.filter(m => m.type === "visitor").length;
  const recent = [...members].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5);
  const withTags = members.filter(m => (tags[m.id]||[]).length > 0).slice(0,5);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">{new Date().toDateString()} · Welcome back!</div>
      </div>
      <div className="stats-grid">
        {[
          { label: "Total Members", value: members.length, change: "Registered", color: "linear-gradient(90deg,#6B7C4E,#8B9E60)" },
          { label: "Active", value: active, change: `${members.length ? Math.round(active/members.length*100) : 0}% of total`, color: "linear-gradient(90deg,#4A5635,#6B7C4E)" },
          { label: "Inactive", value: inactive, change: "Need follow-up", color: "linear-gradient(90deg,#C8813A,#E8A55A)" },
          { label: "Visitors", value: visitors, change: "Total visitors", color: "linear-gradient(90deg,#6B4226,#8B5E3C)" },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{"--gradient": s.color}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">Recent Additions</div>
          {recent.length === 0
            ? <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No members yet. Register your first member!</div>
            : <table className="table">
                <thead><tr><th>Name</th><th>Type</th><th>Joined</th></tr></thead>
                <tbody>
                  {recent.map(m => (
                    <tr key={m.id}>
                      <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={m.name}/>{m.name}</div></td>
                      <td><span className={`badge ${m.type==='visitor'?'badge-visitor':'badge-active'}`}>{m.type}</span></td>
                      <td style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{m.join_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
        <div className="card">
          <div className="card-title">Needs Follow-Up</div>
          {withTags.length === 0
            ? <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No follow-up tags yet.</div>
            : withTags.map(m => (
                <div className="member-row" key={m.id}>
                  <div className="member-info">
                    <Avatar name={m.name}/>
                    <div>
                      <div className="member-name">{m.name}</div>
                      <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>
                        {(tags[m.id]||[]).map(t => {
                          const opt = TAG_OPTIONS.find(o => o.key===t);
                          return <span key={t} className="badge" style={{background:'rgba(107,124,78,0.1)',color:'var(--olive-dark)',fontSize:'0.65rem'}}>{opt?.label}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${m.status==='active'?'badge-active':'badge-inactive'}`}>{m.status}</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

function Registration({ onAdd }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', dept:'None', type:'member', notes:'' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handle = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    if (!form.name || !form.phone) return setError("Name and phone are required.");
    setLoading(true); setError('');
    try {
      const result = await db.post('members', {
        name: form.name, phone: form.phone, email: form.email,
        dept: form.dept, type: form.type, status: 'active',
        notes: form.notes, join_date: new Date().toISOString().split('T')[0]
      });
      if (result && result[0]) {
        onAdd(result[0]);
        setForm({ name:'', phone:'', email:'', dept:'None', type:'member', notes:'' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else { setError("Something went wrong. Please try again."); }
    } catch(e) { setError("Connection error. Check your internet."); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Member Registration</div>
        <div className="page-sub">Register a new member or first-time visitor</div>
      </div>
      <div className="card">
        <div className="card-title">New Registration Form</div>
        {success && <div className="alert alert-success">✅ Member registered and saved to database!</div>}
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="e.g. Adaeze Okonkwo" value={form.name} onChange={e=>handle('name',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Phone Number *</label><input className="form-input" placeholder="08012345678" value={form.phone} onChange={e=>handle('phone',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" placeholder="name@email.com" value={form.email} onChange={e=>handle('email',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.dept} onChange={e=>handle('dept',e.target.value)}>{depts.map(d=><option key={d}>{d}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Member Type</label><select className="form-select" value={form.type} onChange={e=>handle('type',e.target.value)}><option value="member">Member</option><option value="visitor">Visitor</option></select></div>
          <div className="form-group full"><label className="form-label">Notes (optional)</label><textarea className="form-textarea" placeholder="Any additional notes..." value={form.notes} onChange={e=>handle('notes',e.target.value)}/></div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? '⏳ Saving...' : '✅ Register Member'}</button>
          <button className="btn btn-secondary" onClick={()=>setForm({ name:'', phone:'', email:'', dept:'None', type:'member', notes:'' })}>Clear</button>
        </div>
      </div>
    </div>
  );
}

function Attendance({ members }) {
  const [week, setWeek] = useState(WEEKS.length - 1);
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await db.get('attendance', `week_label=eq.${encodeURIComponent(WEEKS[week])}&select=member_id,present`);
      const map = {};
      (data||[]).forEach(r => { map[r.member_id] = r.present; });
      setAttendance(map);
      setLoading(false);
    };
    load();
  }, [week]);

  const toggle = async (memberId) => {
    const newVal = !attendance[memberId];
    setAttendance(prev => ({...prev, [memberId]: newVal}));
    await db.upsert('attendance', { member_id: memberId, week_label: WEEKS[week], present: newVal });
  };

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const present = Object.values(attendance).filter(Boolean).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Attendance Tracking</div>
        <div className="page-sub">Mark weekly attendance — saves automatically</div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div className="week-selector">
          <button className="btn btn-secondary btn-sm" onClick={()=>setWeek(w=>Math.max(0,w-1))}>◀</button>
          <span className="week-label">📅 {WEEKS[week]}</span>
          <button className="btn btn-secondary btn-sm" onClick={()=>setWeek(w=>Math.min(WEEKS.length-1,w+1))}>▶</button>
        </div>
        <div style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>
          <strong style={{color:'var(--olive-dark)'}}>{present}</strong> / {members.length} present
        </div>
      </div>
      <div className="search-bar"><input className="search-input" placeholder="🔍 Search members..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {loading ? <div className="loader">Loading attendance...</div> : (
        <div className="card">
          <div className="card-title">Members — {WEEKS[week]}</div>
          {filtered.length === 0 && <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No members found.</div>}
          {filtered.map(m => (
            <div className="member-row" key={m.id}>
              <div className="member-info">
                <Avatar name={m.name}/>
                <div><div className="member-name">{m.name}</div><div className="member-dept">{m.dept} · {m.type}</div></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:'0.8rem',color: attendance[m.id]?'var(--olive)':'var(--text-muted)'}}>{attendance[m.id] ? 'Present' : 'Absent'}</span>
                <button className={`toggle-btn ${attendance[m.id] ? 'on' : ''}`} onClick={()=>toggle(m.id)}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowUp({ members, tags, setTags }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const toggleTag = async (memberId, tagKey) => {
    const current = tags[memberId] || [];
    const has = current.includes(tagKey);
    const updated = has ? current.filter(t => t !== tagKey) : [...current, tagKey];
    setTags(prev => ({...prev, [memberId]: updated}));
    if (has) { await db.delete('follow_up_tags', `member_id=eq.${memberId}&tag=eq.${tagKey}`); }
    else { await db.upsert('follow_up_tags', { member_id: memberId, tag: tagKey }); }
  };

  let filtered = members;
  if (filter === 'tagged') filtered = filtered.filter(m => (tags[m.id]||[]).length > 0);
  if (filter === 'visitors') filtered = filtered.filter(m => m.type === 'visitor');
  if (filter === 'inactive') filtered = filtered.filter(m => m.status === 'inactive');
  if (search) filtered = filtered.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Follow-Up Tagging</div>
        <div className="page-sub">Tag members for prayer, visits, calls — saves instantly</div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {['all','tagged','visitors','inactive'].map(f => (
          <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <div className="search-bar"><input className="search-input" placeholder="🔍 Search members..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {filtered.map(m => (
          <div className="card" key={m.id} style={{padding:'18px 22px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div className="member-info">
                <Avatar name={m.name}/>
                <div><div className="member-name">{m.name}</div><div className="member-dept">{m.phone} · {m.dept}</div></div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <span className={`badge ${m.status==='active'?'badge-active':'badge-inactive'}`}>{m.status}</span>
                <span className={`badge ${m.type==='visitor'?'badge-visitor':'badge-new'}`}>{m.type}</span>
              </div>
            </div>
            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:6,fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase'}}>Follow-Up Tags</div>
            <div className="tag-list">
              {TAG_OPTIONS.map(opt => (
                <span key={opt.key} className={`tag ${opt.cls} ${(tags[m.id]||[]).includes(opt.key)?'selected':''}`} onClick={()=>toggleTag(m.id, opt.key)}>
                  {(tags[m.id]||[]).includes(opt.key)?'✓ ':''}{opt.label}
                </span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{textAlign:'center',color:'var(--text-muted)',padding:40}}>No members match this filter.</div>}
      </div>
    </div>
  );
}

function Members({ members }) {
  const [search, setSearch] = useState('');
  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.dept.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="page-header">
        <div className="page-title">All Members</div>
        <div className="page-sub">{members.length} total · {members.filter(m=>m.status==='inactive').length} inactive</div>
      </div>
      <div className="search-bar"><input className="search-input" placeholder="🔍 Search by name or department..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="card">
        {members.length === 0 && <div style={{color:'var(--text-muted)',fontSize:'0.85rem',padding:'8px 0'}}>No members yet. Go to Register to add your first member.</div>}
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Department</th><th>Type</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={m.name}/><span style={{fontWeight:600}}>{m.name}</span></div></td>
                <td style={{color:'var(--text-muted)'}}>{m.phone}</td>
                <td>{m.dept}</td>
                <td><span className={`badge ${m.type==='visitor'?'badge-visitor':'badge-new'}`}>{m.type}</span></td>
                <td><span className={`badge ${m.status==='active'?'badge-active':'badge-inactive'}`}>{m.status}</span></td>
                <td style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{m.join_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const NAV = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'members', icon: '👥', label: 'Members' },
  { key: 'register', icon: '✍️', label: 'Register' },
  { key: 'attendance', icon: '📋', label: 'Attendance' },
  { key: 'followup', icon: '🏷️', label: 'Follow-Up' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [tags, setTags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [membersData, tagsData] = await Promise.all([
        db.get('members', 'order=created_at.desc'),
        db.get('follow_up_tags', 'select=member_id,tag')
      ]);
      setMembers(membersData || []);
      const tagMap = {};
      (tagsData||[]).forEach(r => {
        if (!tagMap[r.member_id]) tagMap[r.member_id] = [];
        tagMap[r.member_id].push(r.tag);
      });
      setTags(tagMap);
      setLoading(false);
    };
    loadData();
  }, []);

  const renderPage = () => {
    if (loading) return <div className="loader">⏳ Loading ShepherdFlow...</div>;
    switch(page) {
      case 'dashboard': return <Dashboard members={members} tags={tags}/>;
      case 'register': return <Registration onAdd={m => setMembers(prev => [m, ...prev])}/>;
      case 'attendance': return <Attendance members={members}/>;
      case 'followup': return <FollowUp members={members} tags={tags} setTags={setTags}/>;
      case 'members': return <Members members={members}/>;
      default: return <Dashboard members={members} tags={tags}/>;
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
          </div>
          <nav className="nav">
            <div className="nav-label">Main Menu</div>
            {NAV.map(n => (
              <div key={n.key} className={`nav-item ${page===n.key?'active':''}`} onClick={()=>setPage(n.key)}>
                <span>{n.icon}</span>{n.label}
              </div>
            ))}
          </nav>
        </aside>
        <main className="main">{renderPage()}</main>
      </div>
    </>
  );
}
