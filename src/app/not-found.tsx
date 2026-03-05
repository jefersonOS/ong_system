import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
                <h1 className="text-6xl font-bold text-[#0B4F6C] mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-2">Página não encontrada</h2>
                <p className="text-muted-foreground mb-6">A página que você está procurando não existe ou foi movida.</p>
                <Link href="/">
                    <Button><Home className="h-4 w-4 mr-2" />Voltar ao Início</Button>
                </Link>
            </div>
        </div>
    );
}
