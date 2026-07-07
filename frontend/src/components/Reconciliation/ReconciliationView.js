import React, { useState, useEffect } from 'react';
import { reconciliationAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS = {
  MATCHED:           { label:'Matched',      color:'#22543d', bg:'#f0fff4', icon:'✅' },
  PARTIALLY_MATCHED: { label:'Partial Match',color:'#7b341e', bg:'#fffaf0', icon:'⚡' },
  NOT_MATCHED:       { label:'Not Matched',  color:'#742a2a', bg:'#fff5f5', icon:'❌' },
  DUPLICATE:         { label:'Duplicate',    color:'#553c9a', bg:'#faf5ff', icon:'🔁' },
};

export default function ReconciliationView() {
  const [jobs,        setJobs]        = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [results,     setResults]     = useState([]);
  const [filter,      setFilter]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [expanded,    setExpanded]    = useState(null);
  const [correcting,  setCorrecting]  = useState(null);
  const [note,        setNote]        = useState('');

  useEffect(() => {
    uploadAPI.getJobs().then(r => {
      const done = (r.data.data || []).filter(j => j.status === 'COMPLETED');
      setJobs(done);
      if (done.length) setSelectedJob(done[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => { if (selectedJob) loadResults(); }, [selectedJob, filter]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const res  = await reconciliationAPI.getResults(selectedJob);
      let data   = res.data.data || [];
      if (filter) data = data.filter(r => r.matchStatus === filter);
      setResults(data);
    } catch { toast.error('Could not load results'); }
    finally { setLoading(false); }
  };

  const saveCorrection = async id => {
    try {
      await reconciliationAPI.correct(id, { note });
      toast.success('Correction saved');
      setCorrecting(null); setNote('');
      loadResults();
    } catch { toast.error('Correction failed'); }
  };

  const counts = Object.fromEntries(
    Object.keys(STATUS).map(k => [k, results.filter(r => r.matchStatus === k).length])
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#1a202c', marginBottom:4 }}>Reconciliation View</h2>
        <p  style={{ fontSize:14, color:'#718096' }}>
          Compare uploaded records vs system records — click a row to expand details
        </p>
      </div>

      {/* Status filter chips */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        {Object.entries(STATUS).map(([k, s]) => (
          <button key={k} onClick={() => setFilter(filter === k ? '' : k)}
            style={{ padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer',
              border:`2px solid ${filter===k ? s.color:'#e2e8f0'}`,
              background: filter===k ? s.bg:'#fff', color: s.color }}>
            {s.icon} {s.label} ({counts[k] ?? 0})
          </button>
        ))}
        {filter && (
          <button onClick={() => setFilter('')}
            style={{ padding:'7px 16px', borderRadius:20, fontSize:13, cursor:'pointer',
              border:'2px solid #e2e8f0', background:'#f7fafc', color:'#718096' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Job selector + refresh */}
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
        <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
          style={{ padding:'10px 14px', border:'2px solid #e2e8f0', borderRadius:10,
            fontSize:14, fontFamily:'Inter,sans-serif', outline:'none', minWidth:240 }}>
          <option value="">All completed jobs</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>Job #{j.id} — {j.fileName}</option>
          ))}
        </select>
        <button onClick={loadResults} style={{ padding:'10px 20px', background:'#667eea',
          color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:14 }}>
          🔄 Refresh
        </button>
        <span style={{ fontSize:13, color:'#718096' }}>{results.length} records</span>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'#718096', fontSize:16 }}>Loading…</div>
      ) : results.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:16, padding:56, textAlign:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:15, color:'#718096' }}>
            No results found.<br />Upload and process a file first, then select a completed job above.
          </div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,.06)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f7fafc', borderBottom:'2px solid #e2e8f0' }}>
                  {['','Transaction ID','Uploaded Amt','System Amt','Variance','Mismatched Fields','Status','Action'].map(h => (
                    <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#718096', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const s  = STATUS[r.matchStatus] || STATUS.NOT_MATCHED;
                  const ex = expanded === r.id;
                  const mf = r.mismatchedFields ? r.mismatchedFields.split(',') : [];
                  return (
                    <React.Fragment key={r.id}>
                      <tr onClick={() => setExpanded(ex ? null : r.id)}
                        style={{ borderBottom:'1px solid #f0f4f8', cursor:'pointer',
                          background: ex ? '#fafbff':'#fff' }}>
                        <td style={{ padding:'12px 14px', color:'#a0aec0', fontSize:12 }}>
                          {ex ? '▼':'▶'}
                        </td>
                        <td style={{ padding:'12px 14px', fontWeight:700, color:'#2d3748', fontSize:13 }}>
                          {r.transactionId}
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:13, color:'#4a5568' }}>
                          {r.uploadedAmount ? `$${parseFloat(r.uploadedAmount).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:13, color:'#4a5568' }}>
                          {r.systemAmount ? `$${parseFloat(r.systemAmount).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:13, fontWeight:600,
                          color: r.amountVariance > 0 ? '#e53e3e':'#48bb78' }}>
                          {r.amountVariance ? `$${parseFloat(r.amountVariance).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          {mf.map(f => (
                            <span key={f} style={{ display:'inline-block', background:'#fff5f5',
                              color:'#e53e3e', fontSize:11, padding:'2px 7px', borderRadius:4,
                              marginRight:4, fontWeight:600 }}>{f}</span>
                          ))}
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12,
                            fontWeight:700, background:s.bg, color:s.color }}>
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          {r.matchStatus !== 'MATCHED' && !r.manuallyResolvedBy && (
                            <button onClick={e => { e.stopPropagation(); setCorrecting(r.id); }}
                              style={{ padding:'5px 12px', background:'#667eea', color:'#fff',
                                border:'none', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                              ✏️ Correct
                            </button>
                          )}
                          {r.manuallyResolvedBy && (
                            <span style={{ fontSize:11, color:'#48bb78', fontWeight:700 }}>✓ Resolved</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {ex && (
                        <tr style={{ background:'#f7faff' }}>
                          <td colSpan={8} style={{ padding:'16px 28px' }}>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                              <Detail label="📤 UPLOADED RECORD" color="#667eea" rows={[
                                ['Transaction ID', r.transactionId],
                                ['Amount',         r.uploadedAmount ? `$${r.uploadedAmount}` : 'N/A'],
                                ['Record ID',      r.uploadedRecordId],
                              ]} />
                              <Detail label="🏦 SYSTEM RECORD" color="#48bb78" rows={[
                                ['Amount',    r.systemAmount ? `$${r.systemAmount}` : 'Not found'],
                                ['Record ID', r.systemRecordId || '—'],
                                ['Variance',  r.amountVariance || '0'],
                              ]} />
                            </div>
                            {r.manualNote && (
                              <div style={{ marginTop:12, padding:12, background:'#f0fff4',
                                borderRadius:8, fontSize:12, color:'#22543d' }}>
                                <strong>Resolution note:</strong> {r.manualNote} — <em>{r.manuallyResolvedBy}</em>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}

                      {/* Correction input row */}
                      {correcting === r.id && (
                        <tr style={{ background:'#fffaf0' }}>
                          <td colSpan={8} style={{ padding:'14px 28px' }}>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              <input value={note} onChange={e => setNote(e.target.value)}
                                placeholder="Enter correction note…"
                                style={{ flex:1, padding:'9px 14px', border:'2px solid #ed8936',
                                  borderRadius:8, fontSize:14, fontFamily:'Inter,sans-serif', outline:'none' }} />
                              <button onClick={() => saveCorrection(r.id)}
                                style={{ padding:'9px 18px', background:'#48bb78', color:'#fff',
                                  border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
                                Save
                              </button>
                              <button onClick={() => setCorrecting(null)}
                                style={{ padding:'9px 14px', background:'#e2e8f0', color:'#4a5568',
                                  border:'none', borderRadius:8, cursor:'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, color, rows }) {
  return (
    <div style={{ padding:14, background:'#fff', borderRadius:10, border:`1px solid ${color}30` }}>
      <div style={{ fontSize:11, fontWeight:700, color, marginBottom:10 }}>{label}</div>
      {rows.map(([l,v]) => (
        <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:12, color:'#718096' }}>{l}</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#2d3748' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
