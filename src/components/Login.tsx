import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { authAPI, setAccessToken, BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';

interface LoginProps {
  onLogin: (user: any, session: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear any old/invalid sessions on mount to force fresh login
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // If the session looks old or invalid, clear it
        if (!parsed.access_token || !parsed.user) {
          console.log('Clearing invalid session from localStorage');
          localStorage.removeItem('session');
          localStorage.removeItem('user');
        }
      } catch (error) {
        localStorage.removeItem('session');
        localStorage.removeItem('user');
      }
    }
    
    // Setup test accounts on first load
    setupTestAccounts();
  }, []);

  const setupTestAccounts = async () => {
    try {
      console.log('Setting up test accounts...');
      const response = await fetch(
        `${BASE_URL}/setup-accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test accounts setup response:', data);
        console.log('Available credentials:', data.credentials);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Setup accounts failed with status:', response.status);
        console.error('Error response:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Setup accounts error:', error);
      return false;
    }
  };

  const handleSetupAccounts = async () => {
    setLoading(true);
    setError('');
    const success = await setupTestAccounts();
    setLoading(false);
    if (success) {
      setError('Test accounts created successfully! You can now login.');
    } else {
      setError('Accounts may already exist. Try logging in with: admin@gamesup.com');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        const result = await authAPI.signup(email, password, name);
        // After signup, log them in
        const loginResult = await authAPI.login(email, password);
        console.log('Login successful, setting token:', loginResult.session.access_token ? 'present' : 'missing');
        setAccessToken(loginResult.session.access_token);
        onLogin(loginResult.user, loginResult.session);
      } else {
        const result = await authAPI.login(email, password);
        console.log('Login successful, session:', result.session ? 'present' : 'missing');
        console.log('Access token:', result.session?.access_token ? 'present' : 'missing');
        setAccessToken(result.session.access_token);
        onLogin(result.user, result.session);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-2xl mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <span className="text-white font-bold text-xl">GU</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Games - Up</h1>
          <p className="text-red-100">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignup ? 'Sign up to get started' : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="John Doe"
                  required={isSignup}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="admin@psstore.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {isSignup ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-800 font-semibold mb-2">Demo Admin Credentials:</p>
              <div className="space-y-1">
                <p className="text-sm text-red-700 font-mono">Email: admin@gamesup.com</p>
                <p className="text-sm text-red-700 font-mono">Password: admin123</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@gamesup.com');
                  setPassword('admin123');
                }}
                className="mt-3 text-xs text-red-600 hover:text-red-700 font-semibold underline"
              >
                Click to auto-fill credentials
              </button>
            </div>
          )}
        </div>

        {/* Landing Page Redirect Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              window.location.hash = '#website';
              window.location.reload();
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium text-sm transition-all border border-white/20 hover:border-white/40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Website
          </button>
        </div>
      </div>
    </div>
  );
}