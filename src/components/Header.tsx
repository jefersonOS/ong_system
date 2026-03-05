"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { currentUser } = useAuth();
    const { t } = useTranslation();

    return (
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-border h-16 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-[#263238] dark:text-gray-300"
                    onClick={onMenuClick}
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden sm:block">
                    <h2 className="text-sm font-semibold text-[#263238] dark:text-white">
                        {t("common.appTitle") || "Gestão de Projetos"}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative text-[#263238] dark:text-gray-300">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#2E9E4A] rounded-full" />
                </Button>
                <div className="hidden md:flex items-center gap-2 ml-2">
                    <span className="text-sm text-muted-foreground">
                        {currentUser?.name || "Usuário"}
                    </span>
                </div>
            </div>
        </header>
    );
}
