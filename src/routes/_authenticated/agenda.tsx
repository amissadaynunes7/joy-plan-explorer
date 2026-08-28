import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Check, XCircle, Trash2 } from "lucide-react";

import {
  listAgendamentos,
  listClientes,
  listServicos,
  createAgendamento,
  concluirAgendamento,
  updateStatusAgendamento,
  deleteAgendamento,
  criarServicosPadrao,
} from "@/lib/barbershop.functions";
import { hojeISO, formatarData, formatarHora, brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Barbearia" },
      { name: "description", content: "Agenda diária de agendamentos da barbearia." },
    ],
  }),
  component: AgendaPage,
});

function mudarDia(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function AgendaPage() {
  const qc = useQueryClient();
  const [dia, setDia] = useState(() => hojeISO());
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [quando, setQuando] = useState(() => `${hojeISO()}T09:00`);
  const [preco, setPreco] = useState("");
  const [obs, setObs] = useState("");

  const servicosQ = useQuery({ queryKey: ["servicos"], queryFn: () => listServicos() });
  const clientesQ = useQuery({ queryKey: ["clientes"], queryFn: () => listClientes() });
  const agendamentosQ = useQuery({
    queryKey: ["agendamentos", dia],
    queryFn: () =>
      listAgendamentos({ data: { de: `${dia}T00:00:00`, ate: `${dia}T23:59:59` } }),
  });

  const servicos = servicosQ.data ?? [];
  const clientes = clientesQ.data ?? [];
  const agendamentos = useMemo(
    () => (agendamentosQ.data ?? []).slice().sort((a, b) => a.inicia_em.localeCompare(b.inicia_em)),
    [agendamentosQ.data],
  );

  const agendados = agendamentos.filter((a) => a.status !== "cancelado");
  const totalDia = agendados.reduce((s, a) => s + a.preco, 0);
  const recebido = agendamentos
    .filter((a) => a.status === "concluido")
    .reduce((s, a) => s + a.preco, 0);

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["agendamentos"] });
    qc.invalidateQueries({ queryKey: ["financeiro"] });
    qc.invalidateQueries({ queryKey: ["pacotes"] });
  };

  const criarMut = useMutation({
    mutationFn: (input: {
      cliente_id: string;
      servico_id: string;
      inicia_em: string;
      preco: number;
      observacoes?: string;
    }) => createAgendamento({ data: input }),
    onSuccess: () => {
      invalidar();
      toast.success("Agendamento criado!");
      setDialogoAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const concluirMut = useMutation({
    mutationFn: (input: { id: string; receber: boolean }) =>
      concluirAgendamento({ data: input }),
    onSuccess: () => {
      invalidar();
      toast.success("Atendimento concluído e receita registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (input: { id: string; status: "cancelado" | "faltou" }) =>
      updateStatusAgendamento({ data: input }),
    onSuccess: () => invalidar(),
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => deleteAgendamento({ data: { id } }),
    onSuccess: () => {
      invalidar();
      toast.success("Agendamento removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirDialogo = () => {
    setClienteId(clientes[0]?.id ?? "");
    setServicoId("");
    setPreco("");
    setObs("");
    setQuando(`${dia}T09:00`);
    setDialogoAberto(true);
  };

  const escolherServico = (id: string) => {
    setServicoId(id);
    const s = servicos.find((x) => x.id === id);
    if (s) setPreco(String(s.preco));
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !servicoId || !quando || !preco) {
      toast.error("Preencha cliente, serviço, horário e valor.");
      return;
    }
    setEnviando(true);
    criarMut.mutate(
      {
        cliente_id: clienteId,
        servico_id: servicoId,
        inicia_em: new Date(quando).toISOString(),
        preco: Number(preco),
        observacoes: obs.trim() ? obs.trim() : undefined,
      },
      { onSettled: () => setEnviando(false) },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Agenda</h1>
        <Button onClick={abrirDialogo} size="sm">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDia(mudarDia(dia, -1))}
          aria-label="Dia anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">{formatarData(dia)}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDia(mudarDia(dia, 1))}
          aria-label="Próximo dia"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Agendados</p>
            <p className="font-display text-2xl text-foreground">{agendados.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Previsto</p>
            <p className="font-display text-xl text-foreground">{brl(totalDia)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="font-display text-xl text-success">{brl(recebido)}</p>
          </CardContent>
        </Card>
      </div>

      {agendamentosQ.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando agenda...</p>
      ) : agendamentos.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
            <Button onClick={abrirDialogo} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
              Agendar horário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {agendamentos.map((a) => (
            <Card key={a.id} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="w-14 shrink-0 text-center">
                  <p className="font-display text-xl text-foreground">
                    {formatarHora(a.inicia_em)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {a.cliente_nome ?? "Cliente"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.servico_nome ?? "Serviço"} · {brl(a.preco)}
                  </p>
                </div>
                <Badge
                  variant={
                    a.status === "concluido"
                      ? "default"
                      : a.status === "cancelado" || a.status === "faltou"
                        ? "destructive"
                        : "secondary"
                  }
                  className="shrink-0"
                >
                  {a.status === "concluido"
                    ? "Concluído"
                    : a.status === "cancelado"
                      ? "Cancelado"
                      : a.status === "faltou"
                        ? "Faltou"
                        : "Agendado"}
                </Badge>
                <div className="flex shrink-0 gap-1">
                  {a.status === "agendado" && (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        aria-label="Concluir e receber"
                        onClick={() => concluirMut.mutate({ id: a.id, receber: true })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        aria-label="Marcar falta"
                        onClick={() => statusMut.mutate({ id: a.id, status: "faltou" })}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="Excluir"
                    onClick={() => {
                      if (confirm("Excluir este agendamento?")) excluirMut.mutate(a.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {servicos.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Cadastre seus serviços para começar a agendar.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await criarServicosPadrao();
                  qc.invalidateQueries({ queryKey: ["servicos"] });
                  toast.success("Serviços padrão criados!");
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Criar serviços padrão
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
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
              {clientes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Cadastre clientes na aba Clientes.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={servicoId} onValueChange={escolherServico}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} · {brl(s.preco)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quando">Data e hora</Label>
                <Input
                  id="quando"
                  type="datetime-local"
                  value={quando}
                  onChange={(e) => setQuando(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco">Valor (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Opcional"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
