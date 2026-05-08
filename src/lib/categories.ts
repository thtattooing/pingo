export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  { id: "alimentacao",  name: "Alimentação",   icon: "fa-utensils",        color: "#F59E0B", keywords: ["mercado","supermercado","ifood","restaurante","lanche","padaria","pizza","burger","delivery","alimento"] },
  { id: "transporte",   name: "Transporte",    icon: "fa-car",             color: "#3B82F6", keywords: ["uber","99","gasolina","combustivel","estacionamento","onibus","metro","taxi","posto"] },
  { id: "moradia",      name: "Moradia",       icon: "fa-house",           color: "#8B5CF6", keywords: ["aluguel","condominio","iptu","reforma","casa","imovel"] },
  { id: "saude",        name: "Saúde",         icon: "fa-heart-pulse",     color: "#EC4899", keywords: ["farmacia","medico","consulta","exame","hospital","plano","saude","remedio"] },
  { id: "educacao",     name: "Educação",      icon: "fa-graduation-cap",  color: "#06B6D4", keywords: ["escola","faculdade","curso","livro","mensalidade","matricula","udemy","alura"] },
  { id: "lazer",        name: "Lazer",         icon: "fa-gamepad",         color: "#A855F7", keywords: ["netflix","spotify","cinema","show","viagem","hotel","steam","jogos","disney","prime"] },
  { id: "assinaturas",  name: "Assinaturas",   icon: "fa-tv",              color: "#14B8A6", keywords: ["assinatura","mensalidade","plano","subscription","apple","google","youtube"] },
  { id: "energia",      name: "Energia",       icon: "fa-bolt",            color: "#EAB308", keywords: ["energia","eletrica","enel","cemig","cpfl","celpe","coelba","eletricidade"] },
  { id: "agua",         name: "Água/Saneamento", icon: "fa-droplet",       color: "#0EA5E9", keywords: ["agua","sabesp","saneamento","embasa","cagece","caema"] },
  { id: "vestuario",    name: "Vestuário",     icon: "fa-shirt",           color: "#F97316", keywords: ["roupa","calcado","sapato","tenis","loja","moda","magazine","renner","riachuelo"] },
  { id: "salario",      name: "Salário",       icon: "fa-money-bill-wave", color: "#10B981", keywords: ["salario","pagamento","holerite","folha","remuneracao","vencimento"] },
  { id: "freelance",    name: "Freelance",     icon: "fa-briefcase",       color: "#059669", keywords: ["freelance","autonomo","servico","projeto","honorario","consultoria"] },
  { id: "investimento", name: "Investimento",  icon: "fa-chart-line",      color: "#6366F1", keywords: ["investimento","rendimento","dividendo","juros","cdb","tesouro","acao","fundo"] },
  { id: "outros",       name: "Outros",        icon: "fa-ellipsis",        color: "#64748B", keywords: [] },
];

export function detectCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat.id;
  }
  return "outros";
}
