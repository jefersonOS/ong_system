"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SignupForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const { signup, isAuthenticated, initialLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { t } = useTranslation();

    // Se o gestor enviou um link com ?project=ID, ele entra direto no projeto
    const organId = searchParams.get("project") || "";
    // Se tem projeto no link, entra como Membro. Se não tem nada, é o dono/gestor.
    const role = organId ? "Membro" : "Gestor";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(email, password, name, role, organId);
            toast({
                title: "Sucesso",
                description: organId
                    ? "Cadastro realizado! Bem-vindo ao projeto."
                    : "Cadastro realizado como Gestor!"
            });
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

            {organId && (
                <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground border border-border">
                    Você entrará como <strong>Membro</strong> neste projeto.
                </div>
            )}

            {!organId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    Você terá acesso como <strong>Gestor</strong> para criar e gerenciar seu próprio projeto institucional.
                </div>
            )}

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
    );
}

export default function SignupPage() {
    const { t } = useTranslation();

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
                    <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Carregando formulário...</div>}>
                        <SignupForm />
                    </Suspense>
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
