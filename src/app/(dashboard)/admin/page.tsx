"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Users, CreditCard, Building2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalClients: 0, activeSubscriptions: 0, totalUsers: 0 });

    useEffect(() => {
        if (currentUser && currentUser.role !== "SuperAdmin") {
            router.push("/");
            return;
        }
        fetchAdminData();
    }, [currentUser]);

    const fetchAdminData = async () => {
        try {
            const [orgsRes, usersRes] = await Promise.all([
                supabase.from("organs").select("*").order("created_at", { ascending: false }),
                supabase.from("profiles").select("id, role"),
            ]);

            if (orgsRes.error) throw orgsRes.error;

            const orgs = orgsRes.data || [];
            const users = usersRes.data || [];

            setClients(orgs);
            setStats({
                totalClients: orgs.length,
                activeSubscriptions: orgs.filter(o => o.subscription_status === 'active').length,
                totalUsers: users.length
            });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const updatePlan = async (id: string, plan: string) => {
        const { error } = await supabase.from("organs").update({ subscription_plan: plan }).eq("id", id);
        if (error) toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        else {
            toast({ title: "Sucesso", description: "Plano atualizado!" });
            fetchAdminData();
        }
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from("organs").update({ subscription_status: status }).eq("id", id);
        if (error) toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        else {
            toast({ title: "Sucesso", description: "Status atualizado!" });
            fetchAdminData();
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    if (currentUser?.role !== "SuperAdmin") return null;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-2 mb-8">
                <ShieldAlert className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Painel do Proprietário</h1>
                    <p className="text-muted-foreground">Gerenciamento global de clientes e assinaturas SaaS</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Usuários Registrados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Gestão de Projetos (Clientes)</CardTitle>
                    <CardDescription>Visualize e gerencie todos os tenants do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Plano</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>
                                        <Select value={client.subscription_plan} onValueChange={(v) => updatePlan(client.id, v)}>
                                            <SelectTrigger className="w-[120px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Free">Free</SelectItem>
                                                <SelectItem value="Pro">Pro</SelectItem>
                                                <SelectItem value="Enterprise">Enterprise</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={client.subscription_status === 'active' ? 'default' : 'secondary'}>
                                            {client.subscription_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(client.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Select value={client.subscription_status} onValueChange={(v) => updateStatus(client.id, v)}>
                                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                                    <SelectValue placeholder="Mudar Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Ativo</SelectItem>
                                                    <SelectItem value="trialing">Trial</SelectItem>
                                                    <SelectItem value="past_due">Pendente</SelectItem>
                                                    <SelectItem value="canceled">Cancelado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(`/organs/${client.id}`)}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
