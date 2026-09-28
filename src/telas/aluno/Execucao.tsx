import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { enviarPendentes, gravaOuGuarda, observarConexao } from "../../lib/fila";
import type { Treino, TreinoExercicio } from "../../lib/tipos";
import { Carregando, Midia, Tela, Vazio } from "../../ui";
import { acharTecnica } from "../../lib/tecnicas";

export default function Execucao() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { quem } = useSessao();

  const [treino, setTreino] = useState<Treino | null>(null);
  const [itens, setItens] = useState<TreinoExercicio[]>([]);
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [feitas, setFeitas] = useState<Record<string, boolean>>({});
  const [descanso, setDescanso] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const relogio = useRef<number | null>(null);

  useEffect(() => {
    if (quem.tipo !== "aluno" || !id) return;
    (async () => {
      const [{ data: t }, { data: ex }] = await Promise.all([
        supabase.from("treinos").select("*").eq("id", id).single(),
        supabase.from("treino_exercicios").select("*").eq("treino_id", id).order("ordem"),
      ]);
      setTreino((t as Treino) ?? null);
      setItens((ex as TreinoExercicio[]) ?? []);

      const { data: s } = await supabase
        .from("sessoes")
        .insert({ aluno_id: quem.aluno.id, treino_id: id })
        .select()
        .single();
      if (s) setSessaoId(s.id);
      setCarregando(false);
    })();
  }, [id, quem]);

  // contagem do descanso
  useEffect(() => {
    if (descanso <= 0) return;
    relogio.current = window.setInterval(() => {
      setDescanso((d) => {
        if (d <= 1) {
          window.clearInterval(relogio.current!);
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
          return 0;
        }
        return d - 1;
      });
    }, 1000);
    return () => {
      if (relogio.current) window.clearInterval(relogio.current);
    };
  }, [descanso > 0]);

  // sobe o que ficou pendente quando a internet volta
  useEffect(() => {
    const parar = observarConexao(() => {
      setOffline(false);
      enviarPendentes();
    });
    const aoCair = () => setOffline(true);
    window.addEventListener("offline", aoCair);
    return () => {
      parar();
      window.removeEventListener("offline", aoCair);
    };
  }, []);

  async function marcar(item: TreinoExercicio, numero: number) {
    const chave = `${item.id}-${numero}`;
    const jaEstava = feitas[chave];
    setFeitas({ ...feitas, [chave]: !jaEstava });
    if (jaEstava) return; // desmarcar é só visual; não apaga o registro

    setDescanso(item.descanso_seg || 60);
    if (sessaoId) {
      await gravaOuGuarda("sessao_series", {
        sessao_id: sessaoId,
        treino_exercicio_id: item.id,
        numero,
        reps_feitas: item.repeticoes,
        carga_usada: item.carga,
      });
    }
  }

  async function concluir() {
    if (sessaoId) {
      await supabase
        .from("sessoes")
        .update({ concluida_em: new Date().toISOString() })
        .eq("id", sessaoId);
    }
    navegar("/hoje");
  }

  if (carregando) return <Carregando texto="Abrindo seu treino…" />;
  if (!treino)
    return (
      <Tela titulo="Treino" voltar="/hoje">
        <Vazio>Não encontrei esse treino.</Vazio>
      </Tela>
    );

  const totalSeries = itens.reduce((s, i) => s + i.series, 0);
  const totalFeitas = Object.values(feitas).filter(Boolean).length;
  const minutos = String(Math.floor(descanso / 60)).padStart(2, "0");
  const segundos = String(descanso % 60).padStart(2, "0");

  return (
    <Tela titulo={treino.nome} sub={treino.foco ?? undefined} voltar="/hoje">
      <div className="cartao plano">
        <div className="linha" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">
              {descanso > 0 ? "Descanso" : `${totalFeitas} de ${totalSeries} séries`}
            </div>
            <div className="meta">
              {descanso > 0 ? "Respira. Já volta." : "Marque cada série que terminar."}
            </div>
          </div>
          <div
            className="cronometro"
            style={{ color: descanso > 0 ? "var(--vinho)" : "var(--tinta-3)" }}
          >
            {minutos}:{segundos}
          </div>
        </div>
      </div>

      {offline && (
        <div className="aviso">
          Sem internet agora. Pode treinar: o que você marcar sobe sozinho quando o sinal voltar.
        </div>
      )}

      {itens.length === 0 && <Vazio>Essa ficha ainda não tem exercícios.</Vazio>}

      {itens.map((item, i) => (
        <div className="cartao" key={item.id}>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="n mono" style={{ color: "var(--tinta-3)", fontSize: 11, paddingTop: 3 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nome">{item.nome}</div>
              <div className="meta mono" style={{ marginTop: 2 }}>
                {item.series} × {item.repeticoes}
                {item.carga ? ` · ${item.carga}` : ""}
                {item.rir ? ` · ${item.rir}` : ""}
                {item.cadencia ? ` · cadência ${item.cadencia}` : ""}
              </div>

              {acharTecnica(item.tecnica) && (
                <div className="tecnica">
                  <span className="selo destaque">{acharTecnica(item.tecnica)!.nome}</span>
                  <div className="tecnica-como">{acharTecnica(item.tecnica)!.comoFazer}</div>
                </div>
              )}
              {item.observacao && (
                <div className="meta" style={{ marginTop: 3 }}>
                  {item.observacao}
                </div>
              )}

              <Midia url={item.midia_url} titulo={item.nome} />

              <div className="series">
                {Array.from({ length: item.series }, (_, k) => k + 1).map((n) => {
                  const chave = `${item.id}-${n}`;
                  const feita = !!feitas[chave];
                  return (
                    <button
                      key={n}
                      className="serie"
                      data-feita={feita ? "1" : "0"}
                      aria-pressed={feita}
                      aria-label={`Série ${n} de ${item.nome}`}
                      onClick={() => marcar(item, n)}
                    >
                      {feita ? "✓" : n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button className="botao" onClick={concluir}>
        Concluir treino
      </button>
      <div className="rodape-nota">
        As séries marcadas ficam salvas no celular e sobem quando a internet voltar.
      </div>
    </Tela>
  );
}
