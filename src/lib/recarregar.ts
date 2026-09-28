import { useEffect, useRef } from "react";

/**
 * Busca os dados de novo quando a tela volta a ser vista.
 *
 * O app fica aberto o dia inteiro no celular do personal. Sem isto, uma
 * foto que o aluno trocou, ou um treino concluído, só apareceria depois
 * de fechar e abrir o app — dá a impressão de que o app "não atualizou".
 *
 * Dispara quando o app volta do segundo plano e quando a janela recebe
 * o foco. Espaça em 5 segundos para não repetir busca à toa quando os
 * dois eventos acontecem juntos.
 */
export function useRecarregarAoVoltar(buscar: () => void, intervaloMin = 5000) {
  const ultima = useRef(Date.now());
  const guardada = useRef(buscar);
  guardada.current = buscar;

  useEffect(() => {
    function talvezBuscar() {
      if (document.visibilityState !== "visible") return;
      const agora = Date.now();
      if (agora - ultima.current < intervaloMin) return;
      ultima.current = agora;
      guardada.current();
    }

    document.addEventListener("visibilitychange", talvezBuscar);
    window.addEventListener("focus", talvezBuscar);
    return () => {
      document.removeEventListener("visibilitychange", talvezBuscar);
      window.removeEventListener("focus", talvezBuscar);
    };
  }, [intervaloMin]);
}
