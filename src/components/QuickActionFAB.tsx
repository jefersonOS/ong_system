"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuickActionFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const actions = [
        { icon: FileText, label: "Novo Plano de Trabalho", path: "/work-plans/new", color: "bg-[#0B4F6C]" },
        { icon: BarChart3, label: "Nova Prestação de Contas", path: "/accountability-reports/new", color: "bg-[#2E9E4A]" },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
                    >
                        {actions.map((action, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-xs font-medium bg-white dark:bg-gray-800 shadow-md px-3 py-1.5 rounded-lg whitespace-nowrap">
                                    {action.label}
                                </span>
                                <Button
                                    size="icon"
                                    className={`${action.color} text-white shadow-lg h-10 w-10 rounded-full`}
                                    onClick={() => {
                                        router.push(action.path);
                                        setIsOpen(false);
                                    }}
                                >
                                    <action.icon className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-[#0B4F6C] hover:bg-[#0B4F6C]/90 text-white shadow-xl"
                onClick={() => setIsOpen(!isOpen)}
            >
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                </motion.div>
            </Button>
        </div>
    );
}
