import { supabase } from "./supabase";

/**
 * Foto de perfil.
 *
 * A foto sai do celular com 3 a 12 MB. Antes de enviar, o app corta no
 * quadrado, reduz para 512 px e salva como JPEG — o arquivo cai para uns
 * 40 KB. Isso economiza a internet de quem envia, o depósito do Supabase
 * e o carregamento de quem vê a lista de alunos.
 */

const LADO = 512;
const QUALIDADE = 0.85;

export type ResultadoDaFoto = { url: string } | { erro: string };

/** Corta no quadrado do meio e reduz. Devolve um JPEG. */
async function prepararImagem(arquivo: File): Promise<Blob> {
  // createImageBitmap já corrige a rotação registrada pela câmera —
  // sem isso, foto tirada de lado no iPhone aparece deitada.
  const bitmap = await createImageBitmap(arquivo, {
    imageOrientation: "from-image",
  });

  const lado = Math.min(bitmap.width, bitmap.height);
  const x = (bitmap.width - lado) / 2;
  const y = (bitmap.height - lado) / 2;

  const tela = document.createElement("canvas");
  tela.width = LADO;
  tela.height = LADO;

  const pincel = tela.getContext("2d");
  if (!pincel) throw new Error("Não consegui preparar a imagem.");
  pincel.imageSmoothingQuality = "high";
  pincel.drawImage(bitmap, x, y, lado, lado, 0, 0, LADO, LADO);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    tela.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falhou ao gerar a imagem."))),
      "image/jpeg",
      QUALIDADE
    );
  });
}

/**
 * Envia a foto para o depósito e devolve o endereço público.
 * `nomeDoArquivo` é só o nome: a pasta é sempre a do usuário logado,
 * que é o que as regras do banco exigem.
 */
export async function enviarFoto(
  arquivo: File,
  nomeDoArquivo: string
): Promise<ResultadoDaFoto> {
  if (!arquivo.type.startsWith("image/")) {
    return { erro: "Escolha uma imagem." };
  }

  const { data: sessao } = await supabase.auth.getUser();
  const usuario = sessao?.user;
  if (!usuario) return { erro: "Sua sessão expirou. Entre de novo." };

  let imagem: Blob;
  try {
    imagem = await prepararImagem(arquivo);
  } catch {
    return { erro: "Não consegui ler essa imagem. Tente outra." };
  }

  const caminho = `${usuario.id}/${nomeDoArquivo}.jpg`;

  const { error } = await supabase.storage.from("fotos").upload(caminho, imagem, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "3600",
  });

  if (error) {
    return {
      erro: error.message.includes("Bucket not found")
        ? "O depósito de fotos ainda não foi criado no Supabase (rode a migração)."
        : "Não consegui enviar a foto. Tente de novo.",
    };
  }

  const { data } = supabase.storage.from("fotos").getPublicUrl(caminho);
  // o endereço é sempre o mesmo quando a pessoa troca a foto; o carimbo
  // de tempo força o celular a buscar a nova em vez de mostrar a antiga
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}
