import { supabase } from "./supabase";

/**
 * Fila de gravações pendentes.
 * Na academia a internet cai; as séries marcadas ficam guardadas no
 * próprio celular e sobem sozinhas quando a conexão volta.
 */
type Pendente = { tabela: string; dados: Record<string, unknown> };

const CHAVE = "prancheta.pendentes";

function ler(): Pendente[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "[]");
  } catch {
    return [];
  }
}

function gravar(lista: Pendente[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* modo privado do navegador: seguimos sem guardar */
  }
}

export function quantidadePendente(): number {
  return ler().length;
}

/** Tenta gravar agora; se falhar, guarda para depois. */
export async function gravaOuGuarda(
  tabela: string,
  dados: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase.from(tabela).insert(dados);
  if (!error) return true;
  gravar([...ler(), { tabela, dados }]);
  return false;
}

/** Sobe tudo que ficou pendente. Chamado quando a internet volta. */
export async function enviarPendentes(): Promise<number> {
  const lista = ler();
  if (!lista.length) return 0;
  const sobraram: Pendente[] = [];
  let enviados = 0;
  for (const item of lista) {
    const { error } = await supabase.from(item.tabela).insert(item.dados);
    if (error) sobraram.push(item);
    else enviados++;
  }
  gravar(sobraram);
  return enviados;
}

export function observarConexao(aoVoltar: () => void) {
  window.addEventListener("online", aoVoltar);
  return () => window.removeEventListener("online", aoVoltar);
}
