import React, { useState, useEffect, useCallback } from 'react';
import { 
  getMerchants, 
  getMerchantBalance, 
  getMerchantLedger, 
  getMerchantBankAccounts, 
  getMerchantPayouts, 
  createPayout 
} from './api';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RefreshCcw,
  User,
  IndianRupee
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [balance, setBalance] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (merchantId) => {
    try {
      const [balRes, ledRes, bankRes, payRes] = await Promise.all([
        getMerchantBalance(merchantId),
        getMerchantLedger(merchantId),
        getMerchantBankAccounts(merchantId),
        getMerchantPayouts(merchantId)
      ]);
      setBalance(balRes.data);
      setLedger(ledRes.data);
      setBankAccounts(bankRes.data);
      setPayouts(payRes.data);
      
      if (bankRes.data.length > 0 && !selectedBankId) {
        setSelectedBankId(bankRes.data.find(b => b.is_primary)?.id || bankRes.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    }
  }, [selectedBankId]);

  useEffect(() => {
    getMerchants().then(res => {
      setMerchants(res.data);
      if (res.data.length > 0) setSelectedMerchant(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      fetchData(selectedMerchant.id);
      
      // Polling logic: every 3s if there are pending/processing payouts
      const pollInterval = setInterval(() => {
        const hasActive = payouts.some(p => ['pending', 'processing'].includes(p.status));
        if (hasActive || true) { // Always poll for demo purposes or stick to spec
          fetchData(selectedMerchant.id);
        }
      }, 3000);
      
      return () => clearInterval(pollInterval);
    }
  }, [selectedMerchant, fetchData, payouts.length]);

  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || !selectedBankId) return;

    setIsSubmitting(true);
    setError(null);
    const amountPaise = Math.round(parseFloat(payoutAmount) * 100);
    const idempotencyKey = uuidv4();

    try {
      await createPayout(selectedMerchant.id, {
        amount_paise: amountPaise,
        bank_account_id: selectedBankId
      }, idempotencyKey);
      
      setPayoutAmount('');
      fetchData(selectedMerchant.id);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create payout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPaise = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  if (!selectedMerchant) return <div className="p-8 text-center">Loading Payout Engine...</div>;

  return (
    <div className="min-h-screen px-4 py-8 md:px-12 lg:px-24">
      {/* Top Nav */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <CreditCard className="text-background" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Engine</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-card border border-border px-4 py-2 rounded-xl">
          <User size={18} className="text-gray-400" />
          <select 
            className="bg-transparent outline-none cursor-pointer font-semibold"
            value={selectedMerchant.id}
            onChange={(e) => setSelectedMerchant(merchants.find(m => m.id === parseInt(e.target.value)))}
          >
            {merchants.map(m => (
              <option key={m.id} value={m.id} className="bg-background">{m.name}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance & Payout Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BalanceCard 
              title="Available" 
              amount={balance?.available_paise || 0} 
              color="text-primary" 
              icon={<CheckCircle2 size={20} />} 
            />
            <BalanceCard 
              title="Held" 
              amount={balance?.held_paise || 0} 
              color="text-secondary" 
              icon={<Clock size={20} />}
              pulse={payouts.some(p => ['pending', 'processing'].includes(p.status))}
            />
            <BalanceCard 
              title="Cleared" 
              amount={balance?.total_balance_paise || 0} 
              color="text-gray-300" 
              icon={<LayoutDashboard size={20} />} 
            />
          </div>

          {/* Payout Form */}
          <section className="glass p-8">
            <h2 className="text-xl font-bold mb-6">Request Payout</h2>
            <form onSubmit={handleSubmitPayout} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount (Rupees)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-background border border-border rounded-lg pl-12 pr-4 py-3 outline-none focus:border-primary transition-colors font-mono"
                      placeholder="0.00"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                    />
                  </div>
                  {payoutAmount && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      = {Math.round(parseFloat(payoutAmount) * 100).toLocaleString()} paise
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Destination Account</label>
                  <select 
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary transition-colors"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                  >
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number.slice(-4).padStart(12, '•')} - {acc.account_holder_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-emerald-600 text-background font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : "Initiate Payout"}
              </button>
            </form>
          </section>

          {/* Payout History */}
          <section className="glass overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold">Payout History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-sm text-gray-500 bg-background/50">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Bank</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Retries</th>
                    <th className="px-6 py-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">#{p.id.toString().slice(-6)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm">{formatPaise(p.amount_paise)}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {p.bank_account_details?.account_number.slice(-4).padStart(12, '•')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 text-xs">
                         <span className={p.attempts > 0 ? "text-secondary" : "text-gray-600"}>
                           {p.attempts}/3
                         </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Ledger */}
        <div className="space-y-8">
          <section className="glass h-full">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <RefreshCcw size={16} className="text-primary" />
                Ledger Entries
              </h3>
            </div>
            <div className="divide-y divide-border">
              {ledger.map(entry => (
                <div key={entry.id} className="p-6 hover:bg-white/[0.02]">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.entry_type === 'credit' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                      {entry.entry_type}
                    </span>
                    <span className="font-mono font-bold">{formatPaise(entry.amount_paise)}</span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{entry.description}</p>
                  <p className="text-[10px] text-gray-600 mt-2 font-mono">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const BalanceCard = ({ title, amount, color, icon, pulse }) => (
  <div className={`glass p-6 relative overflow-hidden ${pulse ? 'ring-1 ring-secondary/50' : ''}`}>
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
      {icon}
      <span>{title}</span>
    </div>
    <div className={`text-2xl font-bold font-mono ${color}`}>
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount / 100)}
    </div>
    {pulse && (
      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-secondary pulse-amber" />
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-secondary/20 text-secondary border-secondary/30',
    processing: 'bg-accent/20 text-accent border-accent/30',
    completed: 'bg-primary/20 text-primary border-primary/30',
    failed: 'bg-red-500/20 text-red-500 border-red-500/30'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]} flex items-center gap-1.5 w-fit`}>
      {status === 'processing' && <RefreshCcw size={10} className="animate-spin" />}
      {status}
    </span>
  );
};

export default App;
