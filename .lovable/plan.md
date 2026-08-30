# Audace SaaS — plano por etapas

Objetivo: evoluir o sistema atual (uso individual, dados isolados por usuário) para um SaaS de barbearias com múltiplas unidades, equipe e permissões — sem perder nada do que já funciona hoje.

O projeto continua em TanStack Start + React + TypeScript + Tailwind + shadcn/ui + Lovable Cloud. Não migramos para Next.js: o ganho seria zero e o custo (reescrever tudo) alto.

## Etapa 1 — Empresas e papéis (base do SaaS)

- Tabela `empresas` (nome, slug, telefone, endereço, logo, fuso, criada_em).
- Tabela `membros`: vínculo usuário ↔ empresa com papel `admin`, `gerente`, `barbeiro`, `recepcao`.
- Função de segurança `tem_papel(empresa, papel)` e `empresa_atual()` para as regras de acesso.
- Todas as tabelas atuais (clientes, serviços, produtos, agendamentos, lançamentos, pacotes) ganham `empresa_id`, com migração dos dados existentes para a primeira empresa do dono.
- Regras de acesso reescritas por empresa + papel: barbeiro vê a própria agenda, recepção não vê financeiro, gerente/admin veem tudo.
- Onboarding: ao criar conta, o usuário cria a barbearia e vira admin.

## Etapa 2 — Profissionais e agenda por barbeiro

- Tabela `profissionais` (nome, cor, comissão %, serviços que atende, horários de trabalho, folgas).
- Agendamento passa a ter `profissional_id`.
- Agenda com visão por dia/semana e coluna por profissional; bloqueio de horário conflitante.
- Convite de equipe por e-mail com papel definido.

## Etapa 3 — Comissões e caixa

- Comissões calculadas por serviço/produto concluído, com fechamento por período e status pago/pendente.
- Caixa: abertura, fechamento, sangria, formas de pagamento (dinheiro, pix, débito, crédito) e conferência.
- Financeiro atual continua, agora com filtro por profissional e forma de pagamento.

## Etapa 4 — Assinaturas, marketing e relatórios

- Assinaturas recorrentes (plano mensal do cliente) além dos pacotes de sessões já existentes.
- Marketing: aniversariantes, clientes inativos, campanhas de retorno com link de WhatsApp pronto.
- Relatórios exportáveis (CSV) de faturamento, comissões, serviços e clientes.
- Configurações da empresa: dados, horários, serviços padrão, papéis.

## Etapa 5 — Agendamento público (opcional)

- Página pública por slug da barbearia (`/b/audace`) com serviços, profissionais, horários livres e confirmação.
- Cliente agenda sem login; o agendamento cai direto na agenda interna.

## Detalhes técnicos

- Mudanças de banco em migrações incrementais, uma por etapa, com GRANTs e RLS por empresa.
- Papéis nunca ficam na tabela de perfil: ficam em `membros`, checados por função `security definer`.
- Server functions passam a validar empresa + papel antes de qualquer leitura/escrita.
- O painel de métricas atual é mantido e passa a filtrar por empresa e profissional.

## Ordem sugerida

Começamos pela Etapa 1, que é o alicerce — sem ela as outras não têm isolamento de dados. Cada etapa é entregue funcionando antes de iniciar a próxima.
