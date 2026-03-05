"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowLeft, Link as LinkIcon, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function CourseEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const supabase = createClient();
    const isEditing = !!params?.id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", duration: 1, category: "" });
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");

    useEffect(() => { if (isEditing) fetchCourse(); }, []);

    const fetchCourse = async () => {
        const { data } = await supabase.from("courses").select("*").eq("id", params.id).single();
        if (data) setForm({ name: data.name, description: data.description || "", duration: data.duration, category: data.category || "" });
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.name) { toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" }); return; }
        setSaving(true);
        const payload = { ...form, created_by: currentUser?.id, instructor_id: currentUser?.id, organ_id: currentUser?.organ_id };

        let result;
        if (isEditing) {
            result = await supabase.from("courses").update(payload).eq("id", params.id);
        } else {
            result = await supabase.from("courses").insert(payload).select().single();
        }

        if (result.error) {
            toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" });
        } else {
            if (!isEditing && result.data) {
                const link = `${window.location.origin}/courses/${result.data.id}`;
                setGeneratedLink(link);
                setShowSuccessDialog(true);
            } else {
                toast({ title: "Sucesso", description: isEditing ? "Curso atualizado!" : "Curso criado!" });
                router.push("/courses");
            }
        }
        setSaving(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast({ title: "Copiado!", description: "Link copiado para a área de transferência." });
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <Button variant="ghost" onClick={() => router.push("/courses")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
            <h1 className="text-2xl font-bold mb-6">{isEditing ? "Editar Curso" : "Novo Curso"}</h1>
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do curso" /></div>
                    <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Duração (horas)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 1 })} /></div>
                        <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Gestão, RH..." /></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => router.push("/courses")}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Salvando..." : "Salvar"}</Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Módulo Criado com Sucesso!</DialogTitle>
                        <DialogDescription>
                            O curso foi criado. Use o link abaixo para permitir que os alunos se inscrevam.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-md overflow-hidden">
                        <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs truncate flex-1">{generatedLink}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => router.push("/courses")}>Ir para Meus Cursos</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
