import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Bell, CreditCard, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';

const Settings = () => {
  const { selectedMerchant } = useMerchant();

  const sections = [
    { title: 'Security Vault', subtitle: '2FA & Biometrics', icon: Shield, color: 'text-emerald-vibrant bg-emerald-light/20' },
    { title: 'API Access', subtitle: 'Keys & Webhooks', icon: Key, color: 'text-blue-500 bg-blue-50' },
    { title: 'Notifications', subtitle: 'Push & Email Alerts', icon: Bell, color: 'text-amber-500 bg-amber-50' },
    { title: 'Billing', subtitle: 'Statements & Fees', icon: CreditCard, color: 'text-purple-500 bg-purple-50' },
    { title: 'Support', subtitle: 'Help Center & Docs', icon: HelpCircle, color: 'text-slate-500 bg-slate-100' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
      <div className="grid grid-cols-12 gap-12">
        {/* Profile Card */}
        <div className="col-span-4 space-y-8">
          <div className="bg-neutral-pop rounded-[4rem] p-12 shadow-organic-lg border border-slate-50 relative overflow-hidden">
            <div className="w-24 h-24 bg-forest-deep rounded-[2.5rem] flex items-center justify-center text-white mb-8 text-3xl font-black">
              {selectedMerchant?.name ? selectedMerchant.name[0] : 'M'}
            </div>
            <h4 className="text-3xl font-extrabold text-forest-deep hero-text">{selectedMerchant?.name || 'Loading...'}</h4>
            <p className="text-slate-400 font-bold text-sm mb-8">{selectedMerchant?.email}</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-neutral-well rounded-2xl flex justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text">Merchant ID</span>
                <span className="text-[10px] font-mono text-forest-deep font-bold">#M-{selectedMerchant?.id.toString().padStart(5, '0')}</span>
              </div>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-3 py-6 rounded-3xl bg-rose-50 text-rose-500 font-black text-sm uppercase tracking-widest hover:bg-rose-100 transition-colors">
            <LogOut size={18} /> Sign Out Account
          </button>
        </div>

        {/* Categories */}
        <div className="col-span-8 bg-neutral-pop rounded-6xl p-12 shadow-organic-lg border border-slate-50 space-y-6">
          <h4 className="text-2xl font-extrabold text-forest-deep hero-text mb-10">Platform Control</h4>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {sections.map((s) => (
              <motion.div 
                key={s.title} 
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  show: { opacity: 1, x: 0 }
                }}
                whileHover={{ x: 10, backgroundColor: "rgba(235, 238, 237, 0.6)" }}
                className="flex items-center justify-between p-6 bg-neutral-well/30 rounded-[2.5rem] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${s.color}`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-forest-deep">{s.title}</p>
                    <p className="text-sm font-bold text-slate-400">{s.subtitle}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-forest-deep transition-colors" />
              </motion.div>
            ))}
          </motion.div>

          <div className="pt-10 border-t border-slate-100 mt-10">
            <div className="bg-emerald-vibrant/5 p-8 rounded-4xl flex items-center justify-between">
              <div>
                <p className="text-emerald-vibrant font-black text-lg">System Security: 98/100</p>
                <p className="text-sm text-emerald-vibrant/60 font-bold">All protocols operational</p>
              </div>
              <Shield className="text-emerald-vibrant opacity-30" size={40} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
