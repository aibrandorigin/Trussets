import React from 'react';
import { ShieldCheck, ExternalLink, Lock } from 'lucide-react';
import { PropertyCategory, TransactionType, ActivePage } from '../types';
import { TrussetsLogo } from './TrussetsLogo';

interface FooterProps {
  onSelectCategory: (cat: PropertyCategory) => void;
  onSelectTransaction: (type: TransactionType) => void;
  onNavigatePage?: (page: ActivePage) => void;
  onNavigateAdmin?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectTransaction,
  onNavigatePage,
  onNavigateAdmin,
  isAdminLoggedIn = false,
}) => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-slate-100">
          {/* Brand Column (spans 2) */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <TrussetsLogo size="md" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              India's premier zero-brokerage direct property marketplace connecting authentic owners and
              genuine buyers. Eliminating dealer markups, middleman commissions, and bogus listings through
              rigorous title deed and KYC authentication.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Anti-Middleman Protocol Enabled</span>
            </div>
          </div>

          {/* Properties Column */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Properties
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li>
                <button
                  onClick={() => {
                    onSelectTransaction('buy');
                    onSelectCategory('apartments');
                  }}
                  className="hover:text-[#881324] transition-colors cursor-pointer"
                >
                  Apartments
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTransaction('buy');
                    onSelectCategory('plots');
                  }}
                  className="hover:text-[#881324] transition-colors cursor-pointer"
                >
                  Plots & Lands
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTransaction('buy');
                    onSelectCategory('villas');
                  }}
                  className="hover:text-[#881324] transition-colors cursor-pointer"
                >
                  Villas
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTransaction('buy');
                    onSelectCategory('commercial');
                  }}
                  className="hover:text-[#881324] transition-colors cursor-pointer"
                >
                  Commercial
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Verification */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Trust & Verification
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage?.('about')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  Direct Verification
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage?.('terms')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  Legal Escrow Guarantee
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage?.('about')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  EC & Title Verification
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage?.('terms')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  RERA Compliance Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-500">
              <li>
                <button
                  id="footer-about-btn"
                  type="button"
                  onClick={() => onNavigatePage?.('about')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  About Trussets
                </button>
              </li>
              <li>
                <button
                  id="footer-terms-btn"
                  type="button"
                  onClick={() => onNavigatePage?.('terms')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  id="footer-privacy-btn"
                  type="button"
                  onClick={() => onNavigatePage?.('privacy')}
                  className="cursor-pointer hover:text-[#881324] transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Trussets Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="font-medium text-slate-600 flex items-center gap-1.5">
            <span>Crafted with passion by</span>
            <a
              href="https://brandorigin.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#77101F] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>BrandOrigin</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <button
              id="footer-bottom-privacy-btn"
              type="button"
              onClick={() => onNavigatePage?.('privacy')}
              className="hover:text-[#881324] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              id="footer-bottom-terms-btn"
              type="button"
              onClick={() => onNavigatePage?.('terms')}
              className="hover:text-[#881324] transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <button
              id="footer-bottom-help-btn"
              type="button"
              onClick={() => onNavigatePage?.('help')}
              className="hover:text-[#881324] transition-colors cursor-pointer"
            >
              Help Center
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
