"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Building2, FileText, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OrganDetailPage() {
    const params = useParams();
    const { t } = useTranslation();
    const supabase = createClient();
    const [organ, setOrgan] = useState<any>(null);
    const [workPlans, setWorkPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) fetchData();
    }, [params.id]);

    const fetchData = async () => {
        const [organRes, plansRes] = await Promise.all([
            supabase.from("organs").select("*").eq("id", params.id).single(),
            supabase.from("work_plans").select("*").eq("organ_id", params.id).order("created_at", { ascending: false }),
        ]);
        setOrgan(organRes.data);
        setWorkPlans(plansRes.data || []);
        setLoading(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
    if (!organ) return <div className="text-center py-8 text-muted-foreground">Projeto não encontrado.</div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" />{organ.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">Criado em {new Date(organ.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Planos de Trabalho</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{workPlans.length}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Em Andamento</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{workPlans.filter((p) => p.status === "Submitted").length}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aprovados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{workPlans.filter((p) => p.status === "Approved").length}</div></CardContent></Card>
            </div>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Planos de Trabalho</CardTitle></CardHeader>
                <CardContent>
                    {workPlans.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano encontrado.</p> : (
                        <div className="space-y-3">{workPlans.map((plan) => (
                            <div key={plan.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                <div><h4 className="font-medium text-sm">{plan.name}</h4><p className="text-xs text-muted-foreground">{plan.year}</p></div>
                                <Badge variant={plan.status === "Approved" ? "default" : plan.status === "Rejected" ? "destructive" : "secondary"}>{plan.status}</Badge>
                            </div>
                        ))}</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
