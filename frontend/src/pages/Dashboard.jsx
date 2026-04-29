import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCcw,
  Search
} from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useMerchant, API_BASE } from '../context/MerchantContext';

const Dashboard = () => {
  const { balances, payouts, bankAccounts, selectedMerchant, refresh } = useMerchant();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ amount: '', bank_account_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  if (!selectedMerchant) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-300 font-bold animate-pulse">
        Synchronizing with Secure Vault...
      </div>
    );
  }

  const splitPaise = (paise) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
    return { 
      symbol: formatted.charAt(0), 
      value: formatted.slice(1) 
    };
  };

  const formatPaise = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.bank_account_id) {
      setMsg({ text: 'Please fill all fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const idempotencyKey = uuidv4();
      const response = await axios.post(`${API_BASE}/payouts/`, {
        merchant_id: selectedMerchant.id,
        amount_paise: parseFloat(formData.amount) * 100,
        bank_account_id: parseInt(formData.bank_account_id)
      }, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      setMsg({ text: 'Payout initiated!', type: 'success' });
      setFormData({ amount: '', bank_account_id: '' });
      refresh();
      setTimeout(() => navigate('/success', { state: { payout: response.data } }), 1000);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Payout failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
      {/* Balance Grid */}
      <div className="grid grid-cols-12 gap-10">
        <motion.div 
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="col-span-8 bg-neutral-pop rounded-6xl p-14 shadow-organic-lg emerald-mesh relative overflow-hidden group cursor-default"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-16">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-1 bg-emerald-light rounded-full"></span>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Available Liquidity</p>
                </div>
                <h4 className="text-8xl font-extrabold text-forest-deep hero-text tracking-tighter leading-none mb-6 flex items-baseline">
                  <span className="text-4xl text-emerald-vibrant/30 mr-3 font-black">₹</span>
                  {splitPaise(balances.available_paise).value}
                </h4>
                <div className="flex items-center gap-3 text-emerald-vibrant font-bold text-sm">
                  <TrendingUp size={18} />
                  <span>+12.4% yield performance</span>
                </div>
              </div>
              <div className="w-20 h-20 bg-forest-deep rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mt-4 group-hover:rotate-12 transition-transform duration-500">
                <ArrowUpRight size={32} />
              </div>
            </div>
            <div className="flex gap-16 border-t border-slate-100 pt-10">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Global Currency</p>
                <p className="text-forest-deep font-extrabold">INR / Domestic</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                <p className="text-forest-deep font-extrabold flex items-center gap-2">Verified Level III</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-32 -bottom-20 w-80 h-80 bg-emerald-light/10 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
        </motion.div>

        <div className="col-span-4 flex flex-col gap-10">
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex-1 bg-forest-deep rounded-5xl p-10 relative overflow-hidden shadow-2xl cursor-default"
          >
            <p className="text-emerald-light/60 text-xs font-bold mb-4 uppercase tracking-widest">Awaiting Settlement</p>
            <h4 className="text-4xl font-extrabold text-white hero-text mb-4 flex items-baseline">
              <span className="text-xl text-white/30 mr-2 font-black">₹</span>
              {splitPaise(balances.held_paise).value}
            </h4>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full w-fit">
              <Clock size={14} className="text-emerald-light" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Processing</span>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ x: 5 }}
            className="flex-1 bg-neutral-well rounded-5xl p-10 border border-white cursor-default"
          >
            <p className="text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Total Cleared</p>
            <h4 className="text-4xl font-extrabold text-forest-deep hero-text mb-4 flex items-baseline">
              <span className="text-xl text-forest-deep/20 mr-2 font-black">₹</span>
              {splitPaise(balances.total_balance_paise).value}
            </h4>
            <div className="flex items-center gap-2 text-emerald-vibrant font-black text-[10px] uppercase tracking-widest">
              <CheckCircle2 size={16} /> All time
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Payout & Mini Ledger */}
      <div className="grid grid-cols-12 gap-12 items-start">
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-8 bg-neutral-pop rounded-6xl p-12 shadow-organic-lg border border-slate-50"
        >
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-2xl font-extrabold text-forest-deep hero-text">Recent Sync</h4>
            <button className="flex items-center gap-2 text-sm font-black text-rose-500 uppercase tracking-widest">
              Full History <ArrowRight size={16} />
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="pb-6">Recipient</th>
                <th className="pb-6">Status</th>
                <th className="pb-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(payouts) && payouts.slice(0, 4).map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-6 font-bold text-forest-deep">{p.bank_account_name || 'Destination Vault'}</td>
                  <td className="py-6"><span className="text-xs font-bold uppercase">{p.status}</span></td>
                  <td className="py-6 text-right font-black text-lg">{formatPaise(p.amount_paise)}</td>
                </tr>
              ))}
              {(!payouts || payouts.length === 0) && (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No Recent Syncs</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-4 bg-neutral-pop rounded-6xl p-12 border border-slate-100 shadow-organic-lg"
        >
          <h4 className="text-2xl font-extrabold text-forest-deep hero-text mb-10">Quick Payout</h4>
          <form onSubmit={handlePayout} className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-4 block uppercase tracking-widest">Value</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-neutral-well/50 rounded-2xl p-6 text-2xl font-extrabold text-forest-deep focus:ring-4 ring-emerald-light/10 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-4 block uppercase tracking-widest">Vault</label>
              <select 
                value={formData.bank_account_id}
                onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                className="w-full bg-neutral-well/50 rounded-2xl p-5 text-sm font-bold focus:ring-4 ring-emerald-light/10 outline-none transition-all"
              >
                <option value="">Select Account</option>
                {Array.isArray(bankAccounts) && bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_holder_name}</option>
                ))}
              </select>
            </div>
            <button className="w-full bg-forest-deep text-white font-black py-6 rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {isSubmitting ? <RefreshCcw className="animate-spin mx-auto" /> : 'Execute'}
            </button>
          </form>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Dashboard;
