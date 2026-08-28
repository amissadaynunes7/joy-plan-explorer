import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Remove chaves com valor undefined (compatibilidade com exactOptionalPropertyTypes)
type Compact<T> = { [K in keyof T]: Exclude<T[K], undefined> };
const compact = <T extends Record<string, unknown>>(obj: T): Compact<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Compact<T>;

// ============ Tipos (DTOs) ============

export type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracao_min: number;
  ativo: boolean;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
};

export type Agendamento = {
  id: string;
  cliente_id: string | null;
  servico_id: string | null;
  inicia_em: string;
  status: string;
  preco: number;
  pago: boolean;
  observacoes: string | null;
  cliente_nome: string | null;
  servico_nome: string | null;
};

export type Lancamento = {
  id: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  ocorrido_em: string;
};

export type Produto = {
  id: string;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  estoque_minimo: number;
};

export type Pacote = {
  id: string;
  cliente_id: string;
  servico_id: string | null;
  nome: string;
  total_sessoes: number;
  sessoes_usadas: number;
  preco: number;
  valido_ate: string | null;
  cliente_nome: string | null;
  servico_nome: string | null;
};

export type HistoricoItem = {
  id: string;
  inicia_em: string;
  status: string;
  preco: number;
  pago: boolean;
  servico_nome: string | null;
};

// ============ Serviços ============

export const listServicos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("servicos")
      .select("*")
      .order("nome");
    if (error) throw error;
    return data as Servico[];
  });

const servicoInput = z.object({
  nome: z.string().min(1),
  preco: z.number().min(0),
  duracao_min: z.number().int().min(5).max(600),
  ativo: z.boolean().optional().default(true),
});

export const createServico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => servicoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("servicos")
      .insert({ ...compact(data), user_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const updateServico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    servicoInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("servicos")
      .update(compact(rest))
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteServico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("servicos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const criarServicosPadrao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existentes, error: errCount } = await context.supabase
      .from("servicos")
      .select("id");
    if (errCount) throw errCount;
    if (existentes && existentes.length > 0) return { ok: true, criados: 0 };
    const { error } = await context.supabase.from("servicos").insert([
      { nome: "Corte masculino", preco: 40, duracao_min: 40, user_id: context.userId },
      { nome: "Corte + barba", preco: 60, duracao_min: 60, user_id: context.userId },
      { nome: "Barba", preco: 25, duracao_min: 30, user_id: context.userId },
      { nome: "Corte infantil", preco: 30, duracao_min: 40, user_id: context.userId },
      { nome: "Pezinho", preco: 15, duracao_min: 15, user_id: context.userId },
    ]);
    if (error) throw error;
    return { ok: true, criados: 5 };
  });

// ============ Clientes ============

export const listClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clientes")
      .select("*")
      .order("nome");
    if (error) throw error;
    return data as Cliente[];
  });

