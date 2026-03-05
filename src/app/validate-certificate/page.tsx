"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, CheckCircle, XCircle, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CertificateValidationPage() {
    const supabase = createClient();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [notFound, setNotFound] = useState(false);

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setNotFound(false);
        setResult(null);

        const { data } = await supabase.from("certificates").select("*, courses(*), profiles:user_id(name)").eq("certificate_code", code.trim()).maybeSingle();
        if (data) { setResult(data); await supabase.from("certificate_validations").insert({ certificate_id: data.id, validated_by: "public" }); }
        else setNotFound(true);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0B4F6C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Building2 className="h-8 w-8 text-white" /></div>
                    <h1 className="text-2xl font-bold text-[#263238]">Validar Certificado</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestão de Projetos - Verificação de Certificados</p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Validação de Certificado</CardTitle>
                        <CardDescription>Insira o código do certificado para verificar sua autenticidade.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleValidate} className="flex gap-2">
                            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código do certificado" className="flex-1" />
                            <Button type="submit" disabled={loading}>{loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Search className="h-4 w-4 mr-2" />Validar</>}</Button>
                        </form>

                        {result && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-3"><CheckCircle className="h-5 w-5 text-green-600" /><span className="font-semibold text-green-800">Certificado válido!</span></div>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Aluno:</span> <strong>{result.profiles?.name}</strong></p>
                                    <p><span className="text-muted-foreground">Curso:</span> <strong>{result.courses?.name}</strong></p>
                                    <p><span className="text-muted-foreground">Emitido em:</span> <strong>{new Date(result.issued_at).toLocaleDateString("pt-BR")}</strong></p>
                                </div>
                            </div>
                        )}

                        {notFound && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" /><span className="text-red-800">Certificado não encontrado.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
