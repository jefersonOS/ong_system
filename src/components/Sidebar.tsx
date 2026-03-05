"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import {
    Home, FileText, Building2, BarChart3, History, Settings,
    ChevronRight, ChevronDown, Menu, Plus, Search, AlertCircle,
    RefreshCw, LogOut, User, BookOpen, GraduationCap, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organ {
    id: string;
    name: string;
    parent_id: string | null;
    children?: Organ[];
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout } = useAuth();
    const { t } = useTranslation();
    const supabase = createClient();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [organs, setOrgans] = useState<Organ[]>([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [orgsError, setOrgsError] = useState<string | null>(null);
    const [expandedOrgans, setExpandedOrgans] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [isOrgSectionOpen, setIsOrgSectionOpen] = useState(true);

    useEffect(() => {
        fetchOrgans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchOrgans = async () => {
        setLoadingOrgs(true);
        setOrgsError(null);
        try {
            const { data, error } = await supabase
                .from("organs")
                .select("*")
                .order("name");
            if (error) throw error;
            setOrgans(data || []);
        } catch {
            setOrgsError("Erro ao carregar projetos");
        } finally {
            setLoadingOrgs(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const toggleOrgan = (organId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedOrgans((prev) => ({ ...prev, [organId]: !prev[organId] }));
    };

    const filteredOrgans = useMemo(() => {
        if (!searchQuery) return organs;
        const lowerQuery = searchQuery.toLowerCase();
        return organs.filter((o) => o.name.toLowerCase().includes(lowerQuery));
    }, [organs, searchQuery]);

    const buildOrganTree = (parentId: string | null = null): Organ[] => {
        return filteredOrgans
            .filter((organ) => organ.parent_id === parentId || (!organ.parent_id && parentId === null))
            .map((organ) => ({ ...organ, children: buildOrganTree(organ.id) }));
    };

    const organTree = buildOrganTree();

    const OrganTreeItem = ({ organ, level = 0 }: { organ: Organ; level?: number }) => {
        const hasChildren = organ.children && organ.children.length > 0;
        const isExpanded = expandedOrgans[organ.id] || !!searchQuery;

        return (
            <div className="overflow-hidden">
                <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#E8EEF5] dark:hover:bg-gray-800 transition-colors text-[#263238] dark:text-gray-200`}
                    style={{ marginLeft: level * 12 }}
                    onClick={() => router.push(`/organs/${organ.id}`)}
                    title={organ.name}
                >
                    <div
                        className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                        onClick={(e) => hasChildren && toggleOrgan(organ.id, e)}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                        ) : (
                            <div className="w-3" />
                        )}
                    </div>
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                    <span className="text-xs truncate flex-1">{organ.name}</span>
                </div>
                <AnimatePresence>
                    {hasChildren && isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {organ.children!.map((child) => (
                                <OrganTreeItem key={child.id} organ={child} level={level + 1} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const menuItems = [
        { icon: Home, label: t("nav.dashboard"), path: "/home" },
        { icon: ShieldAlert, label: "Backoffice", path: "/admin", superAdminOnly: true },
        { icon: Building2, label: t("nav.organizations") || "Projetos", path: "/organs" },
        { icon: FileText, label: t("nav.workPlans"), path: "/work-plans" },
        { icon: BarChart3, label: t("nav.accountabilityReports"), path: "/accountability-reports" },
        { icon: BookOpen, label: t("nav.courses"), path: "/courses" },
        { icon: GraduationCap, label: t("nav.myCourses"), path: "/my-courses" },
        { icon: History, label: t("nav.auditLogs"), path: "/audit-logs" },
        { icon: Settings, label: t("nav.settings"), path: "/settings", adminOnly: true },
    ];

    const quickActions = [
        { icon: Plus, label: "Novo Plano de Trabalho", path: "/work-plans/new" },
        { icon: Plus, label: "Nova Prestação de Contas", path: "/accountability-reports/new" },
        { icon: Plus, label: "Novo Curso", path: "/courses/new", adminOnly: true },
    ];

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const sidebarWidth = isCollapsed ? 80 : 280;

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: typeof window !== "undefined" && window.innerWidth < 1024 ? 280 : sidebarWidth,
                    x: typeof window !== "undefined" && window.innerWidth < 1024 ? (isOpen ? 0 : -280) : 0,
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed lg:sticky top-0 left-0 h-screen bg-[#F5F7FA] dark:bg-gray-900 border-r border-border z-50 lg:z-30 flex flex-col overflow-hidden shadow-sm"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border h-16 flex-shrink-0">
                    <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center w-full" : ""}`}>
                        <div className="w-8 h-8 bg-[#0B4F6C] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Building2 className="h-4 w-4 text-white" />
                        </div>
                        {!isCollapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col whitespace-nowrap">
                                <span className="font-bold text-sm text-[#263238] dark:text-white leading-tight">Gestão de Projetos</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">Plataforma de Gestão</span>
                            </motion.div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => (typeof window !== "undefined" && window.innerWidth < 1024 ? onClose() : setIsCollapsed(!isCollapsed))}
                        className="text-[#263238] dark:text-gray-300 hover:bg-[#E8EEF5] dark:hover:bg-gray-800 flex-shrink-0"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 flex flex-col gap-6">
                    {/* Nav */}
                    <nav role="navigation" aria-label="Main Navigation" className="px-3 space-y-1">
                        {menuItems.map((item) => {
                            if (item.adminOnly && currentUser?.role !== "Admin" && currentUser?.role !== "SuperAdmin") return null;
                            if (item.superAdminOnly && currentUser?.role !== "SuperAdmin") return null;
                            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${isActive
                                        ? "bg-[#0B4F6C] text-white shadow-md"
                                        : "text-[#263238] dark:text-gray-300 hover:bg-[#E8EEF5] dark:hover:bg-gray-800 hover:scale-[1.02]"
                                        } ${isCollapsed ? "justify-center" : ""}`}
                                    onClick={() => typeof window !== "undefined" && window.innerWidth < 1024 && onClose()}
                                >
                                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-[#0B4F6C] dark:text-gray-400 group-hover:text-[#0B4F6C]"}`} />
                                    {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Quick Actions */}
                    {!isCollapsed && (
                        <div className="px-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ações Rápidas</h3>
                            <div className="space-y-2">
                                {quickActions.map((action, idx) => {
                                    if (action.adminOnly && currentUser?.role !== "Admin" && currentUser?.role !== "SuperAdmin") return null;
                                    return (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            className="w-full justify-start text-xs h-9 bg-white dark:bg-gray-800 border-border hover:border-[#2E9E4A] hover:text-[#2E9E4A] hover:bg-[#2E9E4A]/5 transition-all duration-300 shadow-sm"
                                            onClick={() => {
                                                router.push(action.path);
                                                if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
                                            }}
                                        >
                                            <action.icon className="h-3.5 w-3.5 mr-2 text-[#2E9E4A]" />
                                            <span className="truncate">{action.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Organizations Tree */}
                    {!isCollapsed && (
                        <div className="px-4 flex-1 flex flex-col min-h-[200px]">
                            <div className="flex items-center justify-between mb-2 cursor-pointer group" onClick={() => setIsOrgSectionOpen(!isOrgSectionOpen)}>
                                <div className="flex items-center gap-1">
                                    {isOrgSectionOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Projetos</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-[#0B4F6C] hover:bg-[#E8EEF5] opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push("/organs");
                                        if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
                                    }}
                                    title="Novo Projeto"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <AnimatePresence>
                                {isOrgSectionOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="flex flex-col gap-2 overflow-hidden"
                                    >
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-8 pl-7 text-xs bg-white dark:bg-gray-800 border-border focus-visible:ring-[#0B4F6C]"
                                            />
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-0.5">
                                            {loadingOrgs ? (
                                                <div className="space-y-2 mt-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="flex items-center gap-2 px-2">
                                                            <div className="w-3.5 h-3.5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : orgsError ? (
                                                <div className="text-center py-4 px-2">
                                                    <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                                                    <p className="text-[10px] text-destructive mb-2">{orgsError}</p>
                                                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={fetchOrgans}>
                                                        <RefreshCw className="h-3 w-3 mr-1" /> Tentar Novamente
                                                    </Button>
                                                </div>
                                            ) : organTree.length === 0 ? (
                                                <p className="text-xs text-muted-foreground text-center py-4">Nenhum projeto encontrado.</p>
                                            ) : (
                                                <div className="mt-1">
                                                    {organTree.map((organ) => (
                                                        <OrganTreeItem key={organ.id} organ={organ} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="border-t border-border p-3 bg-white dark:bg-gray-900 flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={`w-full flex items-center hover:bg-[#E8EEF5] dark:hover:bg-gray-800 transition-colors h-auto py-2 ${isCollapsed ? "justify-center px-0" : "justify-start px-2 gap-3"}`}
                            >
                                <Avatar className="h-8 w-8 border border-border shadow-sm flex-shrink-0">
                                    {currentUser?.avatar_url ? (
                                        <AvatarImage src={currentUser.avatar_url} alt={currentUser.name} />
                                    ) : (
                                        <AvatarFallback className="bg-[#F2A900] text-white text-xs font-medium">
                                            {getInitials(currentUser?.name)}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                {!isCollapsed && (
                                    <div className="flex flex-col items-start overflow-hidden flex-1">
                                        <span className="text-sm font-medium text-[#263238] dark:text-gray-200 truncate w-full text-left">
                                            {currentUser?.name || currentUser?.email || "Usuário"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                                            {t(`roles.${currentUser?.role}`) || currentUser?.role || "Membro"}
                                        </span>
                                    </div>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isCollapsed ? "start" : "end"} side="top" className="w-56 mb-1">
                            <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                                <User className="mr-2 h-4 w-4 text-[#0B4F6C]" />
                                <span>Perfil do Usuário</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4 text-[#0B4F6C]" />
                                <span>Configurações</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sair</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.aside>
        </>
    );
}
