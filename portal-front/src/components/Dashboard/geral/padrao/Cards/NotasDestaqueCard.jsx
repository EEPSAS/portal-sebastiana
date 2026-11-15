import { Link } from "react-router";
import IndicadorTooltip from "../../../../common/IndicadorTooltip";
import { DESCRICOES_INDICADORES } from "../../../../common/descricoesIndicadores";

/**
 * NotasDestaqueCard.jsx - Cards de Melhor Nota e Atenção Pedagógica
 *
 * Papel Didático:
 * Exibe exclusivamente os destaques calculados sobre as notas reais lançadas no diário escolar,
 * apresentando estado vazio legítimo ("—") quando ainda não há avaliações registradas.
 */

export function MelhorNotaCard({
  nota = "—",
  disciplina = "Sem notas lançadas",
  mensagem = "Aguardando lançamento de notas pelo corpo docente.",
  temLancamento = false,
}) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-3 p-2 px-md-3 d-flex flex-column justify-content-between bg-white">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <IndicadorTooltip
                titulo={DESCRICOES_INDICADORES.aluno_melhor_nota.titulo}
                texto={DESCRICOES_INDICADORES.aluno_melhor_nota.texto}
              >
                <span
                  className="badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "var(--dashboard-navy-soft)",
                    color: "var(--dashboard-navy)",
                    width: "28px",
                    height: "28px",
                  }}
                  aria-hidden="true"
                >
                  <i className="bi bi-star-fill" style={{ fontSize: "0.85rem" }}></i>
                </span>
              </IndicadorTooltip>
              <span className="small text-secondary fw-semibold text-truncate">Melhor Nota</span>
            </div>
            <Link
              to="/dashboard/boletim"
              className="geral-kpi-arrow-btn geral-kpi-arrow-btn--sm flex-shrink-0 ms-2"
              aria-label="Abrir Boletim Escolar Completo"
              title="Abrir Boletim Escolar Completo"
            >
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>

          <div className="d-flex align-items-baseline gap-2 flex-wrap">
            <span className="fw-bold fs-2 text-dark lh-1">{nota}</span>
            <span className="text-secondary small fw-medium text-truncate">
              {disciplina}
            </span>
          </div>
        </div>

        <div
          className="rounded-3 p-2 mt-2"
          style={{
            backgroundColor: "var(--dashboard-navy-soft)",
            border: "1px solid var(--dashboard-navy-soft)",
          }}
        >
          <p
            className={`mb-0 ${temLancamento ? "text-success" : "text-secondary"}`}
            style={{ fontSize: "0.74rem", lineHeight: 1.3 }}
          >
            {mensagem}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotaAtencaoCard({
  nota = "—",
  disciplina = "Sem pendências",
  mensagem = "Nenhuma disciplina requer atenção no momento.",
  emAlerta = false,
  temLancamento = false,
}) {
  // Ajusta a semântica visual quando todas as disciplinas estão acima de 60%
  const corDestaqueTexto = !temLancamento
    ? "text-secondary"
    : emAlerta
      ? "text-danger"
      : "text-success";

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-3 p-2 px-md-3 d-flex flex-column justify-content-between bg-white">
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <IndicadorTooltip
                titulo={DESCRICOES_INDICADORES.aluno_nota_atencao.titulo}
                texto={DESCRICOES_INDICADORES.aluno_nota_atencao.texto}
              >
                <span
                  className="badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: emAlerta
                      ? "var(--dashboard-pink-soft)"
                      : "var(--dashboard-navy-soft)",
                    color: emAlerta ? "var(--dashboard-pink)" : "var(--dashboard-navy)",
                    width: "28px",
                    height: "28px",
                  }}
                  aria-hidden="true"
                >
                  <i
                    className={`bi ${
                      emAlerta ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"
                    }`}
                    style={{ fontSize: "0.85rem" }}
                  ></i>
                </span>
              </IndicadorTooltip>
              <span className="small text-secondary fw-semibold text-truncate">
                {emAlerta ? "Nota em Atenção" : "Menor Nota Atual"}
              </span>
            </div>
            <Link
              to="/dashboard/boletim"
              className="geral-kpi-arrow-btn geral-kpi-arrow-btn--sm flex-shrink-0 ms-2"
              aria-label="Abrir Boletim Escolar Completo"
              title="Abrir Boletim Escolar Completo"
            >
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>

          <div className="d-flex align-items-baseline gap-2 flex-wrap">
            <span className={`fw-bold fs-2 lh-1 ${emAlerta ? "text-danger" : "text-dark"}`}>
              {nota}
            </span>
            <span className="text-secondary small fw-medium text-truncate">
              {disciplina}
            </span>
          </div>
        </div>

        <div
          className="rounded-3 p-2 mt-2"
          style={{
            backgroundColor: emAlerta
              ? "var(--dashboard-pink-soft)"
              : "var(--dashboard-navy-soft)",
            border: `1px solid ${
              emAlerta ? "var(--dashboard-pink-soft)" : "var(--dashboard-navy-soft)"
            }`,
          }}
        >
          <p
            className={`mb-0 ${corDestaqueTexto}`}
            style={{ fontSize: "0.74rem", lineHeight: 1.3 }}
          >
            {mensagem}
          </p>
        </div>
      </div>
    </div>
  );
}
