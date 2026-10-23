import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const CONFIGURACAO_INDICADOR = {
  nota: {
    tituloColuna: "Média atual",
    propriedadeValor: "mediaAtual",
  },
  frequencia: {
    tituloColuna: "Frequência atual",
    propriedadeValor: "frequenciaAtual",
  },
};

const ANOS_ESCOLARES = [
  { valor: 1, titulo: "1º ANO" },
  { valor: 2, titulo: "2º ANO" },
  { valor: 3, titulo: "3º ANO" },
];

/** Apresenta os alunos fictícios associados ao indicador escolhido. */
export default function ModalAlunosRisco({
  titulo,
  indicador,
  alunos,
  materia,
  onClose,
}) {
  const botaoFecharRef = useRef(null);
  const configuracao = CONFIGURACAO_INDICADOR[indicador];

  useEffect(() => {
    botaoFecharRef.current?.focus();

    const fecharComEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [onClose]);

  if (!configuracao) {
    return null;
  }

  const alunosPorAno = ANOS_ESCOLARES.map((ano) => ({
    ...ano,
    alunos: alunos.filter((aluno) => {
      const turma = aluno.turma?.trim() ?? "";
      return new RegExp(`^${ano.valor}º?\\s*ANO\\b`, "i").test(turma);
    }),
  }));

  return createPortal(
    <div
      className="position-fixed d-flex align-items-center justify-content-center"
      style={{
        inset: 0,
        zIndex: 1055,
        width: "100vw",
        height: "100dvh",
        padding: "1rem",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="bg-white text-dark w-100"
        style={{
          maxWidth: "740px",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid #000",
          borderRadius: "0.75rem",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-alunos-risco-titulo"
      >
        <header className="d-flex align-items-center justify-content-between gap-3 p-3 border-bottom border-dark">
          <div>
            <h2
              className="h6 fw-semibold mb-1"
              id="modal-alunos-risco-titulo"
            >
              {titulo}
            </h2>
            <p className="small mb-0">
              {materia} · Lista demonstrativa de alunos.
            </p>
          </div>
          <button
            ref={botaoFecharRef}
            type="button"
            className="btn btn-sm btn-light border border-dark"
            aria-label="Fechar lista de alunos em risco"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="p-3">
          {alunosPorAno.map((ano) => (
            <section className="mb-3" key={ano.valor}>
              <h3 className="h6 fw-bold text-uppercase mb-2">{ano.titulo}</h3>
              <table className="table table-sm table-bordered border-dark align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Nome do aluno</th>
                    <th scope="col">{configuracao.tituloColuna}</th>
                  </tr>
                </thead>
                <tbody>
                  {ano.alunos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      <td>{aluno[configuracao.propriedadeValor]}%</td>
                    </tr>
                  ))}
                  {ano.alunos.length === 0 && (
                    <tr>
                      <td colSpan="2" className="text-center py-3">
                        Nenhum aluno nesta lista.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}
