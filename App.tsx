
import React, { useState, useMemo } from 'react';
import { 
  HomeIcon,
  CalculatorIcon, 
  SparklesIcon, 
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowUpRightIcon,
  CurrencyRupeeIcon,
  TagIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PriceDetails, CalculationResult, GeneratedContent, ActiveView } from './types';
import { generateProductContent } from './services/geminiService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Listing Tool State ---
  const [prices, setPrices] = useState<PriceDetails>({
    bankSettlement: 1000,
    gstPercentage: 18,
    shippingCharges: 80,
    platformFee: 10,
    fixedFee: 20
  });
  const [shortDesc, setShortDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const results: CalculationResult = useMemo(() => {
    const platformDecimal = prices.platformFee / 100;
    const gstDecimal = prices.gstPercentage / 100;
    const divisor = 1 - platformDecimal - (gstDecimal * (1 + platformDecimal));
    const listingPrice = Math.max(0, (prices.bankSettlement + prices.shippingCharges + prices.fixedFee) / (divisor || 1));
    const platformFeeAmt = listingPrice * platformDecimal;
    const gstOnPrice = (listingPrice - prices.shippingCharges) * (prices.gstPercentage / 100);
    const totalFees = platformFeeAmt + prices.fixedFee + prices.shippingCharges;
    return {
      listingPrice: Math.round(listingPrice),
      gstAmount: Math.round(gstOnPrice),
      totalFees: Math.round(totalFees),
      netMargin: prices.bankSettlement
    };
  }, [prices]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrices(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleGenerateContent = async () => {
    if (!shortDesc.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const content = await generateProductContent(shortDesc);
      setGeneratedData(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: HomeIcon },
    { id: 'listing', label: 'Listing Builder', icon: CalculatorIcon },
  ];

  const renderView = () => {
    switch(activeView) {
      case 'dashboard': return <DashboardHome onStartListing={() => setActiveView('listing')} />;
      case 'listing': return <ListingToolView 
        prices={prices} 
        results={results} 
        onPriceChange={handlePriceChange}
        shortDesc={shortDesc}
        setShortDesc={setShortDesc}
        isGenerating={isGenerating}
        handleGenerateContent={handleGenerateContent}
        generatedData={generatedData}
        error={error}
      />;
      default: return <DashboardHome onStartListing={() => setActiveView('listing')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CalculatorIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SellerPro</span>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ActiveView)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeView === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <p className="text-xs font-medium text-slate-400 mb-1">Tools Active</p>
            <p className="text-sm font-bold truncate">Pricing & AI Suite</p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold">SellerPro</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)}><XMarkIcon className="w-6 h-6" /></button>
          </div>
          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id as ActiveView); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Bars3Icon className="w-6 h-6" /></button>
          <div className="text-sm font-semibold text-slate-500 hidden sm:block">
            Listing Optimization Workspace
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-wider">Store Online</div>
             <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 sm:pb-8">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-4 z-40">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ActiveView)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function DashboardHome({ onStartListing }: { onStartListing: () => void }) {
  const stats = [
    { label: 'Current Margin Target', value: '₹1,000', trend: 'Base', icon: CurrencyRupeeIcon, color: 'bg-green-50 text-green-600' },
    { label: 'Active Drafts', value: '0', trend: 'Fresh', icon: QueueListIcon, color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Seller Dashboard</h2>
          <p className="text-slate-500 text-sm">Create high-converting e-commerce listings in seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-black">Ready to list something new?</h3>
          <p className="text-blue-100 max-w-sm text-sm">Calculate your exact profits and generate SEO titles, descriptions, and keywords using AI.</p>
          <button 
            onClick={onStartListing}
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg"
          >
            <CalculatorIcon className="w-5 h-5" />
            Launch Listing Builder
          </button>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <SparklesIcon className="w-48 h-48" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Quick Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={onStartListing} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Generate Title & Keywords</p>
              <p className="text-xs text-slate-500">SEO optimize your product</p>
            </div>
            <ArrowUpRightIcon className="w-4 h-4 ml-auto text-slate-300" />
          </button>
          <button onClick={onStartListing} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <CurrencyRupeeIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800">Calculate Listing Price</p>
              <p className="text-xs text-slate-500">Know your net settlement</p>
            </div>
            <ArrowUpRightIcon className="w-4 h-4 ml-auto text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListingToolView({ 
  prices, results, onPriceChange, shortDesc, setShortDesc, 
  isGenerating, handleGenerateContent, generatedData, error 
}: any) {
  const chartData = [
    { name: 'Settlement', value: results.netMargin },
    { name: 'Shipping', value: prices.shippingCharges },
    { name: 'Fees', value: Math.round(prices.platformFee * results.listingPrice / 100 + prices.fixedFee) },
    { name: 'GST', value: results.gstAmount },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Financials */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CurrencyRupeeIcon className="w-5 h-5 text-blue-600" />
              Pricing Engine
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Net Settlement (₹)</label>
                <input 
                  type="number" 
                  name="bankSettlement"
                  value={prices.bankSettlement}
                  // Fix: Use 'onPriceChange' prop instead of undefined 'handlePriceChange'
                  onChange={onPriceChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GST %</label>
                  {/* Fix: Use 'onPriceChange' prop instead of undefined 'handlePriceChange' */}
                  <input type="number" name="gstPercentage" value={prices.gstPercentage} onChange={onPriceChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shipping ₹</label>
                  {/* Fix: Use 'onPriceChange' prop instead of undefined 'handlePriceChange' */}
                  <input type="number" name="shippingCharges" value={prices.shippingCharges} onChange={onPriceChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Platform Fee %</label>
                  {/* Fix: Use 'onPriceChange' prop instead of undefined 'handlePriceChange' */}
                  <input type="number" name="platformFee" value={prices.platformFee} onChange={onPriceChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Fee ₹</label>
                  {/* Fix: Use 'onPriceChange' prop instead of undefined 'handlePriceChange' */}
                  <input type="number" name="fixedFee" value={prices.fixedFee} onChange={onPriceChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-center text-white mt-6 shadow-xl shadow-blue-100">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">List This Product At</span>
                <div className="text-4xl font-black mt-1">₹{results.listingPrice.toLocaleString()}</div>
                <div className="mt-4 pt-4 border-t border-blue-500/30 grid grid-cols-2 gap-2 text-[10px] font-bold opacity-90">
                  <div className="flex flex-col">
                    <span>GST PORTION</span>
                    <span>₹{results.gstAmount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span>TOTAL FEES</span>
                    <span>₹{results.totalFees}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase self-start mb-4">Price Composition</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right: AI Content Generation */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                AI Content Optimizer
              </h2>
              {isGenerating && (
                <div className="flex items-center gap-2 text-purple-600 text-xs animate-pulse font-bold">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ANALYZING PRODUCT...
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Tell us what you're selling</label>
              <textarea 
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Example: High-quality noise cancelling headphones with 20h battery, over-ear style, matte black finish."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none h-28 resize-none text-sm leading-relaxed transition-all"
              />
              <button 
                onClick={handleGenerateContent}
                disabled={isGenerating || !shortDesc.trim()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-5 h-5" />
                Generate Optimized Content
              </button>
            </div>

            {error && <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

            {generatedData && (
              <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
                {/* Title */}
                <div className="group">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TagIcon className="w-4 h-4" /> Recommended Product Title
                    </p>
                    <button onClick={() => copyToClipboard(generatedData.title)} className="text-purple-600 hover:text-purple-700 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ClipboardDocumentCheckIcon className="w-4 h-4" /> Copy
                    </button>
                  </div>
                  <div className="text-lg font-bold text-slate-900 bg-purple-50 p-4 rounded-xl border border-purple-100 leading-tight">
                    {generatedData.title}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">SEO Search Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedData.keywords.map((k: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white text-slate-700 rounded-full text-[10px] font-bold border border-slate-200 shadow-sm">{k}</span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="group">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Description</p>
                    <button onClick={() => copyToClipboard(generatedData.longDescription)} className="text-purple-600 hover:text-purple-700 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ClipboardDocumentCheckIcon className="w-4 h-4" /> Copy
                    </button>
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {generatedData.longDescription}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bullet Features</p>
                  <ul className="space-y-2">
                    {generatedData.features.map((f: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
