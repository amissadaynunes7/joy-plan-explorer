import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Scissors, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Barbearia" },
      {
        name: "description",
        content: "Acesse o sistema de agenda e financeiro da sua barbearia.",
      },
      { property: "og:title", content: "Entrar — Barbearia" },
      {
        property: "og:description",
        content: "Acesse o sistema de agenda e financeiro da sua barbearia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          toast.error(
            error.message === "Invalid login credentials"
              ? "E-mail ou senha incorretos."
              : error.message,
          );
          return;
        }
        navigate({ to: "/agenda" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          navigate({ to: "/agenda" });
          return;
        }
        setAguardandoConfirmacao(true);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Scissors className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl tracking-wide text-foreground">Barbearia</h1>
        <p className="text-sm text-muted-foreground">Agenda, clientes e financeiro</p>
      </div>

      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader>
          <CardTitle>{modo === "entrar" ? "Entrar no sistema" : "Criar conta do dono"}</CardTitle>
          <CardDescription>
            {modo === "entrar"
              ? "Use o e-mail e a senha da sua barbearia."
              : "Crie o acesso que você usará todos os dias."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aguardandoConfirmacao ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                Enviamos um link de confirmação para <strong>{email}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Abra o e-mail e confirme o cadastro para conseguir entrar.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAguardandoConfirmacao(false);
                  setModo("entrar");
                }}
              >
                Voltar para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@barbearia.com.br"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <Input
                  id="senha"
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={carregando}>
                {carregando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aguarde...
                  </>
                ) : modo === "entrar" ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
                >
                  {modo === "entrar" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
