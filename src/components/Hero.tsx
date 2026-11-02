import React from 'react';
import { 
  Search, 
  Smartphone, 
  Mountain, 
  Tractor, 
  Building2, 
  Home, 
  Building, 
  TreePine,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PropertyCategory } from '../types';
import { TrussetsLogo } from './TrussetsLogo';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCategory: (category: PropertyCategory) => void;
  selectedCategory: PropertyCategory;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onSelectCategory,
  selectedCategory,
}) => {
  const categoryTiles = [
    { id: 'plots' as PropertyCategory, label: 'Open Plots', icon: Mountain },
    { id: 'lands' as PropertyCategory, label: 'Lands', icon: Tractor },
    { id: 'apartments' as PropertyCategory, label: 'Apartments', icon: Building2 },
    { id: 'villas' as PropertyCategory, label: 'Villas & Houses', icon: Home },
    { id: 'commercial' as PropertyCategory, label: 'Commercial Buildings', icon: Building },
    { id: 'farmhouses' as PropertyCategory, label: 'Farmhouses', icon: TreePine },
  ];

  return (
    <section className="relative bg-[#540B16] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-inner">
      {/* Subtle radial backdrop accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(163,29,56,0.35),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Brand Logo Banner & Eyebrow */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="inline-flex items-center justify-center p-2.5 px-5 rounded-2xl bg-white shadow-xl border border-white/20 hover:scale-102 transition-transform">
            <TrussetsLogo size="sm" />
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-tight mb-4">
          Buy and Sell Real Estate Directly from Owners in India
        </h1>

        {/* Value Proposition Description */}
        <p className="text-sm sm:text-base text-red-100/90 leading-relaxed max-w-3xl mx-auto mb-6 font-normal">
          Trussets is an owner-to-owner property resale and rental network where buyers and sellers connect
          directly — no middlemen, no dealers, no brokers, and no time-passers. Instead of paying hefty
          commissions to agents, sellers connect with genuine direct buyers who are willing to pay a fair
          market value — and buyers avoid overpaying because they deal directly with the owner. From open
          plots and lands to apartments, villas, and commercial buildings — Trussets is the first place to look
          for your next property or sell directly.
        </p>

        {/* App Launching Soon Badge */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
          <span className="text-xs font-semibold text-red-200/80 tracking-wide">
            App Launching Soon
          </span>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/20 rounded-xl text-xs font-semibold text-white shadow-lg transition-all cursor-pointer">
            <Smartphone className="w-4 h-4 text-red-300" />
            <div className="text-left">
              <span className="block text-[10px] text-red-200/80 leading-none">DOWNLOAD ON ANDROID & iOS</span>
              <span className="font-bold text-xs tracking-wider">Google Play</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center bg-white rounded-full shadow-2xl p-1.5 border border-white/30">
            <input
              id="hero-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for properties, gated communities, localities..."
              className="w-full pl-5 pr-12 py-3 text-sm text-slate-800 placeholder-slate-400 rounded-full focus:outline-none"
            />
            <button
              id="hero-search-btn"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#77101F] hover:bg-[#600c19] text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browse Category Tiles */}
        <div className="pt-2">
          <h2 className="text-sm font-semibold text-red-100/85 mb-5 tracking-wide">
            Browse Owner-Listed Properties on Trussets
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categoryTiles.map((tile) => {
              const Icon = tile.icon;
              const isSelected = selectedCategory === tile.id;
              return (
                <button
                  key={tile.id}
                  id={`hero-category-${tile.id}`}
                  onClick={() => onSelectCategory(tile.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#6d0d1b] border-white/60 shadow-lg scale-102'
                      : 'bg-[#670D1C]/80 hover:bg-[#771221] border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center mb-2 text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-white/95 text-center leading-tight">
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
