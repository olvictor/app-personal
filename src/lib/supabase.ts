import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const DOMINIO_INTERNO =
  (import.meta.env.VITE_DOMINIO_INTERNO as string) || "alunos.prancheta.local";

/** Falso enquanto o .env não estiver preenchido. */
export const configurado = Boolean(url && chave);

export const supabase = createClient(
  url || "https://exemplo.supabase.co",
  chave || "chave-de-exemplo",
  { auth: { persistSession: true, autoRefreshToken: true } }
);

/** Deixa só os dígitos: "(11) 98844-2170" vira "11988442170". */
export function soDigitos(texto: string): string {
  return (texto || "").replace(/\D/g, "");
}

/** Formata para exibição: "11988442170" vira "(11) 98844-2170". */
export function formataCelular(texto: string): string {
  const d = soDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** O celular vira o identificador da conta do aluno. Não é e-mail de verdade. */
export function emailInterno(celular: string): string {
  return `${soDigitos(celular)}@${DOMINIO_INTERNO}`;
}

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dataBR(iso?: string | null): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function idade(nascimento?: string | null): string {
  if (!nascimento) return "—";
  const n = new Date(nascimento + "T00:00:00");
  const agora = new Date();
  let anos = agora.getFullYear() - n.getFullYear();
  const m = agora.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && agora.getDate() < n.getDate())) anos--;
  return `${anos} anos`;
}
