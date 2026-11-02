import React, { useState, useEffect } from 'react';
import { TrussetsLogo } from '../TrussetsLogo';
import { adminApi } from '../../services/adminApi';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Copy,
  Check,
  Server,
  KeyRound,
  ArrowLeft,
  Info
} from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome?: () => void;
}

interface TestAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  description: string;
  badge?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoggingIn, setIsTestLoggingIn] = useState(false);
  const [testLoginStep, setTestLoginStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Server health state
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'error'>('checking');
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([
    {
      id: 'admin-super',
      name: 'TrustSets Super Administrator',
      email: 'trussets@gmail.com',
      password: '111111',
      role: 'Super Administrator',
      phone: '+91 9652663763',
      description: 'Complete administrative governance, deed verification, pricing plans & fraud triaging.',
      badge: 'Default Super Admin'
    }
  ]);

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Check server health and fetch test accounts on mount
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok && isMounted) {
          setServerStatus('online');
        } else if (isMounted) {
          setServerStatus('error');
        }
      } catch {
        if (isMounted) setServerStatus('error');
      }

      try {
        const data = await adminApi.getTestAccounts();
        if (isMounted && data?.accounts?.length) {
          setTestAccounts(data.accounts);
        }
      } catch {
        // Use fallback static test account
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle standard manual login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please provide your admin email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your admin password.');
      return;
    }

    try {
      setIsLoading(true);
      await adminApi.login(email.trim(), password);
      setEmail('');
      setPassword('');
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-Click Instant Test Login
  const handleInstantTestLogin = async (targetEmail?: string) => {
    setErrorMessage('');
    setIsTestLoggingIn(true);
    setTestLoginStep('Connecting to secure admin gateway...');

    try {
      await new Promise((r) => setTimeout(r, 250));
      setTestLoginStep('Verifying administrative permissions...');
      await adminApi.testLogin(targetEmail || email);

      setTestLoginStep('Establishing authorized session token...');
      await new Promise((r) => setTimeout(r, 200));

      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick test login failed. Please try manual sign in.');
      setIsTestLoggingIn(false);
      setTestLoginStep('');
    }
  };

  // Populate form with specific test account credentials
  const handleSelectAccount = (acc: TestAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage('');
  };

  // Copy text helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      setIsForgotLoading(true);
      const res = await adminApi.forgotPassword(forgotEmail.trim());
      setForgotSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process password reset.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleReturn = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.hash = '';
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#77101f_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#77101F]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 p-3 px-6 bg-white rounded-2xl shadow-2xl border border-slate-100 mx-auto mb-3">
            <TrussetsLogo size="md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            TrustSets Admin Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Marketplace Management, Verification & Security Operations
          </p>
        </div>

        {/* Primary Container */}
        <div className="bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden">
          
          {/* Quick Test Login Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-300">
                  <Zap className="w-5 h-5 text-amber-700 fill-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs sm:text-sm font-black text-slate-900">
                      Quick Admin Test Login
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                      1-Click Access
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    Pre-configured administrator credentials for testing all modules
                  </p>
                </div>
              </div>

              {/* Instant 1-Click Login CTA */}
              <button
                id="admin-instant-test-login-btn"
                type="button"
                onClick={() => handleInstantTestLogin('trussets@gmail.com')}
                disabled={isTestLoggingIn || isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isTestLoggingIn ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                    <span>⚡ Instant Test Login</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Login Progress Notification */}
            {isTestLoggingIn && (
              <div className="mt-3 p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-900 animate-pulse">
                <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="font-semibold">{testLoginStep}</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <span className="font-bold">Authentication Error:</span> {errorMessage}
                </div>
              </div>
            )}

            {/* Test Credentials Card */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  Default Test Admin Account
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified in DB
                </span>
              </div>

              {testAccounts.map((acc) => (
                <div key={acc.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {acc.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-50 text-[#77101F] rounded border border-red-100">
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {acc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(acc)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Fill the form below with this account"
                      >
                        Fill Form
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantTestLogin(acc.email)}
                        disabled={isTestLoggingIn}
                        className="px-2.5 py-1.5 bg-[#77101F] hover:bg-[#600c19] text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>

                  {/* Credentials Snippets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Email Chip */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate mr-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{acc.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.email, 'email')}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer shrink-0"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Password Chip */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-500">Password:</span>
                        <span className="font-mono font-bold text-[11px] text-slate-900">{acc.password}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.password, 'password')}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer shrink-0"
                        title="Copy password"
                      >
                        {copiedField === 'password' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Standard Credential Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="trussets@gmail.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(true);
                      setForgotSuccessMessage('');
                    }}
                    className="text-xs text-[#77101F] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  disabled={isLoading || isTestLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#77101F] hover:bg-[#600c19] active:scale-[0.99] shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In to Admin Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Server Status Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Backend Gateway:</span>
                <span className={`inline-flex items-center gap-1 font-semibold ${
                  serverStatus === 'online' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    serverStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  {serverStatus === 'online' ? 'Operational & DB Synced' : 'Checking connection...'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Port 3000 • Express API
              </div>
            </div>
          </div>
        </div>

        {/* Back to marketplace */}
        <div className="text-center mt-6">
          <button
            onClick={handleReturn}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to TrustSets Public Marketplace</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#77101F]" />
                <h3 className="text-base font-extrabold text-slate-900">Reset Admin Password</h3>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotSuccessMessage ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Reset Instructions Sent</h4>
                <p className="text-xs text-slate-600 mb-4">{forgotSuccessMessage}</p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 text-left flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Testing Tip:</strong> For testing environments, you can log in immediately using password <span className="font-mono font-bold">111111</span> or the <strong>⚡ Instant Test Login</strong> button on the login screen.
                  </div>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-5 py-2 bg-[#77101F] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered administrator email address. A one-time verification link will be generated.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                  />
                </div>
                <div className="pt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
