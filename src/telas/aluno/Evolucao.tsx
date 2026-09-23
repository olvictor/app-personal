import { useEffect, useState } from "react";
import { dataBR, hoje, supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import type { Avaliacao, Sessao } from "../../lib/tipos";
import { Campo, Carregando, GraficoPeso, Tela, Vazio } from "../../ui";

export default function Evolucao() {
  const { quem } = useSessao();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[] | null>(null);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [peso, setPeso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [abrindo, setAbrindo] = useState(false);

  async function carregar() {
    const [{ data: av }, { data: se }] = await Promise.all([
      supabase.from("avaliacoes").select("*").order("data"),
      supabase.from("sessoes").select("*").not("concluida_em", "is", null),
    ]);
    setAvaliacoes((av as Avaliacao[]) ?? []);
    setSessoes((se as Sessao[]) ?? []);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (quem.tipo !== "aluno") return null;
  if (avaliacoes === null) return <Carregando />;

  async function registrarPeso() {
    if (quem.tipo !== "aluno") return;
    const n = Number(peso.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setSalvando(true);
    await supabase.from("avaliacoes").insert({
      aluno_id: quem.aluno.id,
      data: hoje(),
      peso: n,
      registrada_por: "aluno",
    });
    setSalvando(false);
    setPeso("");
    setAbrindo(false);
    carregar();
  }

  const comPeso = avaliacoes.filter((a) => a.peso != null);
  const primeira = comPeso[0];
  const ultima = comPeso[comPeso.length - 1];
  const diferenca =
    primeira && ultima ? Number(ultima.peso) - Number(primeira.peso) : null;

  const mesAtual = new Date().getMonth();
  const noMes = sessoes.filter(
    (s) => new Date(s.iniciada_em).getMonth() === mesAtual
  ).length;

  return (
    <Tela titulo="Minha evolução" abas="aluno">
      {comPeso.length < 2 && (
        <Vazio>
          Seu gráfico aparece depois da segunda medição. Registre seu peso abaixo ou espere a
          próxima avaliação.
        </Vazio>
      )}

      {comPeso.length >= 2 && (
        <div className="cartao">
          <div className="eyebrow" style={{ marginBottom: 2 }}>
            Peso ao longo do tempo
          </div>
          <GraficoPeso
            pontos={comPeso.map((a) => ({
              rotulo: dataBR(a.data).slice(0, 5),
              valor: Number(a.peso),
            }))}
          />
          {diferenca !== null && (
            <div className="meta" style={{ marginTop: 4 }}>
              {diferenca === 0
                ? "Mesmo peso do início"
                : `${diferenca > 0 ? "+" : "−"}${Math.abs(diferenca)
                    .toFixed(1)
                    .replace(".", ",")} kg desde ${dataBR(primeira.data)}`}
            </div>
          )}
        </div>
      )}

      <div className="dupla">
        <div className="ladrilho">
          <div className="rot">Treinos no mês</div>
          <div className="num">{noMes}</div>
        </div>
        <div className="ladrilho">
          <div className="rot">Desde o início</div>
          <div className="num">{sessoes.length}</div>
        </div>
      </div>

      {ultima && (
        <div className="cartao">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Última avaliação · {dataBR(ultima.data)}
          </div>
          <dl style={{ margin: 0 }}>
            {[
              ["Peso", ultima.peso, "kg"],
              ["Gordura", ultima.gordura, "%"],
              ["Cintura", ultima.cintura, "cm"],
              ["Quadril", ultima.quadril, "cm"],
            ]
              .filter(([, v]) => v != null)
              .map(([rot, v, uni]) => (
                <div className="par" key={String(rot)}>
                  <dt>{rot}</dt>
                  <dd className="mono">
                    {v} {uni}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      )}

      {abrindo ? (
        <div className="cartao plano" style={{ display: "grid", gap: 10 }}>
          <Campo rotulo="Meu peso hoje (kg)">
            <input
              id="meu-peso"
              className="mono"
              inputMode="decimal"
              placeholder="68,4"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </Campo>
          <button className="botao" onClick={registrarPeso} disabled={salvando}>
            {salvando ? "Salvando…" : "Registrar"}
          </button>
          <button className="botao fantasma" onClick={() => setAbrindo(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button className="botao fantasma" onClick={() => setAbrindo(true)}>
          Registrar meu peso de hoje
        </button>
      )}
    </Tela>
  );
}
