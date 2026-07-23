import axios from 'axios';

axios.create({
    baseURL: "https://reconflow.onrender.com"
})

// Auto-attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: data => api.post('/api/auth/login', data),
};

export const uploadAPI = {
  preview: file => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/upload/preview', fd);
  },
  submit: (file, mapping) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(mapping).forEach(([k, v]) => fd.append(`mapping_${k}`, v));
    return api.post('/api/upload/submit', fd);
  },
  getJobs: ()   => api.get('/api/upload/jobs'),
  getJob:  id   => api.get(`/api/upload/jobs/${id}`),
};

export const reconciliationAPI = {
  getDashboard: ()        => api.get('/api/reconciliation/dashboard'),
  getResults:   jobId     => api.get(`/api/reconciliation/results/${jobId}`),
  getAllResults: status    => api.get('/api/reconciliation/results', { params: { status } }),
  correct:      (id, data)=> api.put(`/api/reconciliation/correct/${id}`, data),
};

export const auditAPI = {
  getAll:       ()            => api.get('/api/audit'),
  getForEntity: (type, id)    => api.get(`/api/audit/${type}/${id}`),
};

export default api;
