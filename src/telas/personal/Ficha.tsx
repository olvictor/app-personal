import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { dataBR, idade, soDigitos, supabase } from "../../lib/supabase";
import type { Aluno, Avaliacao, Treino } from "../../lib/tipos";
import { Carregando, EscolherFoto, GraficoPeso, Tela, Vazio } from "../../ui";
import { enviarFoto } from "../../lib/foto";
import { useRecarregarAoVoltar } from "../../lib/recarregar";
import { AcessoCriado } from "./NovoAluno";

type Aba = "dados" | "medidas" | "treinos";

export default function Ficha() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [aba, setAba] = useState<Aba>("dados");
  const [carregando, setCarregando] = useState(true);
  const [acesso, setAcesso] = useState<{ senha: string; login: string; nome: string } | null>(
    null
  );
  const [ocupado, setOcupado] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState("");

  async function carregar() {
    if (!id) return;
    const [a, av, tr] = await Promise.all([
      supabase.from("alunos").select("*").eq("id", id).single(),
      supabase.from("avaliacoes").select("*").eq("aluno_id", id).order("data"),
      supabase.from("treinos").select("*").eq("aluno_id", id).order("nome"),
    ]);
    setAluno((a.data as Aluno) ?? null);
    setAvaliacoes((av.data as Avaliacao[]) ?? []);
    setTreinos((tr.data as Treino[]) ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useRecarregarAoVoltar(carregar);

  async function criarAcesso() {
    if (!aluno) return;
    setOcupado(true);
    const { data, error } = await supabase.functions.invoke("criar-acesso", {
      body: { aluno_id: aluno.id },
    });
    setOcupado(false);
    if (error || !data?.senha) {
      alert("Não consegui criar o acesso agora. Tente de novo em instantes.");
      return;
    }
    setAcesso({ senha: data.senha, login: data.login, nome: data.nome });
  }

  async function novaFicha() {
    if (!aluno) return;
    const letra = String.fromCharCode(65 + treinos.length); // A, B, C…
    const { data } = await supabase
      .from("treinos")
      .insert({ aluno_id: aluno.id, nome: `Treino ${letra}`, foco: "" })
      .select()
      .single();
    if (data) navegar(`/treino/${data.id}`);
  }

  async function trocarFoto(arquivo: File) {
    if (!aluno) return;
    setErroFoto("");
    setEnviandoFoto(true);
    // a foto vai para a pasta do personal, com o id do aluno no nome
    const resultado = await enviarFoto(arquivo, `aluno-${aluno.id}`);
    if ("erro" in resultado) {
      setEnviandoFoto(false);
      return setErroFoto(resultado.erro);
    }
    const { error } = await supabase
      .from("alunos")
      .update({ foto_url: resultado.url })
      .eq("id", aluno.id);
    setEnviandoFoto(false);
    if (error) return setErroFoto(error.message);
    setAluno({ ...aluno, foto_url: resultado.url });
  }

  async function trocarStatus() {
    if (!aluno) return;
    const novo = aluno.status === "ativo" ? "pausado" : "ativo";
    await supabase.from("alunos").update({ status: novo }).eq("id", aluno.id);
    setAluno({ ...aluno, status: novo as Aluno["status"] });
  }

  if (carregando) return <Carregando />;
  if (!aluno)
    return (
      <Tela titulo="Aluno" voltar="/alunos">
        <Vazio>Não encontrei esse aluno.</Vazio>
      </Tela>
    );

  if (acesso)
    return (
      <AcessoCriado
        acesso={acesso}
        celular={aluno.celular}
        aoFechar={() => {
          setAcesso(null);
          carregar();
        }}
      />
    );

  const ultima = avaliacoes[avaliacoes.length - 1];
  const imc =
    ultima?.peso && ultima?.altura
      ? (Number(ultima.peso) / (Number(ultima.altura) * Number(ultima.altura))).toFixed(1)
      : null;

  return (
    <Tela titulo="Ficha do aluno" sub={aluno.nome} voltar="/alunos">
      <div className="linha" style={{ gap: 14 }}>
        <EscolherFoto
          nome={aluno.nome}
          foto={aluno.foto_url}
          enviando={enviandoFoto}
          aoEscolher={trocarFoto}
          tamanho={68}
        />
        <div style={{ minWidth: 0 }}>
          <div className="nome" style={{ fontSize: 17 }}>
            {aluno.nome}
          </div>
          <div className="meta">
            {[aluno.objetivo, aluno.frequencia, idade(aluno.nascimento)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>

      {erroFoto && <div className="aviso erro">{erroFoto}</div>}

      <div className="segmentos" role="group" aria-label="Seções da ficha">
        {(["dados", "medidas", "treinos"] as const).map((x) => (
          <button key={x} type="button" aria-pressed={aba === x} onClick={() => setAba(x)}>
            {x === "dados" ? "Dados" : x === "medidas" ? "Medidas" : "Treinos"}
          </button>
        ))}
      </div>

      {aba === "dados" && (
        <>
          {aluno.observacoes && (
            <div className="cartao" style={{ display: "flex", gap: 10 }}>
              <div className="faixa" />
              <div>
                <div className="eyebrow" style={{ color: "var(--tinta-2)" }}>
                  Atenção na prescrição
                </div>
                <div style={{ fontSize: 13.5, marginTop: 3 }}>{aluno.observacoes}</div>
              </div>
            </div>
          )}

          <div className="cartao">
            <dl style={{ margin: 0 }}>
              <div className="par">
                <dt>Celular</dt>
                <dd className="mono">{aluno.celular}</dd>
              </div>
              <div className="par">
                <dt>Nascimento</dt>
                <dd className="mono">{dataBR(aluno.nascimento)}</dd>
              </div>
              <div className="par">
                <dt>Objetivo</dt>
                <dd>{aluno.objetivo || "—"}</dd>
              </div>
              <div className="par">
                <dt>Aluno desde</dt>
                <dd>{dataBR(aluno.criado_em)}</dd>
              </div>
              <div className="par">
                <dt>Acesso ao app</dt>
                <dd>{aluno.user_id ? "Criado" : "Ainda não criado"}</dd>
              </div>
            </dl>
          </div>

          <button className="botao" onClick={criarAcesso} disabled={ocupado}>
            {ocupado
              ? "Gerando…"
              : aluno.user_id
              ? "Reenviar senha provisória"
              : "Criar acesso do aluno"}
          </button>

          <a
            className="botao fantasma"
            href={`https://wa.me/55${soDigitos(aluno.celular)}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir conversa no WhatsApp
          </a>

          <Link className="botao fantasma" to={`/aluno/${aluno.id}/anamnese`}>
            Ver anamnese
          </Link>

          <button className="botao fantasma" onClick={trocarStatus}>
            {aluno.status === "ativo" ? "Colocar em pausa" : "Reativar aluno"}
          </button>
        </>
      )}

      {aba === "medidas" && (
        <>
          {!ultima && <Vazio>Nenhuma avaliação registrada ainda.</Vazio>}

          {ultima && (
            <>
              <div className="dupla">
                <Ladrilho rot="Peso" num={ultima.peso} uni="kg" />
                <Ladrilho rot="Altura" num={ultima.altura} uni="m" casas={2} />
                <Ladrilho rot="IMC" num={imc ? Number(imc) : null} />
                <Ladrilho rot="Gordura" num={ultima.gordura} uni="%" />
              </div>

              <div className="cartao">
                <div className="eyebrow" style={{ marginBottom: 2 }}>
                  Peso ao longo do tempo
                </div>
                <GraficoPeso
                  pontos={avaliacoes
                    .filter((a) => a.peso != null)
                    .map((a) => ({
                      rotulo: dataBR(a.data).slice(0, 5),
                      valor: Number(a.peso),
                    }))}
                />
              </div>

              <div className="cartao">
                <dl style={{ margin: 0 }}>
                  <Par rot="Cintura" v={ultima.cintura} uni="cm" />
                  <Par rot="Quadril" v={ultima.quadril} uni="cm" />
                  <Par rot="Braço" v={ultima.braco} uni="cm" />
                  <Par rot="Coxa" v={ultima.coxa} uni="cm" />
                  <div className="par">
                    <dt>Medida em</dt>
                    <dd className="mono">{dataBR(ultima.data)}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}

          <Link className="botao" to={`/aluno/${aluno.id}/avaliacao`}>
            + Nova avaliação
          </Link>
        </>
      )}

      {aba === "treinos" && (
        <>
          {treinos.length === 0 && <Vazio>Nenhuma ficha montada ainda.</Vazio>}

          {treinos.map((t) => (
            <Link className="cartao" key={t.id} to={`/treino/${t.id}`}>
              <div className="linha">
                <div className="avatar brass">{t.nome.replace(/\D/g, "") || t.nome.slice(-1)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="nome">
                    {t.nome}
                    {t.foco ? ` · ${t.foco}` : ""}
                  </div>
                  <div className="meta">{t.ativo ? "Em uso" : "Arquivada"}</div>
                </div>
                <div className="meta" aria-hidden="true">
                  ›
                </div>
              </div>
            </Link>
          ))}

          <button className="botao" onClick={novaFicha}>
            + Nova ficha
          </button>
        </>
      )}
    </Tela>
  );
}

function Ladrilho({
  rot,
  num,
  uni,
  casas = 1,
}: {
  rot: string;
  num: number | null;
  uni?: string;
  casas?: number;
}) {
  return (
    <div className="ladrilho">
      <div className="rot">{rot}</div>
      <div className="num">
        {num == null ? "—" : Number(num).toFixed(casas).replace(".", ",")}
        {uni && num != null && <small>{uni}</small>}
      </div>
    </div>
  );
}

function Par({ rot, v, uni }: { rot: string; v: number | null; uni: string }) {
  return (
    <div className="par">
      <dt>{rot}</dt>
      <dd className="mono">{v == null ? "—" : `${v} ${uni}`}</dd>
    </div>
  );
}
