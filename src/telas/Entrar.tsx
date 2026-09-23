import { useState } from "react";
import { emailInterno, formataCelular, soDigitos, supabase } from "../lib/supabase";
import { Campo, Erro } from "../ui";

type Modo = "aluno" | "personal" | "cadastro";

export default function Entrar() {
  const [modo, setModo] = useState<Modo>("aluno");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [recado, setRecado] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setRecado("");
    setOcupado(true);
    try {
      if (modo === "aluno") {
        const digitos = soDigitos(celular);
        if (digitos.length < 10) {
          setErro("Digite o celular com DDD.");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: emailInterno(digitos),
          password: senha,
        });
        if (error) {
          setErro("Celular ou senha não conferem. Confira a mensagem que seu personal mandou.");
        }
      } else if (modo === "personal") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) setErro("E-mail ou senha não conferem.");
      } else {
        if (nome.trim().length < 3) {
          setErro("Escreva seu nome completo.");
          return;
        }
        if (senha.length < 6) {
          setErro("A senha precisa de pelo menos 6 caracteres.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { tipo: "personal", nome: nome.trim() } },
        });
        if (error) {
          setErro(error.message);
        } else {
          setRecado(
            "Conta criada. Se o Supabase estiver pedindo confirmação por e-mail, confirme e volte aqui para entrar."
          );
          setModo("personal");
        }
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="app">
      <form className="centro-tela" onSubmit={enviar}>
        <div className="marca">
          {/* <div className="icone">P</div>
          <div className="titulo">Prancheta</div> */}
          <div className="meta" style={{ marginTop: 150 }}>
            {modo === "aluno"
              ? "O treino que seu personal montou para você"
              : "Área do personal"}
          </div>
        </div>

        <Erro>{erro}</Erro>
        {recado && <div className="aviso ok">{recado}</div>}

        {modo === "aluno" ? (
          <Campo rotulo="Celular">
            <input
              id="celular"
              className="mono"
              inputMode="numeric"
              autoComplete="username"
              placeholder="(11) 98844-2170"
              value={celular}
              onChange={(e) => setCelular(formataCelular(e.target.value))}
            />
          </Campo>
        ) : (
          <>
            {modo === "cadastro" && (
              <Campo rotulo="Seu nome">
                <input
                  id="nome"
                  autoComplete="name"
                  placeholder="Victor Oliveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </Campo>
            )}
            <Campo rotulo="E-mail">
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Campo>
          </>
        )}

        <Campo rotulo={modo === "aluno" ? "Senha" : "Senha"}>
          <input
            id="senha"
            type="password"
            autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
            placeholder="••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Campo>

        <button className="botao" disabled={ocupado}>
          {ocupado ? "Um instante…" : modo === "cadastro" ? "Criar conta" : "Entrar"}
        </button>

        {modo === "aluno" && (
          <div className="rodape-nota">
            Recebeu o acesso pelo WhatsApp e não consegue entrar? Chame seu personal.
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          {modo === "aluno" && (
            <button type="button" className="link-texto" onClick={() => setModo("personal")}>
              Sou o personal
            </button>
          )}
          {modo === "personal" && (
            <>
              <button type="button" className="link-texto" onClick={() => setModo("aluno")}>
                Sou aluno
              </button>
              <button type="button" className="link-texto" onClick={() => setModo("cadastro")}>
                Criar conta de personal
              </button>
            </>
          )}
          {modo === "cadastro" && (
            <button type="button" className="link-texto" onClick={() => setModo("personal")}>
              Já tenho conta
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
