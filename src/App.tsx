import { Navigate, Route, Routes } from "react-router-dom";
import { useSessao } from "./lib/sessao";
import { configurado } from "./lib/supabase";
import { Carregando } from "./ui";

import Entrar from "./telas/Entrar";
import TrocarSenha from "./telas/TrocarSenha";

import Alunos from "./telas/personal/Alunos";
import NovoAluno from "./telas/personal/NovoAluno";
import Ficha from "./telas/personal/Ficha";
import NovaAvaliacao from "./telas/personal/NovaAvaliacao";
import EditorDeTreino from "./telas/personal/EditorDeTreino";
import Agenda from "./telas/personal/Agenda";
import PerfilPersonal from "./telas/personal/PerfilPersonal";

import Hoje from "./telas/aluno/Hoje";
import Execucao from "./telas/aluno/Execucao";
import Evolucao from "./telas/aluno/Evolucao";
import PerfilAluno from "./telas/aluno/PerfilAluno";

export default function App() {
  const { quem } = useSessao();

  if (!configurado) return <FaltaConfigurar />;

  if (quem.tipo === "carregando") return <Carregando />;

  if (quem.tipo === "visitante") {
    return (
      <Routes>
        <Route path="*" element={<Entrar />} />
      </Routes>
    );
  }

  if (quem.tipo === "personal") {
    return (
      <Routes>
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/alunos/novo" element={<NovoAluno />} />
        <Route path="/aluno/:id" element={<Ficha />} />
        <Route path="/aluno/:id/avaliacao" element={<NovaAvaliacao />} />
        <Route path="/treino/:id" element={<EditorDeTreino />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/perfil" element={<PerfilPersonal />} />
        <Route path="*" element={<Navigate to="/alunos" replace />} />
      </Routes>
    );
  }

  // aluno
  const precisaTrocarSenha = quem.user.user_metadata?.senha_trocada !== true;
  if (precisaTrocarSenha) {
    return (
      <Routes>
        <Route path="*" element={<TrocarSenha />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/hoje" element={<Hoje />} />
      <Route path="/treino/:id/executar" element={<Execucao />} />
      <Route path="/evolucao" element={<Evolucao />} />
      <Route path="/meu-perfil" element={<PerfilAluno />} />
      <Route path="*" element={<Navigate to="/hoje" replace />} />
    </Routes>
  );
}

/** Aparece quando o arquivo .env ainda não foi preenchido. */
function FaltaConfigurar() {
  return (
    <div className="app">
      <div className="centro-tela">
        {/* <div className="marca">
          <div className="icone">P</div>
          <div className="titulo">Prancheta</div>
        </div> */}
        <div className="aviso">
          Falta ligar o app ao banco. Copie o arquivo <b>.env.example</b> para <b>.env</b> e
          preencha com o endereço e a chave do seu projeto no Supabase (Project Settings &gt;
          API). Depois rode o app de novo.
        </div>
        <div className="rodape-nota">O passo a passo completo está no arquivo LEIA-ME.md.</div>
      </div>
    </div>
  );
}
