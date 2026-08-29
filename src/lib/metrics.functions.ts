import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SerieDia = { dia: string; receita: number; despesa: number; atendimentos: number };
export type ItemRanking = { nome: string; quantidade: number; valor: number };
export type ItemCategoria = { categoria: string; valor: number };
export type HoraPico = { hora: number; quantidade: number };

export type Metricas = {
  mes: string;
  receita: number;
  despesa: number;
  lucro: number;
  margem: number;
  receitaMesAnterior: number;
  despesaMesAnterior: number;
  lucroMesAnterior: number;
  variacaoReceita: number;
  variacaoLucro: number;
  receitaHoje: number;
  receitaSemana: number;
  receitaAno: number;
  atendimentos: number;
  concluidos: number;
  cancelados: number;
  faltas: number;
  agendados: number;
  taxaConclusao: number;
  taxaFalta: number;
  taxaCancelamento: number;
  ticketMedio: number;
  ticketMedioMesAnterior: number;
  receitaPrevista: number;
  aReceber: number;
  mediaDiaria: number;
  melhorDia: { dia: string; valor: number } | null;
  diasAtivos: number;
  clientesAtendidos: number;
  clientesNovos: number;
  clientesRecorrentes: number;
  taxaRetorno: number;
  totalClientes: number;
  clientesInativos: number;
  serie: SerieDia[];
  topServicos: ItemRanking[];
  topClientes: ItemRanking[];
  receitaPorCategoria: ItemCategoria[];
  despesaPorCategoria: ItemCategoria[];
  horasPico: HoraPico[];
  diasSemana: { dia: number; quantidade: number; valor: number }[];
  produtosEstoqueBaixo: { nome: string; estoque: number; estoque_minimo: number }[];
  valorEstoque: number;
  lucroPotencialEstoque: number;
  pacotesAtivos: number;
  sessoesRestantes: number;
  receitaPacotes: number;
  ocupacaoMinutos: number;
};

const range = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  const ano = a || 2026;
  const mesNum = m || 1;
  const de = new Date(Date.UTC(ano, mesNum - 1, 1));
  const ate = new Date(Date.UTC(ano, mesNum, 0, 23, 59, 59, 999));
  return { de: de.toISOString(), ate: ate.toISOString(), ano, mesNum };
};

