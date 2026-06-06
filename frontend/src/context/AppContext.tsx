import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

// ----------------------------------------------------
// TypeScript Interfaces
// ----------------------------------------------------
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  rewardPoints: number;
  referralCode: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// ----------------------------------------------------
// Context Declarations
// ----------------------------------------------------
interface AppContextType {
  // Auth
  user: User | null;
  vendorProfile: any | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: any) => Promise<any>;
  refreshProfile: () => Promise<any>;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  updateCartQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  rewardPointsToRedeem: number;
  setRewardPointsToRedeem: (pts: number) => void;

  // Comparison
  comparisonList: any[];
  addToComparison: (product: any) => boolean;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;

  // Notifications
  notifications: Notification[];
  dismissNotification: (id: string) => void;
  addNotificationLocal: (title: string, message: string, type: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ----------------------------------------------------
// Context Provider Component
// ----------------------------------------------------
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('rv_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem('rv_cart');
    return cached ? JSON.parse(cached) : [];
  });
  const [rewardPointsToRedeem, setRewardPointsToRedeem] = useState(0);

  // Comparison State (limit to max 3 items)
  const [comparisonList, setComparisonList] = useState<any[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Save Cart to Cache
  useEffect(() => {
    localStorage.setItem('rv_cart', JSON.stringify(cart));
  }, [cart]);

  // Load User Profile on bootstrap
  const refreshProfile = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      setUser(res.data.user);
      setVendorProfile(res.data.vendorProfile);
      localStorage.setItem('rv_user', JSON.stringify(res.data.user));
      return res.data;
    } catch (err) {
      console.warn('Bootstrapping profile failed - guest mode active');
      setUser(null);
      setVendorProfile(null);
      localStorage.removeItem('rv_user');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('rv_access_token');
    if (token) {
      refreshProfile();
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/api/notifications/${user._id}`);
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    // Establish live SSE/Interval polling as fallback for WebSockets
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Auth Operations
  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { accessToken, refreshToken, user: loggedUser } = res.data;
    localStorage.setItem('rv_access_token', accessToken);
    localStorage.setItem('rv_refresh_token', refreshToken);
    localStorage.setItem('rv_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    await refreshProfile();
    return res.data;
  };

  const register = async (data: any) => {
    const res = await api.post('/api/auth/register', data);
    const { accessToken, refreshToken, user: registeredUser } = res.data;
    localStorage.setItem('rv_access_token', accessToken);
    localStorage.setItem('rv_refresh_token', refreshToken);
    localStorage.setItem('rv_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    await refreshProfile();
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('rv_access_token');
    localStorage.removeItem('rv_refresh_token');
    localStorage.removeItem('rv_user');
    setUser(null);
    setVendorProfile(null);
    setCart([]);
  };

  const updateProfile = async (data: any) => {
    const res = await api.put('/api/auth/profile', data);
    setUser(res.data.user);
    setVendorProfile(res.data.vendorProfile);
    localStorage.setItem('rv_user', JSON.stringify(res.data.user));
    return res.data;
  };

  // Cart Operations
  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.variantId === item.variantId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const updateCartQty = (variantId: string, qty: number) => {
    setCart(prev =>
      prev.map(item => (item.variantId === variantId ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setRewardPointsToRedeem(0);
  };

  // Comparison Operations
  const addToComparison = (product: any) => {
    if (comparisonList.length >= 3) return false;
    if (comparisonList.find(p => p._id === product._id)) return true;
    setComparisonList(prev => [...prev, product]);
    return true;
  };

  const removeFromComparison = (productId: string) => {
    setComparisonList(prev => prev.filter(p => p._id !== productId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  // Notification Operations
  const dismissNotification = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      // Offline fallback
      setNotifications(prev => prev.filter(n => n._id !== id));
    }
  };

  const addNotificationLocal = (title: string, message: string, type: string) => {
    const newAlert: Notification = {
      _id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newAlert, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        vendorProfile,
        authLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        rewardPointsToRedeem,
        setRewardPointsToRedeem,
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        notifications,
        dismissNotification,
        addNotificationLocal
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
