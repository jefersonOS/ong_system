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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowLeft, Camera, CreditCard, FileText, Receipt, PaperclipIcon, ListChecks, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountabilityReportEditorPage() {
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
    const [form, setForm] = useState({ organ_id: "", period_start: "", period_end: "", status: "Draft", notes: "" });
    const [photos, setPhotos] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<any[]>([]);

    useEffect(() => { fetchOrgans(); if (isEditing) fetchReport(); }, []);

    const fetchOrgans = async () => { const { data } = await supabase.from("organs").select("id, name").order("name"); setOrgans(data || []); };

    const fetchReport = async () => {
        const [reportRes, photosRes, paymentsRes, attachmentsRes] = await Promise.all([
            supabase.from("accountability_reports").select("*").eq("id", params.id).single(),
            supabase.from("report_photos").select("*").eq("report_id", params.id),
            supabase.from("payment_records").select("*").eq("report_id", params.id),
            supabase.from("report_attachments").select("*").eq("report_id", params.id),
        ]);
        if (reportRes.data) setForm({ organ_id: reportRes.data.organ_id, period_start: reportRes.data.period_start?.split("T")[0] || "", period_end: reportRes.data.period_end?.split("T")[0] || "", status: reportRes.data.status, notes: reportRes.data.notes || "" });
        setPhotos(photosRes.data || []);
        setPayments(paymentsRes.data || []);
        setAttachments(attachmentsRes.data || []);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.organ_id || !form.period_start || !form.period_end) { toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
        setSaving(true);
        const payload = { ...form, responsible_user_id: currentUser?.id, created_by: currentUser?.id };
        const { error } = isEditing ? await supabase.from("accountability_reports").update(payload).eq("id", params.id) : await supabase.from("accountability_reports").insert(payload);
        if (error) toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" });
        else { toast({ title: "Sucesso", description: isEditing ? "Relatório atualizado!" : "Relatório criado!" }); router.push("/accountability-reports"); }
        setSaving(false);
    };

    const addPayment = async () => {
        if (!isEditing) return;
        const { error } = await supabase.from("payment_records").insert({ report_id: params.id, description: "Novo pagamento", amount: 0, date: new Date().toISOString() });
        if (!error) fetchReport();
    };

    const deletePayment = async (id: string) => {
        await supabase.from("payment_records").delete().eq("id", id);
        fetchReport();
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <Button variant="ghost" onClick={() => router.push("/accountability-reports")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
            <h1 className="text-2xl font-bold mb-6">{isEditing ? "Editar Prestação de Contas" : "Nova Prestação de Contas"}</h1>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="flex flex-wrap gap-1">
                    <TabsTrigger value="general" className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Geral</TabsTrigger>
                    <TabsTrigger value="photos" className="flex items-center gap-1" disabled={!isEditing}><Camera className="h-3.5 w-3.5" />Fotos</TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center gap-1" disabled={!isEditing}><Receipt className="h-3.5 w-3.5" />Pagamentos</TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-1" disabled={!isEditing}><CreditCard className="h-3.5 w-3.5" />Extratos</TabsTrigger>
                    <TabsTrigger value="attachments" className="flex items-center gap-1" disabled={!isEditing}><PaperclipIcon className="h-3.5 w-3.5" />Anexos</TabsTrigger>
                    <TabsTrigger value="report" className="flex items-center gap-1" disabled={!isEditing}><ListChecks className="h-3.5 w-3.5" />Relatório</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2"><Label>Projeto *</Label><Select value={form.organ_id} onValueChange={(v) => setForm({ ...form, organ_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{organs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Período Início *</Label><Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Período Fim *</Label><Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Rascunho</SelectItem><SelectItem value="In Review">Em Revisão</SelectItem><SelectItem value="Approved">Aprovado</SelectItem><SelectItem value="Rejected">Rejeitado</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => router.push("/accountability-reports")}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Salvando..." : "Salvar"}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="photos">
                    <Card><CardHeader><CardTitle>Fotos ({photos.length})</CardTitle></CardHeader>
                        <CardContent>{photos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma foto adicionada.</p> : <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{photos.map((p) => <div key={p.id} className="border rounded-lg p-2"><p className="text-xs text-muted-foreground truncate">{p.description || "Sem descrição"}</p></div>)}</div>}</CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Pagamentos ({payments.length})</CardTitle><Button size="sm" onClick={addPayment}><Plus className="h-4 w-4 mr-1" />Adicionar</Button></CardHeader>
                        <CardContent>
                            {payments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado.</p> : (
                                <div className="space-y-3">{payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div><p className="font-medium text-sm">{p.description}</p><p className="text-xs text-muted-foreground">R$ {p.amount?.toFixed(2)} • {p.date ? new Date(p.date).toLocaleDateString("pt-BR") : ""}</p></div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePayment(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bank">
                    <Card><CardHeader><CardTitle>Extratos Bancários</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground text-center py-4">Gerencie extratos e conciliação bancária.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attachments">
                    <Card><CardHeader><CardTitle>Anexos ({attachments.length})</CardTitle></CardHeader>
                        <CardContent>{attachments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo.</p> : <div className="space-y-2">{attachments.map((a) => <div key={a.id} className="flex items-center justify-between p-2 border rounded"><span className="text-sm">{a.file_name}</span></div>)}</div>}</CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="report">
                    <Card><CardHeader><CardTitle>Relatório de Execução</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground text-center py-4">Compose the execution report here.</p></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