const mesAnteriorDe = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  const ano = a || 2026;
  const mesNum = m || 1;
  const d = new Date(Date.UTC(ano, mesNum - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const soma = (arr: { valor: number }[]) => arr.reduce((s, r) => s + (Number(r.valor) || 0), 0);
const pct = (atual: number, anterior: number) =>
  anterior > 0 ? ((atual - anterior) / anterior) * 100 : atual > 0 ? 100 : 0;

export const metricasDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mes: string }) =>
    z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<Metricas> => {
    const { supabase, userId } = context;
    const { de, ate, ano } = range(data.mes);
    const anterior = range(mesAnteriorDe(data.mes));
    const inicioAno = new Date(Date.UTC(ano, 0, 1)).toISOString();
    const fimAno = new Date(Date.UTC(ano, 11, 31, 23, 59, 59, 999)).toISOString();

    const [lanc, lancAnt, lancAno, ags, agsAnt, clientes, produtos, pacotes, servicos] =
      await Promise.all([
        supabase
          .from("lancamentos")
          .select("tipo, categoria, valor, ocorrido_em")
          .eq("user_id", userId)
          .gte("ocorrido_em", de)
          .lte("ocorrido_em", ate),
        supabase
          .from("lancamentos")
          .select("tipo, valor")
          .eq("user_id", userId)
          .gte("ocorrido_em", anterior.de)
          .lte("ocorrido_em", anterior.ate),
        supabase
          .from("lancamentos")
          .select("tipo, valor")
          .eq("user_id", userId)
          .gte("ocorrido_em", inicioAno)
          .lte("ocorrido_em", fimAno),
        supabase
          .from("agendamentos")
          .select("id, cliente_id, inicia_em, status, preco, pago, servicos(nome, duracao_min), clientes(nome)")
          .eq("user_id", userId)
          .gte("inicia_em", de)
          .lte("inicia_em", ate),
        supabase
          .from("agendamentos")
          .select("preco, status")
          .eq("user_id", userId)
          .gte("inicia_em", anterior.de)
          .lte("inicia_em", anterior.ate),
        supabase.from("clientes").select("id, created_at").eq("user_id", userId),
        supabase
          .from("produtos")
          .select("nome, estoque, estoque_minimo, preco_custo, preco_venda")
          .eq("user_id", userId),
        supabase
          .from("pacotes")
          .select("total_sessoes, sessoes_usadas, preco, created_at")
          .eq("user_id", userId),
        supabase.from("servicos").select("id").eq("user_id", userId),
      ]);

    const erro =
      lanc.error || lancAnt.error || lancAno.error || ags.error || agsAnt.error ||
      clientes.error || produtos.error || pacotes.error || servicos.error;
    if (erro) throw erro;

    type L = { tipo: string; categoria: string; valor: number; ocorrido_em: string };
    const ls = (lanc.data ?? []) as L[];
    const receitas = ls.filter((l) => l.tipo === "receita");
    const despesas = ls.filter((l) => l.tipo === "despesa");
    const receita = soma(receitas);
    const despesa = soma(despesas);
    const lucro = receita - despesa;

    const lsAnt = (lancAnt.data ?? []) as { tipo: string; valor: number }[];
    const receitaMesAnterior = soma(lsAnt.filter((l) => l.tipo === "receita"));
    const despesaMesAnterior = soma(lsAnt.filter((l) => l.tipo === "despesa"));

    const lsAno = (lancAno.data ?? []) as { tipo: string; valor: number }[];
    const receitaAno = soma(lsAno.filter((l) => l.tipo === "receita"));

    const hoje = new Date();
    const hojeStr = hoje.toISOString().slice(0, 10);
    const seteDias = new Date(hoje.getTime() - 6 * 86400000).toISOString().slice(0, 10);
    const receitaHoje = soma(receitas.filter((l) => l.ocorrido_em.slice(0, 10) === hojeStr));
    const receitaSemana = soma(receitas.filter((l) => l.ocorrido_em.slice(0, 10) >= seteDias));

    type A = {
      id: string;
      cliente_id: string | null;
      inicia_em: string;
      status: string;
      preco: number;
      pago: boolean;
      servicos: { nome: string; duracao_min: number } | null;
      clientes: { nome: string } | null;
    };
    const as_ = (ags.data ?? []) as unknown as A[];
    const concluidosArr = as_.filter((a) => a.status === "concluido");
    const concluidos = concluidosArr.length;
    const cancelados = as_.filter((a) => a.status === "cancelado").length;
    const faltas = as_.filter((a) => a.status === "faltou").length;
    const agendados = as_.filter((a) => a.status === "agendado").length;
    const atendimentos = as_.length;

    const valorConcluidos = concluidosArr.reduce((s, a) => s + (Number(a.preco) || 0), 0);
    const ticketMedio = concluidos > 0 ? valorConcluidos / concluidos : 0;

    const antArr = (agsAnt.data ?? []) as { preco: number; status: string }[];
    const antConcl = antArr.filter((a) => a.status === "concluido");
    const ticketMedioMesAnterior =
      antConcl.length > 0
        ? antConcl.reduce((s, a) => s + (Number(a.preco) || 0), 0) / antConcl.length
        : 0;

    const receitaPrevista = as_
      .filter((a) => a.status === "agendado" || a.status === "concluido")
      .reduce((s, a) => s + (Number(a.preco) || 0), 0);
    const aReceber = as_
      .filter((a) => !a.pago && a.status !== "cancelado")
      .reduce((s, a) => s + (Number(a.preco) || 0), 0);

    // Série diária
    const mapaDia = new Map<string, SerieDia>();
    const garante = (dia: string) => {
      let item = mapaDia.get(dia);
      if (!item) {
        item = { dia, receita: 0, despesa: 0, atendimentos: 0 };
        mapaDia.set(dia, item);
      }
      return item;
    };
    for (const l of ls) {
      const item = garante(l.ocorrido_em.slice(0, 10));
      if (l.tipo === "receita") item.receita += Number(l.valor) || 0;
      else item.despesa += Number(l.valor) || 0;
    }
    for (const a of as_) garante(a.inicia_em.slice(0, 10)).atendimentos += 1;
    const serie = [...mapaDia.values()].sort((x, y) => x.dia.localeCompare(y.dia));

    const diasComReceita = serie.filter((d) => d.receita > 0);
    const melhor = diasComReceita.reduce<{ dia: string; valor: number } | null>(
      (best, d) => (!best || d.receita > best.valor ? { dia: d.dia, valor: d.receita } : best),
      null,
    );

    // Rankings
    const rank = (chave: (a: A) => string | null) => {
      const m = new Map<string, ItemRanking>();
      for (const a of concluidosArr) {
        const nome = chave(a);
        if (!nome) continue;
        const item = m.get(nome) ?? { nome, quantidade: 0, valor: 0 };
        item.quantidade += 1;
        item.valor += Number(a.preco) || 0;
        m.set(nome, item);
      }
      return [...m.values()].sort((x, y) => y.valor - x.valor).slice(0, 5);
    };
    const topServicos = rank((a) => a.servicos?.nome ?? null);
    const topClientes = rank((a) => a.clientes?.nome ?? null);

    const porCategoria = (arr: L[]) => {
      const m = new Map<string, number>();
      for (const l of arr) m.set(l.categoria, (m.get(l.categoria) ?? 0) + (Number(l.valor) || 0));
      return [...m.entries()]
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((x, y) => y.valor - x.valor);
    };

    // Horários e dias da semana
    const mapaHora = new Map<number, number>();
    const mapaSemana = new Map<number, { dia: number; quantidade: number; valor: number }>();
    for (const a of as_) {
      const d = new Date(a.inicia_em);
      const h = d.getHours();
      mapaHora.set(h, (mapaHora.get(h) ?? 0) + 1);
      const dow = d.getDay();
      const item = mapaSemana.get(dow) ?? { dia: dow, quantidade: 0, valor: 0 };
      item.quantidade += 1;
      item.valor += Number(a.preco) || 0;
      mapaSemana.set(dow, item);
    }

    const ocupacaoMinutos = concluidosArr.reduce(
      (s, a) => s + (a.servicos?.duracao_min ?? 30),
      0,
    );

    // Clientes
    const cls = (clientes.data ?? []) as { id: string; created_at: string }[];
    const idsAtendidos = new Set(
      as_.filter((a) => a.status === "concluido" && a.cliente_id).map((a) => a.cliente_id!),
    );
    const novos = cls.filter((c) => c.created_at >= de && c.created_at <= ate).length;
    const clientesNovos = cls.filter(
      (c) => idsAtendidos.has(c.id) && c.created_at >= de && c.created_at <= ate,
    ).length;
    const contagem = new Map<string, number>();
    for (const a of concluidosArr) {
      if (a.cliente_id) contagem.set(a.cliente_id, (contagem.get(a.cliente_id) ?? 0) + 1);
    }
    const clientesRecorrentes = [...contagem.values()].filter((n) => n > 1).length;

    const { data: ultimos } = await supabase
      .from("agendamentos")
      .select("cliente_id")
      .eq("user_id", userId)
      .eq("status", "concluido")
      .gte("inicia_em", new Date(hoje.getTime() - 60 * 86400000).toISOString());
    const ativos = new Set(
      ((ultimos ?? []) as { cliente_id: string | null }[])
        .map((r) => r.cliente_id)
        .filter(Boolean) as string[],
    );

    // Produtos e pacotes
    const pds = (produtos.data ?? []) as {
      nome: string;
      estoque: number;
      estoque_minimo: number;
      preco_custo: number;
      preco_venda: number;
    }[];
    const pcs = (pacotes.data ?? []) as {
      total_sessoes: number;
      sessoes_usadas: number;
      preco: number;
      created_at: string;
    }[];

    return {
      mes: data.mes,
      receita,
      despesa,
      lucro,
      margem: receita > 0 ? (lucro / receita) * 100 : 0,
      receitaMesAnterior,
      despesaMesAnterior,
      lucroMesAnterior: receitaMesAnterior - despesaMesAnterior,
      variacaoReceita: pct(receita, receitaMesAnterior),
      variacaoLucro: pct(lucro, receitaMesAnterior - despesaMesAnterior),
      receitaHoje,
      receitaSemana,
      receitaAno,
      atendimentos,
      concluidos,
      cancelados,
      faltas,
      agendados,
      taxaConclusao: atendimentos > 0 ? (concluidos / atendimentos) * 100 : 0,
      taxaFalta: atendimentos > 0 ? (faltas / atendimentos) * 100 : 0,
      taxaCancelamento: atendimentos > 0 ? (cancelados / atendimentos) * 100 : 0,
      ticketMedio,
      ticketMedioMesAnterior,
      receitaPrevista,
      aReceber,
      mediaDiaria: diasComReceita.length > 0 ? receita / diasComReceita.length : 0,
      melhorDia: melhor,
      diasAtivos: diasComReceita.length,
      clientesAtendidos: idsAtendidos.size,
      clientesNovos: clientesNovos || novos,
      clientesRecorrentes,
      taxaRetorno: idsAtendidos.size > 0 ? (clientesRecorrentes / idsAtendidos.size) * 100 : 0,
      totalClientes: cls.length,
      clientesInativos: cls.filter((c) => !ativos.has(c.id)).length,
      serie,
      topServicos,
      topClientes,
      receitaPorCategoria: porCategoria(receitas),
      despesaPorCategoria: porCategoria(despesas),
      horasPico: [...mapaHora.entries()]
        .map(([hora, quantidade]) => ({ hora, quantidade }))
        .sort((x, y) => y.quantidade - x.quantidade)
        .slice(0, 6),
      diasSemana: [...mapaSemana.values()].sort((x, y) => x.dia - y.dia),
      produtosEstoqueBaixo: pds
        .filter((p) => p.estoque <= p.estoque_minimo)
        .map((p) => ({ nome: p.nome, estoque: p.estoque, estoque_minimo: p.estoque_minimo })),
      valorEstoque: pds.reduce((s, p) => s + p.estoque * (Number(p.preco_custo) || 0), 0),
      lucroPotencialEstoque: pds.reduce(
        (s, p) => s + p.estoque * ((Number(p.preco_venda) || 0) - (Number(p.preco_custo) || 0)),
        0,
      ),
      pacotesAtivos: pcs.filter((p) => p.sessoes_usadas < p.total_sessoes).length,
      sessoesRestantes: pcs.reduce(
        (s, p) => s + Math.max(0, p.total_sessoes - p.sessoes_usadas),
        0,
      ),
      receitaPacotes: pcs
        .filter((p) => p.created_at >= de && p.created_at <= ate)
        .reduce((s, p) => s + (Number(p.preco) || 0), 0),
      ocupacaoMinutos,
    };
  });
