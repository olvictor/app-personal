import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formataCelular, soDigitos, supabase } from "../../lib/supabase";
import { useSessao } from "../../lib/sessao";
import { OBJETIVOS } from "../../lib/tipos";
import { Campo, Erro, Tela } from "../../ui";

type Acesso = { senha: string; login: string; nome: string };

export default function NovoAluno() {
  const { quem } = useSessao();
  const navegar = useNavigate();

  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [objetivo, setObjetivo] = useState(OBJETIVOS[0]);
  const [frequencia, setFrequencia] = useState("3x / semana");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [acesso, setAcesso] = useState<Acesso | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (quem.tipo !== "personal") return;
    setErro("");

    const digitos = soDigitos(celular);
    if (nome.trim().length < 3) return setErro("Escreva o nome completo do aluno.");
    if (digitos.length < 10) return setErro("Digite o celular com DDD.");

    setOcupado(true);
    const { data: aluno, error } = await supabase
      .from("alunos")
      .insert({
        personal_id: quem.personal.id,
        nome: nome.trim(),
        celular: formataCelular(digitos),
        celular_login: digitos,
        nascimento: nascimento || null,
        objetivo,
        frequencia,
        observacoes: observacoes.trim() || null,
      })
      .select()
      .single();

    if (error || !aluno) {
      setOcupado(false);
      setErro(
        error?.code === "23505"
          ? "Você já tem um aluno com esse celular."
          : error?.message ?? "Não consegui salvar."
      );
      return;
    }

    // cria o login do aluno (senha provisória de 6 dígitos)
    const { data, error: erroFn } = await supabase.functions.invoke("criar-acesso", {
      body: { aluno_id: aluno.id },
    });
    setOcupado(false);

    if (erroFn || !data?.senha) {
      setErro(
        "O aluno foi salvo, mas o acesso não foi criado. Abra a ficha dele e toque em “Criar acesso”."
      );
      return;
    }
    setAcesso({ senha: data.senha, login: data.login, nome: data.nome });
  }

  if (acesso) {
    return <AcessoCriado acesso={acesso} celular={celular} />;
  }

  return (
    <Tela titulo="Novo aluno" sub="O celular será o login" voltar="/alunos">
      <form onSubmit={salvar} style={{ display: "grid", gap: 12 }}>
        <div className="aviso">
          Só o essencial agora. Peso e medidas entram na avaliação física, depois.
        </div>

        <Erro>{erro}</Erro>

        <Campo rotulo="Nome completo">
          <input
            id="nome"
            autoComplete="name"
            placeholder="Camila Rocha"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </Campo>

        <Campo rotulo="Celular · será o login">
          <input
            id="celular"
            className="mono"
            inputMode="numeric"
            placeholder="(11) 98844-2170"
            value={celular}
            onChange={(e) => setCelular(formataCelular(e.target.value))}
          />
        </Campo>

        <div className="dupla">
          <Campo rotulo="Nascimento">
            <input
              id="nascimento"
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
            />
          </Campo>
          <Campo rotulo="Frequência">
            <select
              id="frequencia"
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
            >
              {["1x / semana", "2x / semana", "3x / semana", "4x / semana", "5x / semana"].map(
                (f) => (
                  <option key={f}>{f}</option>
                )
              )}
            </select>
          </Campo>
        </div>

        <Campo rotulo="Objetivo">
          <select id="objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
            {OBJETIVOS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Restrições e observações clínicas">
          <textarea
            id="observacoes"
            placeholder="Lesões, cirurgias, medicação contínua…"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </Campo>

        <button className="botao" disabled={ocupado}>
          {ocupado ? "Criando…" : "Salvar e criar acesso"}
        </button>
        <button
          type="button"
          className="botao fantasma"
          onClick={() => navegar("/alunos")}
        >
          Cancelar
        </button>
      </form>
    </Tela>
  );
}

export function AcessoCriado({
  acesso,
  celular,
  aoFechar,
}: {
  acesso: Acesso;
  celular: string;
  aoFechar?: () => void;
}) {
  const navegar = useNavigate();
  const primeiroNome = acesso.nome.split(" ")[0];
  const endereco = window.location.origin;

  const mensagem =
    `Oi, ${primeiroNome}! Seu treino já está no ar 💪\n\n` +
    `Abra este link no celular: ${endereco}\n` +
    `Login: ${acesso.login}\n` +
    `Senha provisória: ${acesso.senha}\n\n` +
    `Na primeira vez, toque em "Adicionar à tela de início" para virar aplicativo. ` +
    `No iPhone precisa ser pelo Safari.`;

  const whats = `https://wa.me/55${soDigitos(celular || acesso.login)}?text=${encodeURIComponent(
    mensagem
  )}`;

  return (
    <Tela titulo="Acesso criado" sub={acesso.nome} voltar="/alunos">
      <div className="cartao" style={{ display: "flex", gap: 10 }}>
        <div className="faixa ok" />
        <div>
          <div className="nome">Pronto para enviar</div>
          <div className="meta">
            Esta senha aparece uma vez só. Mande agora pelo WhatsApp.
          </div>
        </div>
      </div>

      <div className="cartao">
        <dl style={{ margin: 0 }}>
          <div className="par">
            <dt>Login</dt>
            <dd className="mono">{acesso.login}</dd>
          </div>
          <div className="par">
            <dt>Senha provisória</dt>
            <dd className="mono" style={{ fontSize: 18, letterSpacing: "0.1em" }}>
              {acesso.senha}
            </dd>
          </div>
          <div className="par">
            <dt>Validade</dt>
            <dd>7 dias para o 1º acesso</dd>
          </div>
        </dl>
      </div>

      <div className="cartao plano">
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Mensagem que vai no WhatsApp
        </div>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.5,
            whiteSpace: "pre-line",
            color: "var(--tinta-2)",
          }}
        >
          {mensagem}
        </div>
      </div>

      <a className="botao" href={whats} target="_blank" rel="noreferrer">
        Abrir WhatsApp de {primeiroNome}
      </a>
      <button
        className="botao fantasma"
        onClick={() => (aoFechar ? aoFechar() : navegar("/alunos"))}
      >
        Voltar para a lista
      </button>
    </Tela>
  );
}
