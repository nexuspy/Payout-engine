import React from 'react';
import { User, ChevronDown, Bell } from 'lucide-react';

const TopBar = ({ merchant, merchants, onSelectMerchant }) => {
  return (
    <header className="flex justify-between items-center mb-16">
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">Workspace Overview</h2>
        <h3 className="text-4xl font-extrabold text-forest-deep hero-text">Hello, {merchant?.name ? merchant.name.split(' ')[0] : 'Member'}</h3>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative group">
          <button className="flex items-center gap-4 px-8 py-4 bg-neutral-pop rounded-full hover:shadow-xl transition-all border border-slate-100 shadow-organic">
            <div className="w-9 h-9 rounded-full bg-emerald-light/20 flex items-center justify-center border border-emerald-light/30">
              <User size={18} className="text-emerald-vibrant" />
            </div>
            <span className="font-bold text-sm text-forest-deep">{merchant?.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          
          <div className="absolute top-full right-0 mt-3 w-72 bg-neutral-pop rounded-[2.5rem] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 p-3 z-50 border border-slate-100 shadow-organic-lg">
            {merchants.map(m => (
              <button 
                key={m.id}
                onClick={() => onSelectMerchant(m)}
                className={`w-full text-left px-5 py-4 rounded-[1.75rem] text-sm font-bold transition-all ${merchant?.id === m.id ? 'bg-forest-deep text-white' : 'hover:bg-neutral-well text-slate-600'}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
        
        <button className="p-5 bg-neutral-pop rounded-full hover:shadow-xl transition-all border border-slate-100 shadow-organic relative">
          <Bell size={22} className="text-slate-400" />
          <div className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full border-4 border-white"></div>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
