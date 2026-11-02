import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  LogIn, 
  Eye, 
  EyeOff, 
  MapPin, 
  AlertCircle, 
  KeyRound, 
  UserCheck,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Clock,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { TrussetsLogo } from './TrussetsLogo';
import { userService } from '../services/userService';
import { normalizeMobile } from '../utils/phone';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentCity?: string;
  onNavigateToAdmin?: () => void;
}

type MainView = 'login' | 'signup' | 'forgot-password' | 'complete-profile';
type LoginTab = 'phone' | 'email';
type SignupTab = 'phone' | 'email';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentCity = '',
  onNavigateToAdmin,
}) => {
  // Navigation & tabs
  const [view, setView] = useState<MainView>('login');
  const [loginTab, setLoginTab] = useState<LoginTab>('phone');
  const [signupTab, setSignupTab] = useState<SignupTab>('phone');

  // Phone + OTP State
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'input' | 'otp'>('input');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Email + Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Complete Profile / Registration State (Requirement 10, 13, 14, 15, 17)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUserType, setRegUserType] = useState<'Property Buyers' | 'Property Sellers' | 'Tenants' | 'Property Owners'>('Property Buyers');
  const [regLocation, setRegLocation] = useState(currentCity && currentCity !== 'Select Location' ? currentCity : '');
  const [verifiedPhoneRecord, setVerifiedPhoneRecord] = useState<{ display: string; normalized: string; token?: string } | null>(null);

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'verify'>('input');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Country Code Options (Default: India +91)
  const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
  ];

  // 1-second countdown ticker for resend cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const resetAllFields = () => {
    setView('login');
    setLoginTab('phone');
    setSignupTab('phone');
    setCountryCode('+91');
    setPhone('');
    setDisplayPhone('');
    setOtpStep('input');
    setOtp(['', '', '', '', '', '']);
    setCooldownSeconds(0);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegUserType('Property Buyers');
    setRegLocation(currentCity && currentCity !== 'Select Location' ? currentCity : '');
    setVerifiedPhoneRecord(null);
    setForgotIdentifier('');
    setForgotStep('input');
    setForgotOtp('');
    setNewPassword('');
    setError('');
    setSuccessMessage('');
  };

  // Reset modal state on open or close so old credentials are never retained
  useEffect(() => {
    resetAllFields();
  }, [isOpen]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // HANDLERS: Phone Number + OTP Sign In (Req 8, 9, 10)
  // ----------------------------------------------------
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSuccessMessage('');

    const rawDigits = phone.replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = phone.startsWith('+') ? phone : `${countryCode}${rawDigits.slice(-10)}`;
    const norm = normalizeMobile(fullPhone);
    if (!norm) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setDisplayPhone(norm.display);
    setIsSubmitting(true);

    try {
      const isSignupFlow = view === 'signup';
      const res = await userService.sendOtp(norm.normalized, isSignupFlow ? 'signup' : 'login', isSignupFlow);
      setOtpStep('otp');
      setOtp(['', '', '', '', '', '']);
      setCooldownSeconds(res.cooldownSeconds || 60);
      setSuccessMessage(`Verification code dispatched via SMS to ${norm.display}`);
      setTimeout(() => {
        document.getElementById('login-otp-box-0')?.focus();
      }, 100);
    } catch (err: any) {
      if (err?.code === 'MOBILE_EXISTS') {
        setError('An account with this mobile number already exists. Please switch to Sign In.');
      } else if (err?.code === 'COOLDOWN_ACTIVE' && err?.cooldownSeconds) {
        setCooldownSeconds(err.cooldownSeconds);
        setError(err?.message || 'Please wait before requesting a new code.');
        setOtpStep('otp');
      } else if (err?.code === 'SMS_NOT_CONFIGURED') {
        setError(err?.message || 'SMS Gateway is not fully configured on the server.');
      } else {
        setError(err?.message || 'Failed to dispatch verification code. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isSubmitting) return;
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const isSignupFlow = view === 'signup';
      const norm = normalizeMobile(displayPhone || phone);
      const targetPhone = norm ? norm.normalized : (phone.startsWith('+') ? phone : `${countryCode}${phone}`);
      const res = await userService.sendOtp(targetPhone, isSignupFlow ? 'signup' : 'login', isSignupFlow);
      setCooldownSeconds(res.cooldownSeconds || 60);
      setOtp(['', '', '', '', '', '']);
      setSuccessMessage(`A fresh verification code has been dispatched to ${norm?.display || displayPhone}`);
      setTimeout(() => {
        document.getElementById('login-otp-box-0')?.focus();
      }, 100);
    } catch (err: any) {
      if (err?.cooldownSeconds) {
        setCooldownSeconds(err.cooldownSeconds);
      }
      setError(err?.message || 'Failed to resend verification code. Please wait.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    const cleanDigit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);

    // Auto-focus next box
    if (cleanDigit && index < 5) {
      const nextInput = document.getElementById(`login-otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 5);
    document.getElementById(`login-otp-box-${nextIdx}`)?.focus();
  };

  const handleVerifyPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSuccessMessage('');

    const fullOtp = otp.join('').trim();
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code sent to your phone.');
      return;
    }

    const norm = normalizeMobile(displayPhone || phone);
    const targetPhone = norm ? norm.normalized : phone;

    setIsSubmitting(true);

    try {
      const isSignupFlow = view === 'signup';
      const res = await userService.verifyOtp(targetPhone, fullOtp, isSignupFlow ? 'signup' : 'login');

      if (res.isExistingUser && res.user) {
        // Requirement 9: Existing user -> sign into existing account immediately
        resetAllFields();
        onLoginSuccess(res.user);
        onClose();
      } else {
        // Requirement 10: New phone number -> transition to "Complete Your Profile"
        setVerifiedPhoneRecord({
          display: res.phone || displayPhone,
          normalized: res.mobile_normalized,
          token: res.verificationToken,
        });
        setRegPhone(res.phone || displayPhone);
        setView('complete-profile');
        setSuccessMessage('Mobile verified successfully! Please enter your genuine profile details to complete registration.');
      }
    } catch (err: any) {
      if (err?.remainingAttempts !== undefined) {
        if (err.remainingAttempts === 0) {
          setError('Maximum verification attempts exceeded. Please request a new code.');
          setOtpStep('input');
          setOtp(['', '', '', '', '', '']);
        } else {
          setError(`Incorrect verification code. ${err.remainingAttempts} attempt(s) remaining.`);
        }
      } else {
        setError(err?.message || 'Invalid or expired verification code. Please check and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: Email + Password Sign In (Req 11)
  // ----------------------------------------------------
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await userService.loginWithPassword(email.trim(), password);
      resetAllFields();
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      if (err?.code === 'USER_NOT_FOUND') {
        setError('No account found with this email. Please check your email or Sign Up below.');
      } else if (err?.code === 'NO_PASSWORD_SET') {
        setError('No password is set for this account yet. Please sign in with Phone Number + OTP or use Forgot Password.');
      } else if (err?.code === 'INVALID_PASSWORD') {
        setError('Incorrect password. Please try again or use Forgot Password.');
      } else {
        setError(err?.message || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: Complete Profile & Registration (Req 13, 14, 15, 17, 18, 19, 20)
  // ----------------------------------------------------
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Strict Name Validation (Requirement 15: Never fake user names)
    if (!regName.trim() || regName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    // Phone validation
    const targetPhone = verifiedPhoneRecord?.display || regPhone;
    const norm = normalizeMobile(targetPhone);
    if (!norm) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Email validation (Requirement 14: Never fabricate email; genuine or empty string)
    const cleanEmail = regEmail.trim();

    setIsSubmitting(true);

    try {
      const res = await userService.register({
        name: regName.trim(),
        phone: targetPhone,
        email: cleanEmail || undefined,
        password: regPassword || undefined,
        userType: regUserType,
        location: regLocation.trim() || undefined,
        city: regLocation.includes(',') ? regLocation.split(',').pop()?.trim() : regLocation.trim() || undefined,
        verificationToken: verifiedPhoneRecord?.token,
      });

      resetAllFields();
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      if (err?.code === 'MOBILE_EXISTS') {
        setError('This mobile number is already registered. Please sign in instead.');
      } else if (err?.code === 'EMAIL_EXISTS') {
        setError('An account with this email address already exists. Please sign in instead.');
      } else {
        setError(err?.message || 'Failed to complete registration. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: Forgot Password Flow
  // ----------------------------------------------------
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email address or mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userService.forgotPassword(forgotIdentifier.trim());
      setForgotStep('verify');
      setSuccessMessage(res.message || 'Verification code sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!forgotOtp.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userService.resetPassword({
        emailOrPhone: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      setSuccessMessage(res.message || 'Password updated successfully. You can now sign in.');
      setTimeout(() => {
        setView('login');
        setLoginTab('email');
        setEmail(forgotIdentifier.includes('@') ? forgotIdentifier.trim() : '');
        setPassword(newPassword);
        setForgotStep('input');
        setForgotOtp('');
        setNewPassword('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div 
        id="login-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-[#77101F] to-[#5a0b17] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-2">
            <TrussetsLogo size="sm" variant="white" />
          </div>

          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            {view === 'login' && 'Sign In to Trussets'}
            {view === 'signup' && 'Create Your Trussets Account'}
            {view === 'complete-profile' && 'Complete Your Profile'}
            {view === 'forgot-password' && 'Reset Account Password'}
          </h2>
          <p className="text-xs text-red-100/90 mt-1 leading-relaxed">
            {view === 'login' && 'Zero brokerage real estate network with 100% verified properties & direct owners.'}
            {view === 'signup' && 'Join thousands of genuine buyers, sellers, tenants, and property owners.'}
            {view === 'complete-profile' && 'Mobile verified! Please provide your genuine profile details.'}
            {view === 'forgot-password' && 'Enter your registered email or phone to reset your password.'}
          </p>
        </div>

        {/* Global Feedback Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMessage && !error && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* =========================================================================
              VIEW 1: SIGN IN (Requirement 7: Exactly two tabs: Phone + OTP | Email + Password)
              ========================================================================= */}
          {view === 'login' && (
            <div>
              {/* Primary Switcher Tabs */}
              <div className="flex border-b border-slate-200 mb-5 bg-slate-50 p-1 rounded-2xl">
                <button
                  type="button"
                  id="tab-login-phone"
                  onClick={() => { setLoginTab('phone'); setError(''); setOtpStep('input'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loginTab === 'phone'
                      ? 'bg-white text-[#77101F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone Number + OTP</span>
                </button>
                <button
                  type="button"
                  id="tab-login-email"
                  onClick={() => { setLoginTab('email'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loginTab === 'email'
                      ? 'bg-white text-[#77101F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email + Password</span>
                </button>
              </div>

              {/* TAB 1: PHONE NUMBER + OTP (Requirement 8, 9, 10) */}
              {loginTab === 'phone' && (
                <div>
                  {otpStep === 'input' ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                      <div>
                        <label htmlFor="login-phone-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Mobile Number *
                        </label>
                        <div className="flex gap-2">
                          <div className="relative shrink-0">
                            <select
                              id="login-country-code-select"
                              aria-label="Country Code"
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.flag} {c.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              id="login-phone-input"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter 10-digit mobile number"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                              required
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          We will dispatch a secure 6-digit verification code to this mobile number via SMS.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || phone.replace(/\D/g, '').length < 10}
                        id="login-send-otp-btn"
                        className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Dispatching OTP via SMS...</span>
                          </>
                        ) : (
                          <>
                            <span>Send OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* OTP Verification Step */
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Enter 6-Digit Code</span>
                          <span className="text-[11px] text-slate-500">Sent to <strong className="text-slate-700">{displayPhone || phone}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOtpStep('input'); setOtp(['', '', '', '', '', '']); setError(''); }}
                          className="text-[11px] font-bold text-[#77101F] hover:underline cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>

                      {/* 6 OTP Boxes with paste support */}
                      <div className="flex justify-between gap-1.5 sm:gap-2">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`login-otp-box-${idx}`}
                            aria-label={`OTP Digit ${idx + 1}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                            onPaste={idx === 0 ? handleOtpPaste : undefined}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !digit && idx > 0) {
                                const prev = document.getElementById(`login-otp-box-${idx - 1}`);
                                if (prev) prev.focus();
                              }
                            }}
                            className="w-10 sm:w-11 h-11 text-center font-black text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400">Valid for 5 minutes</span>
                        {cooldownSeconds > 0 ? (
                          <span className="font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Resend code in {cooldownSeconds}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            id="resend-otp-btn"
                            onClick={handleResendOtp}
                            disabled={isSubmitting}
                            className="font-bold text-[#77101F] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Resend OTP</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otp.join('').trim().length !== 6}
                        id="login-verify-otp-btn"
                        className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify OTP & Sign In</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: EMAIL + PASSWORD (Requirement 11) */}
              {loginTab === 'email' && (
                <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="login-email-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. venkat.reddy@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot-password'); setError(''); setSuccessMessage(''); setForgotIdentifier(email); }}
                        className="text-[11px] font-bold text-[#77101F] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    id="login-password-btn"
                    className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In with Password'}
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Requirement 12: Below login options, add "New to Trussets? Sign Up" */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <div className="relative flex py-2 items-center mb-3">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <p className="text-xs text-slate-600">
                  New to Trussets?{' '}
                  <button
                    type="button"
                    id="switch-to-signup-btn"
                    onClick={() => { setView('signup'); setError(''); setSuccessMessage(''); }}
                    className="font-black text-[#77101F] hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                  >
                    Sign Up
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: SIGN UP / REGISTRATION (Requirement 12, 13, 14, 15, 17, 18)
              ========================================================================= */}
          {view === 'signup' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-xs font-extrabold text-[#77101F]">New Account</span>
              </div>

              {/* Registration Tabs */}
              <div className="flex border-b border-slate-200 mb-4 bg-slate-50 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setSignupTab('phone'); setError(''); setOtpStep('input'); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    signupTab === 'phone'
                      ? 'bg-white text-[#77101F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register via Mobile OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setSignupTab('email'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    signupTab === 'email'
                      ? 'bg-white text-[#77101F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register with Email
                </button>
              </div>

              {/* Sign Up via Phone OTP */}
              {signupTab === 'phone' && (
                <div>
                  {otpStep === 'input' ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                      <div>
                        <label htmlFor="signup-phone-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Mobile Number *
                        </label>
                        <div className="flex gap-2">
                          <div className="relative shrink-0">
                            <select
                              id="signup-country-code-select"
                              aria-label="Country Code"
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.flag} {c.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              id="signup-phone-input"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter 10-digit mobile number"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                              required
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          We will verify this mobile number first, then collect your genuine profile details.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || phone.replace(/\D/g, '').length < 10}
                        id="signup-send-otp-btn"
                        className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Dispatching OTP via SMS...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify Mobile via OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Verify OTP step in signup */
                    <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Enter 6-Digit Code</span>
                          <span className="text-[11px] text-slate-500">Sent to <strong className="text-slate-700">{displayPhone || phone}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOtpStep('input'); setOtp(['', '', '', '', '', '']); setError(''); }}
                          className="text-[11px] font-bold text-[#77101F] hover:underline cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>

                      {/* 6 OTP Boxes with paste support */}
                      <div className="flex justify-between gap-1.5 sm:gap-2">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`signup-otp-box-${idx}`}
                            aria-label={`OTP Digit ${idx + 1}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                            onPaste={idx === 0 ? handleOtpPaste : undefined}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !digit && idx > 0) {
                                const prev = document.getElementById(`signup-otp-box-${idx - 1}`);
                                if (prev) prev.focus();
                              }
                            }}
                            className="w-10 sm:w-11 h-11 text-center font-black text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400">Valid for 5 minutes</span>
                        {cooldownSeconds > 0 ? (
                          <span className="font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Resend code in {cooldownSeconds}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            id="signup-resend-otp-btn"
                            onClick={handleResendOtp}
                            disabled={isSubmitting}
                            className="font-bold text-[#77101F] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Resend OTP</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otp.join('').trim().length !== 6}
                        id="signup-verify-otp-btn"
                        className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Sign Up via Email & Password */}
              {signupTab === 'email' && (
                <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="10-digit phone"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. name@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        I am a:
                      </label>
                      <select
                        value={regUserType}
                        onChange={(e) => setRegUserType(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none"
                      >
                        <option value="Property Buyers">Property Buyer</option>
                        <option value="Property Sellers">Property Seller</option>
                        <option value="Tenants">Tenant</option>
                        <option value="Property Owners">Property Owner</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Location / City
                    </label>
                    <input
                      type="text"
                      value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                      placeholder="e.g. Madhapur, Hyderabad"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Complete Sign Up'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                    className="font-black text-[#77101F] hover:underline cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: COMPLETE PROFILE STEP FOR NEW OTP USERS (Requirement 10, 13, 14, 15)
              ========================================================================= */}
          {view === 'complete-profile' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              {/* Verified Phone Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Mobile Verified</span>
                    <div className="text-xs font-black text-slate-900">{verifiedPhoneRecord?.display || regPhone}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  100% Genuine
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="complete-profile-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Enter your genuine full name"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  We display this on your inquiries, verified bids, and property communications.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  id="complete-profile-email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com (leave blank if you don't have one)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave empty if you don't wish to provide an email. We never fabricate fake emails.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    I am a:
                  </label>
                  <select
                    value={regUserType}
                    onChange={(e) => setRegUserType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none"
                  >
                    <option value="Property Buyers">Property Buyer</option>
                    <option value="Property Sellers">Property Seller</option>
                    <option value="Tenants">Tenant</option>
                    <option value="Property Owners">Property Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    placeholder="e.g. Madhapur, Hyderabad"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Password (Optional)
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Set password if you want to sign in with email later"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                id="complete-profile-submit-btn"
                className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Profile & Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* =========================================================================
              VIEW 4: FORGOT PASSWORD (Requirement 11)
              ========================================================================= */}
          {view === 'forgot-password' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-xs font-extrabold text-[#77101F]">Password Help</span>
              </div>

              {forgotStep === 'input' ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Email or Mobile Number
                    </label>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. name@gmail.com or 9849023456"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      We will verify your identity with a 6-digit code.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Code...' : 'Send Reset Code'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="Enter verification code"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter the 6-digit verification code sent to your registered address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password & Sign In'}
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Security Guarantee */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Verified Users
            </span>
            <span>Zero Brokerage Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
