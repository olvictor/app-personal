import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { Campo, Erro, EscolherFoto, Tela } from "../../ui";
import { enviarFoto } from "../../lib/foto";

export default function PerfilPersonal() {
  const { quem, recarregar, sair } = useSessao();
  const [nome, setNome] = useState("");
  const [cref, setCref] = useState("");
  const [local, setLocal] = useState("");
  const [celular, setCelular] = useState("");
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [contagem, setContagem] = useState<{ alunos: number; ativos: number } | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    if (quem.tipo !== "personal") return;
    setNome(quem.personal.nome ?? "");
    setCref(quem.personal.cref ?? "");
    setLocal(quem.personal.local ?? "");
    setCelular(quem.personal.celular ?? "");
    supabase
      .from("alunos")
      .select("status")
      .then(({ data }) => {
        const lista = data ?? [];
        setContagem({
          alunos: lista.length,
          ativos: lista.filter((a: { status: string }) => a.status === "ativo").length,
        });
      });
  }, [quem]);

  if (quem.tipo !== "personal") return null;

  async function salvar() {
    setErro("");
    const { error } = await supabase
      .from("personais")
      .update({ nome, cref, local, celular })
      .eq("id", (quem as { personal: { id: string } }).personal.id);
    if (error) return setErro(error.message);
    setSalvo(true);
    await recarregar();
  }

  async function trocarFoto(arquivo: File) {
    if (quem.tipo !== "personal") return;
    setErro("");
    setEnviandoFoto(true);
    const resultado = await enviarFoto(arquivo, "perfil");
    if ("erro" in resultado) {
      setEnviandoFoto(false);
      return setErro(resultado.erro);
    }
    const { error } = await supabase
      .from("personais")
      .update({ foto_url: resultado.url })
      .eq("id", quem.personal.id);
    setEnviandoFoto(false);
    if (error) return setErro(error.message);
    await recarregar();
  }

  return (
    <Tela titulo="Meu perfil" abas="personal">
      <div className="linha" style={{ gap: 14 }}>
        <EscolherFoto
          nome={nome || "Personal"}
          foto={quem.personal.foto_url}
          enviando={enviandoFoto}
          aoEscolher={trocarFoto}
          tamanho={68}
        />
        <div style={{ minWidth: 0 }}>
          <div className="nome" style={{ fontSize: 17 }}>
            {nome || "Personal"}
          </div>
          <div className="meta">{quem.personal.email}</div>
        </div>
      </div>

      {contagem && (
        <div className="dupla">
          <div className="ladrilho">
            <div className="rot">Alunos</div>
            <div className="num">{contagem.alunos}</div>
          </div>
          <div className="ladrilho">
            <div className="rot">Ativos</div>
            <div className="num">{contagem.ativos}</div>
          </div>
        </div>
      )}

      <Erro>{erro}</Erro>
      {salvo && <div className="aviso ok">Perfil salvo.</div>}

      <Campo rotulo="Nome">
        <input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </Campo>
      <Campo rotulo="CREF">
        <input
          id="p-cref"
          placeholder="048512-G/SP"
          value={cref}
          onChange={(e) => setCref(e.target.value)}
        />
      </Campo>
      <Campo rotulo="Celular">
        <input
          id="p-celular"
          className="mono"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
        />
      </Campo>
      <Campo rotulo="Local de atendimento">
        <input
          id="p-local"
          placeholder="Academia Ferro · Pinheiros"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </Campo>

      <button className="botao" onClick={salvar}>
        Salvar perfil
      </button>
      <Link className="botao fantasma" to="/alunos/novo">
        Criar acesso de um aluno
      </Link>
      <button className="botao fantasma" onClick={() => sair()}>
        Sair da conta
      </button>
    </Tela>
  );
}
