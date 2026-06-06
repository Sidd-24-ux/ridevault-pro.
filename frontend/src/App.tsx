import React, { useState, useEffect } from 'react';
import { AppProvider, useApp, CartItem } from './context/AppContext';
import api from './api/client';
import { 
  ShoppingBag, Shield, CheckCircle, AlertTriangle, User, LogOut, ArrowLeftRight, 
  Sparkles, RefreshCw, BarChart2, Star, Plus, Minus, X, Trash2, Send, Info, Eye, Check, Edit2, ShieldAlert
} from 'lucide-react';

// ----------------------------------------------------
// MAIN APP COMPONENT WRAPPER (PROVIDES CONTEXT)
// ----------------------------------------------------
const App: React.FC = () => {
  return (
    <AppProvider>
      <RideVaultLayout />
    </AppProvider>
  );
};

export default App;

// ----------------------------------------------------
// LAYOUT & STATE COORDINATOR
// ----------------------------------------------------
const RideVaultLayout: React.FC = () => {
  const { user, logout, notifications, dismissNotification } = useApp();
  const [currentView, setCurrentView] = useState<'storefront' | 'detail' | 'cart' | 'compare' | 'ai' | 'vendor' | 'admin' | 'profile'>('storefront');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Auto-switch tabs to vendor/admin dashboards if roles require it, or default to storefront
  useEffect(() => {
    if (user?.role === 'vendor') setCurrentView('vendor');
    if (user?.role === 'admin') setCurrentView('admin');
  }, [user?.role]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-100">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setCurrentView('storefront')} 
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <span className="text-2xl font-black bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-200">
              RIDEVAULT PRO
            </span>
            <span className="text-xs px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 font-mono">
              V1.2
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => setCurrentView('storefront')} 
              className={`text-sm font-medium hover:text-orange-400 transition-colors ${currentView === 'storefront' ? 'text-orange-400' : 'text-slate-300'}`}
            >
              Shop Gear
            </button>
            <button 
              onClick={() => setCurrentView('compare')} 
              className={`text-sm font-medium hover:text-orange-400 transition-colors flex items-center space-x-1 ${currentView === 'compare' ? 'text-orange-400' : 'text-slate-300'}`}
            >
              <ArrowLeftRight size={14} />
              <span>Compare</span>
            </button>
            <button 
              onClick={() => setCurrentView('ai')} 
              className={`text-sm font-medium hover:text-orange-400 transition-colors flex items-center space-x-1 ${currentView === 'ai' ? 'text-orange-400' : 'text-slate-300'}`}
            >
              <Sparkles size={14} className="text-orange-400" />
              <span className="text-orange-400">AI Assistant</span>
            </button>
            <button 
              onClick={() => setCurrentView('stitch')} 
              className={`text-sm font-medium hover:text-orange-400 transition-colors flex items-center space-x-1 ${currentView === 'stitch' ? 'text-orange-400' : 'text-slate-300'}`}
            >
              <Shield size={14} className="text-orange-400" />
              <span>Stitch MCP</span>
            </button>

            {/* Role Dashboards Shortcuts */}
            {user?.role === 'vendor' && (
              <button 
                onClick={() => setCurrentView('vendor')}
                className={`text-sm font-semibold flex items-center space-x-1 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-400 hover:bg-amber-500/20 transition-colors ${currentView === 'vendor' ? 'bg-amber-500/20' : ''}`}
              >
                <BarChart2 size={14} />
                <span>Vendor Portal</span>
              </button>
            )}

            {user?.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')}
                className={`text-sm font-semibold flex items-center space-x-1 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:bg-red-500/20 transition-colors ${currentView === 'admin' ? 'bg-red-500/20' : ''}`}
              >
                <Shield size={14} />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* User Operations */}
          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-2 text-slate-300 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors relative"
                >
                  <span className="sr-only">Notifications</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                  )}
                </button>

                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 glass-panel border border-brand-border rounded-xl shadow-2xl p-4 space-y-3 max-h-96 overflow-y-auto z-50">
                    <div className="flex justify-between items-center border-b border-brand-border pb-2">
                      <span className="font-semibold text-sm">Notifications ({notifications.length})</span>
                      <button onClick={() => setShowNotificationDropdown(false)} className="text-slate-400 hover:text-slate-200">
                        <X size={14} />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No unread alerts</p>
                    ) : (
                      <div className="space-y-2.5">
                        {notifications.map(n => (
                          <div key={n._id} className="p-2.5 rounded-lg bg-slate-900/50 border border-brand-border/40 text-xs flex justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-200">{n.title}</p>
                              <p className="text-slate-400 mt-0.5">{n.message}</p>
                            </div>
                            <button 
                              onClick={() => dismissNotification(n._id)}
                              className="text-slate-500 hover:text-orange-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart button */}
            <button 
              onClick={() => setCurrentView('cart')}
              className="p-2 text-slate-300 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors relative"
            >
              <ShoppingBag size={20} />
              <CartCountBadge />
            </button>

            {/* Auth Menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-semibold text-slate-300">{user.name}</p>
                  <p className="text-[10px] text-orange-400 font-mono font-medium">{user.rewardPoints} Points</p>
                </div>
                <button 
                  onClick={logout} 
                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors orange-glow-hover"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Page Content Render */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {currentView === 'storefront' && (
          <StorefrontView 
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setCurrentView('detail');
            }} 
          />
        )}
        {currentView === 'detail' && selectedProductId && (
          <ProductDetailView 
            productId={selectedProductId} 
            onBack={() => setCurrentView('storefront')} 
          />
        )}
        {currentView === 'compare' && (
          <ComparisonView onBack={() => setCurrentView('storefront')} />
        )}
        {currentView === 'ai' && (
          <AIHubView />
        )}
        {currentView === 'cart' && (
          <CartCheckoutView onBack={() => setCurrentView('storefront')} />
        )}
        {currentView === 'vendor' && user?.role === 'vendor' && (
          <VendorPortalView />
        )}
        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminPortalView />
        )}
        {currentView === 'stitch' && (
          <StitchHubView />
        )}
      </main>

      {/* 3. Floating AI Mini Helper */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setCurrentView('ai')}
          className="p-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xl orange-glow hover:scale-105 transition-transform duration-200 flex items-center space-x-1.5"
          title="Open AI Shopping Assistant"
        >
          <Sparkles size={20} className="animate-pulse" />
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Ask AI</span>
        </button>
      </div>

      {/* 4. Footer */}
      <footer className="bg-slate-950 border-t border-brand-border py-8 text-center text-xs text-slate-500">
        <p>© 2026 RideVault Pro. Built for enterprise motorcycle gear retail environments. Local sandbox mode active.</p>
      </footer>

      {/* Auth Modal Overlay */}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  );
};

// Simple cart badge helper
const CartCountBadge: React.FC = () => {
  const { cart } = useApp();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-orange-500 text-white rounded-full">
      {count}
    </span>
  );
};

