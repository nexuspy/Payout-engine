import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, ShieldCheck, Trash2, Home, Landmark } from 'lucide-react';
import axios from 'axios';
import { useMerchant, API_BASE } from '../context/MerchantContext';

const BankAccounts = () => {
  const { bankAccounts, selectedMerchant, refresh } = useMerchant();
  const [showAdd, setShowAdd] = useState(false);
  const [newBank, setNewBank] = useState({ 
    account_number: '', 
    ifsc_code: '', 
    account_holder_name: '',
    is_primary: false 
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/merchants/${selectedMerchant.id}/bank-accounts/`, newBank);
      setShowAdd(false);
      setNewBank({ account_number: '', ifsc_code: '', account_holder_name: '', is_primary: false });
      refresh();
    } catch (err) {
      alert("Failed to link account");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Recipient Vaults</h2>
          <h3 className="text-5xl font-extrabold text-forest-deep hero-text tracking-tight">Linked Destinations</h3>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-3 px-8 py-5 bg-forest-deep text-white rounded-full font-black shadow-2xl hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Link New Vault
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-neutral-well/50 rounded-5xl p-10 border-2 border-dashed border-slate-200 overflow-hidden"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Holder</label>
              <input 
                required
                className="w-full bg-white rounded-2xl p-5 text-sm font-bold border border-slate-100 shadow-sm"
                value={newBank.account_holder_name}
                onChange={e => setNewBank({ ...newBank, account_holder_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</label>
              <input 
                required
                className="w-full bg-white rounded-2xl p-5 text-sm font-bold border border-slate-100 shadow-sm"
                value={newBank.account_number}
                onChange={e => setNewBank({ ...newBank, account_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</label>
              <input 
                required
                className="w-full bg-white rounded-2xl p-5 text-sm font-bold border border-slate-100 shadow-sm"
                value={newBank.ifsc_code}
                onChange={e => setNewBank({ ...newBank, ifsc_code: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button className="bg-emerald-vibrant text-white w-full py-5 rounded-2xl font-black shadow-lg">Confirm Linkage</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {bankAccounts.map((acc) => (
          <div key={acc.id} className="bg-neutral-pop rounded-5xl p-10 shadow-organic-lg border border-slate-50 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-neutral-well rounded-2xl flex items-center justify-center text-forest-deep">
                <Landmark size={28} />
              </div>
              {acc.is_primary && (
                <span className="bg-emerald-light/20 text-emerald-vibrant text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-light/20">Primary</span>
              )}
            </div>
            
            <div className="space-y-1 mb-8">
              <p className="text-2xl font-black text-forest-deep">{acc.account_holder_name}</p>
              <p className="text-sm font-bold text-slate-400 font-mono">•••• •••• •••• {acc.account_number.slice(-4)}</p>
            </div>

            <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-widest group-hover:text-emerald-vibrant transition-colors">
              <ShieldCheck size={14} /> Verified Gateway
            </div>

            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-forest-deep/5 blur-3xl rounded-full"></div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BankAccounts;
