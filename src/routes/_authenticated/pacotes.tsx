import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Ticket } from "lucide-react";

import {
  listPacotes,
  listClientes,
  listServicos,
  createPacote,
  usarSessaoPacote,
  deletePacote,
} from "@/lib/barbershop.functions";
import { brl, formatarData } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/pacotes")({
  head: () => ({
    meta: [
      { title: "Pacotes — Audace Barbearia" },
      { name: "description", content: "Pacotes de sessões vendidos aos clientes da barbearia." },
    ],
  }),
  component: PacotesPage,
});

function PacotesPage() {
  const qc = useQueryClient();
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [nome, setNome] = useState("");
  const [totalSessoes, setTotalSessoes] = useState("10");
  const [preco, setPreco] = useState("");
  const [validoAte, setValidoAte] = useState("");

  const pacotesQ = useQuery({ queryKey: ["pacotes"], queryFn: () => listPacotes() });
  const clientesQ = useQuery({ queryKey: ["clientes"], queryFn: () => listClientes() });
  const servicosQ = useQuery({ queryKey: ["servicos"], queryFn: () => listServicos() });

  const pacotes = pacotesQ.data ?? [];
  const clientes = clientesQ.data ?? [];
  const servicos = servicosQ.data ?? [];

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["pacotes"] });
    qc.invalidateQueries({ queryKey: ["financeiro"] });
  };

  const criarMut = useMutation({
    mutationFn: (input: {
      cliente_id: string;
      servico_id?: string | undefined;
      nome: string;
      total_sessoes: number;
      preco: number;
      valido_ate?: string | undefined;
    }) => createPacote({ data: input }),
    onSuccess: () => {
      invalidar();
      toast.success("Pacote criado e receita registrada!");
      setDialogoAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const usarMut = useMutation({
    mutationFn: (id: string) => usarSessaoPacote({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacotes"] });
      toast.success("Sessão registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => deletePacote({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pacotes"] });
      toast.success("Pacote removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirDialogo = () => {
    setClienteId(clientes[0]?.id ?? "");
    setServicoId("");
    setNome("");
    setTotalSessoes("10");
    setPreco("");
    setValidoAte("");
    setDialogoAberto(true);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !nome.trim() || !preco) {
      toast.error("Informe cliente, nome do pacote e valor.");
      return;
    }
    criarMut.mutate({
      cliente_id: clienteId,
      servico_id: servicoId || undefined,
      nome: nome.trim(),
      total_sessoes: Number(totalSessoes) || 1,
      preco: Number(preco),
      valido_ate: validoAte
        ? new Date(validoAte + "T12:00:00").toISOString()
        : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Pacotes</h1>
        <Button onClick={abrirDialogo} size="sm">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {pacotesQ.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      ) : pacotes.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum pacote vendido. Pacotes são ótimos para fidelizar clientes — e o valor entra
            no caixa automaticamente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pacotes.map((p) => {
            const restantes = p.total_sessoes - p.sessoes_usadas;
            return (
              <Card key={p.id} className="border-border bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.cliente_nome ?? "Cliente"}
                        {p.servico_nome ? ` · ${p.servico_nome}` : ""} · {brl(p.preco)}
                        {p.valido_ate ? ` · Válido até ${formatarData(p.valido_ate)}` : ""}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      aria-label={`Excluir ${p.nome}`}
                      onClick={() => {
                        if (confirm(`Excluir o pacote ${p.nome}?`)) excluirMut.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress
                      value={(p.sessoes_usadas / p.total_sessoes) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.sessoes_usadas}/{p.total_sessoes} sessões
                    </span>
                    <Button
                      size="sm"
                      variant={restantes > 0 ? "outline" : "secondary"}
                      disabled={restantes <= 0}
                      onClick={() => usarMut.mutate(p.id)}
                    >
                      {restantes > 0 ? "Usar sessão" : "Concluído"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo pacote</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do pacote *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex.: Pacote 10 cortes"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={servicoId} onValueChange={setServicoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSessoes">Sessões *</Label>
                <Input
                  id="totalSessoes"
                  type="number"
                  min="1"
                  value={totalSessoes}
                  onChange={(e) => setTotalSessoes(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="precoPacote">Valor (R$) *</Label>
                <Input
                  id="precoPacote"
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valido">Válido até</Label>
                <Input
                  id="valido"
                  type="date"
                  value={validoAte}
                  onChange={(e) => setValidoAte(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarMut.isPending}>
                Criar pacote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
