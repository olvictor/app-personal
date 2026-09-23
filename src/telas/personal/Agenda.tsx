import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { DIAS } from "../../lib/tipos";
import type { Agendamento, Aluno } from "../../lib/tipos";
import { Campo, Carregando, Tela } from "../../ui";

export default function Agenda() {
  const { quem } = useSessao();
  const [itens, setItens] = useState<Agendamento[] | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [novoAluno, setNovoAluno] = useState("");
  const [dia, setDia] = useState(1);
  const [hora, setHora] = useState("07:00");
  const [abrindo, setAbrindo] = useState(false);

  async function carregar() {
    const [{ data: ag }, { data: al }] = await Promise.all([
      supabase.from("agendamentos").select("*").order("hora"),
      supabase.from("alunos").select("*").order("nome"),
    ]);
    setItens((ag as Agendamento[]) ?? []);
    setAlunos((al as Aluno[]) ?? []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function marcar() {
    if (quem.tipo !== "personal" || !novoAluno) return;
    await supabase.from("agendamentos").insert({
      personal_id: quem.personal.id,
      aluno_id: novoAluno,
      dia_semana: dia,
      hora,
    });
    setAbrindo(false);
    setNovoAluno("");
    carregar();
  }

  async function apagar(id: string) {
    await supabase.from("agendamentos").delete().eq("id", id);
    setItens((antes) => (antes ?? []).filter((i) => i.id !== id));
  }

  const nomeDoAluno = (id: string) => alunos.find((a) => a.id === id)?.nome ?? "Aluno";

  if (itens === null) return <Carregando />;

  return (
    <Tela titulo="Agenda" sub="Sua semana fixa" abas="personal">
      {DIAS.map((d, i) => {
        const doDia = itens.filter((x) => x.dia_semana === i);
        return (
          <div className="cartao" key={d}>
            <div className="linha" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow">{d}</div>
              <div className="meta">{doDia.length ? `${doDia.length} sessões` : "livre"}</div>
            </div>
            {doDia.map((x) => (
              <div className="par" key={x.id}>
                <dt style={{ fontSize: 14, color: "var(--tinta)" }}>
                  <Link
                    to={`/aluno/${x.aluno_id}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {nomeDoAluno(x.aluno_id)}
                  </Link>
                </dt>
                <dd className="mono" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {x.hora.slice(0, 5)}
                  <button
                    className="link-texto"
                    onClick={() => apagar(x.id)}
                    aria-label="Remover horário"
                  >
                    remover
                  </button>
                </dd>
              </div>
            ))}
          </div>
        );
      })}

      {abrindo ? (
        <div className="cartao plano" style={{ display: "grid", gap: 10 }}>
          <Campo rotulo="Aluno">
            <select
              id="aluno-agenda"
              value={novoAluno}
              onChange={(e) => setNovoAluno(e.target.value)}
            >
              <option value="">Escolha…</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </Campo>
          <div className="dupla">
            <Campo rotulo="Dia">
              <select id="dia" value={dia} onChange={(e) => setDia(Number(e.target.value))}>
                {DIAS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Hora">
              <input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </Campo>
          </div>
          <button className="botao" onClick={marcar} disabled={!novoAluno}>
            Marcar sessão
          </button>
          <button className="botao fantasma" onClick={() => setAbrindo(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button className="botao" onClick={() => setAbrindo(true)}>
          + Marcar sessão
        </button>
      )}
    </Tela>
  );
}
