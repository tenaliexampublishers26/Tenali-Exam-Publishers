'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Lock, Mail, ShieldAlert, KeyRound, Sparkles, Eye, EyeOff, Phone } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { login, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const toast = useToast();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    identifier: '', // Username or Email
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Dynamic style states for hover and focus micro-interactions
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitHover, setSubmitHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);
  const [toggleHover, setToggleHover] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      // Determine email — if no @ sign, append @gmail.com as a convenience
      const email = formData.identifier.includes('@') 
        ? formData.identifier.trim() 
        : `${formData.identifier.trim()}@gmail.com`;

      if (isLoginMode) {
        const result = await loginWithEmail(email, formData.password);
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success('Logged in successfully!');
      } else {
        const name = formData.identifier.split('@')[0];
        const result = await registerWithEmail(email, formData.password, name, formData.phone);
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success('Account created successfully! Welcome to Tenali Exam Publishers.');
      }
      
      // Check stored user role for destination: Admins to /admin, Customers to / (or specific redirect)
      const currentUser = localStorage.getItem('tenali_user');
      const parsed = currentUser ? JSON.parse(currentUser) : null;
      if (parsed?.role === 'admin') {
        router.push('/admin');
      } else {
        const destination = (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/account') ? redirectUrl : '/';
        router.push(destination);
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      toast.error('Google login failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100dvh - var(--navbar-height) - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      position: 'relative',
      overflow: 'hidden',
      background: '#f8fafc'
    }}>
      {/* Decorative Blur Background Blobs for Studio Lighting Effect */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0) 70%)',
        filter: 'blur(35px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, rgba(139, 92, 246, 0) 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Glassmorphic Login Card */}
      <div className="card" style={{
        width: '100%',
        maxWidth: '430px',
        padding: '44px 36px',
        borderRadius: '28px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        boxShadow: '0 20px 48px -12px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.02)',
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
      }}>
        
        {/* Logo Container */}
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 20px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <img
            src="/images/logo.png"
            alt="Tenali Exam Publisher"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.6rem',
          fontWeight: 800,
          marginBottom: '8px',
          color: '#0f172a',
          letterSpacing: '-0.5px'
        }}>
          {isLoginMode ? 'Sign In' : 'Create Account'}
        </h1>

        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted, #64748b)',
          marginBottom: '28px',
          lineHeight: 1.5
        }}>
          {redirectUrl.includes('checkout')
            ? 'Sign in to complete your checkout and track shipment.'
            : isLoginMode ? 'Access your postal exam preparation dashboard.' : 'Start your competitive postal exam preparation today.'}
        </p>

        {/* Form Container */}
        <form onSubmit={handleFormSubmit} style={{ textAlign: 'left', marginBottom: '24px' }}>
          
          {/* Field: Username or Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'identifier' ? '#2563eb' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
                <Mail size={18} />
              </span>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('identifier')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter username or email"
                style={{
                  width: '100%', 
                  padding: '12px 14px 12px 42px', 
                  borderRadius: '12px',
                  border: focusedField === 'identifier' ? '1.5px solid #2563eb' : '1.5px solid rgba(226, 232, 240, 0.9)', 
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  boxShadow: focusedField === 'identifier' ? '0 0 0 4px rgba(59, 130, 246, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                required
              />
            </div>
          </div>

          {/* Field: Phone Number (Sign Up Mode only) */}
          {!isLoginMode && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Phone Number <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'phone' ? '#2563eb' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={15}
                  style={{
                    width: '100%', 
                    padding: '12px 14px 12px 42px', 
                    borderRadius: '12px',
                    border: focusedField === 'phone' ? '1.5px solid #2563eb' : '1.5px solid rgba(226, 232, 240, 0.9)', 
                    outline: 'none',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    boxShadow: focusedField === 'phone' ? '0 0 0 4px rgba(59, 130, 246, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Field: Password */}
          <div style={{ marginBottom: isLoginMode ? '26px' : '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'password' ? '#2563eb' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
                <KeyRound size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                style={{
                  width: '100%', 
                  padding: '12px 42px 12px 42px', 
                  borderRadius: '12px',
                  border: focusedField === 'password' ? '1.5px solid #2563eb' : '1.5px solid rgba(226, 232, 240, 0.9)', 
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  background: '#ffffff',
                  boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(59, 130, 246, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Field: Confirm Password (Register Mode only) */}
          {!isLoginMode && (
            <div style={{ marginBottom: '26px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'confirmPassword' ? '#2563eb' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
                  <ShieldAlert size={18} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%', 
                    padding: '12px 42px 12px 42px', 
                    borderRadius: '12px',
                    border: focusedField === 'confirmPassword' ? '1.5px solid #2563eb' : '1.5px solid rgba(226, 232, 240, 0.9)', 
                    outline: 'none',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    boxShadow: focusedField === 'confirmPassword' ? '0 0 0 4px rgba(59, 130, 246, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Form Error Message */}
          {formError && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              textAlign: 'left',
              lineHeight: 1.4
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px',
              border: 'none',
              background: submitHover 
                ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' 
                : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.02rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: submitHover ? '0 8px 24px rgba(37, 99, 235, 0.3)' : '0 4px 12px rgba(37, 99, 235, 0.15)',
              transform: submitHover ? 'translateY(-1px)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            {loading ? 'Processing...' : isLoginMode ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }} />
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || isGoogleLoading}
          onMouseEnter={() => setGoogleHover(true)}
          onMouseLeave={() => setGoogleHover(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 20px',
            border: '1.5px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '12px',
            background: '#ffffff',
            cursor: (loading || isGoogleLoading) ? 'not-allowed' : 'pointer',
            fontWeight: 650,
            fontSize: '0.96rem',
            color: '#334155',
            boxShadow: googleHover ? '0 6px 16px rgba(0, 0, 0, 0.05)' : '0 2px 6px rgba(0, 0, 0, 0.02)',
            transform: googleHover ? 'translateY(-1px)' : 'none',
            transition: 'all 0.2s ease',
            opacity: (loading || isGoogleLoading) ? 0.7 : 1,
          }}
        >
          {isGoogleLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Toggle Mode */}
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
          textAlign: 'center',
          marginTop: '28px',
        }}>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onMouseEnter={() => setToggleHover(true)}
            onMouseLeave={() => setToggleHover(false)}
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setFormData({ identifier: '', phone: '', password: '', confirmPassword: '' });
            }}
            style={{
              background: 'none', 
              border: 'none', 
              padding: 0,
              color: '#2563eb', 
              fontWeight: 700,
              cursor: 'pointer', 
              fontSize: '0.875rem',
              textDecoration: toggleHover ? 'underline' : 'none',
              transition: 'color 0.15s ease'
            }}
          >
            {isLoginMode ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
