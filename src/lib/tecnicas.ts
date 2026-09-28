/**
 * Técnicas de execução.
 *
 * O `id` é o que fica gravado no banco; nome e instrução vivem aqui, para
 * poderem ser melhorados depois sem mexer nas fichas já montadas.
 * A instrução aparece para o aluno dentro do treino — é o que evita ele
 * chegar no drop-set sem saber quanto tirar de carga.
 */

export type Tecnica = {
  id: string;
  nome: string;
  grupo: string;
  comoFazer: string;
};

export const TECNICAS: Tecnica[] = [
  // ---------- levar à falha e passar dela ----------
  {
    id: "drop-set",
    nome: "Drop-set",
    grupo: "Intensidade",
    comoFazer:
      "Ao falhar, tire 20% a 40% da carga e continue sem descanso, até falhar de novo.",
  },
  {
    id: "rest-pause",
    nome: "Rest-pause",
    grupo: "Intensidade",
    comoFazer:
      "Vá até a falha, descanse de 10 a 20 segundos e volte na mesma carga. Repita 2 a 3 vezes.",
  },
  {
    id: "repeticoes-forcadas",
    nome: "Repetições forçadas",
    grupo: "Intensidade",
    comoFazer:
      "Depois da falha, com ajuda de alguém, faça mais 2 a 4 repetições na fase de subida.",
  },
  {
    id: "negativas",
    nome: "Negativas (excêntricas)",
    grupo: "Intensidade",
    comoFazer:
      "Suba com ajuda e desça sozinho, segurando de 3 a 5 segundos. A carga é maior que a normal.",
  },
  {
    id: "parciais",
    nome: "Repetições parciais",
    grupo: "Intensidade",
    comoFazer:
      "Trabalhe só um pedaço do movimento, na parte em que o músculo fica mais tensionado.",
  },
  {
    id: "queima",
    nome: "Sistema de queima",
    grupo: "Intensidade",
    comoFazer:
      "Terminada a série, faça 3 a 6 movimentos curtos e rápidos, de amplitude reduzida.",
  },
  {
    id: "roubadas",
    nome: "Repetições roubadas",
    grupo: "Intensidade",
    comoFazer:
      "Depois da falha, use um leve impulso do corpo para completar mais 2 ou 3 repetições.",
  },
  {
    id: "cluster",
    nome: "Cluster set",
    grupo: "Intensidade",
    comoFazer:
      "Quebre a série em blocos curtos (ex.: 3+3+3) com 15 a 20 segundos entre eles, na mesma carga.",
  },
  {
    id: "myo-reps",
    nome: "Myo-reps",
    grupo: "Intensidade",
    comoFazer:
      "Uma série longa até quase falhar e, depois, mini-séries de 3 a 5 repetições com 5 respiradas entre elas.",
  },
  {
    id: "back-off",
    nome: "Back-off set",
    grupo: "Intensidade",
    comoFazer:
      "Depois da série pesada, faça uma série extra com 20% a 30% menos carga e mais repetições.",
  },

  // ---------- como a carga caminha ao longo das séries ----------
  {
    id: "piramide-crescente",
    nome: "Pirâmide crescente",
    grupo: "Carga",
    comoFazer: "A cada série, mais carga e menos repetições (ex.: 12, 10, 8, 6).",
  },
  {
    id: "piramide-decrescente",
    nome: "Pirâmide decrescente",
    grupo: "Carga",
    comoFazer: "A cada série, menos carga e mais repetições (ex.: 6, 8, 10, 12).",
  },
  {
    id: "piramide-completa",
    nome: "Pirâmide completa",
    grupo: "Carga",
    comoFazer: "Sobe a carga até o topo e desce de novo (ex.: 12, 10, 8, 8, 10, 12).",
  },
  {
    id: "piramide-truncada",
    nome: "Pirâmide truncada",
    grupo: "Carga",
    comoFazer: "Pirâmide curta, com menos degraus: só 3 séries subindo a carga.",
  },
  {
    id: "gvt",
    nome: "GVT (10 × 10)",
    grupo: "Carga",
    comoFazer:
      "Dez séries de dez repetições com a mesma carga (uns 60% do máximo) e 60 a 90 s de descanso.",
  },
  {
    id: "fst-7",
    nome: "FST-7",
    grupo: "Carga",
    comoFazer:
      "Sete séries de 8 a 12 repetições com 30 s de descanso, alongando o músculo entre elas.",
  },

  // ---------- exercícios encadeados ----------
  {
    id: "bi-set",
    nome: "Bi-set",
    grupo: "Combinação",
    comoFazer: "Dois exercícios do mesmo músculo, um atrás do outro, sem descanso no meio.",
  },
  {
    id: "tri-set",
    nome: "Tri-set",
    grupo: "Combinação",
    comoFazer: "Três exercícios do mesmo músculo em sequência, sem descanso entre eles.",
  },
  {
    id: "serie-gigante",
    nome: "Série gigante",
    grupo: "Combinação",
    comoFazer: "Quatro ou mais exercícios do mesmo músculo, emendados sem parar.",
  },
  {
    id: "super-serie",
    nome: "Super-série (agonista/antagonista)",
    grupo: "Combinação",
    comoFazer:
      "Dois exercícios de músculos opostos, sem descanso — por exemplo bíceps e logo tríceps.",
  },
  {
    id: "pre-exaustao",
    nome: "Pré-exaustão",
    grupo: "Combinação",
    comoFazer:
      "Primeiro o exercício isolado, depois o composto para o mesmo músculo, já cansado.",
  },
  {
    id: "pos-exaustao",
    nome: "Pós-exaustão",
    grupo: "Combinação",
    comoFazer: "Primeiro o exercício composto e, logo depois, o isolado até a falha.",
  },
  {
    id: "circuito",
    nome: "Circuito",
    grupo: "Combinação",
    comoFazer:
      "Vários exercícios em sequência com pouco ou nenhum descanso; ao terminar, recomeça.",
  },

  // ---------- tempo e tensão ----------
  {
    id: "isometria",
    nome: "Isometria (pausa)",
    grupo: "Tempo e tensão",
    comoFazer:
      "Segure parado no ponto mais difícil do movimento, de 2 a 5 segundos, em cada repetição.",
  },
  {
    id: "superlento",
    nome: "Superlento",
    grupo: "Tempo e tensão",
    comoFazer: "Cada repetição leva de 10 a 20 segundos, subindo e descendo bem devagar.",
  },
  {
    id: "tensao-continua",
    nome: "Tensão contínua",
    grupo: "Tempo e tensão",
    comoFazer:
      "Sem travar o movimento no fim nem descansar no começo: o músculo não alivia em nenhum momento.",
  },
  {
    id: "pico-contracao",
    nome: "Pico de contração",
    grupo: "Tempo e tensão",
    comoFazer: "Aperte o músculo por 1 a 2 segundos no ponto mais curto do movimento.",
  },
  {
    id: "oclusao",
    nome: "Oclusão vascular",
    grupo: "Tempo e tensão",
    comoFazer:
      "Carga leve com faixa apertando a raiz do membro. Só com acompanhamento do personal.",
  },
];

export function acharTecnica(id?: string | null): Tecnica | undefined {
  if (!id) return undefined;
  return TECNICAS.find((t) => t.id === id);
}

/** As técnicas agrupadas, na ordem em que aparecem na lista de escolha. */
export function tecnicasPorGrupo(): { grupo: string; itens: Tecnica[] }[] {
  const grupos: { grupo: string; itens: Tecnica[] }[] = [];
  for (const t of TECNICAS) {
    const atual = grupos.find((g) => g.grupo === t.grupo);
    if (atual) atual.itens.push(t);
    else grupos.push({ grupo: t.grupo, itens: [t] });
  }
  return grupos;
}

/** Sugestões de cadência para o campo de digitação. */
export const CADENCIAS_SUGERIDAS = [
  "2-0-1-0 — descer em 2s, subir em 1s",
  "3-1-1-0 — descer em 3s, 1s parado embaixo",
  "4-0-1-0 — ênfase na descida",
  "1-0-1-0 — ritmo normal",
  "2-2-2-0 — controlado com pausa",
];
