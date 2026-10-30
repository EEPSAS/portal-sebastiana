/**
 * ModalImportarNotas.jsx - Upload e Conciliação Inteligente de Diário Escolar (CSV)
 *
 * Papel Didático:
 * Atende à Diretriz 3.4d (28/10/2026) além das etapas existentes:
 * 1. Upload do arquivo CSV com download de modelo pré-formatado;
 * 2. Conciliação de Disciplinas (`etapa === "disciplinas"`): sanitiza os cabeçalhos do CSV e,
 *    caso alguma disciplina não seja localizada automaticamente, solicita aprovação do Especialista
 *    para correlacionar manualmente a uma disciplina existente OU criar uma nova disciplina no Ciclo da turma;
 * 3. Confirmação e desambiguação inteligente caso sejam detectados homônimos na turma/escola;
 * 4. Resolução de divergências de notas em períodos letivos anteriores.
 */

import { useEffect, useState } from "react";
import { listarCiclos } from "../../../services/disciplinasService";
import ModalCiclo from "../disciplinas/ModalCiclo";
import { importarNotasCSV } from "../../../services/turmasService";
import { formatarDisciplinaCiclo } from "../../../utils/formatters";

const ModalImportarNotas = ({ turma, isOpen, onClose, onSuccess }) => {
  const [arquivo, setArquivo] = useState(null);
  const [periodoLetivo, setPeriodoLetivo] = useState("1º Trimestre");
  const [dataAula, setDataAula] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  // Etapas: 'upload' | 'disciplinas' | 'confirmacao' | 'divergencias'
  const [etapa, setEtapa] = useState("upload");

  // Estados da Etapa de Conciliação de Disciplinas (Diretriz 3.4d)
  const [disciplinasPendentes, setDisciplinasPendentes] = useState([]);
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([]);
  const [mapeamentosDisciplinas, setMapeamentosDisciplinas] = useState({});
  // Estados dos Ciclos Escolares para conciliação e criação dinâmica (+)
  const [ciclos, setCiclos] = useState([]);
  const [modalCicloAberto, setModalCicloAberto] = useState(false);
  const [disciplinaChaveParaNovoCiclo, setDisciplinaChaveParaNovoCiclo] = useState(null);

  // Estados de resolução de homônimos e divergências de notas
  const [ambiguidades, setAmbiguidades] = useState([]);
  const [mapeamentos, setMapeamentos] = useState({});
  const [divergencias, setDivergencias] = useState([]);

  // Carrega a listagem de ciclos escolares para alimentar os seletores de conciliação
  useEffect(() => {
    let ativo = true;
    if (isOpen) {
      listarCiclos()
        .then((dados) => {
          if (ativo && Array.isArray(dados)) {
            setCiclos(dados);
          }
        })
        .catch(() => {});
    }
    return () => {
      ativo = false;
    };
  }, [isOpen]);

  // Abre o modal de criação rápida de Ciclo vinculado opcionalmente a uma linha de disciplina
  const handleAbrirCriarCiclo = (chaveDisciplina = null) => {
    setDisciplinaChaveParaNovoCiclo(chaveDisciplina);
    setModalCicloAberto(true);
  };

  // Callback chamado pelo ModalCiclo após persistir com sucesso no banco de dados
  const handleNovoCicloSalvo = (cicloSalvo) => {
    if (cicloSalvo?.id_ciclo) {
      const novoId = Number(cicloSalvo.id_ciclo);
      const novoCiclo = {
        id_ciclo: novoId,
        nome: cicloSalvo.nome,
        descricao: cicloSalvo.descricao || "",
      };

      // 1. Atualiza a lista forçando re-renderização do select com o novo ciclo
      setCiclos((prev) => {
        const existe = prev.some((c) => Number(c.id_ciclo) === novoId);
        return existe ? prev : [...prev, novoCiclo];
      });

      // 2. Preenche automaticamente o novo ciclo como selecionado por padrão
      if (disciplinaChaveParaNovoCiclo) {
        setMapeamentosDisciplinas((prev) => ({
          ...prev,
          [disciplinaChaveParaNovoCiclo]: {
            ...prev[disciplinaChaveParaNovoCiclo],
            ciclo_id: novoId,
          },
        }));
      } else {
        setMapeamentosDisciplinas((prev) => {
          const atualizado = { ...prev };
          Object.keys(atualizado).forEach((k) => {
            if (atualizado[k]?.acao === "criar_nova") {
              atualizado[k] = { ...atualizado[k], ciclo_id: novoId };
            }
          });
          return atualizado;
        });
      }
    }
    setModalCicloAberto(false);
    setDisciplinaChaveParaNovoCiclo(null);
  };

  if (!isOpen) return null;

  // Fecha o modal e redefine todos os estados internos para o padrão inicial
  const handleFecharModal = () => {
    setEtapa("upload");
    setDisciplinasPendentes([]);
    setDisciplinasCatalogo([]);
    setMapeamentosDisciplinas({});
    setModalCicloAberto(false);
    setDisciplinaChaveParaNovoCiclo(null);
    setAmbiguidades([]);
    setMapeamentos({});
    setDivergencias([]);
    setErro("");
    setResultado(null);
    onClose();
  };

  // Roteador central da resposta da API para avançar entre as etapas de aprovação
  const processarRespostaImportacao = (resposta) => {
    if (resposta.status === "pendente_confirmacao") {
      // Prioridade 1: Conciliação de Disciplinas não localizadas (Diretriz 3.4d)
      if (
        resposta.tipo_pendencia === "conciliacao_disciplinas" ||
        (resposta.disciplinas_pendentes && resposta.disciplinas_pendentes.length > 0)
      ) {
        const listaPend = resposta.disciplinas_pendentes || [];
        const catalogo = resposta.catalogo_disciplinas || resposta.disciplinas_catalogo || [];
        if (Array.isArray(resposta.catalogo_ciclos) && resposta.catalogo_ciclos.length > 0) {
          setCiclos(resposta.catalogo_ciclos);
        }
        setDisciplinasPendentes(listaPend);
        setDisciplinasCatalogo(catalogo);

        const cicloPadraoId = turma?.ciclo_id || (resposta.catalogo_ciclos?.[0]?.id_ciclo ?? "");

        const mapaInicial = {};
        listaPend.forEach((item) => {
          const chave = item.nome_sanitizado || item.nome_csv;
          if (item.sugestao_id) {
            mapaInicial[chave] = {
              acao: "vincular",
              id_disciplina: Number(item.sugestao_id),
              nome_nova: item.nome_sanitizado || item.nome_csv,
              aulas_semanais: 4,
              ciclo_id: cicloPadraoId,
            };
          } else {
            mapaInicial[chave] = {
              acao: "criar_nova",
              id_disciplina: catalogo[0]?.id_disciplina || "",
              nome_nova: item.nome_sanitizado || item.nome_csv,
              aulas_semanais: 4,
              ciclo_id: cicloPadraoId,
            };
          }
        });
        setMapeamentosDisciplinas(mapaInicial);
        setEtapa("disciplinas");
        return;
      }

      // Prioridade 2: Homônimos de alunos
      if (resposta.ambiguidades?.length > 0) {
        setAmbiguidades(resposta.ambiguidades);
        const inicial = {};
        resposta.ambiguidades.forEach((amb) => {
          const matriculado = amb.candidatos?.find((c) => c.ja_matriculado);
          inicial[amb.nome_csv] = matriculado
            ? matriculado.id
            : amb.candidatos?.[0]?.id || "ignorar";
        });
        setMapeamentos(inicial);
        setEtapa("confirmacao");
        return;
      }

      // Prioridade 3: Divergências de notas em períodos anteriores
      if (
        resposta.tipo_pendencia === "divergencias_notas" ||
        resposta.divergencias?.length > 0
      ) {
        setDivergencias(resposta.divergencias || []);
        setEtapa("divergencias");
        return;
      }
    }

    // Importação finalizada com sucesso
    setResultado(resposta);
    setEtapa("upload");
    if (onSuccess) {
      onSuccess(resposta);
    }
  };

  // Monta o FormData base preservando decisões já tomadas nas etapas anteriores
  const construirFormDataBase = () => {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("exigir_conciliacao_disciplinas", "1");
    if (periodoLetivo) {
      formData.append("periodo_letivo", periodoLetivo);
    }
    if (dataAula) {
      formData.append("data_aula", dataAula);
    }
    if (Object.keys(mapeamentosDisciplinas).length > 0) {
      formData.append(
        "mapeamentos_disciplinas",
        JSON.stringify(mapeamentosDisciplinas)
      );
    }
    if (Object.keys(mapeamentos).length > 0) {
      formData.append("mapeamentos_alunos", JSON.stringify(mapeamentos));
    }
    return formData;
  };

  // Gera e faz download de um arquivo CSV de exemplo para testes
  const baixarModeloExemplo = () => {
    const conteudoExemplo = [
      "Aluno;Matemática;Língua Portuguesa;Física;História;Faltas Matemática",
      "Ana Silva;8,5;9,0;7,5;8,0;0",
      "Carlos Eduardo;6,0;7,0;5,5;6,5;2",
      "Mariana Santos;9,5;8,5;9,0;9,5;0",
      "Lucas Oliveira;5,0;4,5;6,0;5,5;4",
    ].join("\n");

    const blob = new Blob([conteudoExemplo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `modelo_notas_${turma?.nome_identificador?.replace(/\s+/g, "_") || "turma"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Manipula e valida a seleção do arquivo, bloqueando formatos não-CSV instantaneamente
  const handleArquivoChange = (event) => {
    setErro("");
    setResultado(null);
    const file = event.target.files?.[0] || null;

    if (!file) {
      setArquivo(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErro(
        "O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV."
      );
      setArquivo(null);
      event.target.value = "";
      return;
    }

    setArquivo(file);
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

    if (!arquivo.name.toLowerCase().endsWith(".csv")) {
      setErro(
        "O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV."
      );
      return;
    }

    const formData = construirFormDataBase();

    setLoading(true);
    try {
      const resposta = await importarNotasCSV(turma.id_turma, formData);
      processarRespostaImportacao(resposta);
    } catch (err) {
      setErro(err.message || "Ocorreu um erro ao processar o arquivo CSV.");
    } finally {
      setLoading(false);
    }
  };

  // Envio da aprovação de conciliação de disciplinas (Diretriz 3.4d)
  const handleConfirmarDisciplinas = async (event) => {
    event.preventDefault();
    setErro("");

    const formData = construirFormDataBase();

    setLoading(true);
    try {
      const resposta = await importarNotasCSV(turma.id_turma, formData);
      processarRespostaImportacao(resposta);
    } catch (err) {
      setErro(
        err.message || "Ocorreu um erro ao conciliar as disciplinas do arquivo CSV."
      );
    } finally {
      setLoading(false);
    }
  };

  // Envio de confirmação manual de homônimos (Resolução de Alunos)
  const handleConfirmarHomonimos = async (event) => {
    event.preventDefault();
    setErro("");
    setResultado(null);

    const formData = construirFormDataBase();

    setLoading(true);
    try {
      const resposta = await importarNotasCSV(turma.id_turma, formData);
      processarRespostaImportacao(resposta);
    } catch (err) {
      setErro(err.message || "Ocorreu um erro ao confirmar a atribuição dos alunos.");
    } finally {
      setLoading(false);
    }
  };

  // Envio da decisão sobre notas divergentes de períodos anteriores ('atualizar' ou 'manter')
  const handleConfirmarDivergencias = async (decisao) => {
    setErro("");
    setResultado(null);

    const formData = construirFormDataBase();
    formData.append("decisao_divergencias", decisao);

    setLoading(true);
    try {
      const resposta = await importarNotasCSV(turma.id_turma, formData);
      processarRespostaImportacao(resposta);
    } catch (err) {
      setErro(
        err.message || "Ocorreu um erro ao aplicar a decisão sobre as notas divergentes."
      );
    } finally {
      setLoading(false);
    }
  };

  // Atualiza a escolha do especialista para uma disciplina pendente do CSV
  const atualizarDecisaoDisciplina = (chave, camposNovos) => {
    setMapeamentosDisciplinas((prev) => ({
      ...prev,
      [chave]: {
        ...(prev[chave] || {}),
        ...camposNovos,
      },
    }));
  };

  return (
    <div
      className="turmas-modal-overlay"
      onClick={handleFecharModal}
      role="presentation"
    >
      <div
        className="turmas-modal-dialog"
        style={{
          width:
            etapa === "divergencias" || etapa === "disciplinas"
              ? "min(860px, 100%)"
              : "min(680px, 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-importar-titulo"
      >
        {/* Cabeçalho */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div>
            <h5
              id="modal-importar-titulo"
              className="fw-bold text-dark mb-0 d-flex align-items-center gap-2"
            >
              <span style={{ color: "var(--dashboard-pink)" }}>📊</span>
              Cadastrar Notas via CSV
            </h5>
            <small className="text-muted">
              Turma selecionada:{" "}
              <strong className="text-dark">{turma?.nome_identificador}</strong>
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
            {erro && (
              <div
                className="alert alert-danger d-flex align-items-center gap-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{erro}</div>
              </div>
            )}

            {resultado && (
              <div
                className="alert alert-success d-flex flex-column gap-2 mb-3"
                role="alert"
              >
                <div className="d-flex align-items-center gap-2 fw-bold">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  {resultado.message || "Importação concluída com sucesso!"}
                </div>
                {resultado.dados && (
                  <div className="small text-muted border-top pt-2 mt-1">
                    <div>
                      Linhas lidas: <strong>{resultado.dados.linhas_lidas}</strong> | Alunos
                      identificados: <strong>{resultado.dados.alunos_identificados}</strong> |
                      Notas sincronizadas:{" "}
                      <strong>{resultado.dados.notas_sincronizadas}</strong>
                    </div>
                    {resultado.dados.total_ignorados > 0 && (
                      <div className="text-warning-emphasis fw-semibold mt-1 d-flex align-items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill text-warning"></i>
                        <span>
                          {resultado.dados.total_ignorados} aluno(s) ignorado(s) por falta de
                          cadastro institucional (@aluno.mg.gov.br) ou matrícula ativa.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {resultado.dados?.alertas && resultado.dados.alertas.length > 0 && (
                  <div
                    className="mt-2 p-2 bg-light rounded-2 border small"
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                  >
                    <div className="fw-semibold text-dark mb-1">Avisos da Importação:</div>
                    <ul className="mb-0 ps-3 text-muted">
                      {resultado.dados.alertas.map((alerta, aIdx) => (
                        <li key={aIdx}>{alerta}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Ajuda / Download de Modelo */}
            <div className="card bg-light border-0 rounded-3 p-3 mb-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                <div>
                  <strong className="d-block text-dark">
                    Formato do Diário Escolar (CSV)
                  </strong>
                  <small className="text-muted">
                    Aceita arquivos delimitados por vírgula ou ponto-e-vírgula com colunas de
                    Aluno e Disciplinas (conciliadas com o Ciclo da turma).
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
              <div className="col-12">
                <label htmlFor="csv-file-input" className="form-label fw-semibold text-dark">
                  Arquivo CSV da Turma <span className="text-danger">*</span>
                </label>
                <input
                  id="csv-file-input"
                  type="file"
                  className="form-control"
                  accept=".csv"
                  onChange={handleArquivoChange}
                  required
                  disabled={loading}
                />
                <div className="form-text">Tamanho máximo suportado: 10MB.</div>
              </div>

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
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
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

        {/* ETAPA 1.5: Conciliação e Aprovação de Disciplinas do CSV (Diretriz 3.4d) */}
        {etapa === "disciplinas" && (
          <form onSubmit={handleConfirmarDisciplinas}>
            {erro && (
              <div
                className="alert alert-danger d-flex align-items-center gap-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{erro}</div>
              </div>
            )}

            <div
              className="alert alert-info d-flex align-items-start gap-2 mb-3"
              role="alert"
            >
              <i className="bi bi-journal-check fs-4 flex-shrink-0 text-primary"></i>
              <div>
                <strong className="d-block text-dark">
                  Conciliação de Disciplinas do CSV (Aprovação do Especialista)
                </strong>
                <small className="text-muted">
                  Algumas colunas de disciplinas da planilha não foram localizadas de forma
                  exata no sistema. Aprove a correlação manual para uma disciplina já
                  existente OU autorize a criação de uma nova disciplina no Ciclo da turma:
                </small>
              </div>
            </div>

            <div
              className="d-flex flex-column gap-3 mb-4"
              style={{ maxHeight: "360px", overflowY: "auto" }}
            >
              {disciplinasPendentes.map((item, idx) => {
                const chave = item.nome_sanitizado || item.nome_csv;
                const decisao = mapeamentosDisciplinas[chave] || {
                  acao: "criar_nova",
                  id_disciplina: "",
                  nome_nova: chave,
                  aulas_semanais: 4,
                };

                return (
                  <div
                    key={chave || idx}
                    className="card border p-3 rounded-3 shadow-sm bg-light"
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom">
                      <div>
                        <span className="badge bg-primary me-2">Coluna no CSV</span>
                        <strong className="text-dark">{item.nome_csv}</strong>
                        {item.nome_sanitizado && item.nome_sanitizado !== item.nome_csv && (
                          <span className="text-muted small ms-2">
                            (Sanitizado: <code>{item.nome_sanitizado}</code>)
                          </span>
                        )}
                      </div>
                      {item.sugestao_nome && (
                        <span className="badge bg-warning-subtle text-dark border">
                          Sugestão aproximada: {item.sugestao_nome}
                        </span>
                      )}
                    </div>

                    {/* Escolha de Ação */}
                    <div className="row g-2 align-items-end">
                      <div className={decisao.acao === "criar_nova" ? "col-12 col-md-4" : "col-12 col-md-5"}>
                        <label className="form-label small fw-bold text-dark mb-1">
                          Ação de Conciliação:
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={decisao.acao}
                          onChange={(e) =>
                            atualizarDecisaoDisciplina(chave, { acao: e.target.value })
                          }
                          disabled={loading}
                        >
                          <option value="vincular">
                            Correlacionar a disciplina existente
                          </option>
                          <option value="criar_nova">
                            Criar nova disciplina a partir do CSV
                          </option>
                          <option value="ignorar">Ignorar esta coluna</option>
                        </select>
                      </div>

                      {decisao.acao === "vincular" && (
                        <div className="col-12 col-md-7">
                          <label className="form-label small fw-bold text-dark mb-1">
                            Selecionar Disciplina do Sistema:
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={decisao.id_disciplina || ""}
                            onChange={(e) =>
                              atualizarDecisaoDisciplina(chave, {
                                id_disciplina: Number(e.target.value),
                              })
                            }
                            disabled={loading}
                            required
                          >
                            <option value="">Selecione uma disciplina...</option>
                            {disciplinasCatalogo.map((d) => (
                              <option key={d.id_disciplina} value={d.id_disciplina}>
                                {formatarDisciplinaCiclo(d)} ({d.aulas_semanais || 4} aulas/sem)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {decisao.acao === "criar_nova" && (
                        <>
                          <div className="col-12 col-md-3">
                            <label className="form-label small fw-bold text-dark mb-1">
                              Nome da Disciplina:
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={decisao.nome_nova || ""}
                              onChange={(e) =>
                                atualizarDecisaoDisciplina(chave, {
                                  nome_nova: e.target.value,
                                })
                              }
                              disabled={loading}
                              required
                            />
                          </div>
                          <div className="col-4 col-md-2">
                            <label className="form-label small fw-bold text-dark mb-1">
                              Aulas/Sem:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              className="form-control form-control-sm"
                              value={decisao.aulas_semanais || 4}
                              onChange={(e) =>
                                atualizarDecisaoDisciplina(chave, {
                                  aulas_semanais: Number(e.target.value),
                                })
                              }
                              disabled={loading}
                              required
                            />
                          </div>
                          <div className="col-8 col-md-3">
                            <label className="form-label small fw-bold text-dark mb-1">
                              Ciclo Escolar:
                            </label>
                            <div className="input-group input-group-sm">
                              <select
                                className="form-select form-select-sm"
                                value={decisao.ciclo_id || ""}
                                onChange={(e) =>
                                  atualizarDecisaoDisciplina(chave, {
                                    ciclo_id: Number(e.target.value),
                                  })
                                }
                                disabled={loading}
                                required
                              >
                                <option value="">Selecione o Ciclo...</option>
                                {ciclos.map((c) => (
                                  <option key={c.id_ciclo} value={c.id_ciclo}>
                                    {c.nome}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                title="Cadastrar novo ciclo"
                                onClick={() => handleAbrirCriarCiclo(chave)}
                                disabled={loading}
                              >
                                <i className="bi bi-plus-lg"></i>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Conciliando Disciplinas...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i>
                    Aprovar Correlação de Disciplinas e Prosseguir
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
              <div
                className="alert alert-danger d-flex align-items-center gap-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{erro}</div>
              </div>
            )}

            <div
              className="alert alert-warning d-flex align-items-start gap-2 mb-3"
              role="alert"
            >
              <i className="bi bi-person-fill-exclamation fs-4 flex-shrink-0 text-warning"></i>
              <div>
                <strong className="d-block text-dark">
                  Alunos com nomes similares ou homônimos detectados
                </strong>
                <small className="text-muted">
                  Identificamos nomes na planilha que correspondem a mais de um estudante no
                  sistema. Confirme a qual conta cada nota pertence antes de salvar:
                </small>
              </div>
            </div>

            <div
              className="d-flex flex-column gap-3 mb-4"
              style={{ maxHeight: "360px", overflowY: "auto" }}
            >
              {ambiguidades.map((amb, index) => (
                <div
                  key={amb.nome_csv || index}
                  className="card border p-3 rounded-3 shadow-sm bg-light"
                >
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
                          mapeamentos[amb.nome_csv] === cand.id
                            ? "bg-white border-primary shadow-sm"
                            : "bg-white-50"
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
                        mapeamentos[amb.nome_csv] === "ignorar"
                          ? "bg-white border-warning shadow-sm"
                          : "bg-white-50"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        className="form-check-input mt-0"
                        name={`ambiguidade-${index}`}
                        value="ignorar"
                        checked={mapeamentos[amb.nome_csv] === "ignorar"}
                        onChange={() =>
                          setMapeamentos((prev) => ({
                            ...prev,
                            [amb.nome_csv]: "ignorar",
                          }))
                        }
                        disabled={loading}
                      />
                      <div>
                        <span className="fw-semibold text-secondary">(-) Nenhum destes</span>
                        <small className="text-muted ms-2">
                          (Ignorar este aluno - não importar notas sem cadastro prévio)
                        </small>
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
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
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

        {/* ETAPA 3: Resolução de Divergências em Notas de Períodos Anteriores */}
        {etapa === "divergencias" && (
          <div>
            {erro && (
              <div
                className="alert alert-danger d-flex align-items-center gap-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{erro}</div>
              </div>
            )}

            <div
              className="alert alert-warning d-flex align-items-start gap-2 mb-3"
              role="alert"
            >
              <i className="bi bi-exclamation-octagon-fill fs-4 flex-shrink-0 text-warning"></i>
              <div>
                <strong className="d-block text-dark">
                  Divergência detectada em notas de períodos anteriores
                </strong>
                <small className="text-muted">
                  Identificamos que as notas deste arquivo para períodos já cadastrados diferem
                  dos valores atualmente registrados no banco de dados. Compare os lançamentos
                  abaixo e confirme como deseja proceder:
                </small>
              </div>
            </div>

            <div
              className="dashboard-table-scroll border rounded-3 mb-4"
              tabIndex={0}
              role="region"
              aria-label="Tabela de divergências de notas"
              style={{ maxHeight: "320px" }}
            >
              <table
                className="table table-sm table-hover align-middle mb-0"
                style={{ fontSize: "0.875rem" }}
              >
                <thead className="table-light sticky-top">
                  <tr>
                    <th scope="col" className="ps-3">
                      Aluno
                    </th>
                    <th scope="col">Disciplina</th>
                    <th scope="col">Período</th>
                    <th scope="col" className="text-center">
                      Nota Atual
                    </th>
                    <th scope="col" className="text-center">
                      Nova Nota (Arquivo)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {divergencias.map((div, dIdx) => (
                    <tr key={dIdx}>
                      <th scope="row" className="ps-3 fw-semibold text-dark">
                        {div.nome_aluno}
                      </th>
                      <td className="text-muted">{div.nome_disciplina}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {div.periodo_letivo}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-danger border border-danger-subtle px-2 py-1">
                          {Number(div.nota_atual).toFixed(2).replace(".", ",")}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-bold">
                          {Number(div.nova_nota).toFixed(2).replace(".", ",")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 pt-3 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => setEtapa("upload")}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-1"></i> Voltar ao arquivo
              </button>

              <div className="d-flex flex-column flex-sm-row gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center justify-content-center gap-1"
                  onClick={() => handleConfirmarDivergencias("manter")}
                  disabled={loading}
                >
                  <i className="bi bi-shield-check"></i>
                  <span>Manter Anteriores e Importar Novos</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm turmas-btn-primario rounded-pill px-3 d-flex align-items-center justify-content-center gap-1"
                  onClick={() => handleConfirmarDivergencias("atualizar")}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-repeat"></i>
                  <span>Atualizar Notas Anteriores</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Sobreposto para Criação Instantânea de Ciclo (+) */}
      {modalCicloAberto && (
        <div style={{ position: "relative", zIndex: 1065 }}>
          <ModalCiclo
            ciclo={null}
            onFechar={() => {
              setModalCicloAberto(false);
              setDisciplinaChaveParaNovoCiclo(null);
            }}
            onSalvo={handleNovoCicloSalvo}
          />
        </div>
      )}
    </div>
  );
};

export default ModalImportarNotas;
