create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  preco numeric(10,2) not null default 0,
  duracao_min integer not null default 30,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  preco_custo numeric(10,2) not null default 0,
  preco_venda numeric(10,2) not null default 0,
  estoque integer not null default 0,
  estoque_minimo integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  cliente_id uuid references public.clientes on delete cascade,
  servico_id uuid references public.servicos on delete set null,
  inicia_em timestamptz not null,
  status text not null default 'agendado' check (status in ('agendado','concluido','cancelado','faltou')),
  preco numeric(10,2) not null default 0,
  pago boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now()
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tipo text not null check (tipo in ('receita','despesa')),
  categoria text not null default 'outros',
  descricao text not null,
  valor numeric(10,2) not null,
  ocorrido_em timestamptz not null default now(),
  agendamento_id uuid references public.agendamentos on delete set null,
  produto_id uuid references public.produtos on delete set null,
  quantidade integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.pacotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  cliente_id uuid not null references public.clientes on delete cascade,
  servico_id uuid references public.servicos on delete set null,
  nome text not null,
  total_sessoes integer not null,
  sessoes_usadas integer not null default 0,
  preco numeric(10,2) not null default 0,
  valido_ate date,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacotes TO authenticated;
GRANT ALL ON public.servicos TO service_role;
GRANT ALL ON public.clientes TO service_role;
GRANT ALL ON public.produtos TO service_role;
GRANT ALL ON public.agendamentos TO service_role;
GRANT ALL ON public.lancamentos TO service_role;
GRANT ALL ON public.pacotes TO service_role;

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia servicos" ON public.servicos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono gerencia clientes" ON public.clientes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono gerencia produtos" ON public.produtos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono gerencia agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono gerencia lancamentos" ON public.lancamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono gerencia pacotes" ON public.pacotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agendamentos_user_data ON public.agendamentos (user_id, inicia_em);
CREATE INDEX idx_lancamentos_user_data ON public.lancamentos (user_id, ocorrido_em);
CREATE INDEX idx_clientes_user ON public.clientes (user_id);
CREATE INDEX idx_pacotes_user ON public.pacotes (user_id);
CREATE INDEX idx_produtos_user ON public.produtos (user_id);
CREATE INDEX idx_servicos_user ON public.servicos (user_id);