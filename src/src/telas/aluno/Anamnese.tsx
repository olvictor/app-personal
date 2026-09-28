import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import {
  SECOES,
  alertasDoParq,
  aparece,
  pendencias,
  type Pergunta,
  type Respostas,
} from "../../lib/anamnese";
import { Campo, Carregando, Erro, Tela } from "../../ui";

export default function Anamnese() {
  const { quem } = useSessao();
  const navegar = useNavigate();

  const [respostas, setRespostas] = useState<Respostas>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [jaRespondida, setJaRespondida] = useState(false);
  const [mostrarPendencias, setMostrarPendencias] = useState(false);

  useEffect(() => {
    if (quem.tipo !== "aluno") return;
    (async () => {
      const { data } = await supabase
        .from("anamneses")
        .select("respostas, concluida")
        .eq("aluno_id", quem.aluno.id)
        .maybeSingle();
      if (data) {
        setRespostas((data.respostas as Respostas) ?? {});
        setJaRespondida(Boolean(data.concluida));
      }
      setCarregando(false);
    })();
  }, [quem]);

  if (quem.tipo !== "aluno") return null;
  if (carregando) return <Carregando />;

  const responder = (id: string, valor: string) => {
    setRespostas((antes) => ({ ...antes, [id]: valor }));
    setErro("");
  };

  const faltando = pendencias(respostas);
  const alertas = alertasDoParq(respostas);

  async function salvar() {
    if (quem.tipo !== "aluno") return;
    if (faltando.length) {
      setMostrarPendencias(true);
      setErro(
        `Falta responder ${faltando.length === 1 ? "1 pergunta" : `${faltando.length} perguntas`}. Elas estão marcadas em vermelho.`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from("anamneses").upsert(
      {
        aluno_id: quem.aluno.id,
        respostas,
        concluida: true,
      },
      { onConflict: "aluno_id" }
    );
    setSalvando(false);
    if (error) return setErro(error.message);
    navegar("/hoje");
  }

  return (
    <Tela
      titulo={jaRespondida ? "Minha anamnese" : "Antes de começar"}
      sub={jaRespondida ? "Atualize quando algo mudar" : "Leva uns 3 minutos"}
      voltar={jaRespondida ? "/meu-perfil" : undefined}
    >
      {!jaRespondida && (
        <div className="aviso">
          Estas respostas são o que permite montar um treino seguro para você. Só o seu personal
          vê o que você escrever aqui.
        </div>
      )}

      <Erro>{erro}</Erro>

      {alertas.length > 0 && (
        <div className="cartao" style={{ display: "flex", gap: 10 }}>
          <div className="faixa" />
          <div>
            <div className="nome">Procure um médico antes de treinar</div>
            <div className="meta" style={{ marginTop: 3, lineHeight: 1.45 }}>
              Você respondeu <b>sim</b> em {alertas.length}{" "}
              {alertas.length === 1 ? "pergunta" : "perguntas"} do PAR-Q. Isso não impede o
              treino, mas pede liberação médica antes. Seu personal vai ver este aviso.
            </div>
          </div>
        </div>
      )}

      {SECOES.map((secao) => (
        <div key={secao.id} style={{ display: "grid", gap: 12, marginTop: 6 }}>
          <div>
            <div className="eyebrow">{secao.titulo}</div>
            {secao.descricao && (
              <div className="meta" style={{ marginTop: 4, lineHeight: 1.45 }}>
                {secao.descricao}
              </div>
            )}
          </div>

          {secao.perguntas
            .filter((p) => aparece(p, respostas))
            .map((p) => (
              <PerguntaNaTela
                key={p.id}
                pergunta={p}
                valor={respostas[p.id] ?? ""}
                aoResponder={(v) => responder(p.id, v)}
                pendente={mostrarPendencias && faltando.some((f) => f.id === p.id)}
              />
            ))}
        </div>
      ))}

      <button className="botao" onClick={salvar} disabled={salvando}>
        {salvando ? "Salvando…" : jaRespondida ? "Salvar alterações" : "Concluir ficha"}
      </button>

      {!jaRespondida && (
        <button className="botao fantasma" onClick={() => navegar("/hoje")}>
          Responder depois
        </button>
      )}
    </Tela>
  );
}

function PerguntaNaTela({
  pergunta,
  valor,
  aoResponder,
  pendente,
}: {
  pergunta: Pergunta;
  valor: string;
  aoResponder: (v: string) => void;
  pendente: boolean;
}) {
  const acendeAlerta = pergunta.alertaSeSim && valor === "Sim";

  if (pergunta.tipo === "sim_nao" || pergunta.tipo === "escolha") {
    const opcoes = pergunta.tipo === "sim_nao" ? ["Sim", "Não"] : pergunta.opcoes ?? [];
    return (
      <div className={"pergunta" + (pendente ? " pendente" : "")}>
        <div className="pergunta-texto">
          {pergunta.texto}
          {pergunta.obrigatoria && <span className="obrigatoria"> *</span>}
        </div>
        {pergunta.ajuda && <div className="meta">{pergunta.ajuda}</div>}
        <div className="opcoes">
          {opcoes.map((o) => (
            <button
              key={o}
              type="button"
              className="opcao"
              aria-pressed={valor === o}
              data-alerta={acendeAlerta && valor === o ? "1" : "0"}
              onClick={() => aoResponder(valor === o ? "" : o)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={"pergunta" + (pendente ? " pendente" : "")}>
      <div className="pergunta-texto">
        {pergunta.texto}
        {pergunta.obrigatoria && <span className="obrigatoria"> *</span>}
      </div>
      {pergunta.ajuda && <div className="meta">{pergunta.ajuda}</div>}
      <Campo rotulo="Resposta">
        {pergunta.tipo === "texto_longo" ? (
          <textarea
            value={valor}
            placeholder="Escreva aqui"
            onChange={(e) => aoResponder(e.target.value)}
          />
        ) : (
          <input
            type={pergunta.tipo === "numero" ? "number" : "text"}
            inputMode={pergunta.tipo === "numero" ? "numeric" : undefined}
            value={valor}
            placeholder="Escreva aqui"
            onChange={(e) => aoResponder(e.target.value)}
          />
        )}
      </Campo>
    </div>
  );
}
