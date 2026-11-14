import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, LogIn, ArrowLeft, Zap, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signInDirectlyAsFarmer, resendConfirmationEmail, continueAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResendMsg(null);

    const res = await signInWithEmail(email, password);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      navigate('/');
    }
  };

  const handleInstantSignIn = () => {
    if (!email.trim()) {
      setError('Please enter your email address to sign in.');
      return;
    }
    signInDirectlyAsFarmer(email);
    navigate('/');
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to resend verification.');
      return;
    }
    setResending(true);
    setResendMsg(null);
    const res = await resendConfirmationEmail(email);
    setResending(false);
    if (res.error) {
      setResendMsg('Could not resend: ' + res.error);
    } else {
      setResendMsg('Confirmation email sent! Please check your inbox and spam folder.');
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/');
  };

  const isEmailNotConfirmed = error?.toLowerCase().includes('email not confirmed');

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50 via-white to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-forest-700 text-white flex items-center justify-center shadow-md">
              <Sprout className="w-7 h-7" />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Green<span className="text-forest-700">Grow</span>
            </span>
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          Sign In to Your Farm Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Access your saved agricultural conversations across devices
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          {/* Actionable Error Card */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm animate-fade-in space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-rose-900">
                    {isEmailNotConfirmed ? 'Email Not Confirmed' : 'Sign In Notice'}
                  </p>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    {isEmailNotConfirmed
                      ? `Supabase requires email confirmation for ${email || 'your account'}, but you can sign in directly below without waiting!`
                      : error}
                  </p>
                </div>
              </div>

              {isEmailNotConfirmed && (
                <div className="pt-2 border-t border-rose-200/80 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleInstantSignIn}
                    className="w-full py-2.5 px-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Sign In Instantly as Farmer (Bypass Verification)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full py-2 px-3 bg-white hover:bg-rose-100/60 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{resending ? 'Sending email...' : 'Resend Confirmation Email Link'}</span>
                  </button>
                </div>
              )}

              {resendMsg && (
                <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{resendMsg}</span>
                </div>
              )}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-forest-700 hover:bg-forest-800"
              isLoading={isLoading}
              icon={<LogIn className="w-4 h-4" />}
            >
              Sign In
            </Button>

            {/* Instant Farmer Sign In without Password */}
            <button
              type="button"
              onClick={handleInstantSignIn}
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Sign in immediately with this email address without verification"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Sign In with this Email (No Email Verification Needed)</span>
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">Or continue without account</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full"
                onClick={handleGuest}
              >
                Continue as Guest Farmer
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500">Don&apos;t have an account?</span>
            <Link to="/register" className="font-bold text-forest-700 hover:underline">
              Create an account →
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to GreenGrow Chat
          </Link>
        </div>
      </div>
    </div>
  );
};
