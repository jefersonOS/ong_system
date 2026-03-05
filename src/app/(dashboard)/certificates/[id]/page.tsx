"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function CertificateViewerPage() {
    const params = useParams();
    const supabase = createClient();
    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (params.id) fetchCertificate(); }, [params.id]);

    const fetchCertificate = async () => {
        const { data } = await supabase.from("certificates").select("*, courses(*), profiles:user_id(name)").eq("id", params.id).single();
        setCertificate(data);
        setLoading(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
    if (!certificate) return <div className="text-center py-8 text-muted-foreground">Certificado não encontrado.</div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <Card className="border-2 border-primary/20">
                <CardHeader className="text-center border-b pb-6">
                    <div className="w-16 h-16 bg-[#F2A900] rounded-full mx-auto mb-4 flex items-center justify-center"><Award className="h-8 w-8 text-white" /></div>
                    <CardTitle className="text-2xl">Certificado de Conclusão</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">Certificamos que</p>
                    <h2 className="text-xl font-bold">{certificate.profiles?.name || "Aluno"}</h2>
                    <p className="text-muted-foreground">concluiu com sucesso o curso</p>
                    <h3 className="text-lg font-semibold text-primary">{certificate.courses?.name || "Curso"}</h3>
                    <p className="text-sm text-muted-foreground">Duração: {certificate.courses?.duration || 0} horas</p>
                    <p className="text-sm text-muted-foreground">Emitido em: {new Date(certificate.issued_at).toLocaleDateString("pt-BR")}</p>
                    <div className="border border-dashed border-border rounded-lg p-3 inline-block"><p className="text-xs text-muted-foreground">Código: <span className="font-mono font-bold">{certificate.certificate_code}</span></p></div>
                    <div className="pt-4"><Button><Download className="h-4 w-4 mr-2" />Baixar PDF</Button></div>
                </CardContent>
            </Card>
        </div>
    );
}
