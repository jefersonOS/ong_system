"use client";
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, User } from "lucide-react";

export default function UserProfilePage() {
    const { currentUser, updateProfile } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [name, setName] = useState(currentUser?.name || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile({ name });
            toast({ title: "Sucesso", description: t("profile.updateSuccess") || "Perfil atualizado!" });
        } catch (error) {
            toast({ title: t("common.error"), description: error instanceof Error ? error.message : "Erro", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (n?: string | null) => n ? n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "U";

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><User className="h-6 w-6" /> {t("profile.title") || "Perfil do Usuário"}</h1>
            <Card>
                <CardHeader><CardTitle>{t("profile.personalInfo") || "Informações Pessoais"}</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-20 w-20 border-2 border-border">
                            {currentUser?.avatar_url ? <AvatarImage src={currentUser.avatar_url} /> : <AvatarFallback className="bg-[#F2A900] text-white text-lg">{getInitials(currentUser?.name)}</AvatarFallback>}
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">{currentUser?.name || "Usuário"}</h3>
                            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t(`roles.${currentUser?.role}`) || currentUser?.role}</p>
                        </div>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t("auth.name") || "Nome"}</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input value={currentUser?.email || ""} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("auth.role") || "Função"}</Label>
                            <Input value={t(`roles.${currentUser?.role}`) || currentUser?.role || ""} disabled className="bg-muted" />
                        </div>
                        <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Salvando..." : t("common.save") || "Salvar"}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