// ----------------------------------------------------
// AUTHENTICATION MODAL (REGISTER & SIGNIN CONTROLLER)
// ----------------------------------------------------
const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { login, register } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    referralCode: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication process failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-slate-900 border border-brand-border rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-100">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-4 text-orange-400">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h3>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center space-x-2">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Register As</label>
                <select 
                  className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="customer">Standard Rider (Customer)</option>
                  <option value="vendor">Gear Manufacturer (Vendor)</option>
                  <option value="admin">Platform Moderator (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Referral Code (Optional)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. RV-XXXXXX"
                  value={formData.referralCode}
                  onChange={e => setFormData({ ...formData, referralCode: e.target.value })}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="w-full py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors orange-glow"
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          {isRegister ? 'Already registered?' : 'First time riding with us?'}
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="ml-1 text-orange-400 font-semibold hover:underline"
          >
            {isRegister ? 'Login here' : 'Sign up here'}
          </button>
        </p>

        {/* Demo Credentials Panel */}
        <div className="mt-6 pt-4 border-t border-brand-border/40 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300 mb-1 flex items-center space-x-1">
            <Info size={12} className="text-orange-400" />
            <span>Sandbox Mode Note:</span>
          </p>
          <p>You can create any login, or register as a Vendor/Admin. To test out-of-the-box, register a new vendor and then use the Admin panel to approve the vendor profile.</p>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STOREFRONTVIEW (CATALOG, FILTERS, COMPARISONS)
// ----------------------------------------------------
const StorefrontView: React.FC<{ onSelectProduct: (id: string) => void }> = ({ onSelectProduct }) => {
  const { addToComparison, comparisonList } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [ridingStyle, setRidingStyle] = useState('');
  const [waterproof, setWaterproof] = useState(false);
  const [ceCertified, setCeCertified] = useState(false);
  const [sortBy, setSortBy] = useState('');

  // Fetch catalog products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        category,
        brand,
        ridingStyle,
        waterproof: waterproof ? 'true' : undefined,
        ceCertified: ceCertified ? 'true' : undefined,
        search,
        sortBy
      };
      const res = await api.get('/api/products', { params });
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, brand, ridingStyle, waterproof, ceCertified, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const categories = ['Helmets', 'Riding Jackets', 'Riding Gloves', 'Riding Pants', 'Riding Boots', 'Rain Gear'];
  const brands = ['Arai', 'Alpinestars', 'Dainese', 'Klim', 'RevIt', 'Rynox'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel rounded-2xl p-5 border border-brand-border">
          <h4 className="text-lg font-bold mb-4 text-slate-100 flex items-center space-x-2">
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Advanced Filters</span>
          </h4>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Search Keywords</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="e.g. Helmet, Gloves..."
                  className="w-full bg-slate-900 border border-brand-border rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-orange-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
              <select 
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
              <select 
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                value={brand}
                onChange={e => setBrand(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Riding Style Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Riding Style</label>
              <select 
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                value={ridingStyle}
                onChange={e => setRidingStyle(e.target.value)}
              >
                <option value="">All Styles</option>
                <option value="Street">Street / Sport</option>
                <option value="Touring">Touring</option>
                <option value="Adventure">Adventure / Dual Sport</option>
                <option value="Track">Track / Racing</option>
              </select>
            </div>

            {/* Specification Toggles */}
            <div className="space-y-2 pt-2 border-t border-brand-border/40">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0"
                  checked={waterproof}
                  onChange={e => setWaterproof(e.target.checked)}
                />
                <span>Waterproof Shell</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0"
                  checked={ceCertified}
                  onChange={e => setCeCertified(e.target.checked)}
                />
                <span>CE Armor Certified</span>
              </label>
            </div>

            {/* Clear Filters */}
            <button 
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('');
                setBrand('');
                setRidingStyle('');
                setWaterproof(false);
                setCeCertified(false);
              }}
              className="w-full py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors border border-brand-border rounded-lg"
            >
              Reset Filters
            </button>
          </form>
        </div>
      </div>

      {/* Products Grid Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Sorting header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 border border-brand-border rounded-xl">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Riding Gear Catalog</h3>
            <p className="text-xs text-slate-400 mt-0.5">Showing {products.length} products verified for safety</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Sort By:</span>
            <select 
              className="bg-slate-950 border border-brand-border rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin text-orange-500 h-8 w-8" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-xl border border-brand-border">
            <ShoppingBag className="mx-auto text-slate-600 h-10 w-10 mb-3" />
            <p className="text-sm font-semibold text-slate-400">No matching products found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filters or adjusting search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const image = product.images?.[0] || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=400';
              const isCompared = comparisonList.some(p => p._id === product._id);

              return (
                <div key={product._id} className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-brand-border/40">
                  {/* Photo container */}
                  <div 
                    onClick={() => onSelectProduct(product._id)}
                    className="h-48 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                  >
                    <img 
                      src={image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.specifications?.waterproof && (
                      <span className="absolute top-3 left-3 bg-blue-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wide shadow-md">
                        Waterproof
                      </span>
                    )}
                    {product.specifications?.ceCertified && (
                      <span className="absolute top-3 right-3 bg-green-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wide shadow-md">
                        CE Armored
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{product.brand}</span>
                        <span className="text-xs font-semibold text-orange-400">{product.category}</span>
                      </div>
                      <h4 
                        onClick={() => onSelectProduct(product._id)}
                        className="font-bold text-slate-100 hover:text-orange-400 cursor-pointer transition-colors text-sm line-clamp-1"
                      >
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-border/40 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400">Price</span>
                        <p className="text-base font-extrabold text-slate-200">₹{product.basePrice}</p>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Comparison Switcher */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToComparison(product);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${isCompared ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'border-slate-700 text-slate-400 hover:text-orange-400'}`}
                          title="Add to Comparison matrix"
                        >
                          <ArrowLeftRight size={14} />
                        </button>

                        <button 
                          onClick={() => onSelectProduct(product._id)}
                          className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-200"
                        >
                          View Gear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PRODUCT DETAIL VIEW (WAREHOUSES & REVIEWS)
// ----------------------------------------------------
const ProductDetailView: React.FC<{ productId: string; onBack: () => void }> = ({ productId, onBack }) => {
  const { addToCart, addNotificationLocal } = useApp();
  const [product, setProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Review submission states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products/${productId}`);
      setProduct(res.data);
      if (res.data.variants && res.data.variants.length > 0) {
        setSelectedVariant(res.data.variants[0]);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    // Check stock levels
    if (selectedVariant.totalStock <= 0) {
      alert('This variant selection is currently out of stock.');
      return;
    }

    addToCart({
      productId: product._id,
      variantId: selectedVariant._id,
      productName: product.name,
      sku: selectedVariant.sku,
      size: selectedVariant.size,
      color: selectedVariant.color,
      quantity: 1,
      price: product.basePrice + (selectedVariant.priceAdjustment || 0),
      image: product.images?.[0] || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=400'
    });

    addNotificationLocal(
      'Added to Cart',
      `Product "${product.name}" (${selectedVariant.size}/${selectedVariant.color}) was added.`,
      'cart_add'
    );
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    try {
      // Direct mock write since reviews are simple
      await api.post('/api/orders/returns', { 
        // Mocking review write endpoint logic or writing directly to database mock collections:
        // For convenience in our JSON server fallback, we can invoke a simulated mock reviews controller.
      });
      alert('Review posted successfully!');
      setReviewComment('');
      fetchProductDetails();
    } catch (err) {
      // In local mode, push a visual mock review to review list for instant feedback
      if (product) {
        const mockRev = {
          _id: Math.random().toString(),
          productId: product._id,
          rating: reviewRating,
          comment: reviewComment,
          createdAt: new Date().toISOString()
        };
        product.reviews = [mockRev, ...(product.reviews || [])];
        setProduct({ ...product });
        setReviewComment('');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center py-20"><RefreshCw className="animate-spin text-orange-500 h-8 w-8" /></div>;
  if (!product) return <div className="text-center py-10">Product not found.</div>;

  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=400';
  const displayPrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-orange-400 transition-colors"
      >
        <span className="h-5 w-5 rounded-lg border border-slate-700 flex items-center justify-center">←</span>
        <span>Back to catalog</span>
      </button>

      {/* Grid: Details and Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Images */}
        <div className="glass-panel border border-brand-border/60 rounded-3xl p-4 bg-slate-950 flex justify-center overflow-hidden">
          <img 
            src={image} 
            alt={product.name} 
            className="w-full max-h-[400px] object-contain rounded-2xl"
          />
        </div>

        {/* Configurations details */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">{product.brand}</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold">{product.category}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100">{product.name}</h1>
            <p className="text-xs text-slate-400 mt-1">Vendor ID: <span className="font-mono">{product.vendorId}</span></p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{product.description}</p>

          {/* Pricing adjustment details */}
          <div className="p-4 bg-slate-900 border border-brand-border rounded-xl">
            <span className="text-xs text-slate-400">Total Price</span>
            <p className="text-2xl font-black text-slate-100">₹{displayPrice}</p>
            {selectedVariant?.priceAdjustment > 0 && (
              <p className="text-[10px] text-amber-500 mt-0.5">*(Includes size/color variant surcharge adjustment of +₹{selectedVariant.priceAdjustment})</p>
            )}
          </div>

          {/* Specifications Bullet list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Safety Specifications</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 border border-brand-border/40 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Riding Style</span>
                <span className="font-semibold">{product.specifications?.ridingStyle || 'Universal'}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 border border-brand-border/40 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Material</span>
                <span className="font-semibold">{product.specifications?.material || 'Polymer / Textile'}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 border border-brand-border/40 rounded-lg">
                <span className="text-[10px] text-slate-500 block">CE Approved</span>
                <span className={`font-semibold ${product.specifications?.ceCertified ? 'text-green-400' : 'text-slate-400'}`}>
                  {product.specifications?.ceCertified ? 'Yes (Level 2)' : 'Basic Padding'}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2.5 border border-brand-border/40 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Waterproofing</span>
                <span className={`font-semibold ${product.specifications?.waterproof ? 'text-blue-400' : 'text-slate-400'}`}>
                  {product.specifications?.waterproof ? 'Heavy Rain Waterproof' : 'Water-resistant'}
                </span>
              </div>
            </div>
          </div>

          {/* Variant combination selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Select Variant Combination</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 border text-xs font-bold rounded-lg transition-all ${selectedVariant?._id === v._id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'}`}
                  >
                    Size {v.size} / {v.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warehouse stocks locator */}
          {selectedVariant && (
            <div className="space-y-3 pt-3 border-t border-brand-border/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Warehouse Stocks</span>
                <span className="text-xs font-mono font-bold text-slate-200">SKU: {selectedVariant.sku}</span>
              </div>
              
              <div className="space-y-2">
                {(selectedVariant.warehouseStock || []).map((ws: any) => (
                  <div key={ws.warehouse} className="flex justify-between items-center text-xs bg-slate-950 p-2.5 border border-brand-border/60 rounded-lg">
                    <span className="text-slate-300 font-medium">{ws.warehouseName || ws.warehouse}</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded ${ws.quantity > 5 ? 'bg-green-500/10 text-green-400' : ws.quantity > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {ws.quantity} units
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart add button */}
          <button 
            disabled={!selectedVariant || selectedVariant.totalStock <= 0}
            onClick={handleAddToCart}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl transition-all duration-200 uppercase tracking-widest text-xs flex items-center justify-center space-x-2 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed orange-glow"
          >
            <ShoppingBag size={16} />
            <span>{!selectedVariant ? 'Select Variant' : selectedVariant.totalStock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pt-8 border-t border-brand-border/60 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review writer form */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Post Review</h3>
          <form onSubmit={submitReview} className="space-y-3.5 bg-slate-900/60 p-4 border border-brand-border rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Product Rating</label>
              <select 
                className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                value={reviewRating}
                onChange={e => setReviewRating(Number(e.target.value))}
              >
                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                <option value="3">⭐⭐⭐ (3/5)</option>
                <option value="2">⭐⭐ (2/5)</option>
                <option value="1">⭐ (1/5)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Your Comment</label>
              <textarea 
                rows={3}
                required
                className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                placeholder="Share your experience with fit and armor comfort..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg text-xs hover:bg-orange-600 transition-colors"
            >
              Submit Rating
            </button>
          </form>
        </div>

        {/* Review listing */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Rider Reviews</h3>
          {!product.reviews || product.reviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center bg-slate-900/20 rounded-xl border border-brand-border/40">No reviews filed yet. Be the first to share your journey!</p>
          ) : (
            <div className="space-y-3">
              {product.reviews.map((rev: any) => (
                <div key={rev._id} className="p-4 bg-slate-900/40 border border-brand-border/30 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-orange-400 font-bold">{'⭐'.repeat(rev.rating)}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{new Date(rev.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// COMPARISON VIEW (MATRIX)
// ----------------------------------------------------
const ComparisonView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { comparisonList, removeFromComparison, clearComparison } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-orange-400 transition-colors"
        >
          <span className="h-5 w-5 rounded-lg border border-slate-700 flex items-center justify-center">←</span>
          <span>Return</span>
        </button>

        {comparisonList.length > 0 && (
          <button 
            onClick={clearComparison}
            className="text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            Clear Matrix
          </button>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-100">Product Comparison</h2>
        <p className="text-xs text-slate-400 mt-1">Compare technical features and armor levels side-by-side (Max 3 products)</p>
      </div>

      {comparisonList.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-brand-border rounded-xl">
          <ArrowLeftRight className="mx-auto text-slate-600 h-10 w-10 mb-2" />
          <p className="text-sm font-semibold text-slate-400">Comparison matrix is empty</p>
          <p className="text-xs text-slate-500 mt-1">Navigate to Shop Gear catalog and click the comparison matrix icons.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-brand-border">
            <thead>
              <tr className="bg-slate-900">
                <th className="p-4 border border-brand-border text-xs font-bold uppercase text-slate-400">Specs / Details</th>
                {comparisonList.map(p => (
                  <th key={p._id} className="p-4 border border-brand-border text-center min-w-[200px] relative">
                    <button 
                      onClick={() => removeFromComparison(p._id)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] uppercase font-black text-orange-500 tracking-wider block mb-1">{p.brand}</span>
                    <span className="text-sm font-bold text-slate-100 block">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 border border-brand-border text-xs font-bold text-slate-400">Base Price</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="p-4 border border-brand-border text-center text-sm font-black text-orange-400">₹{p.basePrice}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border border-brand-border text-xs font-bold text-slate-400">Material</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="p-4 border border-brand-border text-center text-xs">{p.specifications?.material || 'Textile Shell'}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border border-brand-border text-xs font-bold text-slate-400">CE Certified Armor</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="p-4 border border-brand-border text-center text-xs">
                    {p.specifications?.ceCertified ? (
                      <span className="text-green-400 font-semibold flex items-center justify-center space-x-1">
                        <CheckCircle size={12} /> <span>CE Approved</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Standard Padding</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border border-brand-border text-xs font-bold text-slate-400">Waterproofing</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="p-4 border border-brand-border text-center text-xs">
                    {p.specifications?.waterproof ? (
                      <span className="text-blue-400 font-semibold flex items-center justify-center space-x-1">
                        <CheckCircle size={12} /> <span>Waterproof</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Water Resistant</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border border-brand-border text-xs font-bold text-slate-400">Riding Style</td>
                {comparisonList.map(p => (
                  <td key={p._id} className="p-4 border border-brand-border text-center text-xs">{p.specifications?.ridingStyle || 'Street'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// AI HUB VIEW (CHATBOT, GEAR PLANNER, SIZE)
// ----------------------------------------------------
const AIHubView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'pack' | 'size'>('chat');

  // AI Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; products?: any[] }>>([
    { sender: 'ai', text: 'Hello! I am your AI Riding Assistant. Ask me anything, e.g. "I need waterproof gloves under ₹3000" or "Suggest jacket with armor".' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // AI Gear pack states
  const [bikeModel, setBikeModel] = useState('');
  const [packBudget, setPackBudget] = useState('15000');
  const [packRideType, setPackRideType] = useState('Touring');
  const [packOutput, setPackOutput] = useState<any | null>(null);
  const [packLoading, setPackLoading] = useState(false);

  // AI Size states
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [chestSize, setChestSize] = useState('40');
  const [waistSize, setWaistSize] = useState('32');
  const [sizeOutput, setSizeOutput] = useState<any | null>(null);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/api/ai/chat', { message: userMsg });
      setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply, products: res.data.products }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error contacting AI. Running fallback response: No matching products found.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackLoading(true);
    try {
      const res = await api.post('/api/ai/pack', { bike: bikeModel, budget: packBudget, rideType: packRideType });
      setPackOutput(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPackLoading(false);
    }
  };

  const handleSizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/ai/size', { height, weight, chestSize, waistSize });
      setSizeOutput(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
          <Sparkles className="text-orange-500 animate-pulse" />
          <span>AI Riding Suite</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Smart recommendations, sizing algorithms, and complete outfit bundle calculators</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border space-x-4">
        <button 
          onClick={() => setActiveSubTab('chat')}
          className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'chat' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Shopping Assistant
        </button>
        <button 
          onClick={() => setActiveSubTab('pack')}
          className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'pack' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Riding Gear Pack
        </button>
        <button 
          onClick={() => setActiveSubTab('size')}
          className={`py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeSubTab === 'size' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Size Estimator
        </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'chat' && (
        <div className="glass-panel border border-brand-border rounded-2xl flex flex-col h-[500px]">
          {/* Chat Window */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-xs ${msg.sender === 'user' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-200 border border-brand-border'}`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  
                  {/* Products Grid if attached */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-brand-border/40">
                      {msg.products.map(p => (
                        <div key={p._id} className="bg-slate-950 p-2 border border-brand-border/60 rounded-lg flex items-center space-x-2">
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=60'} className="h-10 w-10 object-cover rounded" />
                          <div className="text-[10px]">
                            <p className="font-bold text-slate-200 truncate">{p.name}</p>
                            <p className="text-orange-400 font-extrabold">₹{p.basePrice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-brand-border rounded-2xl p-3 text-xs text-slate-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-brand-border flex space-x-2 bg-slate-900/50">
            <input 
              type="text"
              placeholder="Ask: 'I need waterproof gloves under ₹3000'..."
              className="flex-grow bg-slate-950 border border-brand-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-slate-100"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" className="p-2 bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors text-white">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'pack' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-1 glass-panel border border-brand-border p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-200 text-sm">Calculate Complete Bundle</h4>
            <form onSubmit={handlePackSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Your Bike Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Himalayan, KTM Duke"
                  className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none text-slate-100"
                  value={bikeModel}
                  onChange={e => setBikeModel(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Total Pack Budget (₹)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none text-slate-100"
                  value={packBudget}
                  onChange={e => setPackBudget(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Primary Riding Style</label>
                <select 
                  className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none text-slate-100"
                  value={packRideType}
                  onChange={e => setPackRideType(e.target.value)}
                >
                  <option value="Touring">Long Highway Touring</option>
                  <option value="Street">City Street Commute</option>
                  <option value="Adventure">Offroad Adventure Trails</option>
                  <option value="Racing">Track Racing / Speed</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg text-xs orange-glow">
                Generate AI Pack
              </button>
            </form>
          </div>

          {/* Output */}
          <div className="md:col-span-2 glass-panel border border-brand-border p-5 rounded-2xl min-h-[300px]">
            {packLoading ? (
              <div className="flex justify-center items-center h-full"><RefreshCw className="animate-spin text-orange-500" /></div>
            ) : !packOutput ? (
              <div className="text-center py-16 text-slate-500 text-xs">Fill in your bike model and budget and click generate to calculate riding combinations.</div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 rounded-lg">
                  <p>{packOutput.explanation}</p>
                </div>

                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Gear List</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packOutput.pack.map((p: any) => (
                    <div key={p._id} className="p-3 bg-slate-950 border border-brand-border/60 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.category} | {p.brand}</p>
                      </div>
                      <span className="text-xs font-black text-orange-400">₹{p.basePrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'size' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-1 glass-panel border border-brand-border p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-200 text-sm">Measure Sizing Code</h4>
            <form onSubmit={handleSizeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Height (cm)</label>
                  <input type="number" className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs text-slate-100" value={height} onChange={e => setHeight(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Weight (kg)</label>
                  <input type="number" className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs text-slate-100" value={weight} onChange={e => setWeight(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Chest Size (inches)</label>
                  <input type="number" className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs text-slate-100" value={chestSize} onChange={e => setChestSize(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Waist (inches)</label>
                  <input type="number" className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs text-slate-100" value={waistSize} onChange={e => setWaistSize(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg text-xs orange-glow">
                Calculate Fit
              </button>
            </form>
          </div>

          {/* Sizing result */}
          <div className="md:col-span-2 glass-panel border border-brand-border p-5 rounded-2xl min-h-[300px]">
            {!sizeOutput ? (
              <div className="text-center py-16 text-slate-500 text-xs">Configure your biometric parameters to calculate correct manufacturer sizes.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6 border border-brand-border bg-slate-950 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-black">Recommended Size</span>
                  <p className="text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{sizeOutput.recommendedSize}</p>
                </div>

                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sizing Rationale Details</h5>
                <ul className="space-y-2">
                  {sizeOutput.reasons.map((r: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// CART & CHECKOUT VIEW (RAZORPAY SIMULATOR)
// ----------------------------------------------------
const CartCheckoutView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { cart, removeFromCart, updateCartQty, clearCart, user, refreshProfile, addNotificationLocal } = useApp();
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [address, setAddress] = useState('123 Biker St, Koramangala, Bangalore');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Razorpay'>('Razorpay');

  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(cartSubtotal * 0.18);
  const shipping = cartSubtotal > 1500 ? 0 : 100;
  const discount = Math.min(redeemPoints, user?.rewardPoints || 0);
  const finalTotal = Math.max(0, cartSubtotal + tax + shipping - discount);

  const handleCheckoutSubmit = async () => {
    setIsProcessing(true);
    try {
      const items = cart.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
      }));
      const res = await api.post('/api/orders', {
        items,
        shippingAddress: address,
        paymentMethod,
        rewardPointsToRedeem: discount
      });

      const order = res.data.order;
      setCreatedOrderId(order._id);

      if (paymentMethod === 'Razorpay') {
        // Trigger simulated Razorpay Overlay modal
        setPaymentModalOpen(true);
      } else {
        // Cash on delivery success
        alert('Order Placed Successfully via COD!');
        clearCart();
        refreshProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatedPaymentSuccess = async () => {
    setPaymentModalOpen(false);
    try {
      // Direct mock verify signature
      const mockSignature = 'mock_sig_' + Math.random().toString(36).substring(2, 9);
      await api.post('/api/orders/verify', {
        orderId: createdOrderId,
        razorpayPaymentId: 'pay_' + Math.floor(1000000000 + Math.random() * 9000000000),
        razorpaySignature: mockSignature
      });

      alert('Simulated Razorpay Signature Verified! Order active.');
      clearCart();
      refreshProfile();

      addNotificationLocal(
        'Order Payment Confirmed',
        `Payment verified for Order #${createdOrderId}. Preparing dispatch.`,
        'payment_success'
      );
    } catch (err) {
      alert('Error updating payment verified state.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-orange-400 transition-colors">
        <span className="h-5 w-5 rounded-lg border border-slate-700 flex items-center justify-center">←</span>
        <span>Back to Store</span>
      </button>

      <div>
        <h2 className="text-2xl font-black text-slate-100">Shopping Cart & Checkout</h2>
        <p className="text-xs text-slate-400 mt-1">Review your selections, apply loyalty credits, and dispatch order</p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-brand-border rounded-xl">
          <ShoppingBag className="mx-auto text-slate-600 h-10 w-10 mb-2" />
          <p className="text-sm font-semibold text-slate-400">Your cart is empty</p>
          <p className="text-xs text-slate-500 mt-1">Visit our shop catalog and select sizes/colors to purchase gear.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cart Contents</h3>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.variantId} className="p-4 bg-slate-900/60 border border-brand-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} className="h-16 w-16 object-cover rounded-lg bg-slate-950" />
                    <div>
                      <p className="text-sm font-bold text-slate-200">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">Size: {item.size} | Color: {item.color} | SKU: {item.sku}</p>
                      <p className="text-xs font-extrabold text-orange-400 mt-1">₹{item.price} per unit</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <div className="flex items-center space-x-1 border border-brand-border bg-slate-950 rounded-lg p-1">
                      <button onClick={() => updateCartQty(item.variantId, item.quantity - 1)} className="p-1 hover:text-orange-400"><Minus size={12} /></button>
                      <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.variantId, item.quantity + 1)} className="p-1 hover:text-orange-400"><Plus size={12} /></button>
                    </div>

                    <button onClick={() => removeFromCart(item.variantId)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Totals & Billing */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Summary</h3>
            <div className="glass-panel p-5 border border-brand-border rounded-2xl space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cart Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GST (18% standard)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Logistics Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Loyalty Points Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-2.5 border-t border-brand-border/40 text-slate-100">
                  <span>Grand Total</span>
                  <span className="text-orange-400">₹{finalTotal}</span>
                </div>
              </div>

              {/* Loyalty System redemption input */}
              {user && user.rewardPoints > 0 && (
                <div className="p-3 bg-slate-950 rounded-lg border border-brand-border/60">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Redeem Loyalty Points (Available: {user.rewardPoints} Pts)</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      max={user.rewardPoints}
                      className="bg-slate-900 border border-brand-border rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none w-20"
                      value={redeemPoints}
                      onChange={e => setRedeemPoints(Math.min(user.rewardPoints, Number(e.target.value)))}
                    />
                    <span className="text-[10px] text-slate-400">1 Point = ₹1 Discount</span>
                  </div>
                </div>
              )}

              {/* Shipping address fields */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Delivery Address</label>
                <textarea 
                  rows={2}
                  className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              {/* Payment selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button 
                    onClick={() => setPaymentMethod('Razorpay')}
                    className={`p-2 border rounded-lg transition-colors ${paymentMethod === 'Razorpay' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                  >
                    Razorpay Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2 border rounded-lg transition-colors ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                  >
                    Cash On Delivery
                  </button>
                </div>
              </div>

              {/* Checkout Submit trigger */}
              <button 
                disabled={isProcessing}
                onClick={handleCheckoutSubmit}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs uppercase tracking-widest transition-colors orange-glow"
              >
                {isProcessing ? 'Verifying stocks...' : 'Place Order & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY TEST MODE CHECKOUT MODAL SIMULATOR */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-brand-border rounded-3xl shadow-2xl overflow-hidden animate-fade-in text-slate-100">
            {/* Header */}
            <div className="p-4 bg-orange-500 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Razorpay Sandbox Checkout</span>
                <h4 className="text-lg font-black leading-tight">RideVault Pro Merchant</h4>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-white hover:opacity-85"><X size={18} /></button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="text-center">
                <span className="text-xs text-slate-500">Amount Due</span>
                <p className="text-3xl font-black text-slate-100">₹{finalTotal}</p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 rounded-lg flex items-start space-x-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>This is a simulated Razorpay payment gateway overlay. Click authorize to complete signature generation.</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-slate-400">Merchant Account</span>
                  <span className="font-semibold text-slate-200">merchant_rv_pro</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-slate-400">Order ID reference</span>
                  <span className="font-mono text-slate-200 truncate max-w-[150px]">{createdOrderId}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-semibold text-slate-400 border border-brand-border rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSimulatedPaymentSuccess}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-xs"
                >
                  Authorize Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// VENDOR PORTAL VIEW
// ----------------------------------------------------
const VendorPortalView: React.FC = () => {
  const { vendorProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'stock'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [stockLogs, setStockLogs] = useState<any[]>([]);

  // Form states for adding new products
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('Alpinestars');
  const [newProdCat, setNewProdCat] = useState('Riding Jackets');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdWaterproof, setNewProdWaterproof] = useState(false);
  const [newProdCE, setNewProdCE] = useState(true);

  // Variant editing state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProdForVariant, setSelectedProdForVariant] = useState<any | null>(null);
  const [variantSize, setVariantSize] = useState('M');
  const [variantColor, setVariantColor] = useState('Black');
  const [variantPriceAdj, setVariantPriceAdj] = useState('0');

  // Stock edit quantity adjustments
  const [selectedVariantForStockUpdate, setSelectedVariantForStockUpdate] = useState<any | null>(null);
  const [stockAdjustmentVal, setStockAdjustmentVal] = useState('5');
  const [stockAdjustmentWarehouse, setStockAdjustmentWarehouse] = useState('wh-blr');

  const fetchVendorProducts = async () => {
    try {
      const res = await api.get('/api/products?includeUnapproved=true');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockLogs = async () => {
    try {
      const res = await api.get('/api/products/logs');
      setStockLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVendorProducts();
    fetchStockLogs();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/products', {
        name: newProdName,
        brand: newProdBrand,
        category: newProdCat,
        basePrice: newProdPrice,
        description: newProdDesc,
        specifications: {
          material: 'Cordura Fabric / Leather panels',
          waterproof: newProdWaterproof,
          ceCertified: newProdCE,
          ridingStyle: 'Touring'
        }
      });
      alert('Product created! Placed in moderation queue.');
      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdDesc('');
      fetchVendorProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating product.');
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForVariant) return;
    try {
      await api.post(`/api/products/${selectedProdForVariant._id}/variants`, {
        size: variantSize,
        color: variantColor,
        priceAdjustment: variantPriceAdj
      });
      alert('Variant combination added successfully.');
      setShowVariantModal(false);
      fetchVendorProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error writing variant.');
    }
  };

  const handleAdjustInventory = async () => {
    if (!selectedVariantForStockUpdate) return;
    try {
      await api.put(`/api/products/variants/${selectedVariantForStockUpdate._id}/inventory`, {
        warehouseId: stockAdjustmentWarehouse,
        quantityChange: stockAdjustmentVal,
        type: 'restock'
      });
      alert('Stock allocation updated!');
      setSelectedVariantForStockUpdate(null);
      fetchVendorProducts();
      fetchStockLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stock edit failed.');
    }
  };

  // Vendor verification reminder if pending
  if (vendorProfile && !vendorProfile.isApproved) {
    return (
      <div className="max-w-xl mx-auto glass-panel p-6 border border-amber-500/30 rounded-2xl bg-slate-900/60 text-center space-y-4 animate-fade-in">
        <ShieldAlert className="mx-auto text-amber-500 h-12 w-12" />
        <h3 className="text-xl font-bold text-slate-100">Profile Pending Verification</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Welcome to **RideVault Pro Seller Suite**. Your vendor registration **"{vendorProfile.businessName}"** is currently awaiting administrator review. 
          To unlock product creation and inventory tracking, please verify your profile status.
        </p>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 rounded-lg">
          💡 **Developer Tip:** Sign in as an **Admin** using the Auth menu to instantly verify and approve this Vendor profile!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
          <BarChart2 className="text-amber-500" />
          <span>Vendor Control Panel</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manage catalog entries, add color/size variants, and check warehouse stock logs for **{vendorProfile?.businessName || 'Merchant'}**</p>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-brand-border space-x-4">
        <button onClick={() => setActiveTab('overview')} className={`py-2 text-xs font-bold uppercase border-b-2 ${activeTab === 'overview' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Overview</button>
        <button onClick={() => setActiveTab('products')} className={`py-2 text-xs font-bold uppercase border-b-2 ${activeTab === 'products' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Products Catalog</button>
        <button onClick={() => setActiveTab('stock')} className={`py-2 text-xs font-bold uppercase border-b-2 ${activeTab === 'stock' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Inventory logs</button>
      </div>

      {/* OVERVIEW PANEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-4 border border-brand-border rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black">Gross Sales Revenue</span>
              <p className="text-2xl font-black text-slate-200">₹{products.length * 45000}</p>
            </div>
            <div className="glass-panel p-4 border border-brand-border rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black">Active Products</span>
              <p className="text-2xl font-black text-slate-200">{products.length}</p>
            </div>
            <div className="glass-panel p-4 border border-brand-border rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black">Low-Stock Warnings</span>
              <p className="text-2xl font-black text-red-400">
                {products.reduce((count, p) => count + (p.variants || []).filter((v: any) => v.totalStock < 3).length, 0)}
              </p>
            </div>
          </div>

          {/* Simple custom SVG mock revenue graph */}
          <div className="glass-panel p-5 border border-brand-border rounded-2xl space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Revenue Analytics (Last 6 Months)</h4>
            <div className="h-40 flex items-end justify-between pt-6 px-4">
              {[12, 19, 30, 50, 40, 75].map((val, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2 w-10">
                  <div 
                    className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all duration-300"
                    style={{ height: `${val * 1.5}px` }}
                  />
                  <span className="text-[10px] text-slate-500">Month {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS PANEL */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2 bg-amber-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-amber-600 transition-colors flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Create Product</span>
            </button>
          </div>

          <div className="glass-panel border border-brand-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-xs font-bold text-slate-400 border-b border-brand-border">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {products.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">No products created yet.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id} className="border-b border-brand-border/40 hover:bg-slate-900/40">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-200">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.category} | {p.brand}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-200">₹{p.basePrice}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isApproved ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {p.isApproved ? 'Approved & Live' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedProdForVariant(p);
                            setShowVariantModal(true);
                          }}
                          className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-amber-400 border border-brand-border rounded"
                        >
                          + Add Variant
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Variants and Stock Levels list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Manage Variant Stock Allocations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p._id} className="p-4 bg-slate-900/60 border border-brand-border rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-200 text-xs">{p.name}</h4>
                  {!(p.variants) || p.variants.length === 0 ? (
                    <p className="text-[10px] text-slate-500">No variants defined. Click "+ Add Variant" to configure sizes.</p>
                  ) : (
                    <div className="space-y-2">
                      {p.variants.map((v: any) => (
                        <div key={v._id} className="p-2.5 bg-slate-950 border border-brand-border/60 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-200">Size {v.size} / {v.color}</span>
                            <span className="block text-[9px] text-slate-500 font-mono mt-0.5">SKU: {v.sku}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-bold font-mono text-slate-300 mr-2">{v.totalStock} Pcs</span>
                            <button 
                              onClick={() => setSelectedVariantForStockUpdate(v)}
                              className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] rounded hover:bg-amber-500 hover:text-white"
                            >
                              Edit Stock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY LOGS TAB */}
      {activeTab === 'stock' && (
        <div className="glass-panel border border-brand-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-xs font-bold text-slate-400 border-b border-brand-border">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Product / SKU</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Previous</th>
                <th className="p-4">New</th>
                <th className="p-4">Delta</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {stockLogs.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No inventory operations logged yet.</td></tr>
              ) : (
                stockLogs.map(log => (
                  <tr key={log._id} className="border-b border-brand-border/40">
                    <td className="p-4 font-mono text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-200">{log.productName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{log.sku}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">{log.warehouseName || log.warehouseId}</td>
                    <td className="p-4 font-mono">{log.prevQuantity}</td>
                    <td className="p-4 font-mono">{log.newQuantity}</td>
                    <td className={`p-4 font-bold font-mono ${log.quantityChanged >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {log.quantityChanged >= 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-slate-900 border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setShowAddProductModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-100">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-amber-500">Create Catalog Product</h3>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Product Name</label>
                <input type="text" required className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none" value={newProdName} onChange={e => setNewProdName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
                  <select className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none" value={newProdBrand} onChange={e => setNewProdBrand(e.target.value)}>
                    <option value="Alpinestars">Alpinestars</option>
                    <option value="Dainese">Dainese</option>
                    <option value="Arai">Arai</option>
                    <option value="Klim">Klim</option>
                    <option value="Rynox">Rynox</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none" value={newProdCat} onChange={e => setNewProdCat(e.target.value)}>
                    <option value="Helmets">Helmets</option>
                    <option value="Riding Jackets">Riding Jackets</option>
                    <option value="Riding Gloves">Riding Gloves</option>
                    <option value="Riding Pants">Riding Pants</option>
                    <option value="Riding Boots">Riding Boots</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Base Price (₹)</label>
                <input type="number" required className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Product Description</label>
                <textarea rows={3} required className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} />
              </div>

              <div className="flex space-x-6 text-xs font-semibold">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={newProdWaterproof} onChange={e => setNewProdWaterproof(e.target.checked)} />
                  <span>Waterproof Shell</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={newProdCE} onChange={e => setNewProdCE(e.target.checked)} />
                  <span>CE Armored Certified</span>
                </label>
              </div>

              <button type="submit" className="w-full py-2 bg-amber-500 text-white font-semibold rounded-lg text-xs orange-glow">Create Item</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VARIANT MODAL */}
      {showVariantModal && selectedProdForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setShowVariantModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-100">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-1 text-amber-500">Configure Item Variant</h3>
            <p className="text-[10px] text-slate-400 mb-4">Add size/color properties for: {selectedProdForVariant.name}</p>

            <form onSubmit={handleAddVariant} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Size Code</label>
                  <select className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none" value={variantSize} onChange={e => setVariantSize(e.target.value)}>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Color Theme</label>
                  <select className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none" value={variantColor} onChange={e => setVariantColor(e.target.value)}>
                    <option value="Black">Black</option>
                    <option value="Red">Red</option>
                    <option value="Blue">Blue</option>
                    <option value="White">White</option>
                    <option value="Grey">Grey</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Price Surcharge Adjustment (₹)</label>
                <input type="number" className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none" placeholder="e.g. 500 (extra cost for XL size)" value={variantPriceAdj} onChange={e => setVariantPriceAdj(e.target.value)} />
              </div>

              <button type="submit" className="w-full py-2 bg-amber-500 text-white font-semibold rounded-lg text-xs orange-glow">Save Variant</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STOCK QUANTITY MODAL */}
      {selectedVariantForStockUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-brand-border rounded-2xl p-6 relative">
            <button onClick={() => setSelectedVariantForStockUpdate(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-100">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-1 text-amber-500">Edit Warehouse Inventory</h3>
            <p className="text-[10px] text-slate-400 mb-4">Select warehouse to increase/decrease stock levels. SKU: {selectedVariantForStockUpdate.sku}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Dispatch Warehouse</label>
                <select className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-xs focus:outline-none text-slate-200" value={stockAdjustmentWarehouse} onChange={e => setStockAdjustmentWarehouse(e.target.value)}>
                  <option value="wh-blr">Bangalore Warehouse</option>
                  <option value="wh-del">Delhi Warehouse</option>
                  <option value="wh-mum">Mumbai Warehouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Restock Delta Quantity</label>
                <input type="number" className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-sm text-slate-100 focus:outline-none" placeholder="e.g. +10 or -5" value={stockAdjustmentVal} onChange={e => setStockAdjustmentVal(e.target.value)} />
              </div>

              <button onClick={handleAdjustInventory} className="w-full py-2 bg-amber-500 text-white font-semibold rounded-lg text-xs orange-glow">Commit Stock Change</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// Platform Admin Control Dashboard
// ----------------------------------------------------
const AdminPortalView: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);
      const vendorsRes = await api.get('/api/admin/vendors');
      setVendors(vendorsRes.data);
      const logsRes = await api.get('/api/admin/audit');
      setAuditLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleVerifyVendor = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/vendors/${id}/verify`, { isApproved: !currentStatus });
      alert(`Vendor status toggled successfully!`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center py-20"><RefreshCw className="animate-spin text-orange-500 h-8 w-8" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
          <Shield className="text-red-500" />
          <span>Platform Moderator Dashboard</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Verify business GST credentials, review platform revenue KPI logs, and coordinate system activity audits</p>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-brand-border p-4 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black">Platform Revenue</span>
            <p className="text-xl font-black text-slate-100">₹{stats.kpis?.totalRevenue}</p>
          </div>
          <div className="bg-slate-900 border border-brand-border p-4 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black">Total Orders</span>
            <p className="text-xl font-black text-slate-100">{stats.kpis?.totalOrders}</p>
          </div>
          <div className="bg-slate-900 border border-brand-border p-4 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black">Registered Sellers</span>
            <p className="text-xl font-black text-slate-100">{stats.kpis?.totalVendors}</p>
          </div>
          <div className="bg-slate-900 border border-brand-border p-4 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-black">Catalog Products</span>
            <p className="text-xl font-black text-slate-100">{stats.kpis?.totalProducts}</p>
          </div>
        </div>
      )}

      {/* Grid: Vendor registrations and Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendor registrations */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Merchant GST Verification Queue</h3>
          <div className="glass-panel border border-brand-border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[10px] text-slate-400 border-b border-brand-border">
                  <th className="p-3">Business Name</th>
                  <th className="p-3">Seller Email</th>
                  <th className="p-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {vendors.map((v: any) => (
                  <tr key={v._id} className="border-b border-brand-border/40 hover:bg-slate-900/20">
                    <td className="p-3 font-semibold text-slate-200">{v.businessName}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{v.ownerEmail}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleToggleVerifyVendor(v._id, v.isApproved)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${v.isApproved ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                      >
                        {v.isApproved ? 'Verified ✓' : 'Approve Profile'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit log history */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Activity Audit Logs</h3>
          <div className="glass-panel border border-brand-border rounded-xl overflow-hidden h-[250px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[10px] text-slate-400 border-b border-brand-border">
                  <th className="p-3">Action</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {auditLogs.map((log: any) => (
                  <tr key={log._id} className="border-b border-brand-border/20 text-[10px]">
                    <td className="p-3 font-bold text-orange-400">{log.action}</td>
                    <td className="p-3 text-slate-400">{log.userEmail}</td>
                    <td className="p-3 text-slate-300 truncate max-w-[200px]" title={log.details}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STITCH MCP CONSOLE VIEW
// ----------------------------------------------------
const StitchHubView: React.FC = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [argumentsJson, setArgumentsJson] = useState('{}');
  const [terminalLogs, setTerminalLogs] = useState<Array<{ timestamp: string; type: 'info' | 'sent' | 'received' | 'error'; message: string }>>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Stitch MCP Console Initialized. Connected to: https://stitch.googleapis.com/mcp' }
  ]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  // Connection settings states
  const [serverUrl, setServerUrl] = useState('https://stitch.googleapis.com/mcp');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchConfigAndTools = async () => {
    setLoading(true);
    try {
      // Get saved config
      const configRes = await api.get('/api/stitch/config');
      setServerUrl(configRes.data.serverUrl || 'https://stitch.googleapis.com/mcp');
      
      const headers = configRes.data.headers || {};
      const keyHeader = Object.keys(headers).find(k => k.toLowerCase() === 'x-goog-api-key') || '';
      setApiKey(keyHeader ? headers[keyHeader] : '');

      // Load tools
      const res = await api.get('/api/stitch/tools');
      setTools(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedTool(res.data[0]);
        setArgumentsJson(res.data[0].schema);
      }
    } catch (err) {
      setTerminalLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Failed to retrieve Stitch MCP config or tools.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndTools();
  }, []);

  const handleSelectTool = (tool: any) => {
    setSelectedTool(tool);
    setArgumentsJson(tool.schema);
    setTerminalLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Selected tool: ${tool.name}` }]);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.post('/api/stitch/config', {
        serverUrl,
        headers: {
          'X-Goog-Api-Key': apiKey
        }
      });
      setTerminalLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Stitch MCP configuration updated successfully. Discovering tools...' }]);
      
      // Reload tools list
      const res = await api.get('/api/stitch/tools');
      setTools(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedTool(res.data[0]);
        setArgumentsJson(res.data[0].schema);
      } else {
        setSelectedTool(null);
        setArgumentsJson('{}');
      }
      setShowSettings(false);
    } catch (err) {
      setTerminalLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Failed to update Stitch configuration.' }]);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;
    setExecuting(true);
    
    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(argumentsJson);
    } catch (err) {
      setTerminalLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Invalid JSON payload arguments input.' }]);
      setExecuting(false);
      return;
    }

    setTerminalLogs(prev => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), type: 'sent', message: `Invoking '${selectedTool.name}' with args: ${argumentsJson}` }
    ]);

    try {
      const res = await api.post('/api/stitch/execute', {
        toolName: selectedTool.name,
        args: parsedArgs
      });
      
      setTerminalLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), type: 'received', message: `Received output:\n${JSON.stringify(res.data.output, null, 2)}` }
      ]);
    } catch (err) {
      setTerminalLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `Execution failed: Relayed endpoint returned server error.` }
      ]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 border border-brand-border rounded-xl">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
            <Shield className="text-orange-500" />
            <span>Stitch MCP Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Interactive configuration sandbox for verifying and executing Stitch API JSON-RPC discovery tools</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 bg-slate-800 border border-brand-border text-xs font-bold rounded-lg text-slate-300 hover:text-orange-400 flex items-center space-x-1.5 transition-colors"
          >
            <Edit2 size={12} />
            <span>Edit Connection</span>
          </button>
          
          <div className="flex items-center space-x-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-ping"></span>
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider font-mono">Active</span>
          </div>
        </div>
      </div>

      {/* Configuration settings overlay editor */}
      {showSettings && (
        <div className="glass-panel p-5 border border-brand-border rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Configure Stitch MCP Server Connection</h3>
          
          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Server Url</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-950 border border-brand-border rounded-lg p-2 text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">X-Goog-Api-Key (Headers)</label>
              <div className="relative">
                <input 
                  type={showApiKey ? 'text' : 'password'}
                  required
                  className="w-full bg-slate-950 border border-brand-border rounded-lg pl-2 pr-12 py-2 text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300 font-bold"
                >
                  {showApiKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-brand-border/40">
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-1.5 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={saveLoading}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg orange-glow"
              >
                {saveLoading ? 'Saving config...' : 'Apply & Reload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Tools list vs Execute sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Tools List */}
        <div className="lg:col-span-1 glass-panel border border-brand-border p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available MCP Tools</h3>
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-orange-500" /></div>
          ) : tools.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center">No tools discovered.</p>
          ) : (
            <div className="space-y-2">
              {tools.map(t => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleSelectTool(t)}
                  className={`w-full text-left p-3 border rounded-xl transition-all block ${selectedTool?.name === t.name ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'}`}
                >
                  <p className="text-xs font-bold text-slate-200 font-mono">{t.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Execute Sandbox & Terminal Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel border border-brand-border p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tool Arguments Sandbox</h3>
            {selectedTool ? (
              <form onSubmit={handleExecute} className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Target Endpoint</span>
                  <p className="text-xs font-bold text-orange-400 font-mono bg-slate-950 p-2 border border-brand-border rounded-lg">{selectedTool.name}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Arguments JSON Input</label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-950 border border-brand-border rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
                    value={argumentsJson}
                    onChange={e => setArgumentsJson(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={executing}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs uppercase tracking-widest transition-colors orange-glow"
                >
                  {executing ? 'Executing tool request...' : 'Call Stitch MCP'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-500 py-10 text-center">No tool selected</p>
            )}
          </div>

          {/* Console Logs */}
          <div className="glass-panel border border-brand-border p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Terminal Log Console</h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-brand-border/60 h-48 overflow-y-auto font-mono text-[10px] space-y-2 select-text">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold shrink-0 ${log.type === 'sent' ? 'text-blue-400' : log.type === 'received' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                    {log.type.toUpperCase()}:
                  </span>
                  <pre className="text-slate-300 whitespace-pre-wrap font-sans">{log.message}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
