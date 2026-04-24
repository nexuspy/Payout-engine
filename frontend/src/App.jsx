import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MerchantProvider } from './context/MerchantContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Ledger from './pages/Ledger';
import BankAccounts from './pages/BankAccounts';
import Settings from './pages/Settings';
import PayoutSuccess from './pages/PayoutSuccess';

const App = () => {
  return (
    <MerchantProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="banks" element={<BankAccounts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="success" element={<PayoutSuccess />} />
          </Route>
        </Routes>
      </Router>
    </MerchantProvider>
  );
};

export default App;
