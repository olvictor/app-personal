import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { DIAS } from "../../lib/tipos";
import type { Aluno, Exercicio, Treino, TreinoExercicio } from "../../lib/tipos";
import { Campo, Carregando, Erro, Midia, Tela, Vazio } from "../../ui";
import { CADENCIAS_SUGERIDAS, acharTecnica, tecnicasPorGrupo } from "../../lib/tecnicas";

export default function EditorDeTreino() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { quem } = useSessao();

  const [treino, setTreino] = useState<Treino | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [itens, setItens] = useState<TreinoExercicio[]>([]);
  const [catalogo, setCatalogo] = useState<Exercicio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: t } = await supabase.from("treinos").select("*").eq("id", id).single();
      if (!t) return setCarregando(false);
      setTreino(t as Treino);

      const [{ data: a }, { data: ex }, { data: cat }] = await Promise.all([
        supabase.from("alunos").select("*").eq("id", t.aluno_id).single(),
        supabase.from("treino_exercicios").select("*").eq("treino_id", id).order("ordem"),
        supabase.from("exercicios").select("*").order("grupo"),
      ]);
      setAluno((a as Aluno) ?? null);
      setItens((ex as TreinoExercicio[]) ?? []);

      let lista = (cat as Exercicio[]) ?? [];
      if (lista.length === 0) {
        // primeira vez neste navegador: carrega o catálogo inicial e busca de novo
        await supabase.rpc("semear_exercicios");
        const { data: novo } = await supabase.from("exercicios").select("*").order("grupo");
        lista = (novo as Exercicio[]) ?? [];
      }
      setCatalogo(lista);
      setCarregando(false);
    })();
  }, [id]);

  /**
   * Link que vale para este exercício: o digitado na ficha e, quando ele
   * está vazio, o que está guardado no catálogo. Campo em branco nunca
   * apaga o vídeo — só quer dizer "usa o do catálogo".
   */
  function midiaDoItem(it: TreinoExercicio): string | null {
    const daFicha = it.midia_url?.trim();
    if (daFicha) return daFicha;
    const doCatalogo = catalogo.find((c) => c.id === it.exercicio_id);
    return doCatalogo?.video_url?.trim() || null;
  }

  function mudaItem(indice: number, campo: keyof TreinoExercicio, valor: string | number) {
    setItens((antes) =>
      antes.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it))
    );
    setSalvo(false);
  }

  async function adicionar(exercicioId: string | null, nomeLivre?: string) {
    if (!treino) return;
    const doCatalogo = exercicioId ? catalogo.find((c) => c.id === exercicioId) : undefined;
    const { data, error } = await supabase
      .from("treino_exercicios")
      .insert({
        treino_id: treino.id,
        exercicio_id: doCatalogo?.id ?? null,
        nome: doCatalogo?.nome ?? nomeLivre ?? "Exercício novo",
        midia_url: doCatalogo?.video_url ?? null,
        ordem: itens.length,
        series: 3,
        repeticoes: "10",
        descanso_seg: 60,
      })
      .select()
      .single();
    if (error) return setErro(error.message);
    if (data) setItens([...itens, data as TreinoExercicio]);
  }

  async function remover(item: TreinoExercicio) {
    if (!confirm(`Tirar "${item.nome}" da ficha?`)) return;
    await supabase.from("treino_exercicios").delete().eq("id", item.id);
    setItens(itens.filter((i) => i.id !== item.id));
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= itens.length) return;
    const copia = [...itens];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    setItens(copia.map((it, i) => ({ ...it, ordem: i })));
    setSalvo(false);
  }

  async function salvar() {
    if (!treino) return;
    setSalvando(true);
    setErro("");

    const { error: e1 } = await supabase
      .from("treinos")
      .update({
        nome: treino.nome,
        foco: treino.foco,
        dias_semana: treino.dias_semana ?? [],
        recado: treino.recado,
        ativo: treino.ativo,
      })
      .eq("id", treino.id);

    const { error: e2 } = await supabase.from("treino_exercicios").upsert(
      itens.map((it, i) => ({
        id: it.id,
        treino_id: treino.id,
        exercicio_id: it.exercicio_id,
        nome: it.nome,
        ordem: i,
        series: Number(it.series) || 1,
        repeticoes: String(it.repeticoes || "10"),
        carga: it.carga,
        descanso_seg: Number(it.descanso_seg) || 60,
        rir: it.rir,
        observacao: it.observacao,
        midia_url: midiaDoItem(it),
        cadencia: it.cadencia?.trim() || null,
        tecnica: it.tecnica || null,
      }))
    );

    // o link também vai para o catálogo, se o exercício ainda não tinha um:
    // assim vale para os outros alunos sem você digitar de novo
    for (const it of itens) {
      const doCatalogo = catalogo.find((c) => c.id === it.exercicio_id);
      if (it.midia_url?.trim() && doCatalogo && !doCatalogo.video_url) {
        await supabase
          .from("exercicios")
          .update({ video_url: it.midia_url.trim() })
          .eq("id", doCatalogo.id);
      }
    }

    setSalvando(false);
    if (e1 || e2) return setErro((e1 ?? e2)!.message);
    setSalvo(true);
  }

  async function apagarFicha() {
    if (!treino) return;
    if (!confirm(`Apagar a ficha "${treino.nome}" inteira?`)) return;
    await supabase.from("treinos").delete().eq("id", treino.id);
    navegar(`/aluno/${treino.aluno_id}`);
  }

  if (carregando) return <Carregando />;
  if (!treino)
    return (
      <Tela titulo="Ficha" voltar="/alunos">
        <Vazio>Não encontrei essa ficha.</Vazio>
      </Tela>
    );

  const dias = treino.dias_semana ?? [];

  return (
    <Tela titulo={treino.nome} sub={aluno?.nome} voltar={`/aluno/${treino.aluno_id}`}>
      <Erro>{erro}</Erro>
      {salvo && <div className="aviso ok">Ficha salva. O aluno já vê a versão nova.</div>}

      <div className="dupla">
        <Campo rotulo="Nome da ficha">
          <input
            id="nome-ficha"
            value={treino.nome}
            onChange={(e) => {
              setTreino({ ...treino, nome: e.target.value });
              setSalvo(false);
            }}
          />
        </Campo>
        <Campo rotulo="Foco">
          <input
            id="foco"
            placeholder="Peito e tríceps"
            value={treino.foco ?? ""}
            onChange={(e) => {
              setTreino({ ...treino, foco: e.target.value });
              setSalvo(false);
            }}
          />
        </Campo>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Dias da semana
        </div>
        <div className="segmentos">
          {DIAS.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={dias.includes(i)}
              onClick={() => {
                const novos = dias.includes(i)
                  ? dias.filter((x) => x !== i)
                  : [...dias, i].sort();
                setTreino({ ...treino, dias_semana: novos });
                setSalvo(false);
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {itens.length === 0 && <Vazio>Ficha vazia. Escolha o primeiro exercício abaixo.</Vazio>}

      {itens.map((it, i) => (
        <div className="cartao" key={it.id}>
          <div className="linha" style={{ alignItems: "flex-start" }}>
            <div className="n mono" style={{ color: "var(--tinta-3)", fontSize: 11, paddingTop: 4 }}>
              {i + 1}
            </div>
            <input
              className="nome"
              style={{
                flex: 1,
                border: 0,
                background: "transparent",
                color: "var(--tinta)",
                font: "inherit",
                fontWeight: 600,
                outline: "none",
                minWidth: 0,
              }}
              value={it.nome}
              onChange={(e) => mudaItem(i, "nome", e.target.value)}
            />
            <button
              className="voltar"
              type="button"
              aria-label="Subir"
              onClick={() => mover(i, -1)}
            >
              ↑
            </button>
            <button
              className="voltar"
              type="button"
              aria-label="Descer"
              onClick={() => mover(i, 1)}
            >
              ↓
            </button>
          </div>

          <div className="dupla" style={{ marginTop: 10 }}>
            <Campo rotulo="Séries">
              <input
                className="mono"
                inputMode="numeric"
                value={it.series}
                onChange={(e) => mudaItem(i, "series", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Repetições">
              <input
                className="mono"
                value={it.repeticoes}
                placeholder="8 a 10"
                onChange={(e) => mudaItem(i, "repeticoes", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Carga">
              <input
                className="mono"
                placeholder="42 kg"
                value={it.carga ?? ""}
                onChange={(e) => mudaItem(i, "carga", e.target.value)}
              />
            </Campo>
            <Campo rotulo="Descanso (s)">
              <input
                className="mono"
                inputMode="numeric"
                value={it.descanso_seg}
                onChange={(e) => mudaItem(i, "descanso_seg", e.target.value)}
              />
            </Campo>
          </div>

          <Campo rotulo="Vídeo ou GIF (link)">
            <input
              placeholder={
                midiaDoItem(it) && !it.midia_url?.trim()
                  ? "usando o vídeo do catálogo"
                  : "youtube.com/watch?v=… ou .../agachamento.gif"
              }
              value={it.midia_url ?? ""}
              onChange={(e) => mudaItem(i, "midia_url", e.target.value)}
            />
          </Campo>
          {!it.midia_url?.trim() && midiaDoItem(it) && (
            <div className="meta">
              Em branco, vale o vídeo que já está no catálogo deste exercício.
            </div>
          )}
          {midiaDoItem(it) && <Midia url={midiaDoItem(it)} titulo={it.nome} />}

          <Campo rotulo="Cadência">
            <input
              list="cadencias"
              placeholder="2-0-1-0 · descer em 2s, subir em 1s"
              value={it.cadencia ?? ""}
              onChange={(e) => mudaItem(i, "cadencia", e.target.value)}
            />
          </Campo>

          <Campo rotulo="Técnica de execução">
            <select
              value={it.tecnica ?? ""}
              onChange={(e) => mudaItem(i, "tecnica", e.target.value)}
            >
              <option value="">Série normal</option>
              {tecnicasPorGrupo().map((g) => (
                <optgroup key={g.grupo} label={g.grupo}>
                  {g.itens.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Campo>
          {acharTecnica(it.tecnica) && (
            <div className="meta">{acharTecnica(it.tecnica)!.comoFazer}</div>
          )}

          <div className="dupla" style={{ marginTop: 10 }}>
            <Campo rotulo="RIR">
              <input
                className="mono"
                placeholder="RIR 2"
                value={it.rir ?? ""}
                onChange={(e) => mudaItem(i, "rir", e.target.value)}
              />
            </Campo>
            <button
              className="botao fantasma"
              type="button"
              style={{ alignSelf: "end" }}
              onClick={() => remover(it)}
            >
              Tirar da ficha
            </button>
          </div>
        </div>
      ))}

      <Campo rotulo="Adicionar exercício">
        <select
          id="adicionar"
          value=""
          onChange={(e) => e.target.value && adicionar(e.target.value)}
        >
          <option value="">
            {catalogo.length
              ? "Escolha no catálogo…"
              : "Catálogo vazio — use o botão abaixo"}
          </option>
          {catalogo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.grupo ? `${c.grupo} · ` : ""}
              {c.nome}
            </option>
          ))}
        </select>
      </Campo>

      <button
        className="botao fantasma"
        type="button"
        onClick={async () => {
          const nome = prompt("Nome do exercício");
          if (!nome?.trim()) return;
          await adicionar(null, nome.trim());
          if (quem.tipo === "personal") {
            // guarda no catálogo para reaproveitar nos outros alunos
            const { data } = await supabase
              .from("exercicios")
              .insert({ personal_id: quem.personal.id, nome: nome.trim() })
              .select()
              .single();
            if (data) setCatalogo([...catalogo, data as Exercicio]);
          }
        }}
      >
        + Exercício fora do catálogo
      </button>

      <Campo rotulo="Recado para o aluno">
        <textarea
          id="recado"
          placeholder="Se o ombro incomodar no supino, reduza a carga e me avise."
          value={treino.recado ?? ""}
          onChange={(e) => {
            setTreino({ ...treino, recado: e.target.value });
            setSalvo(false);
          }}
        />
      </Campo>

      <datalist id="cadencias">
        {CADENCIAS_SUGERIDAS.map((c) => (
          <option key={c} value={c.split(" — ")[0]}>
            {c}
          </option>
        ))}
      </datalist>

      <button className="botao" onClick={salvar} disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar ficha"}
      </button>
      <button className="botao fantasma" onClick={apagarFicha}>
        Apagar esta ficha
      </button>
    </Tela>
  );
}
