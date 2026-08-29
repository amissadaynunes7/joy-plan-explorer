import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Users,
  Scissors,
  Ticket,
  ShoppingBag,
  Wallet,
  LogOut,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/audace-logo.jpg.asset.json";

const NAV = [
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/servicos", label: "Serviços", icon: Scissors },
  { to: "/pacotes", label: "Pacotes", icon: Ticket },
  { to: "/produtos", label: "Produtos", icon: ShoppingBag },
  { to: "/financeiro", label: "Caixa", icon: Wallet },
];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const sair = async () => {
    await supabase.auth.signOut();
    router.invalidate();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/agenda" className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="Logo da Audace Barbearia"
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-border"
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl tracking-widest text-foreground">
                AUDACE
              </span>
              <span className="text-[10px] font-semibold tracking-[0.3em] text-primary">
                BARBEARIA
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/40 backdrop-blur-xl">
        <div className="mx-auto grid max-w-3xl grid-cols-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }}
              className="flex flex-col items-center gap-0.5 py-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
