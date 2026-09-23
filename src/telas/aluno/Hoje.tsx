import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import type { Sessao, Treino, TreinoExercicio } from "../../lib/tipos";
import { Carregando, Tela, Vazio } from "../../ui";

export default function Hoje() {
  const { quem } = useSessao();
  const [treinos, setTreinos] = useState<Treino[] | null>(null);
  const [exercicios, setExercicios] = useState<TreinoExercicio[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [personal, setPersonal] = useState<string>("");

  const diaHoje = new Date().getDay();

  useEffect(() => {
    if (quem.tipo !== "aluno") return;
    (async () => {
      const [{ data: tr }, { data: se }, { data: pe }] = await Promise.all([
        supabase.from("treinos").select("*").eq("ativo", true).order("nome"),
        supabase
          .from("sessoes")
          .select("*")
          .order("iniciada_em", { ascending: false })
          .limit(20),
        supabase.from("personais").select("nome").eq("id", quem.aluno.personal_id).maybeSingle(),
      ]);
      const lista = (tr as Treino[]) ?? [];
      setTreinos(lista);
      setSessoes((se as Sessao[]) ?? []);
      setPersonal((pe as { nome: string } | null)?.nome ?? "seu personal");

      if (lista.length) {
        const { data: ex } = await supabase
          .from("treino_exercicios")
          .select("*")
          .in(
            "treino_id",
            lista.map((t) => t.id)
          );
        setExercicios((ex as TreinoExercicio[]) ?? []);
      }
    })();
  }, [quem]);

  if (quem.tipo !== "aluno") return null;
  if (treinos === null) return <Carregando />;

  const doDia = treinos.filter((t) => (t.dias_semana ?? []).includes(diaHoje));
  const outros = treinos.filter((t) => !doDia.includes(t));
  const primeiroNome = quem.aluno.nome.split(" ")[0];

  const estaSemana = sessoes.filter((s) => {
    const d = new Date(s.iniciada_em);
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    return d >= inicioSemana && s.concluida_em;
  }).length;

  return (
    <Tela abas="aluno">
      <div>
        <div className="eyebrow">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <div className="display" style={{ fontSize: 28, marginTop: 2 }}>
          Bom treino, {primeiroNome}
        </div>
      </div>

      {doDia.length === 0 && outros.length === 0 && (
        <Vazio>
          {personal} ainda não montou sua ficha. Assim que montar, ela aparece aqui.
        </Vazio>
      )}

      {doDia.length === 0 && outros.length > 0 && (
        <div className="aviso">Hoje é dia de descanso na sua ficha. Bora fazer outro?</div>
      )}

      {[...doDia, ...outros].map((t, i) => {
        const qtd = exercicios.filter((e) => e.treino_id === t.id).length;
        const series = exercicios
          .filter((e) => e.treino_id === t.id)
          .reduce((soma, e) => soma + (e.series || 0), 0);
        const ehHoje = doDia.includes(t);
        return (
          <Link className="cartao" key={t.id} to={`/treino/${t.id}/executar`}>
            <div className="linha" style={{ justifyContent: "space-between" }}>
              <span className={"selo " + (ehHoje ? "aviso" : "")}>
                {ehHoje ? "Hoje" : "Outro dia"}
              </span>
              <span className="meta mono">
                {qtd} exercícios · {series} séries
              </span>
            </div>
            <div className="nome" style={{ fontSize: 17, marginTop: 9 }}>
              {t.nome}
              {t.foco ? ` · ${t.foco}` : ""}
            </div>
            {i === 0 && (
              <div
                style={{
                  marginTop: 10,
                  fontWeight: 600,
                  color: "var(--vinho)",
                  fontSize: 14,
                }}
              >
                Começar treino →
              </div>
            )}
          </Link>
        );
      })}

      {doDia[0]?.recado && (
        <div className="cartao" style={{ display: "flex", gap: 10 }}>
          <div className="faixa" />
          <div>
            <div className="eyebrow" style={{ color: "var(--tinta-2)" }}>
              Recado de {personal.split(" ")[0]}
            </div>
            <div style={{ fontSize: 13.5, marginTop: 3 }}>{doDia[0].recado}</div>
          </div>
        </div>
      )}

      <div className="dupla">
        <div className="ladrilho">
          <div className="rot">Esta semana</div>
          <div className="num">
            {estaSemana}
            <small>treinos</small>
          </div>
        </div>
        <div className="ladrilho">
          <div className="rot">No total</div>
          <div className="num">
            {sessoes.filter((s) => s.concluida_em).length}
            <small>treinos</small>
          </div>
        </div>
      </div>
    </Tela>
  );
}
