"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import {
    Utensils,
    ShoppingCart,
    Pill,
    Shirt,
    Smartphone,
    LayoutDashboard,
    Boxes,
    Warehouse,
    Monitor,
    Undo2,
    Calculator,
    Users as UsersIcon,
    Laptop,
    HeartPulse,
    ShoppingBag,
    LucideIcon
} from "lucide-react";

export type IndustryType = "RESTAURANT" | "GROCERY" | "PHARMACY" | "RETAIL" | "TECH" | "HEALTHCARE" | "GENERAL";

interface MenuItem {
    title: string;
    route: string;
    icon: LucideIcon;
    featureKey?: string;
}

interface UIContextType {
    industry: IndustryType;
    setIndustry: (industry: IndustryType) => void;
    icons: Record<string, LucideIcon>;
    getMenuItems: (features: Record<string, boolean>) => MenuItem[];
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const INDUSTRY_ICONS: Record<IndustryType, LucideIcon> = {
    RESTAURANT: Utensils,
    GROCERY: ShoppingCart,
    PHARMACY: Pill,
    RETAIL: Shirt,
    TECH: Laptop,
    HEALTHCARE: HeartPulse,
    GENERAL: Boxes
};

export function UIProvider({ children }: { children: ReactNode }) {
    const [industry, setIndustry] = useState<IndustryType>("GENERAL");

    const icons = {
        main: INDUSTRY_ICONS[industry] || Boxes,
        dashboard: LayoutDashboard,
        inventory: Boxes,
        warehouse: Warehouse,
        terminal: Monitor,
        returns: Undo2,
        accounting: Calculator
    };

    const getMenuItems = (features: Record<string, boolean>) => {
        const items: MenuItem[] = [
            { title: "Overview", route: "OVERVIEW", icon: LayoutDashboard },
        ];

        if (features["INVENTORY"]) {
            items.push({ title: "Master Data", route: "INVENTORY", icon: Boxes });
            items.push({ title: "Inventory", route: "WAREHOUSES", icon: Warehouse });
            items.push({ title: "Purchases", route: "PURCHASES", icon: ShoppingBag });
        }

        if (features["POS_BASIC"]) {
            items.push({ title: "Terminal", route: "TERMINAL", icon: Monitor });
            items.push({ title: "Returns", route: "RETURNS", icon: Undo2 });
        }

        items.push({ title: "Team", route: "TEAM", icon: UsersIcon }); // Always visible for now
        items.push({ title: "Accounting", route: "ACCOUNTING", icon: Calculator });

        return items;
    };

    return (
        <UIContext.Provider value={{ industry, setIndustry, icons, getMenuItems }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) throw new Error("useUI must be used within a UIProvider");
    return context;
}
