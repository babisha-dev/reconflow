import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SYS_FIELDS = [
  { key:'transactionId',   label:'Transaction ID',   required:true  },
  { key:'amount',          label:'Amount',            required:true  },
  { key:'referenceNumber', label:'Reference Number',  required:true  },
  { key:'date',            label:'Date',              required:true  },
  { key:'description',     label:'Description',       required:false },
  { key:'accountNumber',   label:'Account Number',    required:false },
];

export default function FileUpload() {
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [mapping,    setMapping]    = useState({});
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [job,        setJob]        = useState(null);

  const onDrop = useCallback(async accepted => {
    const f = accepted[0];
    if (!f) return;
    setFile(f); setPreview(null); setMapping({}); setJob(null);
    setPreviewing(true);
    try {
      const res  = await uploadAPI.preview(f);
      const rows = res.data.data || [];
      setPreview(rows);
      // Auto-map columns by name similarity
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const auto = {};
        SYS_FIELDS.forEach(sf => {
          const hit = cols.find(c =>
            c.toLowerCase().replace(/[^a-z]/g,'').includes(sf.key.toLowerCase().replace(/[^a-z]/g,''))
          );
          if (hit) auto[sf.key] = hit;
        });
        setMapping(auto);
      }
      toast.success(`Preview ready — ${rows.length} rows shown`);
    } catch (e) {
      toast.error('Preview failed: ' + (e.response?.data?.message || e.message));
    } finally { setPreviewing(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:{ 'text/csv':['.csv'],
             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'],
             'application/vnd.ms-excel':['.xls'] },
    maxFiles:1,
  });

  const submit = async () => {
    const missing = SYS_FIELDS.filter(f => f.required && !mapping[f.key]);
    if (missing.length) {
      toast.error('Map required fields: ' + missing.map(f=>f.label).join(', '));
      return;
    }
    setSubmitting(true);
    try {
      const res = await uploadAPI.submit(file, mapping);
      const j   = res.data.data;
      setJob(j);
      toast.success('File submitted — processing in background!');
      if (j?.id) poll(j.id);
    } catch (e) {
      toast.error('Submit failed: ' + (e.response?.data?.message || e.message));
    } finally { setSubmitting(false); }
  };

  const poll = id => {
    const iv = setInterval(async () => {
      try {
        const res = await uploadAPI.getJob(id);
        setJob(res.data.data);
        if (['COMPLETED','FAILED'].includes(res.data.data.status)) {
          clearInterval(iv);
          if (res.data.data.status === 'COMPLETED')
            toast.success('✅ Processing complete! Check Reconciliation page.');
          else
            toast.error('❌ Processing failed: ' + res.data.data.errorMessage);
        }
      } catch { clearInterval(iv); }
    }, 2000);
  };

  const cols = preview?.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#1a202c', marginBottom:4 }}>File Upload & Column Mapping</h2>
        <p  style={{ fontSize:14, color:'#718096' }}>Upload CSV or Excel — up to 50,000 records, processed asynchronously</p>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive?'#667eea':'#cbd5e0'}`,
        borderRadius:16, padding:48, textAlign:'center', cursor:'pointer',
        background: isDragActive ? '#ebf4ff' : '#fff',
        transition:'all .2s', marginBottom:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
        <input {...getInputProps()} />
        <div style={{ fontSize:48, marginBottom:12 }}>📁</div>
        <div style={{ fontSize:17, fontWeight:600, color:'#2d3748', marginBottom:6 }}>
          {isDragActive ? 'Drop it here!' : 'Drag & Drop or Click to Upload'}
        </div>
        <div style={{ fontSize:13, color:'#718096' }}>CSV, XLS, XLSX · Max 50,000 records</div>
        {file && (
          <div style={{ marginTop:14, padding:'6px 16px', background:'#ebf4ff', borderRadius:8,
            display:'inline-block', fontSize:13, color:'#667eea', fontWeight:600 }}>
            📄 {file.name} — {(file.size/1024).toFixed(1)} KB
          </div>
        )}
        {previewing && <div style={{ marginTop:12, color:'#667eea', fontWeight:600 }}>⏳ Loading preview…</div>}
      </div>

      {/* Column mapping */}
      {preview && (
        <div style={{ background:'#fff', borderRadius:16, padding:24, marginBottom:24,
          boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#2d3748', marginBottom:4 }}>Map Columns</h3>
          <p  style={{ fontSize:13, color:'#718096', marginBottom:16 }}>
            Match your file's column headers to the required system fields.
            <span style={{ color:'#e53e3e' }}> * = required</span>
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:12 }}>
            {SYS_FIELDS.map(sf => (
              <div key={sf.key} style={{ padding:14, border:`2px solid ${sf.required && !mapping[sf.key] ? '#fc8181':'#e2e8f0'}`,
                borderRadius:12, transition:'border-color .2s' }}>
                <label style={{ fontSize:12, fontWeight:700, display:'block', marginBottom:8,
                  color: sf.required ? '#e53e3e':'#4a5568' }}>
                  {sf.required ? '* ':''}{sf.label}
                </label>
                <select value={mapping[sf.key] || ''} onChange={e => setMapping({ ...mapping, [sf.key]: e.target.value })}
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:8,
                    fontSize:13, fontFamily:'Inter,sans-serif', outline:'none' }}>
                  <option value="">— Select column —</option>
                  {cols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {mapping[sf.key] && (
                  <div style={{ fontSize:11, color:'#48bb78', marginTop:5 }}>✓ → {mapping[sf.key]}</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={submit} disabled={submitting}
            style={{ marginTop:20, padding:'12px 32px', background:'linear-gradient(135deg,#667eea,#764ba2)',
              color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700,
              cursor:'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? '⏳ Submitting…' : '🚀 Submit for Processing'}
          </button>
        </div>
      )}

      {/* Job status */}
      {job && (
        <div style={{ background:'#fff', borderRadius:16, padding:24, marginBottom:24,
          boxShadow:'0 2px 8px rgba(0,0,0,.06)',
          border:`2px solid ${job.status==='COMPLETED'?'#48bb78':job.status==='FAILED'?'#fc8181':'#667eea'}` }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'#2d3748' }}>Processing Status</h3>
          <div style={{ display:'flex', gap:28, flexWrap:'wrap' }}>
            {[['Job ID','#'+job.id],['File',job.fileName],['Status',job.status],
              ['Progress',`${job.processedRecords??0} / ${job.totalRecords??'?'} records`]].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize:11, color:'#718096', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#2d3748' }}>{v}</div>
              </div>
            ))}
          </div>
          {job.status === 'PROCESSING' && (
            <div style={{ marginTop:14, background:'#e2e8f0', borderRadius:8, overflow:'hidden', height:8 }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#667eea,#764ba2)',
                width:`${job.totalRecords ? Math.min(100,(job.processedRecords/job.totalRecords)*100):25}%`,
                transition:'width .5s' }} />
            </div>
          )}
        </div>
      )}

      {/* Data preview table */}
      {preview && (
        <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'#2d3748' }}>
            Preview — first {preview.length} rows
          </h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#f7fafc' }}>
                  {cols.map(c => (
                    <th key={c} style={{ padding:'10px 12px', textAlign:'left', color:'#4a5568',
                      fontWeight:700, borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ background: i%2 ? '#fafbfc':'#fff', borderBottom:'1px solid #f0f4f8' }}>
                    {cols.map(c => (
                      <td key={c} style={{ padding:'8px 12px', color:'#4a5568',
                        whiteSpace:'nowrap', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>
                        {row[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
