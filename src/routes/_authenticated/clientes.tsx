import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, History } from "lucide-react";

import {
  listClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  historicoCliente,
  type Cliente,
} from "@/lib/barbershop.functions";
import { formatarDataHora, brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Audace Barbearia" },
      { name: "description", content: "Cadastro e histórico de clientes da barbearia." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [historicoDe, setHistoricoDe] = useState<Cliente | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [obs, setObs] = useState("");

  const clientesQ = useQuery({ queryKey: ["clientes"], queryFn: () => listClientes() });
  const clientes = clientesQ.data ?? [];
  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? "").includes(busca),
  );

  const salvarMut = useMutation({
    mutationFn: (input: {
      id?: string | undefined;
      nome: string;
      telefone?: string | undefined;
      email?: string | undefined;
      observacoes?: string | undefined;
    }) => {
      const { id, ...rest } = input;
      if (id) return updateCliente({ data: { id, ...rest } });
      return createCliente({ data: rest });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(editando ? "Cliente atualizado!" : "Cliente cadastrado!");
      setDialogoAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => deleteCliente({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setTelefone("");
    setEmail("");
    setObs("");
    setDialogoAberto(true);
  };

  const abrirEdicao = (c: Cliente) => {
    setEditando(c);
    setNome(c.nome);
    setTelefone(c.telefone ?? "");
    setEmail(c.email ?? "");
    setObs(c.observacoes ?? "");
    setDialogoAberto(true);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    salvarMut.mutate({
      id: editando?.id,
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      observacoes: obs.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Clientes</h1>
        <Button onClick={abrirNovo} size="sm">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="pl-9"
        />
      </div>

      {clientesQ.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {clientes.length === 0
              ? "Nenhum cliente cadastrado ainda."
              : "Nenhum cliente encontrado com essa busca."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => (
            <Card key={c.id} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{c.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.telefone ?? "Sem telefone"}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={`Histórico de ${c.nome}`}
                  onClick={() => setHistoricoDe(c)}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  aria-label={`Editar ${c.nome}`}
                  onClick={() => abrirEdicao(c)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  aria-label={`Excluir ${c.nome}`}
                  onClick={() => {
                    if (confirm(`Excluir o cliente ${c.nome}?`)) excluirMut.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obsCliente">Observações</Label>
              <Textarea
                id="obsCliente"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Preferências, alergias, etc."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvarMut.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <HistoricoDialog
        cliente={historicoDe}
        onClose={() => setHistoricoDe(null)}
      />
    </div>
  );
}

function HistoricoDialog({
  cliente,
  onClose,
}: {
  cliente: Cliente | null;
  onClose: () => void;
}) {
  const historicoQ = useQuery({
    queryKey: ["historico", cliente?.id],
    queryFn: () => historicoCliente({ data: { cliente_id: cliente!.id } }),
    enabled: !!cliente,
  });
  const itens = historicoQ.data ?? [];

  return (
    <Dialog open={!!cliente} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de {cliente?.nome}</DialogTitle>
        </DialogHeader>
        {historicoQ.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : itens.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum atendimento registrado ainda.
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {itens.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {h.servico_nome ?? "Atendimento"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatarDataHora(h.inicia_em)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant={
                      h.status === "concluido"
                        ? "default"
                        : h.status === "cancelado" || h.status === "faltou"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {h.status === "concluido"
                      ? "Concluído"
                      : h.status === "cancelado"
                        ? "Cancelado"
                        : h.status === "faltou"
                          ? "Faltou"
                          : "Agendado"}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{brl(h.preco)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
