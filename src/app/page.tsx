import { redirect } from "next/navigation";

export default function RootPage() {
    // Redireciona a raiz diretamente para o Painel logado.
    // O Dashboard decide se o usuário precisa logar ou não.
    redirect("/home");
}
