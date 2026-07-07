import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch {
      toast.error('Wrong credentials. Try admin / admin123');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>⚖️</div>
          <h1 style={S.title}>Smart Reconciliation</h1>
          <p  style={S.sub}>Audit & Reconciliation System</p>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[['Username','text','admin','username'],
            ['Password','password','••••••••','password']].map(([label,type,ph,key]) => (
            <div key={key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={S.label}>{label}</label>
              <input type={type} placeholder={ph} required
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={S.input} />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={S.hints}>
          <p style={{ fontSize:11, fontWeight:700, color:'#4a5568', marginBottom:8 }}>Demo Credentials</p>
          {[['👑','admin / admin123','Admin'],
            ['🔬','analyst1 / analyst123','Analyst'],
            ['👁️','viewer1 / viewer123','Viewer']].map(([icon,cred,role]) => (
            <div key={role} style={{ display:'flex', gap:8, marginBottom:5, alignItems:'center' }}>
              <span>{icon}</span>
              <span style={{ fontSize:12, color:'#2d3748', fontWeight:600 }}>{cred}</span>
              <span style={{ fontSize:11, color:'#a0aec0' }}>— {role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
           background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' },
  card:  { background:'#fff', borderRadius:20, padding:40, width:420,
           boxShadow:'0 25px 50px rgba(0,0,0,0.25)' },
  title: { fontSize:22, fontWeight:800, color:'#1a202c', marginBottom:4 },
  sub:   { fontSize:13, color:'#718096' },
  label: { fontSize:13, fontWeight:600, color:'#4a5568' },
  input: { padding:'10px 14px', border:'2px solid #e2e8f0', borderRadius:8,
           fontSize:14, fontFamily:'Inter,sans-serif', outline:'none' },
  btn:   { padding:13, background:'linear-gradient(135deg,#667eea,#764ba2)',
           color:'#fff', border:'none', borderRadius:9, fontSize:15,
           fontWeight:700, cursor:'pointer', marginTop:4 },
  hints: { marginTop:24, padding:14, background:'#f7fafc',
           borderRadius:10, border:'1px solid #e2e8f0' },
};
