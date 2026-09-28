import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dataBR, soDigitos, supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { Campo, Erro, EscolherFoto, Tela } from "../../ui";
import { enviarFoto } from "../../lib/foto";

export default function PerfilAluno() {
  const { quem, recarregar, sair } = useSessao();
  const [personal, setPersonal] = useState<{ nome: string; celular: string | null } | null>(
    null
  );
  const [trocando, setTrocando] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    if (quem.tipo !== "aluno") return;
    supabase
      .from("personais")
      .select("nome, celular")
      .eq("id", quem.aluno.personal_id)
      .maybeSingle()
      .then(({ data }) => setPersonal(data as { nome: string; celular: string | null } | null));
  }, [quem]);

  if (quem.tipo !== "aluno") return null;
  const aluno = quem.aluno;

  async function trocarSenha() {
    setErro("");
    if (senha.length < 6) return setErro("A senha precisa de pelo menos 6 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setErro(error.message);
    setSenha("");
    setTrocando(false);
    setOk(true);
  }

  async function trocarFoto(arquivo: File) {
    setErro("");
    setEnviandoFoto(true);
    const resultado = await enviarFoto(arquivo, "perfil");
    if ("erro" in resultado) {
      setEnviandoFoto(false);
      return setErro(resultado.erro);
    }
    // o aluno não edita o próprio cadastro: esta função do banco muda
    // só o campo da foto
    const { error } = await supabase.rpc("atualizar_minha_foto", { p_url: resultado.url });
    setEnviandoFoto(false);
    if (error) return setErro(error.message);
    await recarregar();
  }

  return (
    <Tela titulo="Meu perfil" abas="aluno">
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
          <div className="meta">Aluno desde {dataBR(aluno.criado_em)}</div>
        </div>
      </div>

      <Erro>{erro}</Erro>

      {ok && <div className="aviso ok">Senha trocada.</div>}

      <div className="cartao">
        <dl style={{ margin: 0 }}>
          <div className="par">
            <dt>Personal</dt>
            <dd>{personal?.nome ?? "—"}</dd>
          </div>
          <div className="par">
            <dt>Objetivo</dt>
            <dd>{aluno.objetivo ?? "—"}</dd>
          </div>
          <div className="par">
            <dt>Frequência</dt>
            <dd>{aluno.frequencia ?? "—"}</dd>
          </div>
          <div className="par">
            <dt>Meu celular</dt>
            <dd className="mono">{aluno.celular}</dd>
          </div>
        </dl>
      </div>

      {personal?.celular && (
        <a
          className="botao fantasma"
          href={`https://wa.me/55${soDigitos(personal.celular)}`}
          target="_blank"
          rel="noreferrer"
        >
          Falar com {personal.nome.split(" ")[0]}
        </a>
      )}

      <Link className="botao fantasma" to="/anamnese">
        Minha ficha de anamnese
      </Link>

      {trocando ? (
        <div className="cartao plano" style={{ display: "grid", gap: 10 }}>
          <Campo rotulo="Nova senha">
            <input
              id="nova"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Campo>
          <button className="botao" onClick={trocarSenha}>
            Salvar senha
          </button>
          <button className="botao fantasma" onClick={() => setTrocando(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <button className="botao fantasma" onClick={() => setTrocando(true)}>
          Trocar minha senha
        </button>
      )}

      <button className="botao fantasma" onClick={() => sair()}>
        Sair da conta
      </button>
    </Tela>
  );
}
