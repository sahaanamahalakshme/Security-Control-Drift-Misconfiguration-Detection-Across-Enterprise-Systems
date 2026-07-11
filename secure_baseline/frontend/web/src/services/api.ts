import axios from 'axios';

// Backend is assumed to be running on localhost:8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getControls = async () => {
  const response = await api.get('/controls');
  return response.data;
};

export const getDrifts = async (severity?: string, control_id?: string, suppressed?: boolean) => {
  const params: any = {};
  if (severity) params.severity = severity;
  if (control_id) params.control_id = control_id;
  if (suppressed !== undefined) params.suppressed = suppressed;
  
  const response = await api.get('/drifts', { params });
  return response.data;
};

export const getAttackGraph = async () => {
  const response = await api.get('/intelligence/attack-graph');
  return response.data;
};

export const getControlById = async (id: string) => {
  const response = await api.get(`/controls/${id}`);
  return response.data;
};

export const getDriftById = async (id: string) => {
  const response = await api.get(`/drifts/${id}`);
  return response.data;
};
