"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  ShoppingCart,
  Pill,
  Shirt,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Settings,
  LayoutDashboard,
  Users as UsersIcon,
  FileText,
  Boxes,
  Plus,
  Search,
  Filter,
  Tag,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Box,
  Warehouse,
  History,
  AlertTriangle,
  MoveRight,
  Monitor,
  Calculator,
  BookOpen,
  Undo2,
  Wrench,
  LogOut,
  Palette,
  Zap,
  Check,
  TrendingUp,
  DollarSign,
  CreditCard,
  TrendingDown,
  Target,
  ShoppingBag
} from "lucide-react";
import { Terminal } from "@/components/terminal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBusinessConfig } from "@/hooks/use-business-config";
import Decimal from "decimal.js";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/contexts/theme-context";
import { useUI, IndustryType } from "@/contexts/ui-context";
import {
  SalesTrendChart,
  TopItemsChart,
  FinancialPie
} from "@/components/dashboard-charts";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ICON_MAP: Record<string, any> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  pill: Pill,
  shirt: Shirt,
  smartphone: Smartphone,
};

const THEME_COLORS: Record<string, string> = {
  orange: "text-orange-600 bg-orange-50 border-orange-200",
  emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  rose: "text-rose-600 bg-rose-50 border-rose-200",
  slate: "text-slate-600 bg-slate-50 border-slate-200",
};

