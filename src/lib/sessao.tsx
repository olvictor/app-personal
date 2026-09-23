import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Aluno, Personal } from "./tipos";

type Quem =
  | { tipo: "carregando" }
  | { tipo: "visitante" }
  | { tipo: "personal"; personal: Personal; user: User }
  | { tipo: "aluno"; aluno: Aluno; user: User };

type Contexto = {
  quem: Quem;
  recarregar: () => Promise<void>;
  sair: () => Promise<void>;
};

const Ctx = createContext<Contexto>({
  quem: { tipo: "carregando" },
  recarregar: async () => {},
  sair: async () => {},
});

export function ProvedorDeSessao({ children }: { children: ReactNode }) {
  const [quem, setQuem] = useState<Quem>({ tipo: "carregando" });

  async function identificar(sessao: Session | null) {
    if (!sessao?.user) {
      setQuem({ tipo: "visitante" });
      return;
    }
    const user = sessao.user;

    // personal?
    const { data: personal } = await supabase
      .from("personais")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (personal) {
      setQuem({ tipo: "personal", personal: personal as Personal, user });
      return;
    }

    // aluno?
    const { data: aluno } = await supabase
      .from("alunos")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (aluno) {
      setQuem({ tipo: "aluno", aluno: aluno as Aluno, user });
      return;
    }

    // conta sem cadastro ligado — não deveria acontecer
    setQuem({ tipo: "visitante" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => identificar(data.session));
    const { data: assinatura } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        identificar(sessao);
      }
    );
    return () => assinatura.subscription.unsubscribe();
  }, []);

  const valor = useMemo<Contexto>(
    () => ({
      quem,
      recarregar: async () => {
        const { data } = await supabase.auth.getSession();
        await identificar(data.session);
      },
      sair: async () => {
        await supabase.auth.signOut();
        setQuem({ tipo: "visitante" });
      },
    }),
    [quem]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao() {
  return useContext(Ctx);
}
