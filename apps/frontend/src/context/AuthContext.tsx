import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, AuthApiError } from './authTypes';
export type { User };
export { AuthApiError };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const u: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        };
        setUser(u);
        localStorage.setItem('physim_user', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('physim_user');
      }
    } catch {
      // Backend unreachable or offline: do not set fake auth
      setUser(null);
      localStorage.removeItem('physim_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new AuthApiError('Unable to connect to the server. Please check your network and try again.', 'NETWORK_ERROR', null, 0);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errObj = errData?.error || errData;
      const message = errObj?.message || (res.status === 401 ? 'Email or password is incorrect.' : 'Login failed');
      const code = errObj?.code || (res.status === 401 ? 'UNAUTHORIZED' : 'LOGIN_FAILED');
      const details = (errObj?.details && typeof errObj.details === 'object') ? errObj.details : null;
      throw new AuthApiError(message, code, details, res.status);
    }

    const data = await res.json();
    const u: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
    };
    setUser(u);
    localStorage.setItem('physim_user', JSON.stringify(u));
  };

  const signup = async (name: string, email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
    } catch {
      throw new AuthApiError('Unable to connect to the server. Please check your network and try again.', 'NETWORK_ERROR', null, 0);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errObj = errData?.error || errData;
      const message = errObj?.message || 'Signup failed';
      const code = errObj?.code || 'SIGNUP_FAILED';
      const details = (errObj?.details && typeof errObj.details === 'object') ? errObj.details : null;
      throw new AuthApiError(message, code, details, res.status);
    }

    const data = await res.json();
    const u: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
    };
    setUser(u);
    localStorage.setItem('physim_user', JSON.stringify(u));
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network error on logout
    }
    setUser(null);
    localStorage.removeItem('physim_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
