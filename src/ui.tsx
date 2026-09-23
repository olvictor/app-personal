import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export function Tela({
  titulo,
  sub,
  voltar,
  direita,
  abas,
  children,
}: {
  titulo?: string;
  sub?: string;
  voltar?: string | number;
  direita?: ReactNode;
  abas?: "personal" | "aluno";
  children: ReactNode;
}) {
  const navegar = useNavigate();
  return (
    <div className={"app" + (abas ? " com-abas" : "")}>
      {titulo && (
        <header className="appbar">
          {voltar !== undefined && (
            <button
              className="voltar"
              aria-label="Voltar"
              onClick={() =>
                typeof voltar === "number" ? navegar(voltar) : navegar(voltar)
              }
            >
              ‹
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <h1>{titulo}</h1>
            {sub && <div className="sub">{sub}</div>}
          </div>
          {direita && <div className="direita">{direita}</div>}
        </header>
      )}
      <main className="conteudo">{children}</main>
      {abas === "personal" && (
        <nav className="abas">
          <Aba para="/alunos" ic="☰" texto="Alunos" />
          <Aba para="/agenda" ic="▦" texto="Agenda" />
          <Aba para="/perfil" ic="◍" texto="Perfil" />
        </nav>
      )}
      {abas === "aluno" && (
        <nav className="abas">
          <Aba para="/hoje" ic="▲" texto="Hoje" />
          <Aba para="/evolucao" ic="◠" texto="Evolução" />
          <Aba para="/meu-perfil" ic="◍" texto="Perfil" />
        </nav>
      )}
    </div>
  );
}

function Aba({ para, ic, texto }: { para: string; ic: string; texto: string }) {
  return (
    <NavLink to={para} className={({ isActive }) => (isActive ? "ativa" : "")}>
      <span className="ic" aria-hidden="true">
        {ic}
      </span>
      {texto}
    </NavLink>
  );
}

export function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <label className="campo">
      <div className="rotulo">{rotulo}</div>
      {children}
    </label>
  );
}

