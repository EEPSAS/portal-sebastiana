import { useRef, useState } from "react";
import { useBoletim } from "../../../hooks/Boletim/useBoletim";
import PainelModulo from "../common/PainelModulo";
import ComparativoTurmaAba from "./ComparativoTurmaAba";
import FrequenciaDetalhadaAba from "./FrequenciaDetalhadaAba";
import NotasDetalhadasAba from "./NotasDetalhadasAba";
import ResumoAba from "./ResumoAba";
import "./Boletim.css";

const ABAS = [
  { id: "resumo", label: "Resumo", icone: "bi-house-door-fill", cor: "#2563eb", bg: "#eff6ff" },
  { id: "notas", label: "Notas Detalhadas", icone: "bi-bar-chart-steps", cor: "#7c3aed", bg: "#f5f3ff" },
  {
    id: "frequencia",
    label: "Frequência Detalhada",
    icone: "bi-calendar2-check-fill",
    cor: "#10b981",
    bg: "#f0fdf4",
  },
  {
    id: "comparativo",
    label: "Comparativo Turma",
    icone: "bi-people-fill",
    cor: "#d97706",
    bg: "#fffbeb",
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
    <div className="position-relative boletim-page-viewport-lock">
      <PainelModulo
        className="painel-modulo-viewport-lock"
        conteudoClassName="painel-modulo-conteudo-viewport-lock"
        acoes={acoesBoletim}
      >
        <div className="boletim__shell d-flex flex-column flex-grow-1 min-h-0 border-0 shadow-none bg-transparent">
          {/* Sub-abas de 2º Nível: Segmentadas e Compactas padronizadas com Turmas */}
          <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-1 bg-light rounded-3 border flex-shrink-0 mb-2"
            role="tablist"
            aria-label="Seções do boletim escolar"
          >
            <div className="d-flex flex-wrap align-items-center gap-1">
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
                    className={`btn btn-sm rounded-2 px-2.5 py-1 fw-semibold border-0 d-flex align-items-center gap-1.5 transition-all ${
                      ativa
                        ? "text-white shadow-xs"
                        : "btn-light text-secondary"
                    }`}
                    style={{
                      backgroundColor: ativa ? aba.cor : "transparent",
                    }}
                    onClick={() => setAbaAtiva(aba.id)}
                    onKeyDown={(evento) => navegarAbas(evento, indice)}
                  >
                    <i
                      className={`bi ${aba.icone}`}
                      style={{ color: ativa ? "#ffffff" : aba.cor }}
                      aria-hidden="true"
                    />
                    <span>{aba.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="boletim__content modulo-conteudo-scroll p-0">
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
    </div>
  );
}
