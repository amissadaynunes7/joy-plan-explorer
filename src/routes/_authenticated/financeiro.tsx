import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";

import {
  listLancamentos,
  createLancamento,
  deleteLancamento,
} from "@/lib/barbershop.functions";
import {
  brl,
  mesAtual,
  mesRange,
  formatarData,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
  labelCategoria,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Barbearia" },
      { name: "description", content: "Receitas, despesas e saldo do mês da barbearia." },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const qc = useQueryClient();
  const [mes, setMes] = useState(() => mesAtual());
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
  const [categoria, setCategoria] = useState<string>("servicos");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => mesAtual() + "-01");

  const lancamentosQ = useQuery({
    queryKey: ["financeiro", mes],
    queryFn: () => listLancamentos({ data: mesRange(mes) }),
  });

  const lancamentos = lancamentosQ.data ?? [];
  const receitas = useMemo(
    () => lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0),
    [lancamentos],
  );
  const despesas = useMemo(
    () => lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0),
    [lancamentos],
  );
  const saldo = receitas - despesas;

  const criarMut = useMutation({
    mutationFn: (input: {
      tipo: string;
      categoria: string;
      descricao: string;
      valor: number;
      ocorrido_em?: string | undefined;
    }) => createLancamento({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Lançamento registrado!");
      setDialogoAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => deleteLancamento({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Lançamento removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirDialogo = () => {
    setTipo("receita");
    setCategoria("servicos");
    setDescricao("");
    setValor("");
    setData(new Date().toISOString().slice(0, 10));
    setDialogoAberto(true);
  };

  const mudarTipo = (t: string) => {
    setTipo(t as "receita" | "despesa");
    setCategoria(t === "receita" ? "servicos" : "aluguel");
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !valor) {
      toast.error("Informe a descrição e o valor.");
      return;
    }
    criarMut.mutate({
      tipo,
      categoria,
      descricao: descricao.trim(),
      valor: Number(valor),
      ocorrido_em: new Date(data + "T12:00:00").toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Financeiro</h1>
        <Button onClick={abrirDialogo} size="sm">
          <Plus className="h-4 w-4" />
          Lançamento
        </Button>
      </div>

      <Input
        type="month"
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        className="w-44"
      />

      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-4 w-4 text-success" />
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="font-display text-xl text-success">{brl(receitas)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <TrendingDown className="mx-auto mb-1 h-4 w-4 text-destructive" />
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="font-display text-xl text-destructive">{brl(despesas)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-3 text-center">
            <Wallet className="mx-auto mb-1 h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p
              className={`font-display text-xl ${saldo >= 0 ? "text-foreground" : "text-destructive"}`}
            >
              {brl(saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {lancamentosQ.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      ) : lancamentos.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento neste mês. As receitas de atendimentos, vendas de produtos e
            pacotes aparecem aqui automaticamente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lancamentos.map((l) => (
            <Card key={l.id} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    l.tipo === "receita"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {l.tipo === "receita" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{l.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {labelCategoria(l.categoria)} · {formatarData(l.ocorrido_em)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    l.tipo === "receita" ? "text-success" : "text-destructive"
                  }`}
                >
                  {l.tipo === "receita" ? "+" : "−"}
                  {brl(l.valor)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  aria-label="Excluir lançamento"
                  onClick={() => {
                    if (confirm("Excluir este lançamento?")) excluirMut.mutate(l.id);
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
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={mudarTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => (
                      <SelectItem key={c} value={c}>
                        {labelCategoria(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                placeholder="Ex.: Aluguel de junho"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="valorLanc">Valor (R$) *</Label>
                <Input
                  id="valorLanc"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataLanc">Data</Label>
                <Input
                  id="dataLanc"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarMut.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
