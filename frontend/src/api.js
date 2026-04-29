import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const getMerchants = () => api.get('/merchants/');
export const getMerchantBalance = (id) => api.get(`/merchants/${id}/balance/`);
export const getMerchantLedger = (id) => api.get(`/merchants/${id}/ledger/`);
export const getMerchantBankAccounts = (id) => api.get(`/merchants/${id}/bank-accounts/`);
export const getMerchantPayouts = (id) => api.get(`/merchants/${id}/payouts/`);
export const createPayout = (id, data, idempotencyKey) => 
  api.post(`/merchants/${id}/payouts/create/`, data, {
    headers: { 'Idempotency-Key': idempotencyKey }
  });

export default api;
