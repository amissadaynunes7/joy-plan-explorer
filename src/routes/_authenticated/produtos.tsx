import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle, ShoppingCart, PackagePlus } from "lucide-react";

import {
  listProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  venderProduto,
  reabastecerProduto,
  type Produto,
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

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Audace Barbearia" },
      { name: "description", content: "Estoque, vendas e reposição de produtos da barbearia." },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const qc = useQueryClient();
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [vendaDe, setVendaDe] = useState<Produto | null>(null);
  const [repoDe, setRepoDe] = useState<Produto | null>(null);

  const [nome, setNome] = useState("");
  const [custo, setCusto] = useState("");
  const [venda, setVenda] = useState("");
  const [estoque, setEstoque] = useState("0");
  const [minimo, setMinimo] = useState("0");
  const [qtdVenda, setQtdVenda] = useState("1");
  const [qtdRepo, setQtdRepo] = useState("1");
  const [registrarCusto, setRegistrarCusto] = useState(true);

  const produtosQ = useQuery({ queryKey: ["produtos"], queryFn: () => listProdutos() });
  const produtos = produtosQ.data ?? [];
  const baixos = produtos.filter((p) => p.estoque <= p.estoque_minimo);

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["produtos"] });
    qc.invalidateQueries({ queryKey: ["financeiro"] });
  };

  const salvarMut = useMutation({
    mutationFn: (input: {
      id?: string | undefined;
      nome: string;
      preco_custo: number;
      preco_venda: number;
      estoque: number;
      estoque_minimo: number;
    }) => {
      const { id, ...rest } = input;
      if (id) return updateProduto({ data: { id, ...rest } });
      return createProduto({ data: rest });
    },
    onSuccess: () => {
      invalidar();
      toast.success(editando ? "Produto atualizado!" : "Produto cadastrado!");
      setDialogoAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirMut = useMutation({
    mutationFn: (id: string) => deleteProduto({ data: { id } }),
    onSuccess: () => {
      invalidar();
      toast.success("Produto removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const venderMut = useMutation({
    mutationFn: (input: { id: string; quantidade: number }) =>
      venderProduto({ data: input }),
    onSuccess: () => {
      invalidar();
      toast.success("Venda registrada e receita lançada!");
      setVendaDe(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const repoMut = useMutation({
    mutationFn: (input: { id: string; quantidade: number; registrarCusto: boolean }) =>
      reabastecerProduto({ data: input }),
    onSuccess: () => {
      invalidar();
      toast.success("Estoque atualizado!");
      setRepoDe(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setCusto("");
    setVenda("");
    setEstoque("0");
    setMinimo("0");
    setDialogoAberto(true);
  };

  const abrirEdicao = (p: Produto) => {
    setEditando(p);
    setNome(p.nome);
    setCusto(String(p.preco_custo));
    setVenda(String(p.preco_venda));
    setEstoque(String(p.estoque));
    setMinimo(String(p.estoque_minimo));
    setDialogoAberto(true);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || venda === "") {
      toast.error("Informe o nome e o preço de venda.");
      return;
    }
    salvarMut.mutate({
      id: editando?.id,
      nome: nome.trim(),
      preco_custo: Number(custo) || 0,
      preco_venda: Number(venda),
      estoque: Number(estoque) || 0,
      estoque_minimo: Number(minimo) || 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Produtos</h1>
        <Button onClick={abrirNovo} size="sm">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {baixos.length > 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="flex items-center gap-2 p-3 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Estoque baixo: {baixos.map((p) => p.nome).join(", ")}
          </CardContent>
        </Card>
      )}

      {produtosQ.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando...</p>
      ) : produtos.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum produto cadastrado. Cadastre pomadas, shampoos e outros itens que você vende.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {produtos.map((p) => (
            <Card key={p.id} className="border-border bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Venda: {brl(p.preco_venda)}
                      {p.preco_custo > 0 ? ` · Custo: ${brl(p.preco_custo)}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={p.estoque <= p.estoque_minimo ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {p.estoque} em estoque
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setVendaDe(p);
                      setQtdVenda("1");
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Vender
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setRepoDe(p);
                      setQtdRepo("1");
                      setRegistrarCusto(true);
                    }}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Repor
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label={`Editar ${p.nome}`}
                    onClick={() => abrirEdicao(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label={`Excluir ${p.nome}`}
                    onClick={() => {
                      if (confirm(`Excluir o produto ${p.nome}?`)) excluirMut.mutate(p.id);
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

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeProduto">Nome *</Label>
              <Input
                id="nomeProduto"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex.: Pomada modeladora"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="custo">Preço de custo (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venda">Preço de venda (R$) *</Label>
                <Input
                  id="venda"
                  type="number"
                  min="0"
                  step="0.01"
                  value={venda}
                  onChange={(e) => setVenda(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estoque">Estoque atual</Label>
                <Input
                  id="estoque"
                  type="number"
                  min="0"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimo">Estoque mínimo</Label>
                <Input
                  id="minimo"
                  type="number"
                  min="0"
                  value={minimo}
                  onChange={(e) => setMinimo(e.target.value)}
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

      <Dialog open={!!vendaDe} onOpenChange={(open) => !open && setVendaDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vender {vendaDe?.nome}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!vendaDe) return;
              venderMut.mutate({ id: vendaDe.id, quantidade: Number(qtdVenda) || 1 });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="qtdVenda">Quantidade</Label>
              <Input
                id="qtdVenda"
                type="number"
                min="1"
                max={vendaDe?.estoque ?? 1}
                value={qtdVenda}
                onChange={(e) => setQtdVenda(e.target.value)}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Total: {brl((vendaDe?.preco_venda ?? 0) * (Number(qtdVenda) || 0))} — será
              registrado como receita automaticamente.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVendaDe(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={venderMut.isPending}>
                Confirmar venda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!repoDe} onOpenChange={(open) => !open && setRepoDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repor {repoDe?.nome}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!repoDe) return;
              repoMut.mutate({
                id: repoDe.id,
                quantidade: Number(qtdRepo) || 1,
                registrarCusto,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="qtdRepo">Quantidade</Label>
              <Input
                id="qtdRepo"
                type="number"
                min="1"
                value={qtdRepo}
                onChange={(e) => setQtdRepo(e.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={registrarCusto}
                onChange={(e) => setRegistrarCusto(e.target.checked)}
                className="h-4 w-4"
              />
              Registrar custo como despesa ({brl((repoDe?.preco_custo ?? 0) * (Number(qtdRepo) || 0))})
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRepoDe(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={repoMut.isPending}>
                Confirmar reposição
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
