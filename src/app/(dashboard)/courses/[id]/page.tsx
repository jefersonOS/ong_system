"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Edit, Play, Users, Clock, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const supabase = createClient();
    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (params.id) fetchData(); }, [params.id]);

    const fetchData = async () => {
        const [courseRes, modulesRes, enrollmentRes] = await Promise.all([
            supabase.from("courses").select("*").eq("id", params.id).single(),
            supabase.from("course_modules").select("*, course_lessons(*)").eq("course_id", params.id).order("order_index"),
            supabase.from("course_enrollments").select("*").eq("course_id", params.id).eq("user_id", currentUser?.id || "").maybeSingle(),
        ]);
        setCourse(courseRes.data);
        setModules(modulesRes.data || []);
        setEnrollment(enrollmentRes.data);
        setLoading(false);
    };

    const handleEnroll = async () => {
        const { error } = await supabase.from("course_enrollments").insert({ course_id: params.id, user_id: currentUser?.id || "" });
        if (!error) { toast({ title: "Sucesso", description: "Matrícula realizada!" }); fetchData(); }
        else toast({ title: "Erro", description: "Erro na matrícula", variant: "destructive" });
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
    if (!course) return <div className="text-center py-8 text-muted-foreground">Curso não encontrado.</div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6" />{course.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <Badge variant="secondary">{course.category || "Geral"}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}h</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(currentUser?.role === "Admin" || course.created_by === currentUser?.id) && <Button variant="outline" onClick={() => router.push(`/courses/${params.id}/edit`)}><Edit className="h-4 w-4 mr-2" />Editar</Button>}
                    {!enrollment && <Button onClick={handleEnroll}><Play className="h-4 w-4 mr-2" />Matricular-se</Button>}
                </div>
            </div>

            {enrollment && (
                <Card className="mb-6">
                    <CardContent className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Progresso</span><span className="text-sm text-muted-foreground">{enrollment.progress || 0}%</span></div><Progress value={enrollment.progress || 0} /></CardContent>
                </Card>
            )}

            {course.description && <Card className="mb-6"><CardContent className="p-4"><p className="text-sm">{course.description}</p></CardContent></Card>}

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Módulos ({modules.length})</h2>
                {modules.length === 0 ? <p className="text-muted-foreground">Nenhum módulo cadastrado.</p> : modules.map((mod) => (
                    <Card key={mod.id}>
                        <CardHeader className="pb-2"><CardTitle className="text-base">{mod.title}</CardTitle></CardHeader>
                        <CardContent>
                            {mod.description && <p className="text-sm text-muted-foreground mb-2">{mod.description}</p>}
                            <div className="space-y-1">
                                {(mod.course_lessons || []).sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => (
                                    <div key={lesson.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm">
                                        <Play className="h-3.5 w-3.5 text-primary" />{lesson.title}
                                        {lesson.duration > 0 && <span className="text-xs text-muted-foreground ml-auto">{lesson.duration}min</span>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
