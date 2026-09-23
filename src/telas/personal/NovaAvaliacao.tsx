import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { hoje, supabase } from "../../lib/supabase";
import { Campo, Erro, Tela } from "../../ui";

const CAMPOS = [
  { chave: "peso", rotulo: "Peso (kg)", passo: "0.1" },
  { chave: "altura", rotulo: "Altura (m)", passo: "0.01" },
  { chave: "gordura", rotulo: "Gordura (%)", passo: "0.1" },
  { chave: "cintura", rotulo: "Cintura (cm)", passo: "0.5" },
  { chave: "quadril", rotulo: "Quadril (cm)", passo: "0.5" },
  { chave: "braco", rotulo: "Braço (cm)", passo: "0.5" },
  { chave: "coxa", rotulo: "Coxa (cm)", passo: "0.5" },
] as const;

export default function NovaAvaliacao() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [data, setData] = useState(hoje());
  const [valores, setValores] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function numero(v?: string) {
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!numero(valores.peso)) return setErro("O peso é obrigatório.");
    setOcupado(true);
    const { error } = await supabase.from("avaliacoes").insert({
      aluno_id: id,
      data,
      peso: numero(valores.peso),
      altura: numero(valores.altura),
      gordura: numero(valores.gordura),
      cintura: numero(valores.cintura),
      quadril: numero(valores.quadril),
      braco: numero(valores.braco),
      coxa: numero(valores.coxa),
      observacoes: observacoes.trim() || null,
      registrada_por: "personal",
    });
    setOcupado(false);
    if (error) return setErro(error.message);
    navegar(`/aluno/${id}`);
  }

  return (
    <Tela titulo="Nova avaliação" voltar={-1}>
      <form onSubmit={salvar} style={{ display: "grid", gap: 12 }}>
        <Erro>{erro}</Erro>

        <Campo rotulo="Data">
          <input
            id="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </Campo>

        <div className="dupla">
          {CAMPOS.map((c) => (
            <Campo key={c.chave} rotulo={c.rotulo}>
              <input
                id={c.chave}
                className="mono"
                inputMode="decimal"
                step={c.passo}
                type="number"
                placeholder="—"
                value={valores[c.chave] ?? ""}
                onChange={(e) =>
                  setValores({ ...valores, [c.chave]: e.target.value })
                }
              />
            </Campo>
          ))}
        </div>

        <Campo rotulo="Observações">
          <textarea
            id="obs"
            placeholder="Dobras cutâneas, disposição, dores relatadas…"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </Campo>

        <button className="botao" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Salvar avaliação"}
        </button>
      </form>
    </Tela>
  );
}
