export const brl = (valor: number) =>
  (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const mesAtual = () => hojeISO().slice(0, 7);

export const diaRange = (dia: string) => {
  const de = new Date(`${dia}T00:00:00`);
  const ate = new Date(`${dia}T23:59:59.999`);
  return { de: de.toISOString(), ate: ate.toISOString() };
};

export const mesRange = (mes: string) => {
  const partes = mes.split("-").map(Number);
  const ano = Number(partes[0]) || 2026;
  const mesNum = Number(partes[1]) || 1;
  const de = new Date(ano, mesNum - 1, 1);
  const ate = new Date(ano, mesNum, 0, 23, 59, 59, 999);
  return { de: de.toISOString(), ate: ate.toISOString() };
};

export const formatarHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const formatarDataHora = (iso: string) =>
  `${formatarData(iso)} às ${formatarHora(iso)}`;

export const STATUS_AGENDAMENTO: Record<string, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-primary/15 text-primary border-primary/30" },
  concluido: { label: "Concluído", className: "bg-success/15 text-success border-success/30" },
  cancelado: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  faltou: { label: "Faltou", className: "bg-muted text-muted-foreground border-border" },
};

export const CATEGORIAS_RECEITA = ["servicos", "produtos", "pacotes", "outros"] as const;
export const CATEGORIAS_DESPESA = [
  "aluguel",
  "insumos",
  "energia_agua",
  "marketing",
  "equipamentos",
  "impostos",
  "outros",
] as const;

export const labelCategoria = (cat: string) =>
  ({
    servicos: "Serviços",
    produtos: "Produtos",
    pacotes: "Pacotes",
    aluguel: "Aluguel",
    insumos: "Insumos",
    energia_agua: "Energia/Água",
    marketing: "Marketing",
    equipamentos: "Equipamentos",
    impostos: "Impostos",
    outros: "Outros",
  })[cat] ?? "Outros";
