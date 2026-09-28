import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSessao } from "../lib/sessao";
import { Campo, Erro } from "../ui";

/** Primeiro acesso do aluno: troca a senha provisória e ensina a instalar. */
export default function TrocarSenha() {
  const { recarregar, sair } = useSessao();
  const navegar = useNavigate();
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const iphone = /iPad|iPhone|iPod/.test(navigator.userAgent);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) {
      setErro("A senha precisa de pelo menos 6 caracteres.");
      return;
    }
    if (senha !== repetir) {
      setErro("As duas senhas estão diferentes.");
      return;
    }
    setOcupado(true);
    const { error } = await supabase.auth.updateUser({
      password: senha,
      data: { senha_trocada: true },
    });
    setOcupado(false);
    if (error) {
      setErro(error.message);
      return;
    }
    await recarregar();
    navegar("/anamnese");
  }

  return (
    <div className="app">
      <form className="centro-tela" onSubmit={salvar}>
        <div className="marca">
          <div className="icone">P</div>
          <div className="titulo">Primeiro acesso</div>
        </div>

        <div className="aviso">
          Crie uma senha só sua — a que veio no WhatsApp deixa de valer agora.
        </div>

        <Erro>{erro}</Erro>

        <Campo rotulo="Nova senha">
          <input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Campo>
        <Campo rotulo="Repetir a senha">
          <input
            id="repetir-senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
          />
        </Campo>

        <div className="cartao plano">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Deixe o app na tela de início
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--tinta-2)" }}>
            {iphone ? (
              <>
                Toque no botão de compartilhar do Safari (o quadrado com a seta) e escolha{" "}
                <b>Adicionar à Tela de Início</b>.
              </>
            ) : (
              <>
                Abra o menu do navegador (três pontinhos) e escolha{" "}
                <b>Adicionar à tela de início</b>.
              </>
            )}
          </div>
        </div>

        <button className="botao" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Salvar e começar"}
        </button>
        <button type="button" className="link-texto" onClick={() => sair()}>
          Sair
        </button>
      </form>
    </div>
  );
}
