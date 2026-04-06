import { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('physim_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, _password: string) => {
    // Simulate API call
    await new Promise(res => setTimeout(res, 800));
    const u: User = {
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
    };
    setUser(u);
    localStorage.setItem('physim_user', JSON.stringify(u));
  };

  const signup = async (name: string, email: string, _password: string) => {
    await new Promise(res => setTimeout(res, 800));
    const u: User = { id: crypto.randomUUID(), name, email };
    setUser(u);
    localStorage.setItem('physim_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('physim_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
