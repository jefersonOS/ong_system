"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner";
import { History, Search, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuditLogPage() {
    const { t } = useTranslation();
    const supabase = createClient();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        const { data } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false });
        setLogs(data || []);
        setLoading(false);
    };

    const filtered = logs.filter((l) => !search || l.action_type?.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" text={t("common.loading")} /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><History className="h-6 w-6" />{t("nav.auditLogs") || "Logs de Auditoria"}</h1>
                <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            </div>
            <div className="space-y-3">
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum log encontrado.</p> : filtered.map((log) => (
                    <Card key={log.id}>
                        <CardContent className="flex items-start gap-3 p-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"><FileText className="h-4 w-4 text-primary" /></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{log.action_type}</Badge>
                                    <span className="text-sm font-medium">{log.entity_type}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
