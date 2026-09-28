import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import type { Aluno } from "../../lib/tipos";
import { Avatar, Carregando, Tela, Vazio } from "../../ui";
import { useRecarregarAoVoltar } from "../../lib/recarregar";

export default function Alunos() {
  const { quem } = useSessao();
  const [alunos, setAlunos] = useState<Aluno[] | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "pausados">("todos");

  async function buscar() {
    const { data } = await supabase.from("alunos").select("*").order("nome");
    setAlunos((data as Aluno[]) ?? []);
  }

  useEffect(() => {
    (async () => {
      await buscar();
      // catálogo inicial de exercícios: roda uma vez, na primeira entrada
      await supabase.rpc("semear_exercicios");
    })();
  }, []);

  useRecarregarAoVoltar(buscar);

  const lista = useMemo(() => {
    if (!alunos) return [];
    const termo = busca.trim().toLowerCase();
    return alunos.filter((a) => {
      if (filtro === "ativos" && a.status !== "ativo") return false;
      if (filtro === "pausados" && a.status === "ativo") return false;
      if (!termo) return true;
      return a.nome.toLowerCase().includes(termo) || a.celular.includes(termo);
    });
  }, [alunos, busca, filtro]);

  const nomePersonal = quem.tipo === "personal" ? quem.personal.nome : "";
  const ativos = alunos?.filter((a) => a.status === "ativo").length ?? 0;

  return (
    <Tela
      titulo="Meus alunos"
      sub={alunos ? `${alunos.length} no total · ${ativos} ativos` : nomePersonal}
      abas="personal"
    >
      <div className="campo">
        <input
          id="busca"
          placeholder="Buscar por nome ou celular"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="segmentos" role="group" aria-label="Filtrar alunos">
        {(["todos", "ativos", "pausados"] as const).map((f) => (
          <button
            key={f}
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            type="button"
          >
            {f === "todos" ? "Todos" : f === "ativos" ? "Ativos" : "Em pausa"}
          </button>
        ))}
      </div>

      {alunos === null && <Carregando />}

      {alunos !== null && lista.length === 0 && (
        <Vazio>
          {alunos.length === 0
            ? "Nenhum aluno ainda. Cadastre o primeiro aqui embaixo."
            : "Nenhum aluno com esse filtro."}
        </Vazio>
      )}

      {lista.map((a) => (
        <Link className="cartao" key={a.id} to={`/aluno/${a.id}`}>
          <div className="linha">
            <Avatar nome={a.nome} foto={a.foto_url} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="nome">{a.nome}</div>
              <div className="meta">
                {a.objetivo || "Sem objetivo definido"}
                {a.frequencia ? ` · ${a.frequencia}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              <span className={"selo " + (a.status === "ativo" ? "ok" : "")}>
                {a.status === "ativo"
                  ? "Ativo"
                  : a.status === "pausado"
                  ? "Em pausa"
                  : "Inativo"}
              </span>
              {!a.user_id && (
                <div className="meta" style={{ marginTop: 4 }}>
                  sem acesso
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}

      <Link className="botao" to="/alunos/novo">
        + Novo aluno
      </Link>
    </Tela>
  );
}
