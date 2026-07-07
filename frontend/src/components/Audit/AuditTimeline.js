import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ACTION_STYLE = {
  UPLOAD_INITIATED: { icon:'📤', dot:'#667eea', bg:'#ebf4ff', label:'Upload Started' },
  COMPLETED:        { icon:'✅', dot:'#48bb78', bg:'#f0fff4', label:'Completed' },
  FAILED:           { icon:'❌', dot:'#fc8181', bg:'#fff5f5', label:'Failed' },
  MANUAL_CORRECTION:{ icon:'✏️', dot:'#ed8936', bg:'#fffaf0', label:'Manual Correction' },
};
const DEFAULT_STYLE = { icon:'📋', dot:'#a0aec0', bg:'#f7fafc', label:'Action' };

function groupByDate(logs) {
  const m = {};
  logs.forEach(l => {
    const d = l.timestamp ? l.timestamp.substring(0,10) : 'Unknown';
    if (!m[d]) m[d] = [];
    m[d].push(l);
  });
  return m;
}

export default function AuditTimeline() {
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [userFlt,  setUserFlt]  = useState('');
  const [typeFlt,  setTypeFlt]  = useState('');

  const load = async () => {
    try {
      const res = await auditAPI.getAll();
      setLogs(res.data.data || []);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l =>
    (!userFlt || l.performedByUsername?.toLowerCase().includes(userFlt.toLowerCase())) &&
    (!typeFlt || l.entityType?.toLowerCase().includes(typeFlt.toLowerCase()))
  );

  const grouped = groupByDate(filtered);

  const formatDate = dateStr => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = ts => {
    try { return new Date(ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
    catch { return '—'; }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#1a202c', marginBottom:4 }}>Audit Trail Timeline</h2>
        <p  style={{ fontSize:14, color:'#718096' }}>
          Immutable history of all system actions — append-only, never edited or deleted
        </p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
        <input value={userFlt} onChange={e => setUserFlt(e.target.value)} placeholder="🔍 Filter by user…"
          style={INPUT} />
        <input value={typeFlt} onChange={e => setTypeFlt(e.target.value)} placeholder="🔍 Filter by entity type…"
          style={INPUT} />
        <button onClick={load}
          style={{ padding:'10px 18px', background:'#667eea', color:'#fff', border:'none',
            borderRadius:10, cursor:'pointer', fontWeight:600 }}>
          🔄 Refresh
        </button>
        <span style={{ fontSize:13, color:'#718096', padding:'10px 14px', background:'#f7fafc',
          borderRadius:10 }}>
          📊 {filtered.length} entries
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'#718096', fontSize:16 }}>Loading audit logs…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:16, padding:56, textAlign:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:15, color:'#718096' }}>
            No audit logs yet.<br />Actions will appear here as you use the system.
          </div>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a],[b]) => b.localeCompare(a))
          .map(([date, entries]) => (
            <div key={date} style={{ marginBottom:36 }}>

              {/* Date header */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                <span style={{ background:'#e2e8f0', padding:'4px 14px', borderRadius:20,
                  fontSize:13, fontWeight:700, color:'#4a5568', whiteSpace:'nowrap' }}>
                  📅 {formatDate(date)}
                </span>
                <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
                <span style={{ fontSize:12, color:'#a0aec0', whiteSpace:'nowrap' }}>
                  {entries.length} events
                </span>
              </div>

              {/* Timeline entries */}
              <div style={{ position:'relative', paddingLeft:36 }}>
                {/* Vertical line */}
                <div style={{ position:'absolute', left:13, top:0, bottom:0, width:2,
                  background:'linear-gradient(180deg,#667eea,#e2e8f0)' }} />

                {entries.map((log, i) => {
                  const s = ACTION_STYLE[log.action] || DEFAULT_STYLE;
                  return (
                    <div key={log.id} style={{ position:'relative', marginBottom:16 }}>
                      {/* Dot on timeline */}
                      <div style={{ position:'absolute', left:-28, top:14, width:16, height:16,
                        borderRadius:'50%', background:s.dot,
                        border:'3px solid #fff', boxShadow:`0 0 0 2px ${s.dot}` }} />

                      {/* Card */}
                      <div style={{ background:'#fff', borderRadius:12, padding:'16px 18px',
                        boxShadow:'0 2px 6px rgba(0,0,0,.06)', border:`1px solid ${s.dot}20` }}>

                        {/* Card header */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:22, background:s.bg, padding:7, borderRadius:8 }}>{s.icon}</span>
                            <div>
                              <div style={{ fontSize:14, fontWeight:700, color:'#2d3748' }}>
                                {(log.action || '').replace(/_/g,' ')}
                              </div>
                              <div style={{ fontSize:12, color:'#a0aec0' }}>
                                {log.entityType} #{log.entityId}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:12, color:'#a0aec0' }}>{formatTime(log.timestamp)}</div>
                            <span style={{ fontSize:11, fontWeight:600, color:s.dot,
                              background:s.bg, padding:'2px 8px', borderRadius:20, marginTop:4, display:'inline-block' }}>
                              {log.source}
                            </span>
                          </div>
                        </div>

                        {/* Who */}
                        <div style={{ display:'flex', gap:10, marginBottom: (log.oldValue||log.newValue) ? 12:0 }}>
                          <span style={{ fontSize:12, background:'#f7fafc', padding:'3px 10px',
                            borderRadius:6, color:'#4a5568' }}>
                            👤 <strong>{log.performedByUsername || log.performedBy}</strong>
                          </span>
                        </div>

                        {/* Before / After */}
                        {(log.oldValue || log.newValue) && (
                          <div style={{ display:'grid', gridTemplateColumns: log.oldValue&&log.newValue?'1fr 1fr':'1fr', gap:10 }}>
                            {log.oldValue && (
                              <div style={{ padding:10, background:'#fff5f5', borderRadius:8, border:'1px solid #fed7d7' }}>
                                <div style={{ fontSize:10, fontWeight:800, color:'#e53e3e', marginBottom:4 }}>BEFORE</div>
                                <div style={{ fontSize:12, color:'#4a5568', wordBreak:'break-word' }}>{log.oldValue}</div>
                              </div>
                            )}
                            {log.newValue && (
                              <div style={{ padding:10, background:'#f0fff4', borderRadius:8, border:'1px solid #c6f6d5' }}>
                                <div style={{ fontSize:10, fontWeight:800, color:'#22543d', marginBottom:4 }}>AFTER</div>
                                <div style={{ fontSize:12, color:'#4a5568', wordBreak:'break-word' }}>{log.newValue}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      )}
    </div>
  );
}

const INPUT = {
  padding:'10px 14px', border:'2px solid #e2e8f0', borderRadius:10,
  fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', width:200
};
