import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RootData {
  isLogged: boolean;
  token?: string;
  user?: any;
}

interface RootContextType {
  data: RootData;
  updateData: (newData: Partial<RootData>) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const RootContext = createContext<RootContextType | undefined>(undefined);

export const RootProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<RootData>({
    isLogged: false,
    token: undefined,
  });

  /** 🔹 Detect environment (Web vs Native) */
  const isWeb = typeof window !== 'undefined' && !!window.localStorage;

  /** 🔹 Load stored token on mount */
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = isWeb
          ? localStorage.getItem('jwtToken')
          : await AsyncStorage.getItem('jwtToken');

        if (storedToken) {
          setData({ isLogged: true, token: storedToken });
        }
      } catch (error) {
        console.error('Error loading stored token:', error);
      }
    };
    loadToken();
  }, []);

  /** 🔹 Update context data */
  const updateData = (newData: Partial<RootData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  /** 🔹 Login — POST to API, save JWT */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('https://civisafe.online/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        console.warn('Login failed:', response.status);
        return false;
      }

      const result = await response.json();
      const token = result?.access_token || result?.token;

      if (token) {
        // ✅ Save token persistently
        if (isWeb) {
          localStorage.setItem('jwtToken', token);
        } else {
          await AsyncStorage.setItem('jwtToken', token);
        }

        setData({ isLogged: true, token });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  /** 🔹 Logout — clear token & context */
  const logout = async () => {
    try {
      if (isWeb) {
        localStorage.removeItem('jwtToken');
      } else {
        await AsyncStorage.removeItem('jwtToken');
      }
    } catch (error) {
      console.error('Error clearing token:', error);
    } finally {
      setData({ isLogged: false, token: undefined });
    }
  };

  return (
    <RootContext.Provider value={{ data, updateData, login, logout }}>
      {children}
    </RootContext.Provider>
  );
};

/** 🔹 Convenient hook */
export const useRoot = (): RootContextType => {
  const context = useContext(RootContext);
  if (!context) {
    throw new Error('useRoot must be used within a RootProvider');
  }
  return context;
};
