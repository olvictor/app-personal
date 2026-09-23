import { useEffect, useState } from "react";
import { dataBR, soDigitos, supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { Campo, Erro, Tela, iniciais } from "../../ui";

export default function PerfilAluno() {
  const { quem, sair } = useSessao();
  const [personal, setPersonal] = useState<{ nome: string; celular: string | null } | null>(
    null
  );
  const [trocando, setTrocando] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

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

  return (
    <Tela titulo="Meu perfil" abas="aluno">
      <div className="linha">
        <div className="avatar" style={{ width: 50, height: 50, borderRadius: 999, fontSize: 16 }}>
          {iniciais(aluno.nome)}
        </div>
        <div>
          <div className="nome" style={{ fontSize: 17 }}>
            {aluno.nome}
          </div>
          <div className="meta">Aluno desde {dataBR(aluno.criado_em)}</div>
        </div>
      </div>

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

      {trocando ? (
        <div className="cartao plano" style={{ display: "grid", gap: 10 }}>
          <Erro>{erro}</Erro>
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
