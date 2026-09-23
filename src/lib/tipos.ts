export type Personal = {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  celular: string | null;
  cref: string | null;
  local: string | null;
};

export type Aluno = {
  id: string;
  personal_id: string;
  user_id: string | null;
  nome: string;
  celular: string;
  celular_login: string;
  nascimento: string | null;
  objetivo: string | null;
  frequencia: string | null;
  observacoes: string | null;
  status: "ativo" | "pausado" | "inativo";
  criado_em: string;
};

export type Avaliacao = {
  id: string;
  aluno_id: string;
  data: string;
  peso: number | null;
  altura: number | null;
  gordura: number | null;
  cintura: number | null;
  quadril: number | null;
  braco: number | null;
  coxa: number | null;
  observacoes: string | null;
  registrada_por: "personal" | "aluno";
};

export type Treino = {
  id: string;
  aluno_id: string;
  nome: string;
  foco: string | null;
  dias_semana: number[] | null;
  ativo: boolean;
  recado: string | null;
};

export type TreinoExercicio = {
  id: string;
  treino_id: string;
  exercicio_id: string | null;
  nome: string;
  ordem: number;
  series: number;
  repeticoes: string;
  carga: string | null;
  descanso_seg: number;
  rir: string | null;
  observacao: string | null;
  midia_url: string | null; 
};

export type Exercicio = {
  id: string;
  personal_id: string;
  nome: string;
  grupo: string | null;
  equipamento: string | null;
   video_url: string | null;  
};

export type Sessao = {
  id: string;
  aluno_id: string;
  treino_id: string | null;
  iniciada_em: string;
  concluida_em: string | null;
  percepcao: number | null;
};

export type SessaoSerie = {
  id: string;
  sessao_id: string;
  treino_exercicio_id: string | null;
  numero: number;
  reps_feitas: string | null;
  carga_usada: string | null;
};

export type Agendamento = {
  id: string;
  personal_id: string;
  aluno_id: string;
  treino_id: string | null;
  dia_semana: number;
  hora: string;
  ativo: boolean;
};

export const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const OBJETIVOS = [
  "Hipertrofia",
  "Emagrecimento",
  "Condicionamento",
  "Reabilitação",
  "Pós-parto",
  "Saúde geral",
];
