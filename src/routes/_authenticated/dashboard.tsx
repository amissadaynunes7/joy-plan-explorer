import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Scissors,
  Clock,
  Package,
  Ticket,
  CalendarCheck,
  AlertTriangle,
  Target,
} from "lucide-react";

import { metricasDashboard, type Metricas } from "@/lib/metrics.functions";
import { brl, mesAtual, labelCategoria } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel de Métricas — Audace Barbearia" },
      {
        name: "description",
        content:
          "Indicadores da Audace Barbearia: faturamento, lucro, ticket médio, top serviços, clientes e ocupação.",
      },
      { property: "og:title", content: "Painel de Métricas — Audace Barbearia" },
      {
        property: "og:description",
        content: "Todos os números da barbearia em um só painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Variacao({ valor }: { valor: number }) {
  const positivo = valor >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        positivo ? "text-success" : "text-destructive"
      }`}
    >
      {positivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct(valor)}
    </span>
  );
}

function Kpi({
  titulo,
  valor,
  sub,
  icon: Icon,
  destaque,
}: {
  titulo: string;
  valor: string;
  sub?: React.ReactNode;
  icon: React.ElementType;
  destaque?: boolean;
}) {
  return (
    <Card className={destaque ? "border-primary/40" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="mt-2 text-xl font-bold tracking-tight text-foreground">{valor}</p>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Barras({
  itens,
}: {
  itens: { rotulo: string; principal: string; valor: number }[];
}) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <div className="space-y-3">
      {itens.map((i) => (
        <div key={i.rotulo} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-foreground">{i.rotulo}</span>
            <span className="font-semibold text-muted-foreground">{i.principal}</span>
          </div>
          <Progress value={(i.valor / max) * 100} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const [mes, setMes] = useState(() => mesAtual());

  const { data, isPending, error } = useQuery({
    queryKey: ["metricas", mes],
    queryFn: () => metricasDashboard({ data: { mes } }) as Promise<Metricas>,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-foreground">PAINEL</h1>
          <p className="text-sm text-muted-foreground">Todos os números da barbearia</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mes-metricas" className="text-xs">
            Mês
          </Label>
          <Input
            id="mes-metricas"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value || mesAtual())}
            className="w-40"
          />
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-24 animate-pulse p-4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar as métricas. Tente novamente.
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <Secao titulo="Resultado do mês">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi
                titulo="Faturamento"
                valor={brl(data.receita)}
                icon={TrendingUp}
                destaque
                sub={
                  <>
                    <Variacao valor={data.variacaoReceita} /> vs mês anterior (
                    {brl(data.receitaMesAnterior)})
                  </>
                }
              />
              <Kpi
                titulo="Despesas"
                valor={brl(data.despesa)}
                icon={TrendingDown}
                sub={`Mês anterior: ${brl(data.despesaMesAnterior)}`}
              />
              <Kpi
                titulo="Lucro"
                valor={brl(data.lucro)}
                icon={Wallet}
                destaque
                sub={
                  <>
                    Margem {data.margem.toFixed(1)}% · <Variacao valor={data.variacaoLucro} />
                  </>
                }
              />
              <Kpi
                titulo="Ticket médio"
                valor={brl(data.ticketMedio)}
                icon={Target}
                sub={`Antes: ${brl(data.ticketMedioMesAnterior)}`}
              />
              <Kpi titulo="Recebido hoje" valor={brl(data.receitaHoje)} icon={Wallet} />
              <Kpi titulo="Últimos 7 dias" valor={brl(data.receitaSemana)} icon={Wallet} />
              <Kpi
                titulo="Média por dia ativo"
                valor={brl(data.mediaDiaria)}
                icon={Wallet}
                sub={`${data.diasAtivos} dia(s) com faturamento`}
              />
              <Kpi
                titulo="Faturamento no ano"
                valor={brl(data.receitaAno)}
                icon={TrendingUp}
                sub={
                  data.melhorDia
                    ? `Melhor dia: ${data.melhorDia.dia.split("-").reverse().join("/")} (${brl(
                        data.melhorDia.valor,
                      )})`
                    : undefined
                }
              />
            </div>
          </Secao>

          <Secao titulo="Atendimentos">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi
                titulo="Total no mês"
                valor={String(data.atendimentos)}
                icon={CalendarCheck}
                sub={`${data.agendados} ainda agendado(s)`}
              />
              <Kpi
                titulo="Concluídos"
                valor={String(data.concluidos)}
                icon={Scissors}
                sub={`Taxa de conclusão ${data.taxaConclusao.toFixed(0)}%`}
              />
              <Kpi
                titulo="Faltas"
                valor={String(data.faltas)}
                icon={AlertTriangle}
                sub={`${data.taxaFalta.toFixed(0)}% dos horários`}
              />
              <Kpi
                titulo="Cancelamentos"
                valor={String(data.cancelados)}
                icon={AlertTriangle}
                sub={`${data.taxaCancelamento.toFixed(0)}% dos horários`}
              />
              <Kpi
                titulo="Previsto no mês"
                valor={brl(data.receitaPrevista)}
                icon={Target}
                sub="Concluídos + agendados"
              />
              <Kpi
                titulo="A receber"
                valor={brl(data.aReceber)}
                icon={Wallet}
                sub="Atendimentos não pagos"
              />
              <Kpi
                titulo="Horas na cadeira"
                valor={`${Math.floor(data.ocupacaoMinutos / 60)}h ${data.ocupacaoMinutos % 60}min`}
                icon={Clock}
                sub="Somando serviços concluídos"
              />
              <Kpi
                titulo="Receita por hora"
                valor={brl(
                  data.ocupacaoMinutos > 0 ? data.receita / (data.ocupacaoMinutos / 60) : 0,
                )}
                icon={Target}
              />
            </div>
          </Secao>

          <Secao titulo="Clientes">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi titulo="Atendidos no mês" valor={String(data.clientesAtendidos)} icon={Users} />
              <Kpi titulo="Novos" valor={String(data.clientesNovos)} icon={Users} />
              <Kpi
                titulo="Recorrentes"
                valor={String(data.clientesRecorrentes)}
                icon={Users}
                sub={`Taxa de retorno ${data.taxaRetorno.toFixed(0)}%`}
              />
              <Kpi
                titulo="Cadastro total"
                valor={String(data.totalClientes)}
                icon={Users}
                sub={`${data.clientesInativos} sem vir há 60 dias`}
              />
            </div>
          </Secao>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-foreground">Top serviços</h3>
                {data.topServicos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem atendimentos concluídos.</p>
                ) : (
                  <Barras
                    itens={data.topServicos.map((s) => ({
                      rotulo: `${s.nome} · ${s.quantidade}x`,
                      principal: brl(s.valor),
                      valor: s.valor,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-foreground">Clientes que mais gastam</h3>
                {data.topClientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados no período.</p>
                ) : (
                  <Barras
                    itens={data.topClientes.map((c) => ({
                      rotulo: `${c.nome} · ${c.quantidade}x`,
                      principal: brl(c.valor),
                      valor: c.valor,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-foreground">Receita por categoria</h3>
                {data.receitaPorCategoria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma receita registrada.</p>
                ) : (
                  <Barras
                    itens={data.receitaPorCategoria.map((c) => ({
                      rotulo: labelCategoria(c.categoria),
                      principal: `${brl(c.valor)} · ${((c.valor / (data.receita || 1)) * 100).toFixed(0)}%`,
                      valor: c.valor,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-foreground">Despesas por categoria</h3>
                {data.despesaPorCategoria.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
                ) : (
                  <Barras
                    itens={data.despesaPorCategoria.map((c) => ({
                      rotulo: labelCategoria(c.categoria),
                      principal: `${brl(c.valor)} · ${((c.valor / (data.despesa || 1)) * 100).toFixed(0)}%`,
                      valor: c.valor,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-foreground">Horários de pico</h3>
                {data.horasPico.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem agendamentos no mês.</p>
                ) : (
                  <Barras
                    itens={data.horasPico.map((h) => ({
                      rotulo: `${String(h.hora).padStart(2, "0")}:00`,
                      principal: `${h.quantidade} atend.`,
                      valor: h.quantidade,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-bold text-foreground">Dias da semana</h3>
                {data.diasSemana.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem agendamentos no mês.</p>
                ) : (
                  <Barras
                    itens={data.diasSemana.map((d) => ({
                      rotulo: DIAS[d.dia] ?? "—",
                      principal: `${d.quantidade}x · ${brl(d.valor)}`,
                      valor: d.valor,
                    }))}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Secao titulo="Evolução diária">
            <Card>
              <CardContent className="p-4">
                {data.serie.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem movimento neste mês.</p>
                ) : (
                  <div className="flex h-40 items-end gap-1 overflow-x-auto">
                    {data.serie.map((d) => {
                      const max = Math.max(...data.serie.map((x) => Math.max(x.receita, x.despesa)), 1);
                      return (
                        <div key={d.dia} className="flex min-w-6 flex-1 flex-col items-center gap-1">
                          <div className="flex h-32 w-full items-end justify-center gap-0.5">
                            <div
                              className="w-1/2 rounded-t bg-primary/70"
                              style={{ height: `${(d.receita / max) * 100}%` }}
                              title={`Receita ${brl(d.receita)}`}
                            />
                            <div
                              className="w-1/2 rounded-t bg-destructive/60"
                              style={{ height: `${(d.despesa / max) * 100}%` }}
                              title={`Despesa ${brl(d.despesa)}`}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {d.dia.slice(8)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/70" /> Receita
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-destructive/60" /> Despesa
                  </span>
                </div>
              </CardContent>
            </Card>
          </Secao>

          <Secao titulo="Estoque e pacotes">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi
                titulo="Valor em estoque"
                valor={brl(data.valorEstoque)}
                icon={Package}
                sub="Pelo preço de custo"
              />
              <Kpi
                titulo="Lucro potencial"
                valor={brl(data.lucroPotencialEstoque)}
                icon={Package}
                sub="Se vender todo o estoque"
              />
              <Kpi
                titulo="Pacotes ativos"
                valor={String(data.pacotesAtivos)}
                icon={Ticket}
                sub={`${data.sessoesRestantes} sessão(ões) a usar`}
              />
              <Kpi
                titulo="Pacotes vendidos no mês"
                valor={brl(data.receitaPacotes)}
                icon={Ticket}
              />
            </div>
            {data.produtosEstoqueBaixo.length > 0 ? (
              <Card className="border-destructive/40">
                <CardContent className="space-y-2 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Repor estoque
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.produtosEstoqueBaixo.map((p) => (
                      <Badge key={p.nome} variant="outline">
                        {p.nome}: {p.estoque}/{p.estoque_minimo}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </Secao>
        </>
      ) : null}
    </div>
  );
}
