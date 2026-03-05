"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WorkPlanEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const supabase = createClient();
    const isEditing = !!params?.id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [organs, setOrgans] = useState<any[]>([]);
    const [form, setForm] = useState({ name: "", organ_id: "", year: new Date().getFullYear(), status: "Draft", objectives: "", timeline_start: "", timeline_end: "" });

    useEffect(() => {
        fetchOrgans();
        if (isEditing) fetchPlan();
    }, []);

    const fetchOrgans = async () => { const { data } = await supabase.from("organs").select("id, name").order("name"); setOrgans(data || []); };

    const fetchPlan = async () => {
        const { data } = await supabase.from("work_plans").select("*").eq("id", params.id).single();
        if (data) setForm({ name: data.name, organ_id: data.organ_id, year: data.year, status: data.status, objectives: data.objectives || "", timeline_start: data.timeline_start?.split("T")[0] || "", timeline_end: data.timeline_end?.split("T")[0] || "" });
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.name || !form.organ_id) { toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
        setSaving(true);
        const payload = { ...form, created_by: currentUser?.id, timeline_start: form.timeline_start || null, timeline_end: form.timeline_end || null };
        const { error } = isEditing
            ? await supabase.from("work_plans").update(payload).eq("id", params.id)
            : await supabase.from("work_plans").insert(payload);
        if (error) { toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" }); }
        else { toast({ title: "Sucesso", description: isEditing ? "Plano atualizado!" : "Plano criado!" }); router.push("/work-plans"); }
        setSaving(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <Button variant="ghost" onClick={() => router.push("/work-plans")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
            <h1 className="text-2xl font-bold mb-6">{isEditing ? "Editar Plano de Trabalho" : "Novo Plano de Trabalho"}</h1>
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do plano" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Projeto *</Label><Select value={form.organ_id} onValueChange={(v) => setForm({ ...form, organ_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{organs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Ano</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Rascunho</SelectItem><SelectItem value="Submitted">Enviado</SelectItem><SelectItem value="Approved">Aprovado</SelectItem><SelectItem value="Rejected">Rejeitado</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Objetivos</Label><Textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={4} placeholder="Descreva os objetivos..." /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Início do Cronograma</Label><Input type="date" value={form.timeline_start} onChange={(e) => setForm({ ...form, timeline_start: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Fim do Cronograma</Label><Input type="date" value={form.timeline_end} onChange={(e) => setForm({ ...form, timeline_end: e.target.value })} /></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => router.push("/work-plans")}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Salvando..." : "Salvar"}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
