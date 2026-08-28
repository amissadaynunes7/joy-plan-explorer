import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";

import {
  listServicos,
  createServico,
  updateServico,
  deleteServico,
  criarServicosPadrao,
  type Servico,
} from "@/lib/barbershop.functions";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Barbearia" },
      { name: "description", content: "Serviços, preços e durações da barbearia." },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const qc = useQueryClient();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("30");

  const servicosQ = useQuery({ queryKey: ["servicos"], queryFn: () => listServicos() });
  const servicos = servicosQ.data ?? [];

  const salvarMut = useMutation({
    mutationFn: (input: {
      id?: string | undefined;
      nome: string;
      preco: number;
      duracao_min: number;
      ativo: boolean;
    }) => {
      const { id, ...rest } = input;
      if (id) return updateServico({ data: { id, ...rest } });
      return createServico({ data: rest });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success(editando ? "Serviço atualizado!" : "Serviço criado!");
      setDialogoAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarAtivo = useMutation({
    mutationFn: (s: Servico) =>
      updateServico({
        data: {
          id: s.id,
          nome: s.nome,
          preco: s.preco,
          duracao_min: s.duracao_min,
          ativo: !s.ativo,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => deleteServico({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setPreco("");
    setDuracao("30");
    setDialogoAberto(true);
  };

  const abrirEdicao = (s: Servico) => {
    setEditando(s);
    setNome(s.nome);
    setPreco(String(s.preco));
    setDuracao(String(s.duracao_min));
    setDialogoAberto(true);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !preco) {
      toast.error("Informe nome e valor do serviço.");
      return;
    }
    salvarMut.mutate({
      id: editando?.id,
      nome: nome.trim(),
      preco: Number(preco),
      duracao_min: Number(duracao) || 30,
      ativo: editando?.ativo ?? true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Serviços</h1>
        <Button onClick={abrirNovo} size="sm">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {servicosQ.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      ) : servicos.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum serviço cadastrado. Comece pelos serviços mais comuns de barbearia.
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
              <Sparkles className="h-4 w-4" />
              Criar serviços padrão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {servicos.map((s) => (
            <Card key={s.id} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {brl(s.preco)} · {s.duracao_min} min
                  </p>
                </div>
                <button onClick={() => alternarAtivo.mutate(s)} className="shrink-0">
                  <Badge variant={s.ativo ? "default" : "secondary"}>
                    {s.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  aria-label={`Editar ${s.nome}`}
                  onClick={() => abrirEdicao(s)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  aria-label={`Excluir ${s.nome}`}
                  onClick={() => {
                    if (confirm(`Excluir o serviço ${s.nome}?`)) excluirMut.mutate(s.id);
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
            <DialogTitle>{editando ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeServico">Nome *</Label>
              <Input
                id="nomeServico"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex.: Corte + barba"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="precoServico">Valor (R$) *</Label>
                <Input
                  id="precoServico"
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="5"
                  step="5"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                />
              </div>
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
    </div>
  );
}
