import { useState, type FC, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { api, type AuthResponse } from '../api';

interface AuthCardProps {
  onAuthSuccess: (authData: AuthResponse) => void;
}

interface FormErrors {
  username?: string;
  password?: string;
  api?: string;
}

export const AuthCard: FC<AuthCardProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (data) => {
      onAuthSuccess(data);
    },
    onError: (error: any) => {
      setErrors({ api: error.message || 'Login failed. Please check your credentials.' });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: () => api.register(username, password),
    onSuccess: (data) => {
      onAuthSuccess(data);
    },
    onError: (error: any) => {
      setErrors({ api: error.message || 'Registration failed. Username may be taken.' });
    }
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      newErrors.username = 'Username is required.';
    } else if (cleanUsername.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (isLogin) {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  return (
    <div className="glass-panel p-8 w-full animate-fade-in" style={{ maxWidth: '420px', margin: '4rem auto 0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#fff' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', margin: 0 }}>
          {isLogin ? 'Login to manage your tasks' : 'Sign up to start tracking your todos'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Username Input */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
              if (errors.api) setErrors(prev => ({ ...prev, api: undefined }));
            }}
            className={errors.username ? 'input-error' : ''}
            disabled={isPending}
            autoComplete="username"
          />
          {errors.username && (
            <span className="error-text">{errors.username}</span>
          )}
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              if (errors.api) setErrors(prev => ({ ...prev, api: undefined }));
            }}
            className={errors.password ? 'input-error' : ''}
            disabled={isPending}
            autoComplete="current-password"
          />
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        {/* API Error Feedback */}
        {errors.api && (
          <div 
            style={{ 
              color: 'hsl(var(--rose))', 
              background: 'hsl(var(--rose-glow))', 
              border: '1px solid hsl(var(--rose) / 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.85rem'
            }}
          >
            {errors.api}
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={isPending} style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}>
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isLogin ? (
            <LogIn size={18} />
          ) : (
            <UserPlus size={18} />
          )}
          <span>{isLogin ? 'Sign In' : 'Register'}</span>
        </button>
      </form>

      {/* Switch auth mode link */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (!isPending) {
              setIsLogin(!isLogin);
              setErrors({});
            }
          }}
          style={{ 
            color: 'hsl(var(--accent-hover))', 
            textDecoration: 'none', 
            fontWeight: 600 
          }}
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </a>
      </div>
    </div>
  );
};
export default AuthCard;
