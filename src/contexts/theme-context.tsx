"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeColor =
    | "slate" | "zinc" | "rose" | "orange" | "green"
    | "emerald" | "sky" | "blue" | "indigo"
    | "violet" | "purple" | "pink";

interface ThemeContextType {
    themeColor: ThemeColor;
    setThemeColor: (color: ThemeColor) => void;
    isDark: boolean;
    toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeColor, setThemeColor] = useState<ThemeColor>("zinc");
    const [isDark, setIsDark] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        const savedColor = localStorage.getItem("theme-color") as ThemeColor;
        const savedDark = localStorage.getItem("theme-dark") === "true";
        if (savedColor) setThemeColor(savedColor);
        setIsDark(savedDark);
    }, []);

    // Sync with DOM and localStorage
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", themeColor);
        localStorage.setItem("theme-color", themeColor);
    }, [themeColor]);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme-dark", String(isDark));
    }, [isDark]);

    const toggleDark = () => setIsDark(!isDark);

    return (
        <ThemeContext.Provider value={{ themeColor, setThemeColor, isDark, toggleDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
