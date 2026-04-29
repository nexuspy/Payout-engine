import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';
const MerchantContext = createContext();

export const MerchantProvider = ({ children }) => {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [balances, setBalances] = useState({ available_paise: 0, held_paise: 0, cleared_paise: 0 });
  const [payouts, setPayouts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);

  const fetchData = useCallback(async () => {
    if (!selectedMerchant) return;
    try {
      const [balRes, payoutRes, bankRes, ledgerRes] = await Promise.all([
        axios.get(`${API_BASE}/merchants/${selectedMerchant.id}/balance/`),
        axios.get(`${API_BASE}/merchants/${selectedMerchant.id}/payouts/`),
        axios.get(`${API_BASE}/merchants/${selectedMerchant.id}/bank-accounts/`),
        axios.get(`${API_BASE}/merchants/${selectedMerchant.id}/ledger/`)
      ]);
      setBalances(balRes.data);
      setPayouts(payoutRes.data);
      setBankAccounts(bankRes.data);
      setLedger(ledgerRes.data);
    } catch (err) {
      console.error("Data sync error", err);
    }
  }, [selectedMerchant]);

  useEffect(() => {
    axios.get(`${API_BASE}/merchants/`).then(res => {
      setMerchants(res.data);
      if (res.data.length > 0 && !selectedMerchant) setSelectedMerchant(res.data[0]);
    });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <MerchantContext.Provider value={{ 
      merchants, 
      selectedMerchant, 
      setSelectedMerchant, 
      balances, 
      payouts, 
      bankAccounts, 
      ledger,
      refresh: fetchData 
    }}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = () => useContext(MerchantContext);
export { API_BASE };
