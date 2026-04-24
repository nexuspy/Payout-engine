import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useMerchant } from '../context/MerchantContext';

const Layout = () => {
  const { selectedMerchant, merchants, setSelectedMerchant } = useMerchant();

  return (
    <div className="flex min-h-screen bg-neutral-bg text-slate-900 overflow-x-hidden pb-24 md:pb-0">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 md:ml-[340px] p-6 md:p-12 max-w-[1400px] w-full mx-auto">
        <TopBar 
          merchant={selectedMerchant} 
          merchants={merchants} 
          onSelectMerchant={setSelectedMerchant} 
        />
        <div className="relative pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav - Mobile Only */}
      <MobileNav />
    </div>
  );
};

export default Layout;
