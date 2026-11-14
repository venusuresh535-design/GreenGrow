import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUpWithEmail, signInDirectlyAsFarmer, continueAsGuest } = useAuth();
  const { languages, selectedLanguage, setLanguageByCode } = usePreferences();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [langCode, setLangCode] = useState(selectedLanguage.code);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    setLanguageByCode(langCode);
    const res = await signUpWithEmail(email, password, fullName, langCode);
    setIsLoading(false);

    if (res.error) {
      if (res.error.toLowerCase().includes('already registered')) {
        // Automatically sign in the farmer!
        signInDirectlyAsFarmer(email, fullName);
        navigate('/');
        return;
      }
      setError(res.error);
    } else {
      navigate('/');
    }
  };

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
          Create Your Farm Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Save your regional agriculture guidance and chat history
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          {error && <ErrorMessage message={error} className="mb-6" />}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Full Name / Farmer Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel, Maria Santos..."
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>
            </div>

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
                Password (min 6 characters)
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

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Preferred Response Language
              </label>
              <div className="mt-1">
                <select
                  value={langCode}
                  onChange={(e) => setLangCode(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm bg-white text-slate-800"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-forest-700 hover:bg-forest-800 mt-2"
              isLoading={isLoading}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-500">Already have an account?</span>
            <Link to="/login" className="font-bold text-forest-700 hover:underline">
              Sign in here →
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                continueAsGuest();
                navigate('/');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Skip and continue as Guest Farmer
            </button>
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
