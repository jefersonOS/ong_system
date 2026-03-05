"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LoadingSpinner from "@/components/LoadingSpinner";
import { GraduationCap, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MyCoursesPage() {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const supabase = createClient();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchEnrollments(); }, []);

    const fetchEnrollments = async () => {
        const { data } = await supabase.from("course_enrollments").select("*, courses(*)").eq("user_id", currentUser?.id || "").order("enrolled_at", { ascending: false });
        setEnrollments(data || []);
        setLoading(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><GraduationCap className="h-6 w-6" />{t("nav.myCourses") || "Meus Cursos"}</h1>
            {enrollments.length === 0 ? (
                <div className="text-center py-12"><BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Você ainda não está matriculado em nenhum curso.</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/courses/${enrollment.course_id}`)}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Badge variant={enrollment.status === "completed" ? "default" : "secondary"}>{enrollment.status === "completed" ? "Concluído" : enrollment.status === "in_progress" ? "Em Andamento" : "Matriculado"}</Badge>
                                </div>
                                <CardTitle className="text-lg mt-2">{enrollment.courses?.name || "Curso"}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-2"><span className="text-sm">Progresso</span><span className="text-sm font-medium">{enrollment.progress || 0}%</span></div>
                                <Progress value={enrollment.progress || 0} />
                                <p className="text-xs text-muted-foreground mt-2">Matriculado em {new Date(enrollment.enrolled_at).toLocaleDateString("pt-BR")}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
