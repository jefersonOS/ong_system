"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountabilityReportListPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => { const { data } = await supabase.from("accountability_reports").select("*, organs(name)").order("created_at", { ascending: false }); setReports(data || []); setLoading(false); };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("accountability_reports").delete().eq("id", id);
        if (!error) { toast({ title: "Sucesso", description: "Relatório excluído!" }); fetchReports(); }
    };

    const filtered = reports.filter((r) => {
        const orgName = r.organs?.name || "";
        const matchesSearch = !search || orgName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" />{t("nav.accountabilityReports") || "Prestação de Contas"}</h1>
                <Button onClick={() => router.push("/accountability-reports/new")}><Plus className="h-4 w-4 mr-2" />Novo Relatório</Button>
            </div>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Draft">Rascunho</SelectItem><SelectItem value="In Review">Em Revisão</SelectItem><SelectItem value="Approved">Aprovado</SelectItem><SelectItem value="Rejected">Rejeitado</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-3">
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum relatório encontrado.</p> : filtered.map((report) => (
                    <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/accountability-reports/${report.id}/edit`)}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium">{report.organs?.name || "Projeto"}</h3>
                                <p className="text-sm text-muted-foreground">{new Date(report.period_start).toLocaleDateString("pt-BR")} - {new Date(report.period_end).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={report.status === "Approved" ? "default" : report.status === "Rejected" ? "destructive" : "secondary"}>{report.status}</Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
