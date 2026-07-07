import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer } from 'recharts';
import { reconciliationAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CARDS = [
  { key:'totalRecords',          label:'Total Records',  icon:'📄', color:'#667eea', bg:'#ebf4ff' },
  { key:'matchedRecords',        label:'Matched',        icon:'✅', color:'#48bb78', bg:'#f0fff4' },
  { key:'unmatchedRecords',      label:'Unmatched',      icon:'❌', color:'#fc8181', bg:'#fff5f5' },
  { key:'duplicateRecords',      label:'Duplicates',     icon:'🔁', color:'#9f7aea', bg:'#faf5ff' },
  { key:'partiallyMatchedRecords',label:'Partial Match', icon:'⚡', color:'#ed8936', bg:'#fffaf0' },
  { key:'reconciliationAccuracy',label:'Accuracy %',     icon:'🎯', color:'#38b2ac', bg:'#e6fffa',
    format: v => v + '%' },
];

const PIE_COLORS = { Matched:'#48bb78', Partial:'#ed8936', Unmatched:'#fc8181', Duplicate:'#9f7aea' };
const STATUS_BG  = { COMPLETED:'#f0fff4', PROCESSING:'#fffaf0', FAILED:'#fff5f5' };
const STATUS_FG  = { COMPLETED:'#22543d', PROCESSING:'#7b341e', FAILED:'#742a2a' };

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

const load = async () => {
  try {
    const sRes = await reconciliationAPI.getDashboard();
    setStats(sRes.data.data);
  } catch (e) {
    console.error(e);
  }

  try {
    const jRes = await uploadAPI.getJobs();
    setJobs(jRes.data.data || []);
  } catch (e) {
    console.error(e);
  }

  setLoading(false);
};

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  if (loading) return <Center>Loading…</Center>;

  const pieData = stats ? [
    { name:'Matched',  value: stats.matchedRecords },
    { name:'Partial',  value: stats.partiallyMatchedRecords },
    { name:'Unmatched',value: stats.unmatchedRecords },
    { name:'Duplicate',value: stats.duplicateRecords },
  ].filter(d => d.value > 0) : [];

  const barData = jobs.slice(0,6).map(j => ({
    name: (j.fileName || 'Job').substring(0,14),
    Total: j.totalRecords || 0,
    Done:  j.processedRecords || 0,
  }));

  return (
    <div>
      <PageHeader title="Dashboard Overview"
        sub="Live reconciliation stats — refreshes every 10 s" />

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:16, marginBottom:24 }}>
        {CARDS.map(c => (
          <div key={c.key} style={{ background:'#fff', borderRadius:16, padding:20,
            boxShadow:'0 2px 8px rgba(0,0,0,.06)', borderTop:`4px solid ${c.color}` }}>
            <span style={{ fontSize:30, background:c.bg, padding:8, borderRadius:10 }}>{c.icon}</span>
            <div style={{ fontSize:30, fontWeight:800, color:c.color, marginTop:10 }}>
              {c.format ? c.format(stats?.[c.key] ?? 0) : (stats?.[c.key] ?? 0)}
            </div>
            <div style={{ fontSize:13, color:'#718096', marginTop:2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <Card title="Match Status Distribution">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={78} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map(d => <Cell key={d.name} fill={PIE_COLORS[d.name]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty msg="Upload a file to see distribution" />}
        </Card>

        <Card title="Upload Jobs Overview">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="Total" fill="#667eea" radius={[4,4,0,0]} />
                <Bar dataKey="Done"  fill="#48bb78" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty msg="No jobs yet" />}
        </Card>
      </div>

      {/* Recent jobs table */}
      <Card title="Recent Upload Jobs">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'2px solid #e2e8f0' }}>
              {['ID','File Name','Uploaded By','Records','Status','Created'].map(h => (
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11,
                  fontWeight:700, color:'#718096', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#a0aec0' }}>
                No jobs yet — upload a CSV or Excel file to get started.
              </td></tr>
            ) : jobs.map(j => (
              <tr key={j.id} style={{ borderBottom:'1px solid #f0f4f8' }}>
                <td style={TD}>#{j.id}</td>
                <td style={{ ...TD, fontWeight:600, color:'#2d3748' }}>{j.fileName}</td>
                <td style={TD}>{j.uploadedByUsername}</td>
                <td style={TD}>{j.processedRecords ?? 0} / {j.totalRecords ?? 0}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                    background: STATUS_BG[j.status] || '#f7fafc',
                    color:      STATUS_FG[j.status] || '#4a5568' }}>
                    {j.status}
                  </span>
                </td>
                <td style={{ ...TD, fontSize:12, color:'#a0aec0' }}>
                  {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────
const TD    = { padding:'10px 12px', fontSize:13, color:'#4a5568' };
const Center = ({ children }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
    height:300, fontSize:16, color:'#718096' }}>{children}</div>
);
const Empty = ({ msg }) => (
  <div style={{ height:210, display:'flex', alignItems:'center', justifyContent:'center',
    color:'#a0aec0', fontSize:14 }}>{msg}</div>
);
const Card = ({ title, children }) => (
  <div style={{ background:'#fff', borderRadius:16, padding:24,
    boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
    <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'#2d3748' }}>{title}</h3>
    {children}
  </div>
);
const PageHeader = ({ title, sub }) => (
  <div style={{ marginBottom:24 }}>
    <h2 style={{ fontSize:22, fontWeight:800, color:'#1a202c', marginBottom:4 }}>{title}</h2>
    <p  style={{ fontSize:14, color:'#718096' }}>{sub}</p>
  </div>
);
