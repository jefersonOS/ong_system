"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BookOpen, Plus, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CoursesListPage() {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => { const { data } = await supabase.from("courses").select("*, course_enrollments(count)").order("created_at", { ascending: false }); setCourses(data || []); setLoading(false); };

    const filtered = courses.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6" />{t("nav.courses") || "Cursos"}</h1>
                <div className="flex items-center gap-3">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" /></div>
                    {(currentUser?.role === "Admin" || currentUser?.role === "Coordenador de Curso") && <Button onClick={() => router.push("/courses/new")}><Plus className="h-4 w-4 mr-2" />Novo Curso</Button>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((course) => (
                    <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/courses/${course.id}`)}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary">{course.category || "Geral"}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{course.course_enrollments?.[0]?.count || 0}</span>
                            </div>
                            <CardTitle className="text-lg mt-2">{course.name}</CardTitle>
                            <CardDescription>{course.description?.slice(0, 100)}{course.description?.length > 100 ? "..." : ""}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Duração: {course.duration}h</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum curso encontrado.</p>}
        </div>
    );
}
