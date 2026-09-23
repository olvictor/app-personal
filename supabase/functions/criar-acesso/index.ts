// =====================================================================
// criar-acesso — cria (ou reenvia) o login do aluno
//
// Só o personal dono do aluno consegue chamar. Gera uma senha de 6
// dígitos, cria a conta do aluno no Auth usando o celular como
// identificador e devolve a senha UMA única vez, para o personal
// mandar no WhatsApp. No banco fica só o hash.
//
// Deploy:  supabase functions deploy criar-acesso
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const DOMINIO_INTERNO = "alunos.prancheta.local"; // nunca recebe e-mail de verdade

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function responde(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function senhaDeSeisDigitos(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 1_000_000).padStart(6, "0");
}

async function hash(senha: string): Promise<string> {
  const dados = new TextEncoder().encode(senha);
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const autorizacao = req.headers.get("Authorization") ?? "";
    if (!autorizacao) return responde({ erro: "Sem autorização." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // cliente com o token de quem chamou: respeita as regras de acesso
    const comoUsuario = createClient(url, anon, {
      global: { headers: { Authorization: autorizacao } },
    });
    // cliente administrativo: só para criar a conta no Auth
    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { aluno_id } = await req.json();
    if (!aluno_id) return responde({ erro: "Informe o aluno." }, 400);

    // se o aluno não for deste personal, a consulta volta vazia — as
    // políticas do banco já cuidam disso, não precisamos checar à mão
    const { data: aluno, error: erroAluno } = await comoUsuario
      .from("alunos")
      .select("id, nome, celular, celular_login, user_id")
      .eq("id", aluno_id)
      .single();

    if (erroAluno || !aluno) {
      return responde({ erro: "Aluno não encontrado na sua carteira." }, 404);
    }

    const senha = senhaDeSeisDigitos();
    const emailInterno = `${aluno.celular_login}@${DOMINIO_INTERNO}`;

    let userId = aluno.user_id as string | null;

    if (userId) {
      // já tinha acesso: troca a senha (é o "reenviar senha provisória")
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: senha,
      });
      if (error) return responde({ erro: error.message }, 400);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: emailInterno,
        password: senha,
        email_confirm: true,
        user_metadata: { tipo: "aluno", nome: aluno.nome, aluno_id: aluno.id },
      });
      if (error) return responde({ erro: error.message }, 400);
      userId = data.user.id;

      const { error: erroVinculo } = await admin
        .from("alunos")
        .update({ user_id: userId })
        .eq("id", aluno.id);
      if (erroVinculo) return responde({ erro: erroVinculo.message }, 400);
    }

    await admin.from("acessos").insert({
      aluno_id: aluno.id,
      senha_hash: await hash(senha),
    });

    return responde({
      senha,
      login: aluno.celular,
      nome: aluno.nome,
      validade_dias: 7,
    });
  } catch (e) {
    return responde({ erro: String(e) }, 500);
  }
});
