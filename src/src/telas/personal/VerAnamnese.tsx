import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dataBR, supabase } from "../../lib/supabase";
import { SECOES, alertasDoParq, aparece, type Respostas } from "../../lib/anamnese";
import type { Aluno } from "../../lib/tipos";
import { Carregando, Tela, Vazio } from "../../ui";

/** A anamnese como o personal vê: só leitura, com o PAR-Q em destaque. */
export default function VerAnamnese() {
  const { id } = useParams();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [respostas, setRespostas] = useState<Respostas | null>(null);
  const [quando, setQuando] = useState<string>("");
  const [concluida, setConcluida] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: a }, { data: ficha }] = await Promise.all([
        supabase.from("alunos").select("*").eq("id", id).single(),
        supabase
          .from("anamneses")
          .select("respostas, concluida, atualizada_em")
          .eq("aluno_id", id)
          .maybeSingle(),
      ]);
      setAluno((a as Aluno) ?? null);
      if (ficha) {
        setRespostas((ficha.respostas as Respostas) ?? {});
        setConcluida(Boolean(ficha.concluida));
        setQuando(ficha.atualizada_em as string);
      }
      setCarregando(false);
    })();
  }, [id]);

  if (carregando) return <Carregando />;

  if (!respostas) {
    return (
      <Tela titulo="Anamnese" sub={aluno?.nome} voltar={`/aluno/${id}`}>
        <Vazio>
          {aluno?.nome?.split(" ")[0] ?? "O aluno"} ainda não respondeu a ficha. Ela aparece para
          ele no primeiro acesso ao app.
        </Vazio>
      </Tela>
    );
  }

  const alertas = alertasDoParq(respostas);

  return (
    <Tela titulo="Anamnese" sub={aluno?.nome} voltar={`/aluno/${id}`}>
      <div className="meta">
        {concluida ? "Respondida" : "Começou a responder"} · atualizada em{" "}
        {dataBR(quando?.slice(0, 10))}
      </div>

      {alertas.length > 0 && (
        <div className="cartao" style={{ display: "flex", gap: 10 }}>
          <div className="faixa" />
          <div>
            <div className="nome">
              {alertas.length} {alertas.length === 1 ? "resposta" : "respostas"} SIM no PAR-Q
            </div>
            <div className="meta" style={{ marginTop: 3, lineHeight: 1.45 }}>
              Peça a liberação médica antes de prescrever carga. As perguntas estão marcadas
              abaixo.
            </div>
          </div>
        </div>
      )}

      {SECOES.map((secao) => {
        const visiveis = secao.perguntas.filter(
          (p) => aparece(p, respostas) && respostas[p.id]?.trim()
        );
        if (!visiveis.length) return null;
        return (
          <div key={secao.id} className="cartao">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {secao.titulo}
            </div>
            {visiveis.map((p) => {
              const alerta = p.alertaSeSim && respostas[p.id] === "Sim";
              return (
                <div key={p.id} className="resposta">
                  <div className="resposta-pergunta">{p.texto}</div>
                  <div className={"resposta-valor" + (alerta ? " alerta" : "")}>
                    {respostas[p.id]}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </Tela>
  );
}