export function Erro({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="aviso erro">{children}</div>;
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return <div className="carregando">{texto}</div>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase();
}
export type TipoDeMidia = "imagem" | "video" | "youtube" | "vimeo" | "link";

export function tipoDeMidia(url: string): TipoDeMidia {
  const u = (url || "").trim().toLowerCase();
  if (/(?:youtube\.com|youtu\.be)/.test(u)) return "youtube";
  if (/vimeo\.com/.test(u)) return "vimeo";
  if (/\.(gif|png|jpe?g|webp|avif)(\?|#|$)/.test(u)) return "imagem";
  if (/\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/.test(u)) return "video";
  return "link";
}

function idDoYoutube(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function idDoVimeo(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function Midia({ url, titulo }: { url: string | null; titulo: string }) {
  const [aberta, setAberta] = useState(false);
  if (!url) return null;

  const tipo = tipoDeMidia(url);
  const rotulo =
    tipo === "imagem" ? "Ver o movimento" : tipo === "link" ? "Abrir demonstração" : "Ver o vídeo";

  // link que não dá para mostrar aqui dentro: abre fora
  if (tipo === "link") {
    return (
      <a className="ver-midia" href={url} target="_blank" rel="noreferrer">
        <span aria-hidden="true">↗</span> {rotulo}
      </a>
    );
  }

  if (!aberta) {
    return (
      <button
        type="button"
        className="ver-midia"
        onClick={() => setAberta(true)}
        aria-label={`${rotulo}: ${titulo}`}
      >
        <span aria-hidden="true">▷</span> {rotulo}
      </button>
    );
  }

  return (
    <div className="midia">
      <div className="midia-caixa">
        {tipo === "imagem" && <img src={url} alt={`Demonstração de ${titulo}`} />}

        {tipo === "video" && (
          <video src={url} controls autoPlay loop muted playsInline preload="metadata" />
        )}

        {tipo === "youtube" && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${idDoYoutube(url) ?? ""}?autoplay=1&rel=0`}
            title={`Demonstração de ${titulo}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {tipo === "vimeo" && (
          <iframe
            src={`https://player.vimeo.com/video/${idDoVimeo(url) ?? ""}?autoplay=1`}
            title={`Demonstração de ${titulo}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <div className="midia-pe">
        <button type="button" className="link-texto" onClick={() => setAberta(false)}>
          Fechar
        </button>
        <a className="link-texto" href={url} target="_blank" rel="noreferrer">
          Abrir fora do app
        </a>
      </div>
    </div>
  );
}

/** Gráfico de uma linha só: peso ao longo do tempo. */
export function GraficoPeso({
  pontos,
  altura = 120,
}: {
  pontos: { rotulo: string; valor: number }[];
  altura?: number;
}) {
  if (pontos.length < 2) {
    return (
      <div className="vazio" style={{ padding: 18 }}>
        Duas avaliações e o gráfico aparece aqui.
      </div>
    );
  }
  const L = 300;
  const A = altura;
  const eL = 30;
  const eR = 42;
  const eT = 12;
  const eB = 20;

  const valores = pontos.map((p) => p.valor);
  const bruto = { min: Math.min(...valores), max: Math.max(...valores) };
  const folga = (bruto.max - bruto.min || 1) * 0.25;
  const min = bruto.min - folga;
  const max = bruto.max + folga;

  const x = (i: number) => eL + (i * (L - eL - eR)) / (pontos.length - 1);
  const y = (v: number) => eT + ((max - v) * (A - eT - eB)) / (max - min);

  const linha = pontos
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`)
    .join(" ");
  const area = `${linha} L${x(pontos.length - 1).toFixed(1)} ${A - eB} L${x(0).toFixed(1)} ${A - eB} Z`;

  const ultimo = pontos[pontos.length - 1];
  const primeiro = pontos[0];

  return (
    <svg
      viewBox={`0 0 ${L} ${A}`}
      width="100%"
      height={A}
      role="img"
      aria-label={`Peso de ${primeiro.rotulo} (${primeiro.valor} kg) a ${ultimo.rotulo} (${ultimo.valor} kg)`}
      style={{ maxWidth: "100%", display: "block" }}
    >
      {[bruto.max, bruto.min].map((v) => (
        <g key={v}>
          <line
            x1={eL}
            x2={L - eR}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--borda-2)"
            strokeWidth="1"
          />
          <text
            x={eL - 5}
            y={y(v) + 3.5}
            textAnchor="end"
            fontSize="9"
            fill="var(--tinta-3)"
            fontFamily="IBM Plex Mono, monospace"
          >
            {v.toFixed(0)}
          </text>
        </g>
      ))}
      <path d={area} fill="var(--rosa)" opacity="0.12" />
      <path
        d={linha}
        fill="none"
        stroke="var(--vinho)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(pontos.length - 1)}
        cy={y(ultimo.valor)}
        r="4.5"
        fill="var(--vinho)"
        stroke="var(--superficie)"
        strokeWidth="2"
      />
      <text
        x={x(pontos.length - 1) + 8}
        y={y(ultimo.valor) + 3.5}
        fontSize="10"
        fontWeight="500"
        fill="var(--tinta)"
        fontFamily="IBM Plex Mono, monospace"
      >
        {ultimo.valor.toFixed(1).replace(".", ",")}
      </text>
      <text
        x={eL}
        y={A - 5}
        fontSize="9"
        fill="var(--tinta-3)"
        fontFamily="IBM Plex Mono, monospace"
      >
        {primeiro.rotulo}
      </text>
      <text
        x={L - eR}
        y={A - 5}
        textAnchor="middle"
        fontSize="9"
        fill="var(--tinta-3)"
        fontFamily="IBM Plex Mono, monospace"
      >
        {ultimo.rotulo}
      </text>
    </svg>
  );
}
