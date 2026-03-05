"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OrganListPage() {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const [organs, setOrgans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [newName, setNewName] = useState("");
    const [parentId, setParentId] = useState("");

    useEffect(() => { fetchOrgans(); }, []);

    const fetchOrgans = async () => {
        let query = supabase.from("organs").select("*").order("name");

        // Se não for Admin nem SuperAdmin, aplica filtros de isolamento
        if (currentUser?.role !== "Admin" && currentUser?.role !== "SuperAdmin") {
            if (currentUser?.organ_id) {
                query = query.eq("id", currentUser.organ_id);
            } else {
                // Se não tem organ_id vinculado, vê apenas o que ele criou (Dono)
                query = query.eq("created_by", currentUser?.id);
            }
        }

        const { data } = await query;
        setOrgans(data || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast({ title: "Validação", description: "O nome do projeto é obrigatório", variant: "destructive" });
            return;
        }

        setLoading(true); // Show loading while creating
        const { error } = await supabase.from("organs").insert({
            name: newName,
            parent_id: parentId === "none" || !parentId ? null : parentId,
            created_by: currentUser?.id
        });

        if (error) {
            toast({
                title: "Erro ao validar o cadastro",
                description: error.message || "Erro ao criar projeto no banco de dados",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        // Se o usuário ainda não tem um projeto vinculado no seu perfil, vincula este que ele acabou de criar
        if (!currentUser?.organ_id) {
            const { data: newOrg } = await supabase.from("organs").select("id").eq("name", newName).eq("created_by", currentUser?.id).order("created_at", { ascending: false }).limit(1).single();
            if (newOrg) {
                await supabase.from("profiles").update({ organ_id: newOrg.id }).eq("id", currentUser?.id);
                window.location.reload(); // Recarrega para atualizar o contexto de autenticação com o novo organ_id
            }
        }

        toast({ title: "Sucesso", description: "Projeto criado com sucesso!" });
        setNewName(""); setParentId(""); setShowDialog(false); fetchOrgans();
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("organs").delete().eq("id", id);
        if (error) { toast({ title: "Erro", description: "Erro ao excluir", variant: "destructive" }); return; }
        toast({ title: "Sucesso", description: "Projeto excluído!" }); fetchOrgans();
    };

    const filtered = organs.filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" />{t("nav.organizations") || "Projetos"}</h1>
                <div className="flex items-center gap-3">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" /></div>
                    <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Nova</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((org) => (
                    <Card key={org.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/organs/${org.id}`)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base">{org.name}</CardTitle>
                            {currentUser?.role === "Admin" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(org.id); }}><Trash2 className="h-4 w-4" /></Button>
                            )}
                        </CardHeader>
                        <CardContent><p className="text-xs text-muted-foreground">Criado em {new Date(org.created_at).toLocaleDateString("pt-BR")}</p></CardContent>
                    </Card>
                ))}
            </div>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum projeto encontrado.</p>}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Nome</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do projeto" /></div>
                        <div className="space-y-2">
                            <Label>Projeto Pai (opcional)</Label>
                            <Select value={parentId} onValueChange={setParentId}><SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma (Nível Principal)</SelectItem>
                                    {organs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button><Button onClick={handleCreate}>Criar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
