export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "alimentacao", name: "Alimentação", icon: "fa-utensils", color: "#F59E0B",
    keywords: [
      // Delivery
      "ifood","rappi","ubereats","uber eats","james delivery","loggi","aiqfome",
      // Fast food
      "mcdonalds","mcdonald","burger king","burguer king","bk ","bob's","bobs ","giraffas",
      "subway","pizza","pizzaria","pizza hut","dominos","habib","china in box","temaki",
      "lanchonete","lanche","pastelaria","pastel","hamburger","hamburguer","hot dog",
      "sushi","japonese","culinaria japonesa","churrasco","churrascaria","rodizio",
      "frango assado","kentucky","kfc","popeyes","outback","applebee","banana leaves",
      // Supermarkets / markets
      "mercado","supermercado","hipermercado","atacado","atacarejo","hortifruti",
      "sacolao","sacolão","feira","acougue","açougue","frigorífico",
      "carrefour","extra ","pao de acucar","pão de açúcar","assai","assaí",
      "prezunic","guanabara","mundial","bistek","fort atacado","atacadao","atacadão",
      "sam's club","sams club","condor","muffato","st marche","mundial","savegnago",
      "rede economia","futurebrand","g.barbosa","bompreco","bom preco",
      // Bakeries / cafes
      "padaria","panificadora","padoca","confeitaria","doceria",
      "cafe ","cafeteria","cafezinho","coffee","starbucks","paes & cafe","paes e cafe",
      "acai","açaí","sorveteria","sorvete","gelato","gelateria","frozen",
      // Bars / drinks
      "bebida","bar ","boteco","cervejar","cerveja","chopp","vinho","adega",
      // Generic food
      "alimento","alimentacao","alimentação","comida","refeicao","refeição",
      "kitchen","food","grill","bistr","loja de carnes","hortifruti",
    ],
  },
  {
    id: "transporte", name: "Transporte", icon: "fa-car", color: "#3B82F6",
    keywords: [
      // Ride apps
      "uber","99pop","99 ","cabify","blablacar","indriver","shofer",
      // Fuel / gas stations
      "gasolina","combustivel","combustível","etanol","alcool","álcool","diesel","abastec",
      "posto ","shell","ipiranga","br distribuidora","raizen","ale ","petrobras","ale distribui",
      // Parking
      "estacionamento","parking","rotativo","zona azul","estapar","multipark","indigo",
      // Public transport
      "onibus","ônibus","metro","metrô","bus ","bilhete unico","bilhete único",
      "passagem","rodoviaria","rodoviária","trem","vlt","brt","lotacao",
      // Taxi
      "taxi","táxi","taxista","mototaxi","mototaxi","motorista",
      // Flights
      "latam","gol ","azul ","tam ","avianca","aeroporto","companhia aerea",
      "voo ","passagem aerea","passagem aérea","embarque",
      // Tolls / autopay (includes C6Tag pedágio)
      "pedagio","pedágio","via dutra","autoban","sem parar","move mais",
      "conectcar","veloe","taggy","eixo sul","ecovias","concer",
      "c6tag pedagio","spmar","rodoanel","ccr rod",
      // Parking (C6Tag estacionamento)
      "c6tag estacion","estapar","multipark","indigo park",
      // Public transport card top-up
      "autopass","atm tmob","bilhete unico","bilhete único",
      // Vehicle tax / debit
      "debito veicular","ipva","dpvat","taxa de veiculo","licenciamento",
      // Maintenance
      "manutencao","manutenção","revisao","revisão","pneu","borracharia",
      "mecanica","mecânica","auto pecas","autopeças","funilaria","pintura auto",
      "centro automotivo","auto posto","posto city","posto raposo",
      // Micro mobility
      "bicicleta","patinete","scooter","bike","yellow","grin","tembici",
    ],
  },
  {
    id: "moradia", name: "Moradia", icon: "fa-house", color: "#8B5CF6",
    keywords: [
      "aluguel","condominio","condomínio","iptu","itr","taxa condominial",
      "reforma","material de construcao","material de construção","construcao","construção",
      "leroy merlin","leroy","c&c","telhanorte","dicico","sodimac","quincala","vidracaria",
      "eletricista","pedreiro","pintor","encanador","dedetizacao","dedetização",
      "casa","imovel","imóvel","seguro residencial","seguro imóvel","vistoria",
      "luz ","agua ","gás residencial",
    ],
  },
  {
    id: "saude", name: "Saúde & Beleza", icon: "fa-heart-pulse", color: "#EC4899",
    keywords: [
      // Pharmacies
      "farmacia","farmácia","drogaria","drogasil","droga raia","droga","ultrafarma",
      "nissei","pague menos","panvel","dpsp","onofre","pacheco","raia ",
      // Medical
      "medico","médico","consulta","exame","hospital","clinica","clínica","pronto socorro",
      "laboratorio","laboratório","dasa","fleury","hermes pardini","einstein","sirio",
      "odonto","dentista","ortodon","implante","protese","protése",
      // Health insurance
      "plano de saude","amil","unimed","sulamerica","bradesco saude","hapvida",
      "gndi","notredame","intermedica","intermédica",
      // Fitness
      "academia","gym","smart fit","bluefit","bio ritmo","crossfit","pilates","yoga",
      "treino","personal","musculacao","musculação",
      // Psychology / therapy
      "psicologo","psicólogo","psiquiatra","terapeuta","fonoaudiologo","fisioterapeuta",
      // Beauty / personal care
      "tattoo","tatuagem","piercing","barbearia","barber","cabelereiro","cabeleireiro",
      "salao","salão de beleza","estetica","estética","depilacao","depilação",
      "manicure","pedicure","unhas","spa ","massagem","sobrancelha","micropigmentacao",
      "perfume","cosmetico","cosmético","maquiagem","makeup","loreal","boticario",
    ],
  },
  {
    id: "educacao", name: "Educação", icon: "fa-graduation-cap", color: "#06B6D4",
    keywords: [
      "escola","colegio","colégio","faculdade","universidade","uni ",
      "curso","mensalidade escolar","matricula","matrícula","material escolar",
      "livro","livraria","saraiva","leitura","fnac","amazon livro","estante virtual",
      "udemy","alura","coursera","hotmart","eduzz","domestika","skillshare","dio ",
      "idiomas","ingles","inglês","espanhol","cursinho","preparatorio","preparatório",
      "puc","usp","unicamp","senac","senai","fiap","fatec","etec","descomplica",
      "wizard","ccaa","fisk","cultura inglesa",
    ],
  },
  {
    id: "lazer", name: "Lazer & Entretenimento", icon: "fa-gamepad", color: "#A855F7",
    keywords: [
      // Streaming
      "netflix","hbomax","hbo max","max ","amazon prime","prime video","disney plus",
      "disney+","paramount","globoplay","telecine","mubi","apple tv",
      // Music
      "spotify","deezer","tidal","soundcloud","youtube premium",
      // Cinema
      "cinema","cinemark","cinepolis","cinépolis","uci kinoplex","kinoplex","cineflix",
      // Events
      "teatro","show ","evento ","ingresso","ticket","tickets","eventbrite",
      "ticketmaster","blueticket","sympla","rock in rio","lollapalooza",
      // Games
      "gaming","steam","xbox","playstation","nintendo","nuuvem","humble","epic games",
      // Travel
      "viagem","hotel","airbnb","booking","trivago","decolar","hostel","pousada",
      "agencia de viagem","passagem","latam travel","cvc ",
      // Tourism
      "parque","zoologico","aquarium","museu","exposicao",
      // Sports / leisure
      "esporte","quadra","clube","piscina","futebol","natacao","surf","skate",
    ],
  },
  {
    id: "assinaturas", name: "Assinaturas", icon: "fa-tv", color: "#14B8A6",
    keywords: [
      "assinatura","subscription","plano mensal","plano anual","mensalidade",
      "icloud","google one","dropbox","adobe","microsoft 365","office 365","one drive",
      "antivirus","avast","kaspersky","norton","vpn ","nordvpn","expressvpn",
      "dominio","dominios","hospedagem","hosting","vercel","netlify","aws",
    ],
  },
  {
    id: "energia", name: "Energia", icon: "fa-bolt", color: "#EAB308",
    keywords: [
      "energia eletrica","energia elétrica","fatura energia","conta energia",
      "enel","cemig","cpfl","celpe","coelba","light ","energisa","equatorial",
      "neoenergia","eletrobras","copel","celesc","coelce","ceal","ceron",
      "eletropaulo","aes eletro","aes distrib","elektro","eletricidade",
      "gas encanado","gas natural","comgas","comgás","ceg ","companhia de gas",
    ],
  },
  {
    id: "agua", name: "Água/Saneamento", icon: "fa-droplet", color: "#0EA5E9",
    keywords: [
      "conta agua","conta água","sabesp","saneamento","embasa","cagece","caema",
      "caesb","sanepar","casan","corsan","saae ","caern","copasa","sanasa",
    ],
  },
  {
    id: "vestuario", name: "Vestuário", icon: "fa-shirt", color: "#F97316",
    keywords: [
      "roupa","calcado","calçado","sapato","tenis","tênis","sandalia","sandália",
      "vestuario","vestuário","boutique","moda ","confeccao","confecção",
      "magazine luiza","renner ","riachuelo","c&a","cea ","hering","zara ","h&m",
      "farm ","animale","arezzo","schutz","melissa","havaianas","mizuno","asics",
      "adidas","nike ","puma ","fila ","oakley","quiksilver","billabong",
      "lingerie","cueca","meia ","acessorios","acessórios","bolsa ","carteira",
    ],
  },
  {
    id: "salario", name: "Salário", icon: "fa-money-bill-wave", color: "#10B981",
    keywords: [
      "salario","salário","pagamento salario","holerite","folha de pagamento",
      "remuneracao","remuneração","vencimento","13 salario","13° salário",
      "ferias","férias","pis","pasep","fgts","rescisao","rescisão","indenizacao",
    ],
  },
  {
    id: "freelance", name: "Renda Extra", icon: "fa-briefcase", color: "#059669",
    keywords: [
      "freelance","autonomo","autônomo","servico prestado","serviço prestado",
      "honorario","honorário","consultoria","prestacao de servico",
      "renda extra","comissao","comissão","99freelas","workana","fiverr","upwork",
    ],
  },
  {
    id: "investimento", name: "Investimento", icon: "fa-chart-line", color: "#6366F1",
    keywords: [
      "investimento","rendimento","dividendo","juros sobre","cdb","tesouro direto",
      "tesouro","acoes","ações","fundo ","fii ","criptomoeda","bitcoin","ethereum",
      "xp investimento","btg pactual","rico ","clear ","avenue","modal mais",
      "genial","inter invest","nuinvest","easynvest","corretora","bolsa b3",
      "aplicacao","aplicação","resgate","aporte",
    ],
  },
  { id: "outros", name: "Outros", icon: "fa-ellipsis", color: "#64748B", keywords: [] },
];

// Normalize accents for robust matching (handles "café" == "cafe", etc.)
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function detectCategory(description: string): string {
  const lower = norm(description);
  // Remove common bank prefixes that add noise
  const cleaned = lower
    .replace(/^(cred |deb |credito |debito |pix |ted |doc |pagamento |pg )/i, "")
    .replace(/^(a vista |parcelado |parc |parcela )/i, "");

  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => cleaned.includes(norm(kw)))) return cat.id;
  }
  // Second pass on original (in case cleaning removed a useful term)
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(norm(kw)))) return cat.id;
  }
  return "outros";
}
