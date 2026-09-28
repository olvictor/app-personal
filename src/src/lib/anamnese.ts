/**
 * Ficha de anamnese.
 *
 * O bloco PAR-Q é o questionário de prontidão para atividade física
 * usado no Brasil: são sete perguntas, e qualquer "sim" pede avaliação
 * médica antes de começar. Por isso elas vêm primeiro e marcadas.
 *
 * As perguntas moram aqui, não no banco: dá para reescrever, acrescentar
 * ou reordenar sem migração. O que o banco guarda é o `id` de cada uma.
 */

export type TipoDePergunta = "sim_nao" | "texto" | "texto_longo" | "numero" | "escolha";

export type Pergunta = {
  id: string;
  texto: string;
  tipo: TipoDePergunta;
  opcoes?: string[];
  ajuda?: string;
  /** PAR-Q: responder "sim" acende o alerta de liberação médica. */
  alertaSeSim?: boolean;
  /** só aparece quando outra pergunta tem determinada resposta */
  dependeDe?: { id: string; valor: string };
  obrigatoria?: boolean;
};

export type Secao = {
  id: string;
  titulo: string;
  descricao?: string;
  perguntas: Pergunta[];
};

export const SECOES: Secao[] = [
  {
    id: "parq",
    titulo: "Prontidão para atividade física (PAR-Q)",
    descricao:
      "Sete perguntas padrão. Responda com sinceridade — elas existem para o treino começar com segurança.",
    perguntas: [
      {
        id: "parq1",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto:
          "Algum médico já disse que você tem um problema de coração e que só deveria fazer atividade física supervisionada?",
      },
      {
        id: "parq2",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto: "Você sente dor no peito quando pratica atividade física?",
      },
      {
        id: "parq3",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto: "No último mês, sentiu dor no peito quando estava em repouso?",
      },
      {
        id: "parq4",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto: "Você perde o equilíbrio por tontura ou já perdeu a consciência alguma vez?",
      },
      {
        id: "parq5",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto:
          "Você tem algum problema ósseo ou articular que poderia piorar com a prática de atividade física?",
      },
      {
        id: "parq6",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto:
          "Algum médico já receitou medicamento para pressão arterial ou para o coração?",
      },
      {
        id: "parq7",
        tipo: "sim_nao",
        obrigatoria: true,
        alertaSeSim: true,
        texto:
          "Você sabe de alguma outra razão pela qual não deveria praticar atividade física?",
      },
      {
        id: "parq_detalhe",
        tipo: "texto_longo",
        texto: "Se respondeu SIM em alguma das anteriores, conte o que houve.",
        ajuda: "Quanto mais detalhe, melhor o personal consegue adaptar o treino.",
      },
      {
        id: "liberacao_medica",
        tipo: "sim_nao",
        texto: "Você tem liberação médica atual para praticar exercícios?",
      },
    ],
  },

  {
    id: "saude",
    titulo: "Saúde",
    perguntas: [
      {
        id: "doencas",
        tipo: "texto_longo",
        texto: "Tem alguma doença diagnosticada?",
        ajuda:
          "Pressão alta, diabetes, colesterol, tireoide, asma, labirintite, hérnia de disco, artrite…",
      },
      {
        id: "medicamentos",
        tipo: "texto_longo",
        texto: "Toma algum medicamento contínuo? Quais?",
        ajuda: "Inclua anticoncepcional, antidepressivo e remédio de pressão.",
      },
      {
        id: "cirurgias",
        tipo: "texto_longo",
        texto: "Já fez alguma cirurgia? Qual e quando?",
      },
      {
        id: "lesoes",
        tipo: "texto_longo",
        texto: "Tem alguma lesão ou dor hoje? Onde?",
        ajuda: "Ombro, joelho, coluna, punho — diga o lado e há quanto tempo.",
      },
      {
        id: "dor_ao_treinar",
        tipo: "sim_nao",
        texto: "Alguma dor aparece ou piora quando você treina?",
      },
      {
        id: "fisioterapia",
        tipo: "sim_nao",
        texto: "Faz ou fez fisioterapia recentemente?",
      },
      {
        id: "alergias",
        tipo: "texto",
        texto: "Tem alergia a alguma coisa?",
      },
      {
        id: "historico_familiar",
        tipo: "texto",
        texto: "Doenças de coração, diabetes ou pressão alta na família?",
      },
      {
        id: "gestacao",
        tipo: "escolha",
        texto: "Está grávida ou teve filho nos últimos 12 meses?",
        opcoes: ["Não se aplica", "Estou grávida", "Tive filho nos últimos 12 meses"],
      },
    ],
  },

  {
    id: "habitos",
    titulo: "Rotina e hábitos",
    perguntas: [
      {
        id: "profissao",
        tipo: "texto",
        texto: "Qual é a sua profissão?",
      },
      {
        id: "esforco_trabalho",
        tipo: "escolha",
        texto: "Como é o seu dia no trabalho?",
        opcoes: [
          "Sentado a maior parte do tempo",
          "Em pé ou andando",
          "Esforço físico pesado",
        ],
      },
      {
        id: "sono",
        tipo: "escolha",
        texto: "Quantas horas você dorme por noite?",
        opcoes: ["Menos de 5", "5 a 6", "7 a 8", "Mais de 8"],
      },
      {
        id: "estresse",
        tipo: "escolha",
        texto: "Como anda o seu nível de estresse?",
        opcoes: ["Baixo", "Médio", "Alto"],
      },
      {
        id: "fuma",
        tipo: "escolha",
        texto: "Você fuma?",
        opcoes: ["Não", "Sim", "Parei há menos de um ano", "Parei há mais de um ano"],
      },
      {
        id: "bebida",
        tipo: "escolha",
        texto: "Bebe álcool com que frequência?",
        opcoes: ["Não bebo", "De vez em quando", "Fins de semana", "Quase todo dia"],
      },
      {
        id: "alimentacao",
        tipo: "escolha",
        texto: "Como está a sua alimentação?",
        opcoes: ["Bem regrada", "Mais ou menos", "Desregrada"],
      },
      {
        id: "nutricionista",
        tipo: "sim_nao",
        texto: "Faz acompanhamento com nutricionista?",
      },
      {
        id: "agua",
        tipo: "escolha",
        texto: "Quanta água você bebe por dia?",
        opcoes: ["Menos de 1 litro", "1 a 2 litros", "2 a 3 litros", "Mais de 3 litros"],
      },
      {
        id: "suplementos",
        tipo: "texto",
        texto: "Usa algum suplemento? Quais?",
      },
    ],
  },

  {
    id: "treino",
    titulo: "Histórico de treino",
    perguntas: [
      {
        id: "ja_treinou",
        tipo: "escolha",
        texto: "Qual é a sua experiência com musculação?",
        opcoes: [
          "Nunca treinei",
          "Já treinei, mas parei",
          "Treino há menos de um ano",
          "Treino há mais de um ano",
        ],
        obrigatoria: true,
      },
      {
        id: "tempo_parado",
        tipo: "texto",
        texto: "Há quanto tempo está sem treinar?",
        dependeDe: { id: "ja_treinou", valor: "Já treinei, mas parei" },
      },
      {
        id: "outras_atividades",
        tipo: "texto",
        texto: "Pratica outra atividade física? Qual e quantas vezes por semana?",
        ajuda: "Corrida, futebol, natação, luta, dança…",
      },
      {
        id: "objetivo_detalhe",
        tipo: "texto_longo",
        texto: "O que você quer conquistar com o treino?",
        obrigatoria: true,
        ajuda: "Vale ser específico: 'perder 8 kg até dezembro', 'parar de sentir dor nas costas'.",
      },
      {
        id: "disponibilidade",
        tipo: "texto",
        texto: "Quais dias e horários você consegue treinar?",
        obrigatoria: true,
      },
      {
        id: "exercicios_que_nao_gosta",
        tipo: "texto",
        texto: "Tem algum exercício que você detesta ou não consegue fazer?",
      },
      {
        id: "observacoes",
        tipo: "texto_longo",
        texto: "Mais alguma coisa que o seu personal precisa saber?",
      },
    ],
  },
];

export const TODAS_AS_PERGUNTAS: Pergunta[] = SECOES.flatMap((s) => s.perguntas);

export function acharPergunta(id: string): Pergunta | undefined {
  return TODAS_AS_PERGUNTAS.find((p) => p.id === id);
}

export type Respostas = Record<string, string>;

/** Perguntas obrigatórias ainda em branco. */
export function pendencias(respostas: Respostas): Pergunta[] {
  return TODAS_AS_PERGUNTAS.filter((p) => {
    if (!p.obrigatoria) return false;
    if (!aparece(p, respostas)) return false;
    return !respostas[p.id]?.trim();
  });
}

/** Uma pergunta condicional só vale se a resposta que a libera bater. */
export function aparece(p: Pergunta, respostas: Respostas): boolean {
  if (!p.dependeDe) return true;
  return respostas[p.dependeDe.id] === p.dependeDe.valor;
}

/** Quais perguntas do PAR-Q vieram com "Sim". */
export function alertasDoParq(respostas: Respostas): Pergunta[] {
  return TODAS_AS_PERGUNTAS.filter((p) => p.alertaSeSim && respostas[p.id] === "Sim");
}
