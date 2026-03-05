"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import QuickActionFAB from "@/components/QuickActionFAB";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { initialLoading } = useAuth();

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" text="Carregando..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <Breadcrumb />
                <main className="flex-1">{children}</main>
                <QuickActionFAB />
            </div>
        </div>
    );
}