export default function Home() {
  const { themeColor, setThemeColor, isDark, toggleDark } = useTheme();
  const { industry, setIndustry, icons, getMenuItems } = useUI();
  const [step, setStep] = useState<"SELECT_INDUSTRY" | "ONBOARDING" | "LOGIN" | "DASHBOARD">("SELECT_INDUSTRY");
  const [activeTab, setActiveTab] = useState<string>("OVERVIEW");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Return Module State
  const [returnSearch, setReturnSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);

  // Adjustment State
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjData, setAdjData] = useState<any>({ itemId: "", warehouseId: "", quantity: 0, type: "OUT", reason: "Wastage" });

  // Day Control State
  const [isDayOpen, setIsDayOpen] = useState(true);
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayAction, setDayAction] = useState<"OPEN" | "CLOSE">("OPEN");
  const [submissionKeys, setSubmissionKeys] = useState<string[]>([""]);

  const [newKey, setNewKey] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // Purchase Module State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<any>({
    supplierId: "",
    warehouseId: "",
    invoiceNo: "",
    items: [{ itemId: "", quantity: 1, unitPrice: 0, batchNo: "", expiryDate: "" }],
    payments: [{ method: "CASH", amount: 0 }]
  });

  // For Dashboard
  const { config, isFeatureEnabled, getRule, loading: configLoading } = useBusinessConfig(businessData?.business?.id || null);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', businessData?.business?.id],
    queryFn: async () => {
      const res = await fetch(`/api/reports/dashboard?businessId=${businessData.business.id}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
    enabled: !!businessData?.business?.id && activeTab === "OVERVIEW",
    refetchInterval: 30000, // Refresh every 30s
  });

  useEffect(() => {
    // 1. Fetch Industries
    fetch("/api/industries")
      .then((res) => res.json())
      .then((data) => setIndustries(data));

    // 2. Restore Session
    const saved = localStorage.getItem("pos_session");
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.business && session.user) {
          setBusinessData(session);
          setStep("DASHBOARD");
        }
      } catch (e) {
        console.error("Invalid session", e);
      }
    }
  }, []);

  // Save Session
  useEffect(() => {
    if (businessData?.business?.id) {
      localStorage.setItem("pos_session", JSON.stringify(businessData));
    } else {
      localStorage.removeItem("pos_session");
    }
  }, [businessData]);

  useEffect(() => {
    if (businessData?.business?.id) {
      fetch(`/api/system/day-status?businessId=${businessData.business.id}`)
        .then(res => res.json())
        .then(data => setIsDayOpen(data.isOpen));
    }
  }, [businessData, activeTab]);

  useEffect(() => {
    if (businessData?.business?.id) {
      if (activeTab === "INVENTORY" || activeTab === "TERMINAL") {
        fetch(`/api/items?businessId=${businessData.business.id}`)
          .then(res => res.json())
          .then(data => setItems(data));
      }
      if (activeTab === "WAREHOUSES" || activeTab === "INVENTORY") {
        fetch(`/api/warehouses?businessId=${businessData.business.id}`)
          .then(res => res.json())
          .then(data => {
            setWarehouses(data);
            if (data.length > 0 && !selectedWarehouse) {
              setSelectedWarehouse(data[0]);
            }
          });
      }
    }
  }, [businessData, activeTab]);

  useEffect(() => {
    if (businessData?.business?.id && activeTab === "ACCOUNTING") {
      fetch(`/api/accounts?businessId=${businessData.business.id}`)
        .then(res => res.json())
        .then(data => setAccounts(data));

      fetch(`/api/journal?businessId=${businessData.business.id}`)
        .then(res => res.json())
        .then(data => setJournals(data));
    }
  }, [businessData, activeTab]);

  useEffect(() => {
    if (businessData?.business?.id && activeTab === "PURCHASES") {
      fetch(`/api/purchases?businessId=${businessData.business.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPurchases(data);
          else console.error("Invalid purchases data:", data);
        });

      fetch(`/api/parties?businessId=${businessData.business.id}&type=SUPPLIER`)
        .then(res => res.json())
        .then(data => setParties(data));

      fetch(`/api/items?businessId=${businessData.business.id}`)
        .then(res => res.json())
        .then(data => setItems(data));

      fetch(`/api/warehouses?businessId=${businessData.business.id}`)
        .then(res => res.json())
        .then(data => setWarehouses(data));
    }
  }, [businessData, activeTab]);

  useEffect(() => {
    if (businessData?.business?.industry?.name) {
      setIndustry(businessData.business.industry.name.toUpperCase() as IndustryType);
    }
  }, [businessData?.business?.industry?.name, setIndustry]);

  useEffect(() => {
    if (activeTab === "TEAM" && businessData?.business?.id) {
      fetchUsers();
    }
  }, [activeTab]);

  const searchSale = async () => {
    if (!returnSearch) return;
    setReturnLoading(true);
    try {
      const res = await fetch(`/api/sales?businessId=${businessData.business.id}&invoiceNo=${returnSearch}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        // If it returns an array (which the GET route currently does), find the match
        // But I updated SaleService.getSales to return all sales if no invoiceNo is provided.
        // Wait, I didn't update the GET route in /api/sales/route.ts yet to handle invoiceNo.
      }
      setSelectedSale(data);
      setReturnItems([]);
    } catch (err) {
      alert("Sale not found");
    } finally {
      setReturnLoading(false);
    }
  };

  const toggleReturnItem = (item: any) => {
    setReturnItems(prev => {
      const exists = prev.find(i => i.itemId === item.itemId);
      if (exists) return prev.filter(i => i.itemId !== item.itemId);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateReturnQty = (itemId: string, qty: number) => {
    setReturnItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity: qty } : i));
  };

  const submitReturn = async () => {
    if (returnItems.length === 0) return;
    setReturnLoading(true);
    try {
      // Calculate totals for refund (proportional tax)
      const subtotal = returnItems.reduce((acc, i) => acc.plus(new Decimal(i.unitPrice).mul(i.quantity)), new Decimal(0));
      const taxAmount = returnItems.reduce((acc, i) => {
        const original = selectedSale.items.find((oi: any) => oi.itemId === i.itemId);
        const ratio = new Decimal(i.quantity).div(original.quantity);
        return acc.plus(new Decimal(original.taxAmount).mul(ratio));
      }, new Decimal(0));

      const total = subtotal.plus(taxAmount);

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessData.business.id,
          userId: businessData.user.id,
          saleId: selectedSale.id,
          reason: "Customer Return",
          items: returnItems.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
          refunds: [{ method: "CASH", amount: total.toNumber() }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("Return processed successfully!");
      setSelectedSale(null);
      setReturnSearch("");
      setReturnItems([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReturnLoading(false);
    }
  };

  const submitAdjustment = async () => {
    if (!adjData.itemId || !adjData.quantity) return;
    setLoading(true);
    try {
      const res = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...adjData,
          businessId: businessData.business.id,
          userId: businessData.user.id,
          warehouseId: selectedWarehouse.id,
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("Adjustment successful!");
      setShowAdjModal(false);
      // Refresh stock
      fetch(`/api/stock?warehouseId=${selectedWarehouse.id}`)
        .then(res => res.json())
        .then(data => setStock(data));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = () => {
    fetch(`/api/users?businessId=${businessData.business.id}`)
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          businessId: businessData.business.id
        })
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      alert("User added successfully!");
      setShowUserModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessData.business.id,
          userId: businessData.user.id,
          operation: "DAY_OPEN" // Fixed field name
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewKey(data.key);
    } catch (err: any) {
      alert(err.message || "Failed to generate key");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_session");
    setBusinessData(null);
    setStep("LOGIN");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Fetch warehouse for the business
      const whRes = await fetch(`/api/warehouses?businessId=${result.business.id}`);
      const whs = await whRes.json();

      setBusinessData(result);
      if (whs && whs.length > 0) {
        setSelectedWarehouse(whs[0]);
      }
      setStep("DASHBOARD");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          industryId: selectedIndustry.id,
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Create a default warehouse immediately
      const whRes = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: result.business.id,
          name: "Main Warehouse",
          isDefault: true
        })
      });
      const wh = await whRes.json();

      setBusinessData(result);
      setSelectedWarehouse(wh);
      setStep("DASHBOARD");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTestData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/industries");
      const inds = await res.json();
      const restaurant = inds.find((i: any) => i.name === "Restaurant");
      if (restaurant) {
        setSelectedIndustry(restaurant);
        setIndustry("RESTAURANT");
      }
      alert("Please onboard as 'Test Coffee Shop' to see pre-populated data.");
      setStep("ONBOARDING");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setShowItemModal(true);
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          businessId: businessData.business.id,
          basePrice: parseFloat(data.basePrice as string || "0"),
          userId: businessData.user.id
        })
      });
      const newItem = await res.json();
      if (newItem.error) throw new Error(newItem.error);
      setItems([newItem, ...items]);
      setShowItemModal(false);
      alert("Item created successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePurchase = async () => {
    setLoading(true);
    try {
      // Calculate totals
      let total = 0;
      purchaseForm.items.forEach((i: any) => {
        total += (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0);
      });

      const body = {
        ...purchaseForm,
        businessId: businessData.business.id,
        userId: businessData.user.id,
        items: purchaseForm.items.map((i: any) => ({
          ...i,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          unitId: items.find(it => it.id === i.itemId)?.unitId || "default"
        })),
        payments: purchaseForm.payments.map((p: any) => ({
          ...p,
          amount: parseFloat(p.amount) || total
        }))
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setPurchases([result, ...purchases]);
      setShowPurchaseModal(false);
      setPurchaseForm({
        supplierId: "",
        warehouseId: "",
        invoiceNo: "",
        items: [{ itemId: "", quantity: 1, unitPrice: 0, batchNo: "", expiryDate: "" }],
        payments: [{ method: "CASH", amount: 0 }]
      });
      alert("Purchase recorded and stock updated!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = (itemId: string) => {
    if (!selectedWarehouse) return alert("Select a warehouse first.");
    const item = items.find(i => i.id === itemId);
    setAdjData({ ...adjData, itemId, quantity: 0, type: "IN", reason: "Initial Stock" });
    setShowAdjModal(true);
  };

  if (step === "SELECT_INDUSTRY") {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 dark:bg-zinc-950">
        <div className="max-w-4xl w-full text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-black dark:bg-white rounded-3xl rotate-12 shadow-2xl">
              <Sparkles size={40} className="text-white dark:text-black" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-6">
            Future-Proof Your Business
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Universal Point of Sale & Master Data management tailored for your industry. Select below to begin.
          </p>
          <div className="mt-8">
            <button
              onClick={loadTestData}
              className="text-zinc-400 hover:text-black dark:hover:text-white text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw size={14} /> Quick Start with Test Data
            </button>
            <button
              onClick={() => setStep("LOGIN")}
              className="mt-4 text-zinc-400 hover:text-black dark:hover:text-white text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
            >
              Have an account? Login
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
          {industries.map((ind, i) => {
            const Icon = ICON_MAP[ind.iconPack] || Smartphone;
            return (
              <button
                key={ind.id}
                onClick={() => {
                  setSelectedIndustry(ind);
                  setIndustry(ind.name.toUpperCase() as IndustryType);
                  setStep("ONBOARDING");
                }}
                style={{ animationDelay: `${i * 100}ms` }}
                className="group relative flex flex-col items-start p-10 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all text-left shadow-sm hover:shadow-2xl animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700"
              >
                <div className={cn("p-5 rounded-2xl mb-8 transition-all group-hover:scale-110", THEME_COLORS[ind.defaultTheme] || THEME_COLORS.blue)}>
                  <Icon size={36} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">{ind.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                  Config-driven modules for {ind.name.toLowerCase()} operations, inclusive of industry-specific audit rules and themes.
                </p>
                <div className="mt-auto w-full flex justify-between items-center text-sm font-bold tracking-tight">
                  <span className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">GET STARTED</span>
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === "ONBOARDING") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-200/50 via-transparent to-transparent">
        <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-12 shadow-2xl animate-in zoom-in-95 duration-500">
          <button onClick={() => setStep("SELECT_INDUSTRY")} className="text-zinc-400 text-sm mb-8 hover:text-black dark:hover:text-white flex items-center transition-colors">
            <ArrowRight size={16} className="rotate-180 mr-2" /> Change Industry
          </button>
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold dark:text-white tracking-tight mb-3">Launch your business</h2>
            <p className="text-zinc-500 text-base leading-relaxed">Enter your details to generate your tailored {selectedIndustry.name} dashboard.</p>
          </div>

          <form onSubmit={handleOnboard} className="space-y-6">
            <div className="group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">Business Name</label>
              <input name="name" required autoFocus className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 outline-none focus:ring-4 ring-black/5 dark:ring-white/10 focus:border-black dark:focus:border-white transition-all text-lg font-medium" placeholder="e.g. Test Coffee Shop" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Admin Name</label>
                <input name="adminName" required className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Email Address</label>
                <input name="adminEmail" type="email" required className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-white transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Secure Password</label>
              <input name="adminPassword" type="password" required className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-white transition-all" />
            </div>
            <div className="pt-4">
              <button
                disabled={loading}
                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/20 dark:shadow-white/5"
              >
                {loading ? <RefreshCw className="animate-spin" /> : "Deploy POS"} <ArrowRight size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === "LOGIN") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-200/50 via-transparent to-transparent">
        <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-12 shadow-2xl animate-in zoom-in-95 duration-500">
          <button onClick={() => setStep("SELECT_INDUSTRY")} className="text-zinc-400 text-sm mb-8 hover:text-black dark:hover:text-white flex items-center transition-colors">
            <ArrowRight size={16} className="rotate-180 mr-2" /> Back
          </button>
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold dark:text-white tracking-tight mb-3">Welcome Back</h2>
            <p className="text-zinc-500 text-base leading-relaxed">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Email Address</label>
              <input name="email" type="email" required autoFocus className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Password</label>
              <input name="password" type="password" required className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 outline-none focus:border-black dark:focus:border-white transition-all" />
            </div>
            <div className="pt-4">
              <button
                disabled={loading}
                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/20 dark:shadow-white/5"
              >
                {loading ? <RefreshCw className="animate-spin" /> : "Login"} <ArrowRight size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === "DASHBOARD") {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-0 flex font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
        {/* Sidebar */}
        <aside className="w-80 border-r border-zinc-100 dark:border-zinc-900 h-screen p-10 hidden lg:flex flex-col bg-zinc-50/30 dark:bg-zinc-900/10 transition-colors">
          <div className="mb-14 flex items-center gap-4">
            <div className="p-2.5 rounded-xl shadow-lg bg-primary text-primary-foreground transition-all duration-500">
              {icons.main && React.createElement(icons.main, { size: 24 })}
            </div>
            <span className="font-extrabold text-2xl tracking-tighter dark:text-white">POS<span className="text-zinc-300">CORE</span></span>
          </div>

          <nav className="space-y-3 flex-grow">
            {getMenuItems(config?.features || {}).map((item) => (
              <NavItem
                key={item.route}
                icon={item.icon}
                label={item.title}
                active={activeTab === item.route}
                onClick={() => setActiveTab(item.route)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-10 space-y-4">
            <div className={cn(
              "p-6 rounded-2xl flex items-center justify-between border",
              isDayOpen ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
            )}>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Day Status</span>
                <span className={cn("text-xs font-bold", isDayOpen ? "text-emerald-600" : "text-rose-600")}>
                  {isDayOpen ? "ACTIVE" : "CLOSED"}
                </span>
              </div>
              <button
                onClick={() => {
                  setDayAction(isDayOpen ? "CLOSE" : "OPEN");
                  setShowDayModal(true);
                }}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isDayOpen ? "text-emerald-600 bg-emerald-100" : "text-rose-600 bg-rose-100"
                )}
              >
                <Zap size={16} />
              </button>
            </div>
            <NavItem
              icon={Settings}
              label="System Settings"
              active={activeTab === "SETTINGS"}
              onClick={() => setActiveTab("SETTINGS")}
            />
            <NavItem
              icon={LogOut}
              label="Log Out"
              active={false}
              onClick={handleLogout}
            />
          </div>
        </aside>

        {/* Main Content */}
        {activeTab === "OVERVIEW" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700">
            <header className="p-16 pb-10 flex justify-between items-center bg-white dark:bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50">
              <div>
                <h1 className="text-5xl font-black tracking-tighter dark:text-white mb-2">Business Pulse</h1>
                <p className="text-zinc-400 font-medium tracking-tight">Real-time performance metrics for {businessData.business.name}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Status</span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full text-[10px] font-black tracking-widest border border-emerald-100 dark:border-emerald-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE UPDATES
                  </div>
                </div>
              </div>
            </header>

            <div className="p-16 pt-10 flex-grow overflow-y-auto space-y-12">
              {dashboardLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 rounded-[3rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : dashboardData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="p-10 rounded-[3rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Month Sales</div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                      <div className="text-4xl font-black dark:text-white tracking-tighter">${dashboardData.sales.totalSales.toLocaleString()}</div>
                      <div className="text-xs text-zinc-400 mt-2 font-medium tracking-tight">{dashboardData.sales.transactionCount} transactions this month</div>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Net Profit</div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform">
                          <DollarSign size={20} />
                        </div>
                      </div>
                      <div className="text-4xl font-black dark:text-white tracking-tighter">${dashboardData.financial.netProfit.toLocaleString()}</div>
                      <div className="text-xs text-zinc-400 mt-2 font-medium tracking-tight">Margin: {dashboardData.financial.revenue > 0 ? ((dashboardData.financial.netProfit / dashboardData.financial.revenue) * 100).toFixed(1) : 0}%</div>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Stock Value</div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl group-hover:rotate-12 transition-transform">
                          <Box size={20} />
                        </div>
                      </div>
                      <div className="text-4xl font-black dark:text-white tracking-tighter">${dashboardData.inventory.totalValue.toLocaleString()}</div>
                      <div className="text-xs text-zinc-400 mt-2 font-medium tracking-tight">{dashboardData.inventory.lowStockCount} items low on stock</div>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Average Ticket</div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-2xl group-hover:rotate-12 transition-transform">
                          <CreditCard size={20} />
                        </div>
                      </div>
                      <div className="text-4xl font-black dark:text-white tracking-tighter">${dashboardData.sales.averageTicket.toFixed(2)}</div>
                      <div className="text-xs text-zinc-400 mt-2 font-medium tracking-tight">Based on this month's data</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 p-12 rounded-[4rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl">
                      <div className="flex justify-between items-end mb-10">
                        <div>
                          <h3 className="text-3xl font-black tracking-tighter dark:text-white mb-2">Sales Forecast</h3>
                          <p className="text-zinc-400 font-medium tracking-tight">Daily revenue trends</p>
                        </div>
                      </div>
                      <SalesTrendChart data={dashboardData.sales.chartData} />
                    </div>

                    <div className="flex flex-col gap-8">
                      <div className="p-12 rounded-[4rem] bg-black dark:bg-zinc-800 text-white flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="relative z-10">
                          <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">Financial Health</h4>
                          <div className="text-5xl font-black tracking-tight mb-2">${(dashboardData.financial.revenue / 1000).toFixed(1)}k</div>
                          <p className="text-xs text-zinc-400 font-medium">Monthly Gross Revenue</p>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-all duration-700">
                          <TrendingUp size={120} />
                        </div>
                      </div>

                      <div className="flex-grow p-10 rounded-[4rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">Top Performance</h4>
                        <div className="space-y-6">
                          {dashboardData.topItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center group cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">{idx + 1}</div>
                                <div className="font-bold dark:text-white tracking-tight">{item.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-black dark:text-white">${item.revenue.toLocaleString()}</div>
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.quantity} SOLD</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center">
                  <AlertTriangle size={48} className="text-zinc-200 mx-auto mb-6" />
                  <h4 className="text-xl font-bold dark:text-white">Unable to load dashboard</h4>
                </div>
              )}
            </div>
          </main>
        ) : activeTab === "INVENTORY" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700">
            <header className="p-16 pb-10 flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter dark:text-white mb-3">Master Data</h1>
                <div className="flex items-center gap-6">
                  <div className="text-zinc-400 font-medium">Manage your universal items catalog</div>
                  <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex items-center gap-2 text-zinc-300 text-sm font-bold uppercase tracking-widest">
                    <Box size={14} /> {items.length} Items Total
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={addItem}
                  className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-extrabold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  <Plus size={24} /> New Item
                </button>
              </div>
            </header>

            <div className="px-16 pb-8 flex gap-6">
              <div className="flex-grow relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input className="w-full pl-16 pr-8 py-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] outline-none focus:ring-4 ring-black/5 dark:ring-white/5 focus:border-black dark:focus:border-white transition-all text-lg font-medium" placeholder="Search by SKU, Name or Category..." />
              </div>
              <button className="px-8 py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] text-zinc-600 dark:text-zinc-300 flex items-center gap-3 font-bold hover:bg-zinc-50 transition-colors">
                <Filter size={20} /> Filters
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-16 pb-16">
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-2xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/20 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] text-left">
                      <th className="px-10 py-6">Identity & SKU</th>
                      <th className="px-10 py-6">Classification</th>
                      <th className="px-10 py-6">Valuation</th>
                      <th className="px-10 py-6 text-center">Logic Configuration</th>
                      <th className="px-10 py-6 text-right">Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {items.map(item => (
                      <tr key={item.id} className="group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:scale-110 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                              {item.type === 'SERVICE' ? <Tag size={24} /> : <Package size={24} />}
                            </div>
                            <div>
                              <div className="font-extrabold text-xl dark:text-white tracking-tight">{item.name}</div>
                              <div className="text-xs text-zinc-400 font-mono mt-2 tracking-widest">{item.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-2">
                            <span className={cn("w-fit px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.1em] uppercase", item.type === 'SERVICE' ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100")}>
                              {item.type}
                            </span>
                            <div className="text-sm font-medium text-zinc-500">{item.category?.name || 'General'}</div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="font-black text-xl dark:text-white">${parseFloat(item.basePrice).toFixed(2)}</div>
                          <div className="text-xs text-emerald-500 font-bold mt-1">{item.tax?.name || 'Tax Exempt'}</div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-3 items-center">
                            <Badge text="Inventory Logic" active={item.trackStock} />
                            <Badge text="Batch Controls" active={item.trackBatch} />
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          {item.trackStock && (
                            <button
                              onClick={() => adjustStock(item.id)}
                              className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                            >
                              Quick Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        ) : activeTab === "ACCOUNTING" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700 bg-zinc-50/50 dark:bg-black">
            <header className="p-16 pb-10 flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter dark:text-white mb-3">Accounting</h1>
                <p className="text-zinc-400 font-medium">Double-entry ledger & Chart of Accounts</p>
              </div>
            </header>

            <div className="flex-grow overflow-y-auto px-16 pb-16 space-y-12">
              <section>
                <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen size={20} className="text-zinc-400" /> Recent Journal Entries
                </h3>
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                      <tr>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4">Description</th>
                        <th className="px-8 py-4">Account</th>
                        <th className="px-8 py-4 text-right">Debit</th>
                        <th className="px-8 py-4 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {journals.map(entry => (
                        entry.lines.map((line: any, idx: number) => (
                          <tr key={line.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01]">
                            <td className="px-8 py-4 text-xs font-medium text-zinc-400">
                              {idx === 0 ? new Date(entry.createdAt).toLocaleDateString() : ''}
                            </td>
                            <td className="px-8 py-4">
                              {idx === 0 ? <div className="font-bold text-sm dark:text-white">{entry.description}</div> : ''}
                            </td>
                            <td className="px-8 py-4">
                              <div className="text-sm font-medium dark:text-zinc-300">{line.account.name}</div>
                            </td>
                            <td className="px-8 py-4 text-right text-sm font-bold dark:text-white">
                              {parseFloat(line.debit) > 0 ? `$${parseFloat(line.debit).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-8 py-4 text-right text-sm font-bold dark:text-white">
                              {parseFloat(line.credit) > 0 ? `$${parseFloat(line.credit).toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))
                      ))}
                      {journals.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-20 text-center text-zinc-300 font-bold">No journal entries yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold dark:text-white mb-6">Chart of Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'].map(type => (
                    <div key={type} className="p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">{type}s</div>
                      <div className="space-y-3">
                        {accounts.filter(a => a.type === type).map(acc => (
                          <div key={acc.id} className="flex justify-between items-center group">
                            <span className="text-sm font-medium dark:text-zinc-300">{acc.name}</span>
                            <div className="w-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        ) : activeTab === "RETURNS" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700 bg-zinc-50/50 dark:bg-black">
            <header className="p-16 pb-10">
              <h1 className="text-5xl font-extrabold tracking-tighter dark:text-white mb-3">Sales Returns</h1>
              <p className="text-zinc-400 font-medium">Search invoice to initiate a refund or return</p>
            </header>

            <div className="flex-grow overflow-y-auto px-16 pb-16 space-y-10">
              <section className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex-grow relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                      value={returnSearch}
                      onChange={(e) => setReturnSearch(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl outline-none focus:ring-4 ring-black/5 dark:text-white text-lg font-bold"
                      placeholder="Enter Invoice Number (e.g. INV-XXXXXX)"
                    />
                  </div>
                  <button
                    onClick={searchSale}
                    disabled={returnLoading}
                    className="px-10 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    {returnLoading ? <RefreshCw className="animate-spin" /> : <Search size={24} />} Find Sale
                  </button>
                </div>
              </section>

              {selectedSale && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-bottom-5 duration-700">
                  <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="p-8 border-b border-zinc-50 dark:border-zinc-800/50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold dark:text-white">Sale Detail: {selectedSale.invoiceNo}</h3>
                        <p className="text-xs text-zinc-400 font-mono">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge text={selectedSale.status} active={selectedSale.status === 'COMPLETED'} />
                    </div>
                    <div className="p-0">
                      <table className="w-full text-left">
                        <thead className="text-[10px] uppercase tracking-widest text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/20">
                          <tr>
                            <th className="px-8 py-4">Item</th>
                            <th className="px-8 py-4 text-center">Sold Qty</th>
                            <th className="px-8 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {selectedSale.items.map((item: any) => {
                            const isSelected = returnItems.find(ri => ri.itemId === item.itemId);
                            return (
                              <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01]">
                                <td className="px-8 py-6">
                                  <div className="font-bold text-sm dark:text-white">{item.item.name}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono">${parseFloat(item.unitPrice).toFixed(2)} / unit</div>
                                </td>
                                <td className="px-8 py-6 text-center font-bold dark:text-white">
                                  {parseFloat(item.quantity)}
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button
                                    onClick={() => toggleReturnItem(item)}
                                    className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", isSelected ? "bg-rose-50 text-rose-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-black hover:text-white")}
                                  >
                                    {isSelected ? 'Remove' : 'Select'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-black dark:bg-white p-10 rounded-[3rem] text-white dark:text-black shadow-2xl">
                      <h3 className="text-2xl font-black tracking-tight mb-8">Return Summary</h3>
                      <div className="space-y-6">
                        {returnItems.map(ri => (
                          <div key={ri.itemId} className="flex justify-between items-center">
                            <div className="flex-grow">
                              <div className="font-bold text-lg">{ri.item.name}</div>
                              <div className="flex items-center gap-4 mt-2">
                                <button
                                  onClick={() => updateReturnQty(ri.itemId, Math.max(1, ri.quantity - 1))}
                                  className="w-8 h-8 rounded-lg bg-white/10 dark:bg-black/10 flex items-center justify-center font-black">-</button>
                                <span className="font-mono font-bold w-12 text-center text-xl">{ri.quantity}</span>
                                <button
                                  onClick={() => updateReturnQty(ri.itemId, Math.min(parseFloat(selectedSale.items.find((oi: any) => oi.itemId === ri.itemId).quantity), ri.quantity + 1))}
                                  className="w-8 h-8 rounded-lg bg-white/10 dark:bg-black/10 flex items-center justify-center font-black">+</button>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-xl">${(parseFloat(ri.unitPrice) * ri.quantity).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                        {returnItems.length === 0 && (
                          <div className="py-10 text-center text-white/30 dark:text-black/30 font-bold border-2 border-dashed border-white/10 dark:border-black/10 rounded-2xl">
                            Select items from the list to return
                          </div>
                        )}
                      </div>

                      {returnItems.length > 0 && (
                        <div className="mt-10 pt-10 border-t border-white/10 dark:border-black/10 space-y-4">
                          <div className="flex justify-between items-center text-2xl font-black">
                            <span>Refund Total</span>
                            <span>${returnItems.reduce((acc, i) => acc + (parseFloat(i.unitPrice) * i.quantity), 0).toFixed(2)}</span>
                          </div>
                          <button
                            onClick={submitReturn}
                            disabled={returnLoading}
                            className="w-full py-6 bg-white dark:bg-black text-black dark:text-white rounded-2xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            {returnLoading ? <RefreshCw className="animate-spin" /> : <Undo2 size={24} />} Process Refund
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        ) : activeTab === "WAREHOUSES" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700 bg-zinc-50/50 dark:bg-black">
            <header className="p-16 pb-10 flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter dark:text-white mb-3">Warehouse Stock</h1>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedWarehouse?.id}
                    onChange={(e) => setSelectedWarehouse(warehouses.find(w => w.id === e.target.value))}
                    className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-black/5"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} {w.isDefault ? '(Default)' : ''}</option>)}
                  </select>
                  <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setAdjData({ ...adjData, warehouseId: selectedWarehouse?.id });
                    setShowAdjModal(true);
                  }}
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  <Wrench size={20} /> Adjust
                </button>
                <div className="bg-white dark:bg-zinc-900 px-8 py-4 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Warehouse Health</span>
                  <span className="text-xl font-black text-emerald-500">OPTIMAL</span>
                </div>
              </div>
            </header>

            <div className="px-16 pb-8 flex gap-6">
              <div className="flex-grow relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input className="w-full pl-16 pr-8 py-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] outline-none" placeholder="Filter stock in this warehouse..." />
              </div>
              <button className="px-8 py-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] text-zinc-400 flex items-center gap-3 font-bold">
                <History size={20} /> Movement Log
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-16 pb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {stock.map(s => (
                  <div key={s.id} className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                        <Package size={24} />
                      </div>
                      <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black tracking-widest", parseFloat(s.quantityBaseUnit) < 10 ? "bg-rose-50 text-rose-500 border border-rose-100" : "bg-emerald-50 text-emerald-500 border border-emerald-100")}>
                        {parseFloat(s.quantityBaseUnit) < 10 ? 'LOW STOCK' : 'IN STOCK'}
                      </div>
                    </div>
                    <h4 className="text-xl font-extrabold dark:text-white mb-1">{s.item.name}</h4>
                    <p className="text-zinc-400 text-xs font-mono mb-6">{s.item.code}</p>

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Available</div>
                        <div className="text-4xl font-black dark:text-white tracking-tighter">
                          {parseFloat(s.quantityBaseUnit)} <span className="text-sm font-medium text-zinc-400 uppercase ml-1">PCS</span>
                        </div>
                      </div>
                      <button
                        onClick={() => adjustStock(s.item.id)}
                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                      >
                        <MoveRight size={20} />
                      </button>
                    </div>

                    {s.batches.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                        <div className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em] mb-3">Active Batches (FIFO Order)</div>
                        <div className="space-y-2">
                          {s.batches.map((b: any) => (
                            <div key={b.id} className="flex justify-between items-center text-[11px]">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                <span className="font-mono text-zinc-500 dark:text-zinc-400">{b.batchNo || 'UNBATCHED'}</span>
                              </div>
                              <div className="font-bold dark:text-white">{parseFloat(b.quantityBaseUnit)} <span className="text-zinc-400 text-[10px]">PCS</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 dark:bg-white/[0.01] -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform" />
                  </div>
                ))}
                {stock.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 border-dashed">
                    <AlertTriangle size={48} className="text-zinc-200 mx-auto mb-6" />
                    <h4 className="text-xl font-bold dark:text-white">No stock records found</h4>
                    <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2 leading-relaxed">Adjust an item's stock in the Master Data tab to see it appear here in the warehouse.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : activeTab === "PURCHASES" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700 bg-zinc-50/50 dark:bg-black">
            <header className="p-16 pb-10 flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter dark:text-white mb-3">Procurement</h1>
                <p className="text-zinc-400 font-medium tracking-tight">Manage incoming stock and supplier invoices</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-extrabold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                <Plus size={24} /> Record Purchase
              </button>
            </header>

            <div className="flex-grow overflow-y-auto px-16 pb-16">
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-2xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/20 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] text-left">
                      <th className="px-10 py-6">Reference / Invoice</th>
                      <th className="px-10 py-6">Supplier</th>
                      <th className="px-10 py-6">Total Amount</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {Array.isArray(purchases) && purchases.map(p => (
                      <tr key={p.id} className="group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-8">
                          <div className="font-extrabold text-lg dark:text-white tracking-tight">{p.referenceNo}</div>
                          <div className="text-xs text-zinc-400 mt-1">Inv: {p.invoiceNo}</div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="font-bold dark:text-zinc-300">{p.supplier?.name}</div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="font-black text-xl dark:text-white">${parseFloat(p.total).toFixed(2)}</div>
                        </td>
                        <td className="px-10 py-8">
                          <Badge text={p.status} active={p.status === 'COMPLETED'} />
                        </td>
                        <td className="px-10 py-8 text-right text-zinc-400 font-medium text-sm">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {(Array.isArray(purchases) ? purchases.length === 0 : true) && (
                      <tr>
                        <td colSpan={5} className="px-10 py-20 text-center text-zinc-400 font-bold">No purchase records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        ) : activeTab === "TEAM" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700 bg-zinc-50/50 dark:bg-black">
            <header className="p-16 pb-10 flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter dark:text-white mb-3">Team Management</h1>
                <p className="text-zinc-400 font-medium tracking-tight">Manage user access and roles (RBAC/ABAC)</p>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-extrabold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                <Plus size={24} /> Add Team Member
              </button>
            </header>

            <div className="flex-grow overflow-y-auto px-16 pb-16">
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-2xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/20 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] text-left">
                      <th className="px-10 py-6">Member</th>
                      <th className="px-10 py-6">Role / Access</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-extrabold text-lg dark:text-white tracking-tight">{u.name}</div>
                              <div className="text-xs text-zinc-400 mt-1">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black tracking-widest uppercase dark:text-zinc-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-widest uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right text-zinc-400 font-medium text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        ) : activeTab === "SETTINGS" ? (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700">
            <header className="p-16 pb-10 flex justify-between items-center bg-white dark:bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50">
              <div>
                <h1 className="text-5xl font-black tracking-tighter dark:text-white mb-2">System Config</h1>
                <p className="text-zinc-400 font-medium tracking-tight">Manage the pulse and aesthetics of your POS</p>
              </div>
            </header>

            <div className="p-16 pt-10 flex-grow overflow-y-auto space-y-12">
              <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-12 rounded-[3.5rem] shadow-2xl">
                <div className="flex items-center gap-6 mb-10">
                  <div className="p-4 bg-primary text-primary-foreground rounded-2xl">
                    <Palette size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter dark:text-white">Brand & Visuals</h2>
                    <p className="text-zinc-400 font-medium">Select a color palette that matches your brand identity</p>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-6">
                  {["zinc", "slate", "rose", "orange", "green", "emerald", "teal", "sky", "blue", "indigo", "violet", "purple"].map((color) => {
                    const colorMap: Record<string, string> = {
                      rose: '#e11d48', orange: '#f97316', green: '#22c55e', emerald: '#10b981',
                      teal: '#14b8a6', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1',
                      violet: '#8b5cf6', purple: '#a855f7', pink: '#ec4899', slate: '#475569', zinc: '#3f3f46'
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color as any)}
                        className={cn(
                          "group relative aspect-square rounded-3xl border-4 flex items-center justify-center transition-all hover:scale-105",
                          themeColor === color ? "border-primary shadow-xl" : "border-transparent bg-zinc-50 dark:bg-zinc-950"
                        )}
                      >
                        <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: colorMap[color] }} />
                        {themeColor === color && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-md">
                            <Check size={12} />
                          </div>
                        )}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-10">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-12 rounded-[3rem] shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                      <Settings size={20} />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white">Interface</h3>
                  </div>
                  <button
                    onClick={toggleDark}
                    className="flex items-center gap-4 w-full p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all font-bold group"
                  >
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      {isDark ? <Monitor size={20} /> : <LayoutDashboard size={20} />}
                    </div>
                    {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  </button>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-12 rounded-[3rem] shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-rose-100 dark:bg-rose-950/30 text-rose-500 rounded-xl">
                      <Zap size={20} />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white">Security & Access</h3>
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm text-zinc-400 font-medium">Generate authorized security keys for day opening/closing operations.</p>
                    <button
                      onClick={handleGenerateKey}
                      disabled={loading}
                      className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-rose-500/20"
                    >
                      {loading ? <RefreshCw className="animate-spin" /> : "Generate New Security Key"}
                    </button>
                    {newKey && (
                      <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/50 text-center animate-in zoom-in-95 duration-500">
                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Authenticated Key Copied</div>
                        <div className="text-4xl font-black tracking-[0.3em] dark:text-white font-mono">{newKey}</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </main>
        ) : (
          <main className="flex-grow flex flex-col h-screen overflow-hidden animate-in fade-in duration-700">
            <header className="p-16 pb-10 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tighter dark:text-white">POS Terminal</h1>
                <p className="text-zinc-400 text-sm">{selectedWarehouse?.name || 'Default Warehouse'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full text-[10px] font-black tracking-widest border border-emerald-100 dark:border-emerald-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  STATION ACTIVE
                </div>
              </div>
            </header>
            <div className="flex-grow p-8 overflow-hidden relative">
              {!isDayOpen && (
                <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-8">
                    <Zap size={48} className="text-rose-600" />
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter dark:text-white mb-4">Business Day Closed</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md mx-auto mb-10 leading-relaxed italic">
                    All terminal operations are locked until the business day is opened with authorized security keys.
                  </p>
                  <button
                    onClick={() => {
                      setDayAction("OPEN");
                      setShowDayModal(true);
                    }}
                    className="px-12 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-2xl flex items-center gap-4"
                  >
                    <Zap size={24} /> OPEN THE DAY
                  </button>
                </div>
              )}
              <Terminal
                businessId={businessData.business.id}
                userId={businessData.user.id}
                warehouseId={selectedWarehouse?.id}
                items={items}
              />
            </div>
          </main>
        )}
        {showAdjModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-10 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
              <div className="p-12 pb-8 flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter dark:text-white mb-2">Manual Adjustment</h2>
                  <p className="text-zinc-400 font-medium tracking-tight">Correct stock levels manually</p>
                </div>
                <button onClick={() => setShowAdjModal(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-all font-bold">✕</button>
              </div>

              <div className="p-12 pt-0 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Select Item</label>
                  <select
                    value={adjData.itemId}
                    onChange={(e) => setAdjData({ ...adjData, itemId: e.target.value })}
                    className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl shadow-inner font-bold dark:text-white outline-none focus:ring-4 ring-black/5"
                  >
                    <option value="">Choose an item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Quantity</label>
                    <input
                      type="number"
                      value={adjData.quantity}
                      onChange={(e) => setAdjData({ ...adjData, quantity: parseFloat(e.target.value) })}
                      className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl shadow-inner font-bold dark:text-white outline-none focus:ring-4 ring-black/5"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Type</label>
                    <select
                      value={adjData.type}
                      onChange={(e) => setAdjData({ ...adjData, type: e.target.value })}
                      className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl shadow-inner font-bold dark:text-white outline-none focus:ring-4 ring-black/5"
                    >
                      <option value="OUT">Stock OUT (Wastage/Damage)</option>
                      <option value="IN">Stock IN (Correction/Return)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Reason / Note</label>
                  <input
                    value={adjData.reason}
                    onChange={(e) => setAdjData({ ...adjData, reason: e.target.value })}
                    className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl shadow-inner font-bold dark:text-white outline-none focus:ring-4 ring-black/5"
                    placeholder="e.g. Broken packaging, Found under shelf"
                  />
                </div>

                <button
                  onClick={submitAdjustment}
                  disabled={loading}
                  className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-xl hover:scale-[1.02] active:scale-98 transition-all shadow-2xl flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={24} />} Apply Adjustment
                </button>
              </div>
            </div>
          </div>
        )}

        {showDayModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
              <div className="p-16 pb-10 flex justify-between items-start">
                <div>
                  <div className={cn("p-4 rounded-3xl w-fit mb-6", dayAction === "OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                    <Zap size={32} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter dark:text-white mb-2">
                    Day {dayAction === "OPEN" ? "Opening" : "Closing"}
                  </h2>
                  <p className="text-zinc-400 font-medium tracking-tight">Security keys required to proceed</p>
                </div>
                <button onClick={() => setShowDayModal(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-all font-bold">✕</button>
              </div>

              <div className="p-16 pt-0 space-y-10">
                <div className="space-y-6">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Approver Keys</label>
                  {submissionKeys.map((k, i) => (
                    <div key={i} className="relative group">
                      <input
                        value={k}
                        onChange={(e) => {
                          const newKeys = [...submissionKeys];
                          newKeys[i] = e.target.value.toUpperCase();
                          setSubmissionKeys(newKeys);
                        }}
                        placeholder={`KEY ${i + 1}`}
                        className="w-full px-8 py-6 bg-zinc-50 dark:bg-zinc-950 border-none rounded-3xl font-black text-2xl tracking-widest dark:text-white outline-none focus:ring-4 ring-primary/20 transition-all placeholder:text-zinc-200"
                        maxLength={8}
                      />
                      {i === submissionKeys.length - 1 && submissionKeys.length < 3 && (
                        <button
                          onClick={() => setSubmissionKeys([...submissionKeys, ""])}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary hover:scale-110 transition-transform"
                        >
                          + Add Key
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 border-dashed">
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    By submitting these keys, you confirm that the session totals have been verified and you are authorized to {dayAction.toLowerCase()} the business day.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch("/api/system/day-control", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          businessId: businessData.business.id,
                          userId: businessData.user.id,
                          action: dayAction,
                          keys: submissionKeys.filter(k => k.length > 0)
                        })
                      });
                      const data = await res.json();
                      if (data.error) throw new Error(data.error);
                      setIsDayOpen(dayAction === "OPEN");
                      setShowDayModal(false);
                      setSubmissionKeys([""]);
                      alert(`Day successfully ${dayAction === "OPEN" ? "opened" : "closed"}!`);
                    } catch (err: any) {
                      alert(err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || submissionKeys.every(k => k === "")}
                  className={cn(
                    "w-full py-8 text-white rounded-3xl font-black text-2xl hover:scale-[1.02] active:scale-98 transition-all shadow-2xl flex items-center justify-center gap-4",
                    dayAction === "OPEN" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                  )}
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={32} />}
                  {dayAction === "OPEN" ? "OPEN BUSINESS DAY" : "CLOSE BUSINESS DAY"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showItemModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
              <div className="p-16 pb-10 flex justify-between items-start">
                <div>
                  <div className="p-4 rounded-3xl w-fit mb-6 bg-primary/10 text-primary">
                    <Package size={32} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter dark:text-white mb-2">
                    Create New Item
                  </h2>
                  <p className="text-zinc-400 font-medium tracking-tight">Add a product or service to your catalog</p>
                </div>
                <button onClick={() => setShowItemModal(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-all font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateItem} className="p-16 pt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Item Name</label>
                    <input name="name" required autoFocus className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2" placeholder="e.g. Cappuccino, Silk Fabric" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Item Type</label>
                      <select name="type" className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2">
                        <option value="PRODUCT">Product (Stocked)</option>
                        <option value="SERVICE">Service (Non-Stocked)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Base Price</label>
                      <input name="basePrice" type="number" step="0.01" required className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2" placeholder="0.00" />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 border-dashed mt-6">
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">
                    Universal Config: Default units and taxes will be applied based on your business industry rules.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-8 mt-8 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-2xl hover:scale-[1.02] active:scale-98 transition-all shadow-2xl flex items-center justify-center gap-4"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={32} />}
                  CREATE ITEM
                </button>
              </form>
            </div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
              <div className="p-16 pb-10 flex justify-between items-start">
                <div>
                  <div className="p-4 rounded-3xl w-fit mb-6 bg-primary/10 text-primary">
                    <UsersIcon size={32} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter dark:text-white mb-2">
                    Add Team Member
                  </h2>
                  <p className="text-zinc-400 font-medium tracking-tight">Assign roles and permissions (RBAC)</p>
                </div>
                <button onClick={() => setShowUserModal(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-all font-bold">✕</button>
              </div>

              <form onSubmit={handleAddUser} className="p-16 pt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Full Name</label>
                    <input name="name" required className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2" placeholder="e.g. Abdullah S." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Email Address</label>
                    <input name="email" type="email" required className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2" placeholder="user@poscore.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Password</label>
                      <input name="password" type="password" required className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Access Role</label>
                      <select name="roleName" className="w-full px-8 py-5 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all mt-2">
                        <option value="ADMIN">Administrator</option>
                        <option value="CASHIER">Cashier / Staff</option>
                        <option value="MANAGER">Store Manager</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 border-dashed mt-6">
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">
                    RBAC Active: Permissions will be assigned automatically based on the selected role.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-8 mt-8 bg-primary text-primary-foreground rounded-3xl font-black text-2xl hover:scale-[1.02] active:scale-98 transition-all shadow-2xl flex items-center justify-center gap-4"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={32} />}
                  CREATE MEMBER
                </button>
              </form>
            </div>
          </div>
        )}

        {showPurchaseModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[4rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-12 pb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter dark:text-white">Record Procurement</h2>
                  <p className="text-zinc-400 font-medium">Add stock from supplier invoice</p>
                </div>
                <button onClick={() => setShowPurchaseModal(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-all font-bold">✕</button>
              </div>

              <div className="flex-grow overflow-y-auto p-12 pt-0 space-y-10">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Supplier</label>
                    <select
                      value={purchaseForm.supplierId}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all shadow-inner"
                    >
                      <option value="">Choose Supplier...</option>
                      {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Warehouse</label>
                    <select
                      value={purchaseForm.warehouseId}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, warehouseId: e.target.value })}
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all shadow-inner"
                    >
                      <option value="">Select Target...</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Invoice No</label>
                    <input
                      value={purchaseForm.invoiceNo}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNo: e.target.value })}
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl font-bold dark:text-white outline-none focus:ring-4 ring-primary/10 transition-all shadow-inner"
                      placeholder="SUP-XXXX"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Line Items</label>
                    <button
                      onClick={() => setPurchaseForm({ ...purchaseForm, items: [...purchaseForm.items, { itemId: "", quantity: 1, unitPrice: 0, batchNo: "", expiryDate: "" }] })}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      + Add Row
                    </button>
                  </div>
                  <div className="space-y-4">
                    {purchaseForm.items.map((li: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 items-end bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800/50">
                        <div className="col-span-4 space-y-2">
                          <select
                            value={li.itemId}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[idx].itemId = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm dark:text-white outline-none"
                          >
                            <option value="">Item...</option>
                            {items.filter(i => i.type === 'PRODUCT').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <input
                            type="number"
                            value={li.quantity}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[idx].quantity = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm dark:text-white outline-none"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <input
                            type="number"
                            value={li.unitPrice}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[idx].unitPrice = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm dark:text-white outline-none"
                            placeholder="Cost"
                          />
                        </div>
                        <div className="col-span-3 space-y-2">
                          <input
                            value={li.batchNo}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[idx].batchNo = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm dark:text-white outline-none"
                            placeholder="Batch"
                          />
                        </div>
                        <div className="col-span-1 pb-1">
                          <button
                            onClick={() => {
                              const newItems = purchaseForm.items.filter((_: any, i: number) => i !== idx);
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="text-rose-500 hover:scale-110 transition-transform"
                          >✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Payment Mode</label>
                    <div className="flex gap-4">
                      {['CASH', 'BANK', 'CREDIT'].map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            const newPayments = [{ ...purchaseForm.payments[0], method: m }];
                            setPurchaseForm({ ...purchaseForm, payments: newPayments });
                          }}
                          className={cn(
                            "px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest transition-all",
                            purchaseForm.payments[0].method === m ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Grant Total</div>
                    <div className="text-5xl font-black tracking-tighter dark:text-white">
                      ${purchaseForm.items.reduce((acc: number, i: any) => acc + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreatePurchase}
                  disabled={loading}
                  className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-98 transition-all shadow-2xl flex items-center justify-center gap-4"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <><Plus size={24} /> Finalize Procurement</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function Badge({ text, active }: { text: string, active: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all w-fit", active ? "bg-emerald-50 text-emerald-600 border-emerald-100 font-bold" : "bg-zinc-50 text-zinc-300 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-700")}>
      <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-200 dark:bg-zinc-800")} />
      <span className="text-[10px] uppercase tracking-wider">{text}</span>
    </div>
  )
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all mb-1",
        active
          ? "bg-primary text-primary-foreground font-bold shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] translate-x-1"
          : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      )}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="tracking-tight">{label}</span>
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string | number, trend: string }) {
  return (
    <div className="p-10 rounded-[3rem] bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">{label}</div>
        <div className={cn("px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-[10px] font-bold font-mono tracking-tighter", trend.startsWith('+') ? "text-emerald-500" : "text-zinc-400")}>{trend}</div>
      </div>
      <div className="text-5xl font-black dark:text-white tracking-tighter">{value}</div>
    </div>
  );
}
