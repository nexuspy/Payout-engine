import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  CreditCard, 
  Settings 
} from 'lucide-react';

const MobileNav = () => {
  const navItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/' },
    { label: 'Ledger', icon: History, path: '/ledger' },
    { label: 'Vaults', icon: CreditCard, path: '/banks' },
    { label: 'Profile', icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-100 flex items-center justify-around px-6 z-50 md:hidden pb-4">
      {navItems.map((item) => (
        <NavLink 
          key={item.label}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1.5 transition-all
            ${isActive ? 'text-forest-deep' : 'text-slate-400'}
          `}
        >
          {({ isActive }) => (
            <>
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-forest-deep text-white shadow-lg' : ''}`}>
                <item.icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
