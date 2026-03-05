"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WorkPlanListPage() {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        if (currentUser) fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const fetchPlans = async () => {
        let query = supabase.from("work_plans").select("*").order("created_at", { ascending: false });

        if (currentUser?.role !== "Admin" && currentUser?.organ_id) {
            query = query.eq("organ_id", currentUser.organ_id);
        }

        const { data } = await query;
        setPlans(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("work_plans").delete().eq("id", id);
        if (!error) { toast({ title: "Sucesso", description: "Plano excluído!" }); fetchPlans(); }
    };

    const filtered = plans.filter((p) => {
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />{t("nav.workPlans") || "Planos de Trabalho"}</h1>
                <Button onClick={() => router.push("/work-plans/new")}><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
            </div>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Draft">Rascunho</SelectItem><SelectItem value="Submitted">Enviado</SelectItem><SelectItem value="Approved">Aprovado</SelectItem><SelectItem value="Rejected">Rejeitado</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-3">
                {filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum plano encontrado.</p> : filtered.map((plan) => (
                    <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/work-plans/${plan.id}/edit`)}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex-1 min-w-0"><h3 className="font-medium">{plan.name}</h3><p className="text-sm text-muted-foreground">{plan.year} • {plan.objectives?.slice(0, 60)}{plan.objectives?.length > 60 ? "..." : ""}</p></div>
                            <div className="flex items-center gap-2">
                                <Badge variant={plan.status === "Approved" ? "default" : plan.status === "Rejected" ? "destructive" : "secondary"}>{plan.status}</Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