const clienteInput = z.object({
  nome: z.string().min(1),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export const createCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => clienteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clientes")
      .insert({ ...compact(data), user_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const updateCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    clienteInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("clientes")
      .update(compact(rest))
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clientes")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const historicoCliente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { cliente_id: string }) =>
    z.object({ cliente_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("agendamentos")
      .select("id, inicia_em, status, preco, pago, servicos(nome)")
      .eq("user_id", context.userId)
      .eq("cliente_id", data.cliente_id)
      .order("inicia_em", { ascending: false })
      .limit(50);
    if (error) throw error;
    type Hist = {
      id: string;
      inicia_em: string;
      status: string;
      preco: number;
      pago: boolean;
      servicos: { nome: string } | null;
    };
    return (rows as unknown as Hist[]).map<HistoricoItem>((r) => ({
      id: r.id,
      inicia_em: r.inicia_em,
      status: r.status,
      preco: Number(r.preco) || 0,
      pago: r.pago,
      servico_nome: r.servicos?.nome ?? null,
    }));
  });

// ============ Agendamentos ============

export const listAgendamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { de: string; ate: string }) =>
    z.object({ de: z.string(), ate: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("agendamentos")
      .select("*, clientes(nome), servicos(nome)")
      .eq("user_id", context.userId)
      .gte("inicia_em", data.de)
      .lte("inicia_em", data.ate)
      .order("inicia_em");
    if (error) throw error;
    type Row = {
      id: string;
      cliente_id: string | null;
      servico_id: string | null;
      inicia_em: string;
      status: string;
      preco: number;
      pago: boolean;
      observacoes: string | null;
      clientes: { nome: string } | null;
      servicos: { nome: string } | null;
    };
    return (rows as unknown as Row[]).map<Agendamento>((r) => ({
      id: r.id,
      cliente_id: r.cliente_id,
      servico_id: r.servico_id,
      inicia_em: r.inicia_em,
      status: r.status,
      preco: Number(r.preco) || 0,
      pago: r.pago,
      observacoes: r.observacoes,
      cliente_nome: r.clientes?.nome ?? null,
      servico_nome: r.servicos?.nome ?? null,
    }));
  });

const agendamentoInput = z.object({
  cliente_id: z.string().uuid(),
  servico_id: z.string().uuid().optional().nullable(),
  inicia_em: z.string(),
  preco: z.number().min(0),
  observacoes: z.string().optional().nullable(),
});

export const createAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => agendamentoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agendamentos")
      .insert({ ...compact(data), user_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const concluirAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; receber: boolean }) =>
    z.object({ id: z.string().uuid(), receber: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: ag, error: errAg } = await context.supabase
      .from("agendamentos")
      .select("id, preco, servicos(nome)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (errAg || !ag) throw new Error("Agendamento não encontrado");

    const { error: upd } = await context.supabase
      .from("agendamentos")
      .update({ status: "concluido", pago: data.receber })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (upd) throw upd;

    if (data.receber && Number(ag.preco) > 0) {
      const nomeServico = (ag as unknown as { servicos: { nome: string } | null }).servicos?.nome;
      const { error: lanc } = await context.supabase.from("lancamentos").insert({
        user_id: context.userId,
        tipo: "receita",
        categoria: "servicos",
        descricao: nomeServico ? `Atendimento: ${nomeServico}` : "Atendimento",
        valor: Number(ag.preco),
        agendamento_id: ag.id,
      });
      if (lanc) throw lanc;
    }
    return { ok: true };
  });

export const updateStatusAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["agendado", "cancelado", "faltou"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agendamentos")
      .update({ status: data.status, pago: false })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agendamentos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============ Lançamentos financeiros ============

export const listLancamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { de: string; ate: string }) =>
    z.object({ de: z.string(), ate: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("lancamentos")
      .select("*")
      .eq("user_id", context.userId)
      .gte("ocorrido_em", data.de)
      .lte("ocorrido_em", data.ate)
      .order("ocorrido_em", { ascending: false });
    if (error) throw error;
    return rows as Lancamento[];
  });

const lancamentoInput = z.object({
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.string().min(1),
  descricao: z.string().min(1),
  valor: z.number().min(0),
  ocorrido_em: z.string().optional(),
});

export const createLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => lancamentoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lancamentos")
      .insert({ ...compact(data), user_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const deleteLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lancamentos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============ Produtos ============

export const listProdutos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("produtos")
      .select("*")
      .order("nome");
    if (error) throw error;
    return data as Produto[];
  });

const produtoInput = z.object({
  nome: z.string().min(1),
  preco_custo: z.number().min(0),
  preco_venda: z.number().min(0),
  estoque: z.number().int().min(0),
  estoque_minimo: z.number().int().min(0),
});

export const createProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => produtoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("produtos")
      .insert({ ...compact(data), user_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const updateProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    produtoInput.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("produtos")
      .update(compact(rest))
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("produtos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const venderProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; quantidade: number }) =>
    z
      .object({ id: z.string().uuid(), quantidade: z.number().int().min(1) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: produto, error: errP } = await context.supabase
      .from("produtos")
      .select("id, nome, preco_venda, estoque")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (errP || !produto) throw new Error("Produto não encontrado");
    if (produto.estoque < data.quantidade) throw new Error("Estoque insuficiente");

    const { error: upd } = await context.supabase
      .from("produtos")
      .update({ estoque: produto.estoque - data.quantidade })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (upd) throw upd;

    const { error: lanc } = await context.supabase.from("lancamentos").insert({
      user_id: context.userId,
      tipo: "receita",
      categoria: "produtos",
      descricao: `Venda: ${produto.nome}`,
      valor: Number(produto.preco_venda) * data.quantidade,
      produto_id: produto.id,
      quantidade: data.quantidade,
    });
    if (lanc) throw lanc;
    return { ok: true };
  });

export const reabastecerProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; quantidade: number; registrarCusto: boolean }) =>
    z
      .object({
        id: z.string().uuid(),
        quantidade: z.number().int().min(1),
        registrarCusto: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: produto, error: errP } = await context.supabase
      .from("produtos")
      .select("id, nome, preco_custo, estoque")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (errP || !produto) throw new Error("Produto não encontrado");

    const { error: upd } = await context.supabase
      .from("produtos")
      .update({ estoque: produto.estoque + data.quantidade })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (upd) throw upd;

    if (data.registrarCusto && Number(produto.preco_custo) > 0) {
      const { error: lanc } = await context.supabase.from("lancamentos").insert({
        user_id: context.userId,
        tipo: "despesa",
        categoria: "insumos",
        descricao: `Compra: ${produto.nome}`,
        valor: Number(produto.preco_custo) * data.quantidade,
        produto_id: produto.id,
        quantidade: data.quantidade,
      });
      if (lanc) throw lanc;
    }
    return { ok: true };
  });

// ============ Pacotes ============

export const listPacotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("pacotes")
      .select("*, clientes(nome), servicos(nome)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    type Row = {
      id: string;
      cliente_id: string;
      servico_id: string | null;
      nome: string;
      total_sessoes: number;
      sessoes_usadas: number;
      preco: number;
      valido_ate: string | null;
      clientes: { nome: string } | null;
      servicos: { nome: string } | null;
    };
    return (rows as unknown as Row[]).map<Pacote>((r) => ({
      id: r.id,
      cliente_id: r.cliente_id,
      servico_id: r.servico_id,
      nome: r.nome,
      total_sessoes: r.total_sessoes,
      sessoes_usadas: r.sessoes_usadas,
      preco: Number(r.preco) || 0,
      valido_ate: r.valido_ate,
      cliente_nome: r.clientes?.nome ?? null,
      servico_nome: r.servicos?.nome ?? null,
    }));
  });

