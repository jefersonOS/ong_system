"use client";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    const { t } = useTranslation();
    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="h-6 w-6" />{t("nav.settings") || "Configurações"}</h1>
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.general") || "Configurações Gerais"}</CardTitle>
                    <CardDescription>{t("settings.generalDesc") || "Gerencie as configurações da plataforma"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Configurações do sistema estarão disponíveis em breve.</p>
                </CardContent>
            </Card>
        </div>
    );
}
