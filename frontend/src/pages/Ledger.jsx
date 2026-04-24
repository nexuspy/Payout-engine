import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, FileText, Download } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';

const Ledger = () => {
  const { ledger, payouts } = useMerchant();
  const [searchTerm, setSearchTerm] = useState('');

  const formatPaise = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Global Ledger</h2>
          <h3 className="text-5xl font-extrabold text-forest-deep hero-text tracking-tight">Financial Stream</h3>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-pop border border-slate-100 rounded-full pl-14 pr-8 py-4 shadow-organic focus:outline-none focus:ring-2 ring-forest-deep/5 w-80 font-bold text-sm"
            />
          </div>
          <button className="p-4 bg-forest-deep text-white rounded-full shadow-lg">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-neutral-pop rounded-6xl p-10 shadow-organic-lg border border-slate-50">
        <div className="flex justify-between items-center mb-10">
          <h4 className="text-xl font-bold text-forest-deep">Detailed Stream</h4>
          <button className="flex items-center gap-2 text-xs font-black text-emerald-vibrant uppercase tracking-widest bg-emerald-light/10 px-6 py-3 rounded-full hover:bg-emerald-light/20 transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="space-y-4">
          {ledger.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-6 bg-neutral-well/30 rounded-4xl hover:bg-neutral-well/50 transition-colors group">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${entry.entry_type === 'credit' ? 'bg-emerald-light/20 text-emerald-vibrant' : 'bg-rose-50 text-rose-500'}`}>
                  {entry.entry_type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                  <p className="font-bold text-forest-deep text-lg capitalize">{entry.description || entry.entry_type}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <div className="text-right">
                  <p className={`text-2xl font-black ${entry.entry_type === 'credit' ? 'text-emerald-vibrant' : 'text-forest-deep'}`}>
                    {entry.entry_type === 'credit' ? '+' : '-'}{formatPaise(entry.amount_paise)}
                  </p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Vault Reference: {entry.id}</p>
                </div>
                <button className="p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileText className="text-slate-300" size={20} />
                </button>
              </div>
            </div>
          ))}

          {ledger.length === 0 && (
            <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest opacity-50">
              No transactions currently synchronized
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Ledger;
