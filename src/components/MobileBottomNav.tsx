import React from 'react';
import { 
  Home, 
  Building2, 
  Heart, 
  Plus, 
  User
} from 'lucide-react';
import { ActivePage, UserProfile } from '../types';

interface MobileBottomNavProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  savedCount: number;
  onOpenSavedModal: () => void;
  onOpenPostWizard: () => void;
  user: UserProfile | null;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  onNavigate,
  savedCount,
  onOpenSavedModal,
  onOpenPostWizard,
  user,
  onOpenProfile,
  onOpenLogin,
}) => {
  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.07)] w-full max-w-full overflow-hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      <div className="grid grid-cols-5 items-center h-15 px-1 max-w-md mx-auto w-full">
        {/* 1. Home */}
        <button
          type="button"
          id="mobile-nav-home"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center min-h-[48px] w-full transition-transform active:scale-90 cursor-pointer ${
            activePage === 'home' ? 'text-[#77101F]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${activePage === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activePage === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#77101F]" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activePage === 'home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </button>

        {/* 2. Buy Properties */}
        <button
          type="button"
          id="mobile-nav-buy"
          onClick={() => onNavigate('buy')}
          className={`flex flex-col items-center justify-center min-h-[48px] w-full transition-transform active:scale-90 cursor-pointer ${
            activePage === 'buy' ? 'text-[#77101F]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Building2 className={`w-5 h-5 ${activePage === 'buy' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activePage === 'buy' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#77101F]" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activePage === 'buy' ? 'font-bold' : 'font-medium'}`}>
            Buy
          </span>
        </button>

        {/* 3. Sell / Post Property CTA (Center Thumb Anchor) */}
        <button
          type="button"
          id="mobile-nav-post-cta"
          onClick={onOpenPostWizard}
          className="flex flex-col items-center justify-center min-h-[48px] w-full -mt-3.5 transition-transform active:scale-90 cursor-pointer group"
          title="Sell or Rent Property for Free"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#600C18] to-[#881324] text-white flex items-center justify-center shadow-md shadow-[#77101F]/30 group-hover:shadow-lg group-hover:scale-105 transition-all border-2 border-white">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-extrabold text-[#77101F] tracking-tight mt-0.5">
            Sell
          </span>
        </button>

        {/* 4. Saved Properties */}
        <button
          type="button"
          id="mobile-nav-saved"
          onClick={onOpenSavedModal}
          className="flex flex-col items-center justify-center min-h-[48px] w-full transition-transform active:scale-90 cursor-pointer text-slate-500 hover:text-slate-800"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${savedCount > 0 ? 'text-[#77101F] fill-[#77101F]/15 stroke-[2.2]' : 'stroke-2'}`} />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#77101F] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                {savedCount > 99 ? '99+' : savedCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${savedCount > 0 ? 'font-bold text-slate-800' : 'font-medium'}`}>
            Saved
          </span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          id="mobile-nav-profile"
          onClick={() => (user ? onOpenProfile() : onOpenLogin())}
          className={`flex flex-col items-center justify-center min-h-[48px] w-full transition-transform active:scale-90 cursor-pointer ${
            activePage === 'profile' ? 'text-[#77101F]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            {user ? (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                activePage === 'profile'
                  ? 'bg-[#77101F] text-white ring-2 ring-red-200'
                  : 'bg-slate-800 text-white'
              }`}>
                {user.avatarInitials || user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ) : (
              <User className={`w-5 h-5 ${activePage === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            )}
            {activePage === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#77101F]" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activePage === 'profile' ? 'font-bold' : 'font-medium'}`}>
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
