/**
 * ModalDetalhesAluno.jsx - Ficha Informativa do Estudante Matriculado
 *
 * Papel Didático:
 * Exibe um modal simples e direto com as informações cadastrais e de vínculo
 * acadêmico do aluno selecionado, atendendo ao princípio de responsabilidade única.
 * Utiliza o padrão de overlay acessível com fechamento por clique externo.
 */

const ModalDetalhesAluno = ({ matricula, turmaInfo, onClose }) => {
  // Se não houver matrícula selecionada, não renderiza nada na árvore
  if (!matricula) return null;

  const alunoNome = matricula.aluno?.name || matricula.name || "Estudante sem nome";
  const alunoEmail = matricula.aluno?.email || matricula.email || "Sem e-mail cadastrado";
  const matId = matricula.id_matricula ?? matricula.id ?? 1;
  const turmaNome = turmaInfo?.nome_identificador || matricula.turma?.nome_identificador || (matricula.turma_id ? `Turma #${matricula.turma_id}` : "Não informada");
  const turno = turmaInfo?.turno || "Não informado";
  const anoLetivo = turmaInfo?.ano_letivo || "Não informado";

  let dataFormatada = "Não informada";
  const dataRaw = matricula.data_matricula || matricula.created_at;
  if (dataRaw) {
    try {
      const str = String(dataRaw);
      const dataIso = str.includes("T") ? str : `${str.slice(0, 10)}T00:00:00`;
      const d = new Date(dataIso);
      dataFormatada = !isNaN(d.getTime()) ? d.toLocaleDateString("pt-BR") : str.slice(0, 10);
    } catch {
      dataFormatada = String(dataRaw).slice(0, 10);
    }
  }

  const isAtivo = (matricula.status_matricula || "Ativo").toLowerCase() === "ativo";

  return (
    <div
      className="turmas-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="turmas-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-detalhes-aluno-titulo"
      >
        {/* 1. Cabeçalho do Modal */}
        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
          <div className="d-flex align-items-center gap-2">
            <span
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#fce7f3",
                color: "#e6007e",
              }}
            >
              <i className="bi bi-person-badge"></i>
            </span>
            <h5 className="modal-title fw-bold text-dark fs-6 mb-0" id="modal-detalhes-aluno-titulo">
              Ficha do Estudante
            </h5>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Fechar ficha do estudante"
          ></button>
        </div>

        {/* 2. Cartão de Identificação do Aluno */}
        <div className="p-3 bg-light rounded-4 border mb-3 d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#fce7f3",
              color: "#e6007e",
              fontSize: "1.4rem",
            }}
          >
            {(alunoNome || "A").charAt(0).toUpperCase()}
          </div>

          <div className="overflow-hidden">
            <h6 className="fw-bold text-dark mb-1 text-truncate">
              {alunoNome}
            </h6>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="text-muted small text-truncate" style={{ fontSize: "0.82rem" }}>
                {alunoEmail}
              </span>
              <span
                className="badge bg-white text-secondary border d-inline-flex align-items-center gap-1"
                style={{ fontSize: "0.7rem" }}
              >
                <i className="bi bi-google text-primary"></i>
                Conta Google Workspace
              </span>
            </div>
          </div>
        </div>

        {/* 3. Grade com Detalhes da Matrícula Escolar */}
        <div className="row g-2 mb-4">
          {/* Código da Matrícula */}
          <div className="col-sm-6">
            <div className="p-3 border rounded-3 bg-white h-100">
              <span className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-hash me-1 text-primary"></i>
                Nº de Matrícula
              </span>
              <span className="fw-bold text-dark fs-6">
                #{String(matId).padStart(4, "0")}
              </span>
            </div>
          </div>

          {/* Situação Acadêmica */}
          <div className="col-sm-6">
            <div className="p-3 border rounded-3 bg-white h-100">
              <span className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-shield-check me-1 text-success"></i>
                Situação
              </span>
              <span
                className={`badge rounded-pill ${
                  isAtivo
                    ? "bg-success-subtle text-success border border-success-subtle"
                    : "bg-secondary-subtle text-secondary border"
                }`}
              >
                {matricula.status_matricula || "Ativo"}
              </span>
            </div>
          </div>

          {/* Turma Vinculada */}
          <div className="col-sm-6">
            <div className="p-3 border rounded-3 bg-white h-100">
              <span className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-mortarboard me-1 text-info"></i>
                Turma Vinculada
              </span>
              <span className="fw-semibold text-dark small d-block">
                {turmaNome}
              </span>
            </div>
          </div>

          {/* Turno e Ano Letivo */}
          <div className="col-sm-6">
            <div className="p-3 border rounded-3 bg-white h-100">
              <span className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-calendar-event me-1 text-warning"></i>
                Turno / Ano Letivo
              </span>
              <span className="fw-semibold text-dark small d-block">
                {turno} • {anoLetivo}
              </span>
            </div>
          </div>

          {/* Data da Matrícula */}
          <div className="col-12">
            <div className="p-3 border rounded-3 bg-white">
              <span className="text-muted small d-block mb-1" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-clock-history me-1 text-secondary"></i>
                Data de Ingresso / Homologação
              </span>
              <span className="fw-semibold text-dark small">
                {dataFormatada}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Rodapé de Ações */}
        <div className="d-flex justify-content-end pt-2 border-top">
          <button
            type="button"
            className="btn btn-sm btn-light border px-4 py-2 rounded-pill fw-semibold"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalhesAluno;
