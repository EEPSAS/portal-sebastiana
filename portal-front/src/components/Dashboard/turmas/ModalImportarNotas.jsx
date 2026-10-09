import React, { useState } from "react";
import { importarNotasCSV } from "../../../services/turmasService";

/**
 * Modal didático para envio de arquivo CSV contendo diário escolar e notas da turma.
 * Permite também o download imediato de um modelo CSV pré-formatado para testes.
 */
const ModalImportarNotas = ({ turma, isOpen, onClose, onSuccess }) => {
  const [arquivo, setArquivo] = useState(null);
  const [periodoLetivo, setPeriodoLetivo] = useState("1º Trimestre");
  const [dataAula, setDataAula] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  if (!isOpen) return null;

  // Gera e faz download de um arquivo CSV de exemplo para testes
  const baixarModeloExemplo = () => {
    const conteudoExemplo = [
      "Aluno;Matemática;Língua Portuguesa e Literatura;Física;História Geral e do Brasil;Faltas Matemática",
      "Ana Silva;8,5;9,0;7,5;8,0;0",
      "Carlos Eduardo;6,0;7,0;5,5;6,5;2",
      "Mariana Santos;9,5;8,5;9,0;9,5;0",
      "Lucas Oliveira;5,0;4,5;6,0;5,5;4",
    ].join("\n");

    const blob = new Blob([conteudoExemplo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `modelo_notas_${turma?.nome_identificador?.replace(/\s+/g, "_") || "turma"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");
    setResultado(null);

    if (!arquivo) {
      setErro("Por favor, selecione um arquivo CSV para enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    if (periodoLetivo) {
      formData.append("periodo_letivo", periodoLetivo);
    }
    if (dataAula) {
      formData.append("data_aula", dataAula);
    }

    setLoading(true);
    try {
      const resposta = await importarNotasCSV(turma.id_turma, formData);
      setResultado(resposta);
      if (onSuccess) {
        onSuccess(resposta);
      }
    } catch (err) {
      setErro(err.message || "Ocorreu um erro ao processar o arquivo CSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1055 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 border-0 shadow">
          {/* Cabeçalho */}
          <div className="modal-header border-bottom px-4 pt-4 pb-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-1">
                <i className="bi bi-file-earmark-spreadsheet me-2 text-primary"></i>
                Cadastrar Notas via CSV
              </h5>
              <small className="text-muted">
                Turma selecionada: <strong className="text-dark">{turma?.nome_identificador}</strong>
              </small>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              {/* Alerta de Erro */}
              {erro && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                  <div>{erro}</div>
                </div>
              )}

              {/* Alerta de Sucesso */}
              {resultado && (
                <div className="alert alert-success d-flex flex-column gap-1 mb-3" role="alert">
                  <div className="d-flex align-items-center gap-2 fw-bold">
                    <i className="bi bi-check-circle-fill fs-5"></i>
                    {resultado.message || "Importação concluída com sucesso!"}
                  </div>
                  {resultado.dados && (
                    <small className="text-muted">
                      Linhas lidas: {resultado.dados.linhas_lidas} | Alunos identificados: {resultado.dados.alunos_identificados} | Notas sincronizadas: {resultado.dados.notas_sincronizadas}
                    </small>
                  )}
                </div>
              )}

              {/* Bloco de Ajuda / Download de Modelo */}
              <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                  <div>
                    <strong className="d-block text-dark">Formato do Diário Escolar (CSV)</strong>
                    <small className="text-muted">
                      Aceita arquivos delimitados por vírgula ou ponto-e-vírgula com colunas de Aluno e Disciplinas.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary fw-semibold"
                    onClick={baixarModeloExemplo}
                  >
                    <i className="bi bi-download me-1"></i> Baixar Modelo CSV
                  </button>
                </div>
              </div>

              <div className="row g-3">
                {/* Seleção do Arquivo */}
                <div className="col-12">
                  <label htmlFor="csv-file-input" className="form-label fw-semibold text-dark">
                    Arquivo CSV da Turma <span className="text-danger">*</span>
                  </label>
                  <input
                    id="csv-file-input"
                    type="file"
                    className="form-control"
                    accept=".csv,text/csv,text/plain"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    required
                    disabled={loading}
                  />
                  <div className="form-text">Tamanho máximo suportado: 10MB.</div>
                </div>

                {/* Período Letivo */}
                <div className="col-12 col-md-6">
                  <label htmlFor="periodo-select" className="form-label fw-semibold text-dark">
                    Período Letivo
                  </label>
                  <select
                    id="periodo-select"
                    className="form-select"
                    value={periodoLetivo}
                    onChange={(e) => setPeriodoLetivo(e.target.value)}
                    disabled={loading}
                  >
                    <option value="1º Trimestre">1º Trimestre</option>
                    <option value="2º Trimestre">2º Trimestre</option>
                    <option value="3º Trimestre">3º Trimestre</option>
                    <option value="1º Bimestre">1º Bimestre</option>
                    <option value="2º Bimestre">2º Bimestre</option>
                    <option value="3º Bimestre">3º Bimestre</option>
                    <option value="4º Bimestre">4º Bimestre</option>
                  </select>
                </div>

                {/* Data de Referência das Aulas */}
                <div className="col-12 col-md-6">
                  <label htmlFor="data-aula-input" className="form-label fw-semibold text-dark">
                    Data de Referência (Opcional)
                  </label>
                  <input
                    id="data-aula-input"
                    type="date"
                    className="form-control"
                    value={dataAula}
                    onChange={(e) => setDataAula(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Rodapé com Ações */}
            <div className="modal-footer border-top px-4 pb-4 pt-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                {resultado ? "Fechar" : "Cancelar"}
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
                disabled={loading || !arquivo}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Processando Planilha...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    Enviar e Sincronizar Notas
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalImportarNotas;
