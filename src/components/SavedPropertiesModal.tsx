import React from 'react';
import { X, Heart, Trash2, ArrowRight, Eye, ExternalLink } from 'lucide-react';
import { PropertyListing } from '../types';
import { TrussetsLogo } from './TrussetsLogo';

interface SavedPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProperties: PropertyListing[];
  onSelectProperty: (property: PropertyListing) => void;
  onRemoveSaved: (id: string) => void;
  onClearAll: () => void;
  onOpenProperty?: (id: string) => void;
}

export const SavedPropertiesModal: React.FC<SavedPropertiesModalProps> = ({
  isOpen,
  onClose,
  savedProperties,
  onSelectProperty,
  onRemoveSaved,
  onClearAll,
  onOpenProperty,
}) => {
  if (!isOpen) return null;

  const handleOpenPropertyInSameTab = (propId: string) => {
    if (onOpenProperty) {
      onOpenProperty(propId);
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('property', propId);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.pathname + url.search);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#540B16] text-white">
          <div className="flex items-center gap-3">
            <TrussetsLogo size="sm" variant="white" />
            <span className="text-white/40">|</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-100">
              <Heart className="w-4 h-4 text-red-300 fill-red-300" />
              <span>Saved ({savedProperties.length})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1 space-y-3">
          {savedProperties.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No saved properties yet</p>
              <p className="mt-1">Click the heart icon on any listing to save it for quick comparison.</p>
            </div>
          ) : (
            savedProperties.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors"
              >
                <img
                  src={prop.images[0]}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{prop.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{prop.locality}, {prop.city}</p>
                  <span className="text-xs font-black text-[#881324] mt-1 block">
                    {prop.priceDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onSelectProperty(prop);
                      onClose();
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Quick view in modal"
                  >
                    <Eye className="w-4 h-4 text-[#77101F]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPropertyInSameTab(prop.id)}
                    className="p-1.5 bg-[#77101F] hover:bg-[#600c19] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                    title="Open details in same tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveSaved(prop.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {savedProperties.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#77101F] text-white text-xs font-bold hover:bg-[#600c19]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
