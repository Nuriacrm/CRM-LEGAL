"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type Tab = {
    id: string;
    label: string;
    content: React.ReactNode;
};

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
    onTabChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, className, onTabChange }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabClick = (id: string) => {
        setActiveTab(id);
        onTabChange?.(id);
    };

    return (
        <div className={cn("w-full", className)}>
            {/* Tab List */}
            <div className="flex space-x-1 border-b border-slate-700/50 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            "relative px-6 py-3 text-sm font-medium transition-colors hover:text-white outline-none",
                            activeTab === tab.id ? "text-emerald-400" : "text-slate-400"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute left-0 right-0 bottom-0 h-0.5 bg-emerald-500"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="relative w-full">
                {tabs.map((tab) => (
                    activeTab === tab.id && (
                        <motion.div
                            key={tab.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {tab.content}
                        </motion.div>
                    )
                ))}
            </div>
        </div>
    );
}
