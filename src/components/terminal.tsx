"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Tag,
    Package,
    X,
    CheckCircle2,
    Scan,
    RefreshCw,
    Smartphone
} from "lucide-react";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useBusinessConfig } from "@/hooks/use-business-config";
import { Decimal } from "decimal.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Item {
    id: string;
    name: string;
    code: string;
    basePrice: string;
    type: 'PRODUCT' | 'SERVICE';
    trackStock: boolean;
    unitId: string;
    tax?: { name: string; rate: string };
    isTaxInclusive: boolean;
}

interface CartItem extends Item {
    quantity: number;
    discount: number;
}

export function Terminal({ businessId, userId, warehouseId, items }: { businessId: string, userId: string, warehouseId: string, items: Item[] }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);

    const { getRule } = useBusinessConfig(businessId);

    // Scanner integration
    useBarcodeScanner({
        onScan: (code) => {
            const item = items.find(i => i.code === code);
            if (item) addToCart(item);
        }
    });

    const filteredItems = useMemo(() => {
        return items.filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.code.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [items, searchQuery]);

    const addToCart = (item: Item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1, discount: 0 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(0.1, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const totals = useMemo(() => {
        let subtotal = new Decimal(0);
        let taxTotal = new Decimal(0);
        let discountTotal = new Decimal(0);

        cart.forEach(item => {
            const price = new Decimal(item.basePrice);
            const taxRate = new Decimal(item.tax?.rate || 0);
            const qty = new Decimal(item.quantity);

            // Simplified calc for UI display
            let itemBase, itemTax;
            if (item.isTaxInclusive) {
                itemBase = price.div(taxRate.div(100).add(1));
                itemTax = price.sub(itemBase);
            } else {
                itemBase = price;
                itemTax = price.mul(taxRate.div(100));
            }

            subtotal = subtotal.add(itemBase.mul(qty));
            taxTotal = taxTotal.add(itemTax.mul(qty));
            discountTotal = discountTotal.add(new Decimal(item.discount).mul(qty));
        });

        return {
            subtotal: subtotal.toDecimalPlaces(2).toNumber(),
            tax: taxTotal.toDecimalPlaces(2).toNumber(),
            discount: discountTotal.toDecimalPlaces(2).toNumber(),
            total: subtotal.add(taxTotal).sub(discountTotal).toDecimalPlaces(2).toNumber()
        };
    }, [cart]);

    const handleCheckout = async (method: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId,
                    userId,
                    warehouseId,
                    items: cart.map(i => ({
                        itemId: i.id,
                        quantity: i.quantity,
                        unitId: i.unitId,
                        unitPrice: parseFloat(i.basePrice),
                        discountAmount: i.discount
                    })),
                    payments: [{ method, amount: totals.total }]
                })
            });
            const sale = await res.json();
            if (sale.error) throw new Error(sale.error);

            setLastSale(sale);
            setCart([]);
            setShowPayment(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-full gap-8 p-1 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Search & Items Area */}
            <div className="flex-grow flex flex-col gap-6">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={24} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] outline-none focus:ring-4 ring-black/5 dark:ring-white/5 focus:border-black dark:focus:border-white transition-all text-xl font-medium"
                        placeholder="Scan barcode or type item name..."
                        autoFocus
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold text-zinc-400">
                        <Scan size={14} /> SCAN READY
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-y-auto">
                    {filteredItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:scale-105 active:scale-95 transition-all text-left group shadow-sm hover:shadow-xl"
                        >
                            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300 mb-4 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                {item.type === 'SERVICE' ? <Tag size={20} /> : <Package size={20} />}
                            </div>
                            <div className="font-bold text-lg dark:text-white mb-1 line-clamp-1">{item.name}</div>
                            <div className="text-xl font-black text-black dark:text-white">${parseFloat(item.basePrice).toFixed(2)}</div>
                        </button>
                    ))}
                </div>

                {lastSale && (
                    <div className="mt-auto p-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-[2.5rem] flex items-center justify-between animate-in zoom-in-95">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-emerald-900 dark:text-emerald-400">Checkout Successful</div>
                                <div className="text-sm text-emerald-600 font-mono tracking-widest">{lastSale.invoiceNo}</div>
                            </div>
                        </div>
                        <button onClick={() => setLastSale(null)} className="text-emerald-300 hover:text-emerald-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Cart Area */}
            <div className="w-[450px] flex flex-col bg-zinc-50 dark:bg-zinc-950 rounded-[3rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-sm">
                <header className="p-8 pb-4 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="text-zinc-400" />
                        <h3 className="text-xl font-bold dark:text-white">Active Cart</h3>
                    </div>
                    <button onClick={() => setCart([])} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={20} />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-8 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-4 items-center animate-in slide-in-from-right-2">
                            <div className="flex-grow">
                                <div className="font-bold dark:text-white">{item.name}</div>
                                <div className="text-xs text-zinc-400 font-medium">UNIT: {parseFloat(item.basePrice).toFixed(2)}</div>
                            </div>
                            <div className="flex items-center bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-1">
                                <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors"><Minus size={14} /></button>
                                <span className="px-3 font-bold min-w-[2.5rem] text-center">{item.quantity}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors"><Plus size={14} /></button>
                            </div>
                            <div className="text-right min-w-[80px]">
                                <div className="font-black dark:text-white">${(parseFloat(item.basePrice) * item.quantity).toFixed(2)}</div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-300 opacity-50 space-y-4 py-20">
                            <ShoppingCart size={48} />
                            <div className="font-bold">Cart is empty</div>
                        </div>
                    )}
                </div>

                <footer className="p-10 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Subtotal</span>
                            <span className="font-bold dark:text-white">${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Estimated Tax</span>
                            <span className="font-bold dark:text-white">${totals.tax.toFixed(2)}</span>
                        </div>
                        {totals.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-rose-400">Total Discount</span>
                                <span className="font-bold text-rose-500">-${totals.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold dark:text-white uppercase tracking-widest">Payable</span>
                            <span className="text-4xl font-black text-black dark:text-white tracking-tighter">${totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        disabled={cart.length === 0 || isProcessing}
                        onClick={() => setShowPayment(true)}
                        className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-2xl flex items-center justify-center gap-3"
                    >
                        {isProcessing ? <RefreshCw className="animate-spin" /> : <><CreditCard /> CHECKOUT</>}
                    </button>
                </footer>
            </div>

            {/* Payment Overlay */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
                    <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black tracking-tight dark:text-white">Payment</h3>
                            <button onClick={() => setShowPayment(false)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <PaymentButton icon={Banknote} label="Cash Payment" onClick={() => handleCheckout('CASH')} />
                            <PaymentButton icon={CreditCard} label="Credit/Debit Card" onClick={() => handleCheckout('CARD')} />
                            <PaymentButton icon={Smartphone} label="Digital Wallet" onClick={() => handleCheckout('UPI')} />
                        </div>

                        <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="text-center">
                                <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-1">Total Due</div>
                                <div className="text-4xl font-black dark:text-white">${totals.total.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PaymentButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-3xl flex items-center gap-5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all group"
        >
            <div className="p-3 bg-white dark:bg-zinc-700 rounded-2xl shadow-sm group-hover:bg-transparent transition-colors">
                <Icon size={24} />
            </div>
            <span className="font-bold text-lg">{label}</span>
        </button>
    );
}
