import { useRef, useState } from "react";
import { useBoletim } from "../../../hooks/Boletim/useBoletim";
import PainelModulo from "../common/PainelModulo";
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

export default function Boletim({ turmaId, alunoId }) {
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const referenciasAbas = useRef([]);
  const {
    dados,
    carregando,
    erro,
    semMatricula,
    podeTentarNovamente,
    tentarNovamente,
  } = useBoletim(turmaId, alunoId);

  // As setas permitem trocar de aba sem exigir que o estudante use o mouse
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
            frequenciaAlunoGlobal={dados.frequenciaAlunoGlobal}
            frequenciaTurmaGlobal={dados.frequenciaTurmaGlobal}
          />
        );
      default:
        return <ResumoAba disciplinas={dados.disciplinas} />;
    }
  };

  const acoesBoletim = (
    <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-semibold small">
      <i className="bi bi-calendar3 me-1 text-primary" aria-hidden="true" />
      Ano letivo · 3 trimestres
    </span>
  );

  return (
    <PainelModulo acoes={acoesBoletim}>
      <div className="boletim__shell">
        {/* Sub-abas de 2º Nível: Segmentadas e Elegantes */}
        <div
          className="d-flex flex-wrap align-items-center gap-1 p-1 bg-light rounded-pill border mb-3 d-inline-flex"
          role="tablist"
          aria-label="Seções do boletim escolar"
        >
          {ABAS.map((aba, indice) => {
            const ativa = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                ref={(elemento) => {
                  referenciasAbas.current[indice] = elemento;
                }}
                type="button"
                id={`boletim-aba-${aba.id}`}
                role="tab"
                aria-selected={ativa}
                aria-controls={`boletim-painel-${aba.id}`}
                tabIndex={ativa ? 0 : -1}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border-0 d-flex align-items-center gap-2 ${
                  ativa ? "btn-primary text-white shadow-sm" : "btn-light text-muted"
                }`}
                onClick={() => setAbaAtiva(aba.id)}
                onKeyDown={(evento) => navegarAbas(evento, indice)}
              >
                <i className={`bi ${aba.icone}`} aria-hidden="true" />
                <span>{aba.label}</span>
              </button>
            );
          })}
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
                    className="spinner-border spinner-border-sm me-2 text-primary"
                    aria-hidden="true"
                  />
                  Carregando as informações do seu boletim...
                </div>
              )}

              {abaAtiva === aba.id && !carregando && erro && (
                <div
                  className={`alert ${semMatricula ? "alert-info" : "alert-warning"} d-flex flex-column gap-2 mb-0 rounded-4 shadow-sm`}
                  role="alert"
                >
                  <div className="d-flex align-items-center gap-2">
                    <i
                      className={`bi ${semMatricula ? "bi-info-circle-fill text-info" : "bi-exclamation-triangle-fill text-warning"} fs-5`}
                      aria-hidden="true"
                    />
                    <strong className="fw-semibold">
                      {semMatricula ? "Aviso de Matrícula Escolar" : "Atenção"}
                    </strong>
                  </div>
                  <p className="mb-0 text-secondary">{erro}</p>
                  {podeTentarNovamente && (
                    <div className="pt-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={tentarNovamente}
                      >
                        Tentar novamente
                      </button>
                    </div>
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
    </PainelModulo>
  );
}
