import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Wallet, 
  LayoutDashboard, 
  ArrowUpRight, 
  CreditCard, 
  History, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Ledger', icon: History, path: '/ledger' },
    { label: 'Bank Vaults', icon: CreditCard, path: '/banks' },
    { label: 'Preferences', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-80 fixed h-[calc(100vh-40px)] m-5 bg-neutral-pop border border-slate-100 rounded-5xl p-10 flex flex-col gap-12 shadow-organic z-50">
      <div className="flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-forest-deep rounded-3xl flex items-center justify-center shadow-lg shadow-forest-deep/20">
          <Wallet className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight hero-text text-forest-deep">Engine<span className="text-emerald-light">.</span></h1>
      </div>

      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <NavLink 
            key={item.label}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-5 px-6 py-5 rounded-full transition-all duration-500 group
              ${isActive 
                ? 'bg-forest-deep text-white shadow-xl shadow-forest-deep/10' 
                : 'hover:bg-neutral-well text-slate-400 hover:text-forest-deep'}
            `}
          >
            <item.icon size={22} />
            <span className="font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden lg:flex mt-auto bg-neutral-well/50 rounded-4xl p-6 border border-slate-50 flex-col">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cloud Status</p>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-light rounded-full relative">
            <div className="absolute inset-0 bg-emerald-light rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-sm font-bold text-forest-deep">Secure Link</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
