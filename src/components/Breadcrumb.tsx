"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function Breadcrumb() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const pathMap: Record<string, string> = {
        organs: t("nav.organizations") || "Projetos",
        "work-plans": t("nav.workPlans") || "Planos de Trabalho",
        "accountability-reports": t("nav.accountabilityReports") || "Prestação de Contas",
        courses: t("nav.courses") || "Cursos",
        "my-courses": t("nav.myCourses") || "Meus Cursos",
        certificates: "Certificados",
        "audit-logs": t("nav.auditLogs") || "Logs de Auditoria",
        settings: t("nav.settings") || "Configurações",
        profile: "Perfil",
        new: "Novo",
        edit: "Editar",
    };

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) return null;

    return (
        <nav className="px-4 lg:px-6 py-2 bg-white dark:bg-gray-900 border-b border-border" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <li>
                    <Link href="/" className="flex items-center gap-1 hover:text-[#0B4F6C] transition-colors">
                        <Home className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Início</span>
                    </Link>
                </li>
                {segments.map((segment, index) => {
                    const path = "/" + segments.slice(0, index + 1).join("/");
                    const isLast = index === segments.length - 1;
                    const label = pathMap[segment] || segment;

                    return (
                        <React.Fragment key={path}>
                            <li>
                                <ChevronRight className="h-3 w-3" />
                            </li>
                            <li>
                                {isLast ? (
                                    <span className="font-medium text-foreground">{label}</span>
                                ) : (
                                    <Link href={path} className="hover:text-[#0B4F6C] transition-colors">
                                        {label}
                                    </Link>
                                )}
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
