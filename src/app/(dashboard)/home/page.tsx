"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { FileText, ClipboardList, Plus, Calendar, Building2, TrendingUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalPlans: 0, draftPlans: 0, submittedPlans: 0, approvedPlans: 0 });
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        if (!currentUser?.organ_id) {
            setLoading(false);
            return;
        }

        try {
            const [plansRes, logsRes] = await Promise.all([
                supabase.from("work_plans").select("*").eq("organ_id", currentUser.organ_id),
                supabase.from("audit_logs").select("*").eq("user_id", currentUser.id).order("timestamp", { ascending: false }).limit(10),
            ]);

            const workPlans = plansRes.data || [];
            setStats({
                totalPlans: workPlans.length,
                draftPlans: workPlans.filter((p) => p.status === "Draft").length,
                submittedPlans: workPlans.filter((p) => p.status === "Submitted").length,
                approvedPlans: workPlans.filter((p) => p.status === "Approved").length,
            });

            setRecentActivities(logsRes.data || []);

            const plansWithDeadlines = workPlans
                .filter((p) => p.timeline_end)
                .map((p) => ({ ...p, daysUntil: Math.ceil((new Date(p.timeline_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }))
                .filter((p) => p.daysUntil >= 0 && p.daysUntil <= 30)
                .sort((a, b) => a.daysUntil - b.daysUntil)
                .slice(0, 5);
            setUpcomingDeadlines(plansWithDeadlines);
        } catch {
            toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" text={t("common.loading")} />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {t("dashboard.welcome")}{currentUser?.name || "Usuário"}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t("dashboard.role")}<span className="font-medium">{t(`roles.${currentUser?.role}`) || currentUser?.role}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { title: t("dashboard.totalPlans"), value: stats.totalPlans, icon: FileText, desc: t("dashboard.allPlans") },
                    { title: t("dashboard.draftPlans"), value: stats.draftPlans, icon: Clock, desc: t("dashboard.inProgress") },
                    { title: t("dashboard.submitted"), value: stats.submittedPlans, icon: TrendingUp, desc: t("dashboard.underReview") },
                    { title: t("dashboard.approved"), value: stats.approvedPlans, icon: ClipboardList, desc: t("dashboard.completed") },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("dashboard.upcomingDeadlines")}</CardTitle>
                        <CardDescription>{t("dashboard.upcomingDeadlinesDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingDeadlines.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noUpcomingDeadlines")}</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingDeadlines.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => router.push(`/work-plans/${plan.id}/edit`)}
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">{plan.name}</h4>
                                            <p className="text-xs text-muted-foreground">{t("dashboard.due")} {formatDate(plan.timeline_end)}</p>
                                        </div>
                                        <Badge variant={plan.daysUntil <= 7 ? "destructive" : "default"}>
                                            {plan.daysUntil} {t("dashboard.days")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("dashboard.recentActivities")}</CardTitle>
                        <CardDescription>{t("dashboard.recentActivitiesDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noRecentActivities")}</p>
                        ) : (
                            <div className="space-y-3">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                                {t(`common.${activity.action_type?.toLowerCase()}`) || activity.action_type} - {activity.entity_type}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("dashboard.quickActions")}</CardTitle>
                    <CardDescription>{t("dashboard.quickActionsDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button onClick={() => router.push("/work-plans/new")} className="h-auto py-6 flex-col gap-2">
                            <Plus className="h-6 w-6" />
                            <span>{t("dashboard.createWorkPlan")}</span>
                        </Button>
                        <Button onClick={() => router.push("/organs")} variant="outline" className="h-auto py-6 flex-col gap-2">
                            <Building2 className="h-6 w-6" />
                            <span>{t("dashboard.manageOrganizations")}</span>
                        </Button>
                        <Button onClick={() => router.push("/audit-logs")} variant="outline" className="h-auto py-6 flex-col gap-2">
                            <Calendar className="h-6 w-6" />
                            <span>{t("dashboard.viewAuditLogs")}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <footer className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                <p>{t("common.appTitle")} {t("common.version")} 1.0.0 | {t("common.support")}: support@workplan.com</p>
            </footer>
        </div>
    );
}
