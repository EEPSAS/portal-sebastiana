import { useRef, useState } from "react";
import { useBoletim } from "../../../hooks/Boletim/useBoletim";
import ComparativoTurmaAba from "./ComparativoTurmaAba";
import FrequenciaDetalhadaAba from "./FrequenciaDetalhadaAba";
import NotasDetalhadasAba from "./NotasDetalhadasAba";
import ResumoAba from "./ResumoAba";
import "./Boletim.css";

const ABAS = [
  { id: "resumo", label: "Resumo", icone: "bi-house-door-fill" },
  { id: "notas", label: "Notas Detalhadas", icone: "bi-bar-chart-steps" },
  {
    id: "frequencia",
    label: "Frequência Detalhada",
    icone: "bi-calendar2-check-fill",
  },
  {
    id: "comparativo",
    label: "Comparativo Turma",
    icone: "bi-people-fill",
  },
];

export default function Boletim({ turmaId }) {
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const referenciasAbas = useRef([]);
  const {
    dados,
    carregando,
    erro,
    podeTentarNovamente,
    tentarNovamente,
  } = useBoletim(turmaId);

  // As setas permitem trocar de aba sem exigir que o estudante use o mouse.
  const navegarAbas = (evento, indiceAtual) => {
    let proximoIndice;
    if (evento.key === "ArrowRight") {
      proximoIndice = (indiceAtual + 1) % ABAS.length;
    } else if (evento.key === "ArrowLeft") {
      proximoIndice = (indiceAtual - 1 + ABAS.length) % ABAS.length;
    } else if (evento.key === "Home") {
      proximoIndice = 0;
    } else if (evento.key === "End") {
      proximoIndice = ABAS.length - 1;
    } else {
      return;
    }

    evento.preventDefault();
    setAbaAtiva(ABAS[proximoIndice].id);
    referenciasAbas.current[proximoIndice]?.focus();
  };

  const renderizarAba = (idAba) => {
    if (!dados) return null;

    switch (idAba) {
      case "notas":
        return <NotasDetalhadasAba disciplinas={dados.disciplinas} />;
      case "frequencia":
        return <FrequenciaDetalhadaAba disciplinas={dados.disciplinas} />;
      case "comparativo":
        return (
          <ComparativoTurmaAba
            disciplinas={dados.disciplinas}
            comparativoNotas={dados.comparativoNotas}
          />
        );
      default:
        return <ResumoAba disciplinas={dados.disciplinas} />;
    }
  };

  return (
    <main className="boletim-page container-fluid px-0">
      <header className="boletim-page__header">
        <div>
          <p className="boletim-page__eyebrow mb-1">Área do estudante</p>
          <h1 className="h3 mb-0">Boletim Escolar</h1>
        </div>
        <span className="boletim__badge rounded-pill">
          <i className="bi bi-calendar3 me-2" aria-hidden="true" />
          Ano letivo · 3 trimestres
        </span>
      </header>

      <div className="boletim__shell">
        <div
          className="boletim__tabs"
          role="tablist"
          aria-label="Seções do boletim escolar"
        >
          {ABAS.map((aba, indice) => (
            <button
              key={aba.id}
              ref={(elemento) => {
                referenciasAbas.current[indice] = elemento;
              }}
              type="button"
              id={`boletim-aba-${aba.id}`}
              role="tab"
              aria-selected={abaAtiva === aba.id}
              aria-controls={`boletim-painel-${aba.id}`}
              tabIndex={abaAtiva === aba.id ? 0 : -1}
              className={`boletim__tab ${
                abaAtiva === aba.id ? "is-active" : ""
              }`}
              onClick={() => setAbaAtiva(aba.id)}
              onKeyDown={(evento) => navegarAbas(evento, indice)}
            >
              <i className={`bi ${aba.icone}`} aria-hidden="true" />
              <span>{aba.label}</span>
            </button>
          ))}
        </div>

        <div className="boletim__content">
          {ABAS.map((aba) => (
            <div
              key={aba.id}
              id={`boletim-painel-${aba.id}`}
              role="tabpanel"
              aria-labelledby={`boletim-aba-${aba.id}`}
              tabIndex="0"
              hidden={abaAtiva !== aba.id}
            >
              {abaAtiva === aba.id && carregando && (
                <div className="boletim__state" role="status">
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  />
                  Carregando as informações do seu boletim...
                </div>
              )}

              {abaAtiva === aba.id && !carregando && erro && (
                <div className="alert alert-warning mb-0" role="alert">
                  <p className="mb-2">{erro}</p>
                  {podeTentarNovamente && (
                    <button
                      type="button"
                      className="btn btn-sm boletim__btn-primary rounded-pill px-3"
                      onClick={tentarNovamente}
                    >
                      Tentar novamente
                    </button>
                  )}
                </div>
              )}

              {abaAtiva === aba.id && !carregando && !erro
                ? renderizarAba(aba.id)
                : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
