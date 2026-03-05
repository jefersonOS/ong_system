"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("Membro");
    const [organId, setOrganId] = useState("");
    const [organs, setOrgans] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const supabase = createClient();

    useEffect(() => {
        const fetchOrgans = async () => {
            const { data } = await supabase.from("organs").select("id, name").order("name");
            if (data) setOrgans(data);
        };
        fetchOrgans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(email, password, name, role, organId);
            toast({ title: "Sucesso", description: t("auth.signupSuccess") || "Cadastro realizado com sucesso!" });
            router.push("/login");
        } catch (error) {
            toast({
                title: t("common.error"),
                description: error instanceof Error ? error.message : "Erro no cadastro",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md px-4">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#0B4F6C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Building2 className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[#263238]">Gestão de Projetos</h1>
                <p className="text-sm text-muted-foreground mt-1">Criar nova conta</p>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">{t("auth.signup") || "Cadastro"}</CardTitle>
                    <CardDescription>{t("auth.signupDesc") || "Preencha os dados para criar sua conta"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t("auth.name") || "Nome completo"}</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("auth.email") || "E-mail"}</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t("auth.password") || "Senha"}</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("auth.role") || "Função"}</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Membro">Membro</SelectItem>
                                    <SelectItem value="Gestor">Gestor</SelectItem>
                                    <SelectItem value="Coordenador de Curso">Coordenador de Curso</SelectItem>
                                    <SelectItem value="Admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t("auth.organization") || "Projeto"}</Label>
                            <Select value={organId} onValueChange={setOrganId}>
                                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                                <SelectContent>
                                    {organs.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {t("auth.signup") || "Cadastrar"}
                                </>
                            )}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        {t("auth.hasAccount") || "Já tem uma conta?"}{" "}
                        <Link href="/login" className="text-[#0B4F6C] font-medium hover:underline">
                            {t("auth.login") || "Entrar"}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
