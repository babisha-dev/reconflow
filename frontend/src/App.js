import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login        from './components/Auth/Login';
import Layout       from './components/Layout/Layout';
import Dashboard    from './components/Dashboard/Dashboard';
import FileUpload   from './components/Upload/FileUpload';
import Reconciliation from './components/Reconciliation/ReconciliationView';
import AuditTimeline  from './components/Audit/AuditTimeline';

function Guard({ children, adminOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index             element={<Dashboard />} />
        <Route path="upload"    element={<Guard><FileUpload /></Guard>} />
        <Route path="reconciliation" element={<Guard><Reconciliation /></Guard>} />
        <Route path="audit"     element={<Guard><AuditTimeline /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: 14 } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
