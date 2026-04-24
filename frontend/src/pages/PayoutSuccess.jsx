import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Share2, ArrowLeft, Receipt } from 'lucide-react';

const PayoutSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  const payout = state?.payout || { 
    id: 'PYT-99021', 
    amount_paise: 500000, 
    bank_account_name: 'Nexus Corp Vault' 
  };

  const formatPaise = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  const fee = payout.amount_paise * 0.005; // 0.5% fee
  const net = payout.amount_paise - fee;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <div className="bg-neutral-pop rounded-6xl p-12 shadow-organic-lg border border-slate-50 relative overflow-hidden text-center">
        {/* Success Glow */}
        <div className="w-32 h-32 bg-emerald-light/20 rounded-full mx-auto mb-10 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-emerald-light/30 rounded-full animate-ping opacity-25"></div>
          <CheckCircle2 size={64} className="text-emerald-vibrant" />
        </div>

        <h2 className="text-4xl font-extrabold text-forest-deep hero-text mb-4">Payout Dispatched</h2>
        <p className="text-slate-400 font-bold mb-12 uppercase tracking-widest text-xs">Reference: REF-{payout.id.toString().padStart(5, '0')}</p>

        {/* Cinematic Receipt */}
        <div className="bg-neutral-well/30 rounded-4xl p-10 text-left space-y-6 mb-12 border border-white/50">
          <div className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <span>Fiscal Item</span>
            <span>Value</span>
          </div>
          <div className="h-px bg-slate-100"></div>
          
          <div className="flex justify-between">
            <span className="font-bold text-slate-400">Gross Withdrawal</span>
            <span className="font-black text-forest-deep">{formatPaise(payout.amount_paise)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-bold text-slate-400">Processing Fee (0.5%)</span>
            <span className="font-bold text-rose-400">-{formatPaise(fee)}</span>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-emerald-vibrant uppercase tracking-widest leading-none mb-2">Net Cleared</p>
              <p className="text-4xl font-black text-forest-deep hero-text">{formatPaise(net)}</p>
            </div>
            <Receipt className="text-emerald-vibrant/20" size={48} />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-6">
          <button className="flex items-center justify-center gap-3 bg-forest-deep text-white py-6 rounded-3xl font-black shadow-xl hover:scale-105 transition-transform">
            <Download size={20} /> Receipt
          </button>
          <button className="flex items-center justify-center gap-3 glass-accent text-forest-deep py-6 rounded-3xl font-black border border-slate-100 hover:bg-white transition-colors">
            <Share2 size={20} /> Share
          </button>
        </div>

        <Link 
          to="/"
          className="inline-flex items-center gap-2 mt-12 text-slate-400 font-bold hover:text-forest-deep transition-colors"
        >
          <ArrowLeft size={18} /> Return to Terminal
        </Link>
      </div>
    </motion.div>
  );
};

export default PayoutSuccess;
