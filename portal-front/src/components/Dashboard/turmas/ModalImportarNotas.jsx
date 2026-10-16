// Importação específica do hook useState (dispensa 'import React')
import { useState } from "react";
import { importarNotasCSV } from "../../../services/turmasService";

/**
 * Modal didático para envio de arquivo CSV contendo diário escolar e notas da turma.
 * Possui duas etapas:
 * 1. Upload do arquivo com download de modelo CSV pré-formatado.
 * 2. Confirmação e desambiguação inteligente caso sejam detectados homônimos na turma/escola.
 */
const ModalImportarNotas = ({ turma, isOpen, onClose, onSuccess }) => {
  const [arquivo, setArquivo] = useState(null);
  const [periodoLetivo, setPeriodoLetivo] = useState("1º Trimestre");
  const [dataAula, setDataAula] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  // Estados pedagógicos para o fluxo de resolução de homônimos (Etapa 2)
  const [etapa, setEtapa] = useState("upload"); // 'upload' ou 'confirmacao'
  const [ambiguidades, setAmbiguidades] = useState([]);
  const [mapeamentos, setMapeamentos] = useState({});

  if (!isOpen) return null;

  // Fecha o modal e redefine todos os estados internos para o padrão inicial
  const handleFecharModal = () => {
    setEtapa("upload");
    setAmbiguidades([]);
    setMapeamentos({});
    setErro("");
    setResultado(null);
    onClose();
  };

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

  // Envio inicial da planilha (Etapa 1: Upload)
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

      // Se o backend detectou estudantes com mesmo primeiro/último nome pendentes de confirmação
      if (resposta.status === "pendente_confirmacao" && resposta.ambiguidades?.length > 0) {
        setAmbiguidades(resposta.ambiguidades);
        const inicial = {};
        resposta.ambiguidades.forEach((amb) => {
          // Pré-seleciona o candidato que já estiver matriculado nesta turma ou o primeiro da lista
          const matriculado = amb.candidatos?.find((c) => c.ja_matriculado);
          inicial[amb.nome_csv] = matriculado ? matriculado.id : (amb.candidatos?.[0]?.id || "novo");
        });
        setMapeamentos(inicial);
        setEtapa("confirmacao");
      } else {
        setResultado(resposta);
        if (onSuccess) {
          onSuccess(resposta);
        }
      }
    } catch (err) {
      setErro(err.message || "Ocorreu um erro ao processar o arquivo CSV.");
    } finally {
      setLoading(false);
    }
  };

  // Envio de confirmação manual de homônimos (Etapa 2: Resolução)
  const handleConfirmarHomonimos = async (event) => {
    event.preventDefault();
    setErro("");
    setResultado(null);

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    if (periodoLetivo) {
      formData.append("periodo_letivo", periodoLetivo);
    }
    if (dataAula) {
      formData.append("data_aula", dataAula);
    }
    // Serializa o mapeamento de decisões [nome_csv => id_aluno | 'novo']
    formData.append("mapeamentos_alunos", JSON.stringify(mapeamentos));

    setLoading(true);
    try {
      const resposta = await importarNotasCSV(turma.id_turma, formData);
      setResultado(resposta);
      setEtapa("upload");
      if (onSuccess) {
        onSuccess(resposta);
      }
    } catch (err) {
      setErro(err.message || "Ocorreu um erro ao confirmar a atribuição dos alunos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="turmas-modal-overlay"
      onClick={handleFecharModal}
      role="presentation"
    >
      <div
        className="turmas-modal-dialog"
        style={{ width: "min(680px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-importar-titulo"
      >
        {/* Cabeçalho */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div>
            <h5 id="modal-importar-titulo" className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <span style={{ color: "var(--dashboard-pink)" }}>📊</span>
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
            onClick={handleFecharModal}
            disabled={loading}
          ></button>
        </div>

        {/* ETAPA 1: Formulário de Upload do CSV */}
        {etapa === "upload" && (
          <form onSubmit={handleSubmit}>
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

            {/* Rodapé com Ações */}
            <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-3">
              <button
                type="button"
                className="btn btn-sm btn-light border px-3 rounded-pill"
                onClick={handleFecharModal}
                disabled={loading}
              >
                {resultado ? "Fechar" : "Cancelar"}
              </button>
              <button
                type="submit"
                className="btn btn-sm turmas-btn-primario px-4 rounded-pill d-flex align-items-center gap-2"
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
        )}

        {/* ETAPA 2: Resolução e Desambiguação de Homônimos */}
        {etapa === "confirmacao" && (
          <form onSubmit={handleConfirmarHomonimos}>
            {erro && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{erro}</div>
              </div>
            )}

            <div className="alert alert-warning d-flex align-items-start gap-2 mb-3" role="alert">
              <i className="bi bi-person-fill-exclamation fs-4 flex-shrink-0 text-warning"></i>
              <div>
                <strong className="d-block text-dark">Alunos com nomes similares ou homônimos detectados</strong>
                <small className="text-muted">
                  Identificamos nomes na planilha que correspondem a mais de um estudante no sistema. Confirme a qual conta cada nota pertence antes de salvar:
                </small>
              </div>
            </div>

            <div className="d-flex flex-column gap-3 mb-4" style={{ maxHeight: "360px", overflowY: "auto" }}>
              {ambiguidades.map((amb, index) => (
                <div key={amb.nome_csv || index} className="card border p-3 rounded-3 shadow-sm bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                    <div>
                      <span className="badge bg-secondary me-2">Nome na Planilha</span>
                      <strong className="text-dark fs-6">{amb.nome_csv}</strong>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2 mt-1">
                    {amb.candidatos?.map((cand) => (
                      <label
                        key={cand.id}
                        className={`form-check-label p-2 rounded-2 border d-flex align-items-center justify-content-between ${
                          mapeamentos[amb.nome_csv] === cand.id ? "bg-white border-primary shadow-sm" : "bg-white-50"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            className="form-check-input mt-0"
                            name={`ambiguidade-${index}`}
                            value={cand.id}
                            checked={mapeamentos[amb.nome_csv] === cand.id}
                            onChange={() =>
                              setMapeamentos((prev) => ({
                                ...prev,
                                [amb.nome_csv]: cand.id,
                              }))
                            }
                            disabled={loading}
                          />
                          <div>
                            <span className="fw-semibold text-dark">{cand.name}</span>
                            <span className="text-muted small ms-2">({cand.email})</span>
                          </div>
                        </div>
                        {cand.ja_matriculado && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Matriculado nesta turma
                          </span>
                        )}
                      </label>
                    ))}

                    <label
                      className={`form-check-label p-2 rounded-2 border d-flex align-items-center gap-2 ${
                        mapeamentos[amb.nome_csv] === "novo" ? "bg-white border-primary shadow-sm" : "bg-white-50"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        className="form-check-input mt-0"
                        name={`ambiguidade-${index}`}
                        value="novo"
                        checked={mapeamentos[amb.nome_csv] === "novo"}
                        onChange={() =>
                          setMapeamentos((prev) => ({
                            ...prev,
                            [amb.nome_csv]: "novo",
                          }))
                        }
                        disabled={loading}
                      />
                      <div>
                        <span className="fw-semibold text-primary">(+) Nenhum destes</span>
                        <small className="text-muted ms-2">(Cadastrar como novo aluno nesta turma)</small>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-3 rounded-pill"
                onClick={() => setEtapa("upload")}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-1"></i> Voltar ao arquivo
              </button>
              <button
                type="submit"
                className="btn btn-sm turmas-btn-primario px-4 rounded-pill d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i>
                    Confirmar e Finalizar Importação
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalImportarNotas;
