import React from 'react';
import { 
  Compass, 
  Mountain, 
  Home, 
  Building2, 
  Building, 
  TreePine, 
  Sparkles 
} from 'lucide-react';
import { PropertyCategory } from '../types';

interface CategoryFilterBarProps {
  selectedCategory: PropertyCategory;
  onSelectCategory: (category: PropertyCategory) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories: { id: PropertyCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All', icon: Compass },
    { id: 'plots', label: 'Plots & Land', icon: Mountain },
    { id: 'villas', label: 'Villas & Houses', icon: Home },
    { id: 'apartments', label: 'Apartments / Flats', icon: Building2 },
    { id: 'commercial', label: 'Commercial Buildings', icon: Building },
    { id: 'farmhouses', label: 'Farmhouses', icon: TreePine },
    { id: 'luxury', label: 'Luxury Estates', icon: Sparkles },
  ];

  return (
    <div className="border-b border-slate-200 bg-white py-2.5 sm:py-3.5 px-3 sm:px-6 lg:px-8 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-1 snap-x snap-mandatory">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              id={`filter-pill-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 snap-start cursor-pointer ${
                isActive
                  ? 'bg-[#77101F] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
