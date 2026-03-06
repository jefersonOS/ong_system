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
import { Building2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, logout, isAuthenticated, initialLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            router.push("/home");
        } catch (error) {
            toast({
                title: t("common.error"),
                description: error instanceof Error ? error.message : "Erro ao fazer login",
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
                <p className="text-sm text-muted-foreground mt-1">Plataforma de Gestão</p>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">{t("auth.login") || "Entrar"}</CardTitle>
                    <CardDescription>{t("auth.loginDesc") || "Entre com suas credenciais para acessar a plataforma"}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isAuthenticated && !initialLoading ? (
                        <div className="space-y-4 text-center py-4">
                            <p className="text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                Você já está conectado ao sistema.
                            </p>
                            <Button className="w-full" onClick={() => router.push("/home")}>
                                Ir para o Painel Principal
                            </Button>
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-muted-foreground mb-2">Está enfrentando problemas de carregamento contínuo? Limpe seu acesso clicando abaixo:</p>
                                <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
                                    Sair da conta (Limpar Cache)
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("auth.email") || "E-mail"}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t("auth.password") || "Senha"}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <LogIn className="h-4 w-4 mr-2" />
                                            {t("auth.login") || "Entrar"}
                                        </>
                                    )}
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                {t("auth.noAccount") || "Não tem uma conta?"}{" "}
                                <Link href="/signup" className="text-[#0B4F6C] font-medium hover:underline">
                                    {t("auth.signup") || "Cadastre-se"}
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
