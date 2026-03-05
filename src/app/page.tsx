"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BookOpen, Search, Users, Layout, ShieldCheck, TrendingUp, ArrowRight, Building2, GraduationCap, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function LandingPortalPage() {
    const { currentUser, isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchPublicCourses();
    }, []);

    const fetchPublicCourses = async () => {
        // Here we attempt to fetch all courses. 
        // Note: For this to work publicly, RLS settings on 'public.courses' must allow SELECT for anon.
        const { data } = await supabase
            .from("courses")
            .select("*, organs(name), course_enrollments(count)")
            .order("created_at", { ascending: false })
            .limit(12);

        setCourses(data || []);
        setLoading(false);
    };

    const filtered = courses.filter((c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0B4F6C] rounded-lg flex items-center justify-center shadow-sm">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">Gestão de Projetos</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Button onClick={() => router.push("/home")} variant="default" className="bg-[#0B4F6C] hover:bg-[#083d54]">
                                Ir para o Painel <Layout className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[#0B4F6C] transition-colors">
                                    Entrar
                                </Link>
                                <Button onClick={() => router.push("/signup")} className="bg-[#0B4F6C] hover:bg-[#083d54]">
                                    Cadastrar-se
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#0B4F6C] to-[#1E293B]">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                    <div className="container mx-auto px-4 relative">
                        <div className="max-w-3xl mx-auto text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/20 py-1 px-4">
                                    Portal de Conhecimento e Gestão
                                </Badge>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                                    Potencialize seu <span className="text-sky-400">Projeto</span> com nossa plataforma de cursos
                                </h1>
                                <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                                    Acesse conteúdos exclusivos, gerencie instituições e desenvolva equipes com ferramentas pensadas para o impacto social.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button size="lg" onClick={() => router.push("/signup")} className="w-full sm:w-auto bg-white text-[#0B4F6C] hover:bg-slate-100 font-bold py-6 px-10 shadow-xl">
                                        Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => {
                                        const el = document.getElementById('courses');
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }} className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 py-6 px-10">
                                        Ver Cursos Disponíveis
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Floating Stats */}
                    <div className="container mx-auto px-4 mt-20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            {[
                                { label: "Cursos Ativos", value: "24+", icon: BookOpen },
                                { label: "Membros", value: "1.2k+", icon: Users },
                                { label: "Instituições", value: "150+", icon: Building2 },
                                { label: "Taxa de Sucesso", value: "98%", icon: TrendingUp },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
                                >
                                    <div className="flex justify-center mb-2">
                                        <stat.icon className="h-5 w-5 text-sky-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Search and Filters */}
                <section id="courses" className="py-16 container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Cursos Disponíveis</h2>
                            <p className="text-slate-500 mt-2">Explore nossa seleção de cursos voltados para a gestão e execução de projetos.</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar curso ou categoria..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="lg" text="Carregando portal de cursos..." />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">Nenhum curso encontrado</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">Tente ajustar sua busca ou explore outras categorias.</p>
                            <Button variant="ghost" className="mt-4 text-[#0B4F6C]" onClick={() => setSearch("")}>Limpar Filtros</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filtered.map((course, idx) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card
                                        className="group h-full flex flex-col cursor-pointer border-slate-200 hover:border-[#0B4F6C]/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden"
                                        onClick={() => router.push(isAuthenticated ? `/courses/${course.id}` : `/signup?course=${course.id}`)}
                                    >
                                        <div className="h-40 bg-slate-100 relative group-hover:bg-[#0B4F6C]/5 transition-colors">
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 group-hover:text-[#0B4F6C] transition-colors">
                                                <GraduationCap className="h-16 w-16 opacity-20" />
                                            </div>
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-white/90 text-[#0B4F6C] backdrop-blur shadow-sm border-none">
                                                    {course.category || "Gestão"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardHeader className="p-5 pb-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B4F6C] mb-2">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {course.organs?.name || "Projeto Social"}
                                            </div>
                                            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0B4F6C] transition-colors">
                                                {course.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-0 flex-1">
                                            <p className="text-sm text-slate-500 line-clamp-2 mt-2">
                                                {course.description || "Inicie agora e transforme a gestão do seu projeto com este treinamento especializado."}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-slate-500 font-medium bg-slate-200/50 py-1 px-2 rounded-md">
                                                    {course.duration}h
                                                </span>
                                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> {course.course_enrollments?.[0]?.count || 0}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-[#0B4F6C] flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Quero me inscrever <ChevronRight className="h-3 w-3" />
                                            </span>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Features Section */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que escolher nossa plataforma?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto mb-16">Unimos gestão técnica e conhecimento especializado para potencializar o impacto de causas sociais.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { title: "Certificado Válido", desc: "Todos os nossos cursos emitem certificados oficiais validados digitalmente.", icon: ShieldCheck },
                                { title: "Foco em Gestão", desc: "Conteúdo focado na realidade prática da gestão de projetos e prestações de contas.", icon: Layout },
                                { title: "Comunidade Ativa", desc: "Troque experiências com milhares de outros gestores de projetos de todo o país.", icon: Users },
                            ].map((feature, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-[#04D9FF]/10 rounded-2xl flex items-center justify-center mb-6">
                                        <feature.icon className="h-8 w-8 text-[#0B4F6C]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 container mx-auto px-4 mb-20">
                    <div className="bg-[#0B4F6C] rounded-[2.5rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Pronto para transformar sua gestão?</h2>
                        <p className="text-sky-100/70 text-lg mb-10 max-w-xl mx-auto">Junte-se a centenas de gestores que já estão economizando tempo e aumentando seu impacto social.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" onClick={() => router.push("/signup")} className="w-full sm:w-auto bg-sky-400 hover:bg-sky-500 text-[#0B4F6C] font-bold h-14 px-12">
                                Iniciar Gratuitamente
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => router.push("/validate-certificate")} className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 h-14 px-12">
                                Validar um Certificado
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-sky-400" />
                                </div>
                                <span className="font-bold text-xl tracking-tight">Gestão de Projetos</span>
                            </div>
                            <p className="text-slate-400 max-w-sm mb-6">A plataforma definitiva para organizar, gerenciar e escalar projetos de impacto social com transparência e eficiência.</p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-sky-400 uppercase text-xs tracking-[0.2em]">O Sistema</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><Link href="/login" className="hover:text-white transition-colors">Entrar</Link></li>
                                <li><Link href="/signup" className="hover:text-white transition-colors">Criar Conta</Link></li>
                                <li><Link href="/validate-certificate" className="hover:text-white transition-colors">Validar Certificado</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-sky-400 uppercase text-xs tracking-[0.2em]">Contato</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li>ajuda@gestaoprojetos.com.br</li>
                                <li>Atendimento Seg-Sex</li>
                                <li>08:00 às 18:00</li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <p>© 2026 Gestão de Projetos - Todos os direitos reservados.</p>
                        <div className="flex gap-8">
                            <Link href="#" className="underline">Privacidade</Link>
                            <Link href="#" className="underline">Termos</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