export const createPacote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: unknown) =>
      z
        .object({
          cliente_id: z.string().uuid(),
          servico_id: z.string().uuid().optional().nullable(),
          nome: z.string().min(1),
          total_sessoes: z.number().int().min(1),
          preco: z.number().min(0),
          valido_ate: z.string().optional().nullable(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error: ins } = await context.supabase
      .from("pacotes")
      .insert({ ...compact(data), user_id: context.userId });
    if (ins) throw ins;
    if (Number(data.preco) > 0) {
      const { error: lanc } = await context.supabase.from("lancamentos").insert({
        user_id: context.userId,
        tipo: "receita",
        categoria: "pacotes",
        descricao: `Pacote: ${data.nome}`,
        valor: data.preco,
      });
      if (lanc) throw lanc;
    }
    return { ok: true };
  });

export const usarSessaoPacote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: pacote, error: errP } = await context.supabase
      .from("pacotes")
      .select("id, total_sessoes, sessoes_usadas")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (errP || !pacote) throw new Error("Pacote não encontrado");
    if (pacote.sessoes_usadas >= pacote.total_sessoes)
      throw new Error("Todas as sessões deste pacote já foram usadas");

    const { error } = await context.supabase
      .from("pacotes")
      .update({ sessoes_usadas: pacote.sessoes_usadas + 1 })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true, restantes: pacote.total_sessoes - pacote.sessoes_usadas - 1 };
  });

export const deletePacote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("pacotes")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
