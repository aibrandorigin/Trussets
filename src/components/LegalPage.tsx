import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Scale,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  XCircle,
  Gavel,
  Eye,
  Users,
  HelpCircle,
  Send,
} from 'lucide-react';
import { TrussetsLogo } from './TrussetsLogo';
import { brandService, BrandSettings } from '../services/brandService';
import { adminApi } from '../services/adminApi';

export type LegalTab = 'terms' | 'privacy' | 'about' | 'help';

interface LegalPageProps {
  activeTab: LegalTab;
  onChangeTab: (tab: LegalTab) => void;
  onBackToHome: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  activeTab,
  onChangeTab,
  onBackToHome,
}) => {
  const [contactInfo, setContactInfo] = useState<BrandSettings>(() => brandService.getSettings());

  // Inquiry form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Property Document Verification');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    brandService.syncWithServer().then((latest) => {
      setContactInfo(latest);
    });
    const unsubscribe = brandService.subscribe((updated) => {
      setContactInfo(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!fullName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!message.trim()) {
      setSubmitError('Please enter your inquiry message.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminApi.submitHelpInquiry({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      });
      setSubmitSuccess(
        res.message || 'Your inquiry has been submitted. Our specialist desk will reach out shortly.'
      );
      setFullName('');
      setPhone('');
      setEmail('');
      setSubject('Property Document Verification');
      setMessage('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className={activeTab === 'help' ? 'max-w-5xl mx-auto' : 'max-w-4xl mx-auto'}>
        {/* Top Bar: Back Button & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            id="legal-back-home-btn"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#77101F] transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs w-fit">
            <button
              id="legal-tab-terms"
              onClick={() => onChangeTab('terms')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'bg-[#77101F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Terms & Guidelines</span>
            </button>
            <button
              id="legal-tab-privacy"
              onClick={() => onChangeTab('privacy')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-[#77101F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              id="legal-tab-about"
              onClick={() => onChangeTab('about')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'about'
                  ? 'bg-[#77101F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>About Trussets</span>
            </button>
            <button
              id="legal-tab-help"
              onClick={() => onChangeTab('help')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'help'
                  ? 'bg-[#77101F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help Center</span>
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#600C18] via-[#77101F] to-[#450811] p-6 sm:p-10 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 mb-3 text-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Trussets Marketing And Construction Entreprises (TMCE)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {activeTab === 'terms'
                ? 'Trussets – Terms, Guidelines & Conditions'
                : activeTab === 'privacy'
                ? 'Trussets – Privacy & Document Policy'
                : activeTab === 'help'
                ? 'Trussets – Help Center & Support'
                : 'About Trussets & Platform Role'}
            </h1>
            <p className="text-xs sm:text-sm text-white/85 mt-2 max-w-3xl leading-relaxed">
              If you&apos;re not comfortable with English, please seek help from friends or family before proceeding. By listing your property or purchasing contact details, you confirm that you have read, understood, and accepted Trussets’s Terms, Guidelines, and Privacy Policy. Trussets is not responsible if you proceed without understanding the information provided.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-10 space-y-8 text-slate-700 text-sm leading-relaxed">
            {activeTab === 'terms' && (
              <>
                {/* Important Notice Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <AlertCircle className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Important Notice
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#77101F] text-white text-xs font-black flex items-center justify-center">1</span>
                        Property Image Policy
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Property images must not contain text, descriptions, mobile numbers, or any information other than the property image itself. Violations will result in listing deletion without a refund, as per the Trussets Business Policy.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#77101F] text-white text-xs font-black flex items-center justify-center">2</span>
                        Platform Purpose
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Trussets connects property owners directly with buyers and tenants, eliminating brokers, agents, and middlemen. Buyers can view ownership-related information, property documents, contact details, and other relevant documents, subject to the applicable verification indicators displayed on the platform.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#77101F] text-white text-xs font-black flex items-center justify-center">3</span>
                        Non-Refund Policy
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Trussets follows a non-refund policy. Genuine platform-related issues may be reviewed on a case-by-case basis for an appropriate resolution.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#77101F] text-white text-xs font-black flex items-center justify-center">4</span>
                        Reporting Brokers and Misrepresentation
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Trussets prohibits brokers, agents, and middlemen, whether individuals or entities. Agents/brokers misrepresenting themselves as property owners, their relatives, authorised representatives, or genuine buyers may be reported through the platform&apos;s Report option. Trussets reserves the right to block accounts found violating its policies; we cannot identify them until a genuine user reports them. The paid-access model is intended to discourage non-genuine participation and promote direct owner-to-buyer connections.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#77101F] text-white text-xs font-black flex items-center justify-center">5</span>
                        Buyer Engagement and Listing Promotion
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Buyer engagement depends on the uploaded data such as quality of property images, property-related documents (visible after plan purchase), and the owner&apos;s timely responsiveness. Trussets does not mediate or provide personal assistance for individual listings. Trussets may use ownership-verified listings that meet the above criteria for marketing and promotional purposes.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Platform Role */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <Building2 className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Platform Role
                    </h2>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 text-xs sm:text-sm">
                    <li>Trussets is only a property listing and connecting platform.</li>
                    <li>We act solely on the information and documents submitted by property owners/listers.</li>
                    <li>We do not guarantee sale, purchase, price, or returns.</li>
                    <li>Once a buyer purchases access to the owner’s contact details, Trussets’s role ends.</li>
                    <li>Any discussions, negotiations, site visits/inspections, token amounts, or final transactions are solely between the property owner and buyer.</li>
                    <li>
                      <strong>Trussets</strong> owned by <strong>Trussets Marketing And Construction Entreprises (TMCE)</strong> is an online marketplace and intermediary as defined under the Information Technology Act, 2000. Trussets and TMCE do not control or participate in negotiations, pricing, or transactions and shall not be held liable for disputes, fraud, or misrepresentations.
                    </li>
                  </ul>
                </section>

                {/* Do's & Don'ts for Owners and Buyers */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <UserCheck className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Do’s &amp; Don’ts for Owners and Buyers
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dos */}
                    <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                      <h3 className="font-extrabold text-emerald-950 text-base flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Do’s</span>
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-emerald-950/90">
                        <li>Owners must provide accurate property details and genuine documents.</li>
                        <li>To eliminate duplications and fraudulent postings, only the property owner, their parents, spouse, or their children are authorized to list the properties for sale or rent.</li>
                        <li>Owners must agree that once a buyer purchases the Owner’s Access, their contact details and property-related documents will be shared.</li>
                        <li>Buyers should conduct their own due diligence (physical inspection, SRO/RTO checks, title &amp; link document verification, encumbrance/hypothecation status, litigation history, etc.) before making the payments for sale.</li>
                        <li>Both parties should use the platform for genuine and lawful purposes only.</li>
                        <li>Buyers and sellers are advised to act with caution and complete knowledge at every stage of the process.</li>
                        <li>
                          <strong>Owner Consent:</strong> By clicking “I Agree”, the owner grants permission for the buyer to access their contact details and ownership/property documents. These details will be visible in the buyer’s dashboard only after the buyer purchases the owner details. No access is provided to any user who has not purchased the owner’s access.
                        </li>
                      </ul>
                    </div>

                    {/* Don'ts */}
                    <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200 space-y-3">
                      <h3 className="font-extrabold text-red-950 text-base flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#77101F] shrink-0" />
                        <span>Don’ts</span>
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-red-950/90">
                        <li>Do not list properties you do not own or are unauthorized to sell.</li>
                        <li>Do not provide false, incomplete, or misleading details.</li>
                        <li>Do not misuse contact information obtained from Trussets and Owners. It will result in suspension of account and may attract legal consequences under applicable law.</li>
                        <li>Do not expect Trussets to mediate disputes, recover money/documents, or guarantee deals.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Authorized Listings */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Authorized Listings
                    </h2>
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 text-xs sm:text-sm">
                    <li>To eliminate duplications and fraudulent postings, only the property owner, their parents, spouse, or their children are authorized to list their property on Trussets.</li>
                    <li>Dealers, brokers, and agents are strictly not permitted to list on this platform, unless they have bought the asset and proof of ownership is submitted.</li>
                    <li>Any listing found to be created by an unauthorized party will be removed without notice, and no refund will be processed.</li>
                  </ul>
                </section>

                {/* TERMS & CONDITIONS */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <Scale className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Terms &amp; Conditions
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Refund Policy</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>Payments made for listing or contact purchases (Owner Access) are non-refundable.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Contact Purchase (Unlocking the Listing Owner Profile)</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>Buyers must purchase the owner’s access to view owner contact details.</li>
                        <li>This ensures only genuine leads reach the owner.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Buyer Contact Policy</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>If an owner does not respond to the buyer’s first call within 24 hours, the buyer must report it and wait 48 hours.</li>
                        <li>If the owner still does not respond within 48 hours, the buyer will be allowed to select one alternate listing of any value, free of charge.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Owner Non-Response</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>If an owner repeatedly fails to respond after a buyer purchases the owner&apos;s access, Trussets reserves the right to remove the listing without notice.</li>
                        <li>No refunds will be provided.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Site Visit / Inspection Policy</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>If a buyer requests a site visit or inspection, they must show the owner their profile and unlock/contact purchase dashboard before inspecting the property.</li>
                        <li>If the owner is not confident about the buyer’s credentials on the spot, the buyer may request a guided demonstration by the owner or bring a qualified legal/technical advisor to assist in verification.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Listing Closure Policy</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>Once a property is sold, the owner must immediately update the platform and remove the listing to avoid confusion to the buyers.</li>
                        <li>If any buyer reports the property is sold, the listing will be removed immediately; in such cases the owner will not be eligible for the “Earn per Buyer” amount.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Owners Offer to Buyers</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>The owner may reject an offer if another buyer is already in the queue or has paid the token earlier.</li>
                        <li>Trussets provides no refunds if a buyer delays and misses the deal.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Right to Remove the Listing</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                        <li>Any listing found to be fraudulent, misleading, or violating guidelines can be removed without notice and no refund is offered.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Roles & Responsibilities */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <Users className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Roles &amp; Responsibilities
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">Trussets</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                        <li>Provide a digital marketplace to list, browse, and connect. The platform holds no liability for lack of leads or unsuccessful deals.</li>
                        <li>Verify basic ownership documents at the time of listing approval, if provided.</li>
                        <li>Mark listings with a “Verified” badge where documents are provided.</li>
                      </ul>
                      <p className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                        Note: Verification only confirms submission of documents. It does not guarantee property quality, legality, ownership, or performance.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">Property Owners</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                        <li>Ensure the property information and documents submitted are true and valid.</li>
                        <li>Upload property-related documents in the platform for the buyers who are purchasing or enabling packages to show interest on the property.</li>
                        <li>Respond promptly to buyer inquiries.</li>
                        <li>Cooperate with buyers who purchase their Owner’s Access.</li>
                        <li>Remove sold listings immediately to avoid penalties.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">Buyers</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                        <li>Independently verify property details (title deeds, EC, municipal approvals, litigation history, and encumbrances/hypothecation).</li>
                        <li>Exercise caution and seek technical, legal, or financial advice before making payments.</li>
                        <li>Bear the full responsibility for inspection, document checks, and transaction safety.</li>
                        <li>Report non-responsive owners within 48 hours.</li>
                        <li>All buyers are advised to bring a trusted companion when meeting owners for inspections or transactions.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Important & Additional Clauses */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                    <Gavel className="w-5 h-5 text-[#77101F]" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Important &amp; Additional Clauses
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Dispute Resolution</h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                        <li>If an owner does not respond to a buyer within 24 hours, the buyer must report it. Trussets will review the case within 72 hours and may offer an alternate contact unlock as compensation.</li>
                        <li>In case of disputes over inspections, both buyer and seller must provide relevant proof (chat logs, customer ID, etc.).</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Platform Disclaimer</h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                        Trussets is a digital marketplace only. We do not:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                        <li>Mediate disputes.</li>
                        <li>Guarantee sale price, timelines, or property condition.</li>
                        <li>Act as a broker or dealer.</li>
                        <li>Mediate transactions, payments, and negotiations, which remain solely between buyer and seller.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">Purpose of Terms &amp; Conditions</h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        The purpose of these Terms &amp; Conditions for Trussets is to safeguard the interests of the platform and the company against fraudulent activities, misuse, or attempts to exploit any process loopholes. Any deliberate acts intended to damage the company’s business, reputation, or financial interests—including but not limited to competitive manipulation, false listings, or financial exploitation—are strictly prohibited and may attract legal penalties and other actions to protect the company’s rights.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Final Notes & Transaction Guidelines */}
                <section className="p-5 rounded-2xl bg-red-50/60 border border-red-200 space-y-3">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#77101F]">
                    Final Notes &amp; Transaction Guidelines
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700">
                    Trussets is a digital marketplace only. The platform is not responsible for any disputes, recovery of token money, or legal/financial losses arising from interactions between buyers and sellers. All legal and financial obligations lie solely between the buyer and the property owner.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 font-semibold">
                    Trussets is not involved in, nor responsible for, any part of the transaction, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm text-slate-700">
                    <li>Negotiations or price agreements</li>
                    <li>Signing of sale deeds or agreements</li>
                    <li>Token advance handling</li>
                    <li>Delivery of possession</li>
                    <li>Registration / SRO transfer or related formalities</li>
                  </ul>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 pt-1">
                    The entire Terms &amp; Conditions are applicable for legal actions under relevant IPC sections. All disputes arising out of the use of Trussets shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.
                  </p>
                </section>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <strong className="font-bold block mb-0.5">Strict Document &amp; Contact Privacy Protection</strong>
                    We collect documents strictly for verification and buyer transparency after Owner’s Access unlock. We do not misuse, alter, or share any documents with third parties under any circumstance.
                  </div>
                </div>

                {/* What We Collect? */}
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-50 text-[#77101F] text-xs font-black flex items-center justify-center border border-red-100">1</span>
                    What We Collect?
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 text-xs sm:text-sm">
                    <li>
                      Genuine property-related documents such as Sale Deed, EC, Link Documents, Property Tax Receipt, and NOCs (such as loan and lease clearance) for buyers to verify.
                    </li>
                    <li>
                      Basic contact details of the owner/lister for the buyers to connect for sale or rent.
                    </li>
                    <li>
                      Government ID proof (Aadhaar, PAN, Passport, etc.) for ownership and relationship proof is collected strictly for the Trussets internal verification only to assign verification badges, if the Property Owners choose to have the verification badge.
                    </li>
                  </ul>
                </section>

                {/* How Do We Use Documents? */}
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-50 text-[#77101F] text-xs font-black flex items-center justify-center border border-red-100">2</span>
                    How Do We Use Documents?
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 text-xs sm:text-sm">
                    <li>
                      We collect only one property-related document, and also one KYC document to confirm ownership. If the owner himself/herself is not uploading the details, we would also require proof of a relationship between the uploader and the owner.
                    </li>
                    <li>
                      KYC is optional and used purely for internal verification to assign a “Verified” badge to the user’s account.
                    </li>
                    <li>
                      Property-related documents are visible only to potential buyers after they unlock Owner’s Access.
                    </li>
                    <li>
                      We do not misuse, alter, or share any documents with third parties under any circumstance.
                    </li>
                  </ul>
                </section>

                {/* Data Protection */}
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-50 text-[#77101F] text-xs font-black flex items-center justify-center border border-red-100">3</span>
                    Data Protection
                  </h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700 text-xs sm:text-sm">
                    <li>
                      Documents are securely stored and accessible only to authorized verification staff.
                    </li>
                    <li>
                      Documents are never shared with third parties without the owner’s consent.
                    </li>
                    <li>
                      User details (buyer/seller) are protected under strict privacy protocols from third parties.
                    </li>
                  </ul>
                </section>

                {/* Owner Consent & Access Control */}
                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-50 text-[#77101F] text-xs font-black flex items-center justify-center border border-red-100">4</span>
                    Owner Consent &amp; Buyer Access Control
                  </h2>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs sm:text-sm text-slate-700">
                    <p>
                      By clicking “I Agree”, the property owner grants permission for the buyer to access their contact details and property-related documents. These details will be visible in the buyer’s dashboard only after the buyer purchases the owner details. No access is provided to any user who has not purchased the owner’s access.
                    </p>
                    <p>
                      Do not misuse contact information obtained from Trussets and Owners. Misuse will result in suspension of account and may attract legal consequences under applicable law.
                    </p>
                  </div>
                </section>

                {/* Verification Note */}
                <section className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950">
                  <strong className="font-bold block mb-1 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-700" />
                    Verification &amp; Document Disclaimer
                  </strong>
                  Verification only confirms submission of documents. It does not guarantee property quality, legality, ownership, or performance. Buyers should conduct their own independent due diligence before making any payments.
                </section>
              </>
            )}

            {activeTab === 'about' && (
              <>
                <section className="space-y-3">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Platform Purpose &amp; Ownership
                  </h2>
                  <p>
                    <strong>Trussets</strong> (owned by <strong>Trussets Marketing And Construction Entreprises (TMCE)</strong>) connects property owners directly with buyers and tenants, eliminating brokers, agents, and middlemen. Buyers can view ownership-related information, property documents, contact details, and other relevant documents, subject to the applicable verification indicators displayed on the platform.
                  </p>
                  <p>
                    Trussets owned by Trussets Marketing And Construction Entreprises (TMCE) is an online marketplace and intermediary as defined under the Information Technology Act, 2000.
                  </p>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900">
                      <UserCheck className="w-4 h-4 text-[#77101F]" />
                      <span>Authorized Family Listings Only</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      To eliminate duplications and fraudulent postings, only the property owner, their parents, spouse, or their children are authorized to list properties on Trussets.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900">
                      <FileText className="w-4 h-4 text-[#77101F]" />
                      <span>Verified Ownership Documents</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Property-related documents and KYC proofs are verified to assign a “Verified” badge, and ownership documents are shared only with buyers who unlock Owner’s Access.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Zero Brokers &amp; Zero Middlemen</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Dealers, brokers, and agents are strictly prohibited. Paid-access model discourages non-genuine participation and promotes direct owner-to-buyer connections.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>48-Hour Buyer Protection</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      If an owner fails to respond within 48 hours of a reported call after contact unlock, the buyer is eligible to select one alternate listing free of charge.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'help' && (
              <>
                {/* Two-Column Get In Touch & Send Inquiry to Specialist Section */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pb-6 border-b border-slate-200/80">
                  {/* Left Column: Get In Touch & Contact Cards */}
                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#77101F] block">
                        GET IN TOUCH
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5 leading-tight">
                        Help &amp; Property Verification
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-3">
                        Our verification specialists are available 6 days a week to assist with property ownership verification, title deed &amp; EC documents, owner access plans, or general platform queries.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Card 1: Operational Center */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#77101F]/10 text-[#77101F] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {contactInfo.operationalCenterTitle || 'Hyderabad Operational Center'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {contactInfo.operationalAddress || 'Hyderabad, Telangana'}
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Direct Owner Support Helpline */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#77101F]/10 text-[#77101F] flex items-center justify-center shrink-0 mt-0.5">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            Direct Owner Support Helpline
                          </h3>
                          <div className="text-xs sm:text-sm font-mono font-bold text-slate-700 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>{contactInfo.supportPhone || '+91 96526 63763'}</span>
                            {contactInfo.supportSecondaryPhone && (
                              <span>{contactInfo.supportSecondaryPhone}</span>
                            )}
                            {!contactInfo.supportSecondaryPhone &&
                              contactInfo.supportWhatsApp &&
                              contactInfo.supportWhatsApp !== contactInfo.supportPhone && (
                                <span>{contactInfo.supportWhatsApp}</span>
                              )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {contactInfo.supportHours || 'Monday – Saturday, 9:00 AM – 8:00 PM IST'}
                          </p>
                        </div>
                      </div>

                      {/* Card 3: Email Correspondence */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#77101F]/10 text-[#77101F] flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            Email Correspondence
                          </h3>
                          <div className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                            <span>{contactInfo.supportEmail || 'support@trussets.in'}</span>
                            {contactInfo.verificationEmail && (
                              <span>{contactInfo.verificationEmail}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Send Inquiry to Specialist Form */}
                  <div className="lg:col-span-7">
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#F8FAFC] border border-slate-200/90 shadow-xs">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        Send Inquiry to Specialist
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 mb-6">
                        Receive rapid callback from our verified desk.
                      </p>

                      {submitError && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {submitSuccess && (
                        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{submitSuccess}</span>
                        </div>
                      )}

                      <form onSubmit={handleInquirySubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Full Name *
                          </label>
                          <input
                            id="help-inquiry-name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="e.g. Ramesh Varma"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#77101F] transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Mobile Phone *
                            </label>
                            <input
                              id="help-inquiry-phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                              placeholder="10-digit number"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#77101F] transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Email Address
                            </label>
                            <input
                              id="help-inquiry-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="name@email.com"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#77101F] transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Subject
                          </label>
                          <select
                            id="help-inquiry-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#77101F] transition-colors font-medium"
                          >
                            <option value="Property Document Verification">
                              Property Document Verification
                            </option>
                            <option value="Owner Access Plan Assistance">
                              Owner Access Plan Assistance
                            </option>
                            <option value="Report Unresponsive Owner / Broker">
                              Report Unresponsive Owner / Broker
                            </option>
                            <option value="Post Property Assistance">
                              Post Property Assistance
                            </option>
                            <option value="General Platform Inquiry">
                              General Platform Inquiry
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Message *
                          </label>
                          <textarea
                            id="help-inquiry-message"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            placeholder="How can our property advisors assist you today?"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#77101F] transition-colors resize-none"
                          />
                        </div>

                        <button
                          id="help-inquiry-submit-btn"
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 px-6 bg-[#77101F] hover:bg-[#600C18] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </section>

                {/* Frequently Asked Questions */}
                <section className="space-y-4 pt-2">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#77101F]" />
                    <span>Frequently Asked Questions</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        1. How do I contact a Property Owner?
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Select a Buying or Rental plan from the Property Plans page to unlock Owner’s Access. Once unlocked, the owner’s verified phone number, WhatsApp, and uploaded property documents are immediately visible on your dashboard.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        2. What if the Owner does not respond?
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        If an owner does not respond to your first call within 24 hours, report it through the platform and wait 48 hours. If the owner still does not respond within 48 hours, you can select one alternate listing of any value free of charge.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        3. Who is allowed to post a property?
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Only the legal property owner, their parents, spouse, or their children are authorized to list properties. Brokers, agents, and middlemen are strictly prohibited.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        4. How do I report a Broker or Fake Listing?
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Use the Report option on the property page or submit an inquiry via the specialist form above. Accounts found violating our zero-brokerage policy are permanently blocked without refund.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Contact / Grievance Footer Box */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrussetsLogo size="sm" />
                </div>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#77101F]" />{' '}
                    {contactInfo.supportEmail || 'support@trussets.in'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#77101F]" />{' '}
                    {contactInfo.supportPhone || '+91 96526 63763'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#77101F]" />{' '}
                    {contactInfo.operationalAddress || 'Hyderabad, Telangana, India'}
                  </span>
                </p>
              </div>

              <button
                onClick={onBackToHome}
                className="px-5 py-2.5 bg-[#77101F] hover:bg-[#600C18] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer w-fit"
              >
                Return to Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
