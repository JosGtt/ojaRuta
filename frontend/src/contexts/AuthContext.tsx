import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  usuario: string;
  nombre_completo: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (usuario: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configurar axios interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token al cargar la app
  useEffect(() => {
    const savedToken = localStorage.getItem('sedeges_token');
    const savedUser = localStorage.getItem('sedeges_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (usuario: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        usuario,
        password
      });

      const { token: newToken, usuario: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      
      // Guardar en localStorage
      localStorage.setItem('sedeges_token', newToken);
      localStorage.setItem('sedeges_user', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sedeges_token');
    localStorage.removeItem('sedeges_user');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};