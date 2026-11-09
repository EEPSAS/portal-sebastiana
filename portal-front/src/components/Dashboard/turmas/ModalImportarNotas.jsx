/**
 * ModalImportarNotas.jsx - Upload e Conciliação Estrita de Diário Escolar (CSV)
 *
 * Papel Didático:
 * Garante que a importação do CSV atue exclusivamente no lançamento de Notas e Faltas,
 * sem jamais criar disciplinas/ciclos/usuários nem alterar vínculos curriculares:
 * 1. Upload do arquivo CSV (bloqueado preventivamente se a turma não possuir disciplinas vinculadas);
 * 2. Conciliação de Disciplinas (`etapa === "disciplinas"`): correlaciona colunas não reconhecidas
 *    estritamente às disciplinas já vinculadas à turma (`fetchTurmaDisciplinas`) ou ignora a coluna;
 * 3. Confirmação e desambiguação inteligente caso sejam detectados homônimos na turma/escola;
 * 4. Resolução de divergências de notas e/ou faltas em períodos letivos anteriores.
 */

import { useEffect, useState } from "react";
import { fetchTurmaDisciplinas, importarNotasCSV } from "../../../services/turmasService";
import {
  listarPeriodosLetivos,
  obterPeriodoLetivo,
  obterPeriodoLetivoAtivo,
} from "../../../services/periodosLetivosService";
import {
  ArquivoCsvUploadSchema,
  MapeamentosAlunosCsvSchema,
  MapeamentosDisciplinasCsvSchema,
  validarFormularioZod,
} from "../../../utils/academicoSchemas";
import { formatarDisciplinaCiclo } from "../../../utils/formatters";

const ESTADO_INICIAL_DISCIPLINAS_TURMA = {
  turmaIdCarregada: null,
  lista: [],
  erroCarregamento: "",
};

const ESTADO_INICIAL_DIVISOES_TURMA = {
  turmaKey: null,
  divisoes: [],
};

const ModalImportarNotas = ({ turma, isOpen, onClose, onSuccess, periodosDisponiveis = [] }) => {
  const [arquivo, setArquivo] = useState(null);
  const [periodoLetivoManual, setPeriodoLetivoManual] = useState("");
  const [dataAula, setDataAula] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  // Etapas: 'upload' | 'disciplinas' | 'confirmacao' | 'divergencias'
  const [etapa, setEtapa] = useState("upload");

  // Divisões do período letivo da turma carregadas de forma assíncrona
  const [estadoDivisoesTurma, setEstadoDivisoesTurma] = useState(
    ESTADO_INICIAL_DIVISOES_TURMA
  );

  const turmaId = turma?.id_turma ? Number(turma.id_turma) : null;
  const periodoIdTurma = turma?.periodo_letivo_id || turma?.periodoLetivo?.id_periodo_letivo || null;
  const anoTurma = turma?.ano_letivo || null;
  const turmaKey = `${turmaId ?? "sem-id"}_${periodoIdTurma ?? "sem-periodo"}_${anoTurma ?? "sem-ano"}`;

  // Quando periodosDisponiveis é passado via props, tem prioridade imediata
  const temPeriodosProps = Array.isArray(periodosDisponiveis) && periodosDisponiveis.length > 0;
  const divisoesTurma = temPeriodosProps
    ? periodosDisponiveis
    : estadoDivisoesTurma.turmaKey === turmaKey
    ? estadoDivisoesTurma.divisoes
    : [];

  const carregandoDivisoes =
    Boolean(isOpen) && !temPeriodosProps && estadoDivisoesTurma.turmaKey !== turmaKey;

  // Deriva o período letivo selecionado sem set-state-in-effect
  const periodoLetivo =
    periodoLetivoManual && divisoesTurma.some((d) => d.nome === periodoLetivoManual)
      ? periodoLetivoManual
      : divisoesTurma.find((d) => d.is_atual)?.nome || divisoesTurma[0]?.nome || "1º Trimestre";

  // Estados da Etapa de Conciliação Estrita de Disciplinas (restrita à grade da turma)
  const [disciplinasPendentes, setDisciplinasPendentes] = useState([]);
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([]);
  const [mapeamentosDisciplinas, setMapeamentosDisciplinas] = useState({});
  const [estadoDisciplinasTurma, setEstadoDisciplinasTurma] = useState(
    ESTADO_INICIAL_DISCIPLINAS_TURMA
  );

  // Estados de resolução de homônimos e divergências de notas/faltas
  const [ambiguidades, setAmbiguidades] = useState([]);
  const [mapeamentos, setMapeamentos] = useState({});
  const [divergencias, setDivergencias] = useState([]);

  // Deriva os 3 estados assíncronos (Carregando, Erro e Vazio) sem setState síncrono no effect
  const carregandoDisciplinas = Boolean(
    isOpen && turmaId && estadoDisciplinasTurma.turmaIdCarregada !== turmaId
  );
  const disciplinasVinculadasTurma =
    estadoDisciplinasTurma.turmaIdCarregada === turmaId ? estadoDisciplinasTurma.lista : [];
  const erroDisciplinasTurma =
    estadoDisciplinasTurma.turmaIdCarregada === turmaId
      ? estadoDisciplinasTurma.erroCarregamento
      : "";
  const turmaSemDisciplinas =
    !carregandoDisciplinas &&
    !erroDisciplinasTurma &&
    Boolean(turmaId) &&
    disciplinasVinculadasTurma.length === 0;

  // Carrega apenas as disciplinas já vinculadas à turma para blindar o upload e a conciliação
  useEffect(() => {
    let ativo = true;
    if (isOpen && turmaId) {
      fetchTurmaDisciplinas(turmaId)
        .then((lista) => {
          if (ativo) {
            setEstadoDisciplinasTurma({
              turmaIdCarregada: turmaId,
              lista: Array.isArray(lista) ? lista : [],
              erroCarregamento: "",
            });
          }
        })
        .catch((error) => {
          if (ativo) {
            setEstadoDisciplinasTurma({
              turmaIdCarregada: turmaId,
              lista: [],
              erroCarregamento:
                error?.message ||
                "Não foi possível carregar as disciplinas vinculadas à turma.",
            });
          }
        });
    }
    return () => {
      ativo = false;
    };
  }, [isOpen, turmaId]);

  // Carrega dinamicamente as etapas/divisões do período letivo atrelado à turma (ou ativo)
  useEffect(() => {
    let ativo = true;
    if (!isOpen) return;

    // Se já foram passadas divisões pré-carregadas via props, não precisa fazer requisições
    if (temPeriodosProps) {
      return;
    }

    const carregarPeriodo = async () => {
      try {
        let periodoEncontrado = null;

        // 1. Tenta carregar pelo ID explícito do período letivo da turma
        if (periodoIdTurma) {
          try {
            periodoEncontrado = await obterPeriodoLetivo(periodoIdTurma);
          } catch {
            periodoEncontrado = null;
          }
        }

        // 2. Se não encontrou pelo ID ou a turma não tem periodo_letivo_id, busca pelo ano letivo
        if (!periodoEncontrado?.divisoes?.length) {
          try {
            const todosPeriodos = await listarPeriodosLetivos();
            if (Array.isArray(todosPeriodos) && todosPeriodos.length > 0) {
              if (anoTurma) {
                periodoEncontrado = todosPeriodos.find(
                  (p) => Number(p.ano) === Number(anoTurma)
                );
              }
              if (!periodoEncontrado) {
                periodoEncontrado = todosPeriodos.find((p) => p.ativo) || todosPeriodos[0];
              }
            }
          } catch {
            periodoEncontrado = null;
          }
        }

        // 3. Fallback: período letivo ativo vigente do sistema
        if (!periodoEncontrado?.divisoes?.length) {
          try {
            periodoEncontrado = await obterPeriodoLetivoAtivo();
          } catch {
            periodoEncontrado = null;
          }
        }

        if (ativo) {
          const divisoes = periodoEncontrado?.divisoes || [];
          setEstadoDivisoesTurma({
            turmaKey,
            divisoes,
          });
        }
      } catch {
        if (ativo) {
          setEstadoDivisoesTurma({
            turmaKey,
            divisoes: [],
          });
        }
      }
    };

    carregarPeriodo();

    return () => {
      ativo = false;
    };
  }, [
    isOpen,
    temPeriodosProps,
    turmaKey,
    periodoIdTurma,
    anoTurma,
  ]);

  if (!isOpen) return null;

  // Fecha o modal e redefine todos os estados internos (forçando recarga fresca na próxima abertura)
  const handleFecharModal = () => {
    setEtapa("upload");
    setDisciplinasPendentes([]);
    setDisciplinasCatalogo([]);
    setMapeamentosDisciplinas({});
    setEstadoDisciplinasTurma(ESTADO_INICIAL_DISCIPLINAS_TURMA);
    setEstadoDivisoesTurma(ESTADO_INICIAL_DIVISOES_TURMA);
    setPeriodoLetivoManual("");
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
      // Prioridade 1: Conciliação de colunas não reconhecidas estritamente contra disciplinas da turma
      if (
        resposta.tipo_pendencia === "conciliacao_disciplinas" ||
        (resposta.disciplinas_pendentes && resposta.disciplinas_pendentes.length > 0)
      ) {
        const listaPend = resposta.disciplinas_pendentes || [];
        const catalogoRecebido = Array.isArray(resposta.catalogo_disciplinas)
          ? resposta.catalogo_disciplinas
          : [];

        // Filtra o catálogo exibido exclusivamente pelas disciplinas já vinculadas à turma ativa
        const idsVinculados = new Set(
          disciplinasVinculadasTurma.map((d) => Number(d.id_disciplina))
        );
        const catalogoFiltrado =
          idsVinculados.size > 0
            ? catalogoRecebido.filter((d) => idsVinculados.has(Number(d.id_disciplina)))
            : catalogoRecebido;
        const opcoesTurma =
          catalogoFiltrado.length > 0 ? catalogoFiltrado : disciplinasVinculadasTurma;
        const idsPermitidos = new Set(opcoesTurma.map((d) => Number(d.id_disciplina)));

        setDisciplinasPendentes(listaPend);
        setDisciplinasCatalogo(opcoesTurma);

        const mapaInicial = {};
        listaPend.forEach((item) => {
          const chave = item.nome_sanitizado || item.nome_csv;
          const sugestaoId = Number(item.sugestao_disciplina_id ?? item.sugestao_id);

          // Se houver sugestão aproximada pertencente à própria turma, pré-seleciona 'vincular'; caso contrário, 'ignorar'
          if (Number.isInteger(sugestaoId) && sugestaoId > 0 && idsPermitidos.has(sugestaoId)) {
            mapaInicial[chave] = {
              acao: "vincular",
              disciplina_id: sugestaoId,
            };
          } else {
            mapaInicial[chave] = {
              acao: "ignorar",
              disciplina_id: "",
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

      // Prioridade 3: Divergências de notas e/ou faltas em períodos anteriores
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

  // Manipula e valida a seleção do arquivo via Zod, bloqueando formatos não-CSV ou arquivos vazios/>10MB
  const handleArquivoChange = (event) => {
    setErro("");
    setResultado(null);
    const file = event.target.files?.[0] || null;

    if (!file) {
      setArquivo(null);
      return;
    }

    const checkArquivo = validarFormularioZod(ArquivoCsvUploadSchema, file);
    if (!checkArquivo.valido) {
      setErro(checkArquivo.mensagem);
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

    const checkArquivo = validarFormularioZod(ArquivoCsvUploadSchema, arquivo);
    if (!checkArquivo.valido) {
      setErro(checkArquivo.mensagem);
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

  // Envio da aprovação de conciliação de disciplinas validado via Zod (Diretriz 3.4d)
  const handleConfirmarDisciplinas = async (event) => {
    event.preventDefault();
    setErro("");

    const checkDisc = validarFormularioZod(
      MapeamentosDisciplinasCsvSchema,
      mapeamentosDisciplinas
    );
    if (!checkDisc.valido) {
      setErro(checkDisc.mensagem);
      return;
    }

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

  // Envio de confirmação manual de homônimos validado via Zod (Resolução de Alunos)
  const handleConfirmarHomonimos = async (event) => {
    event.preventDefault();
    setErro("");
    setResultado(null);

    const checkAlunos = validarFormularioZod(MapeamentosAlunosCsvSchema, mapeamentos);
    if (!checkAlunos.valido) {
      setErro(checkAlunos.mensagem);
      return;
    }

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

  // Envio da decisão sobre registros divergentes de períodos anteriores ('atualizar' ou 'manter')
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
        err.message || "Ocorreu um erro ao aplicar a decisão sobre os registros divergentes."
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
            {(erro || erroDisciplinasTurma) && (
              <div
                className="alert alert-danger d-flex align-items-center gap-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div>{erro || erroDisciplinasTurma}</div>
              </div>
            )}

            {carregandoDisciplinas && (
              <div
                className="alert alert-light border d-flex align-items-center gap-2 mb-3 small text-muted"
                role="status"
              >
                <span
                  className="spinner-border spinner-border-sm text-primary"
                  aria-hidden="true"
                ></span>
                <span>Verificando disciplinas vinculadas à turma...</span>
              </div>
            )}

            {turmaSemDisciplinas && (
              <div
                className="alert alert-warning d-flex align-items-start gap-2 mb-3"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 text-warning"></i>
                <div>
                  <strong className="d-block text-dark">
                    Turma sem disciplinas vinculadas
                  </strong>
                  <small className="text-muted">
                    Esta turma ainda não possui disciplinas na sua grade curricular. Como a
                    importação de CSV lança apenas notas e faltas (sem criar nem vincular
                    disciplinas ou ciclos automaticamente), vincule primeiro o Ciclo Escolar e
                    as Disciplinas da turma antes de enviar a planilha.
                  </small>
                </div>
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
                      <strong>{resultado.dados.notas_sincronizadas}</strong> | Faltas/Frequências
                      sincronizadas: <strong>{resultado.dados.frequencias_sincronizadas}</strong>
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
                    Aluno e Disciplinas já vinculadas à turma (sem alterar vínculos curriculares).
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
                  disabled={loading || carregandoDisciplinas || turmaSemDisciplinas}
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
                  onChange={(e) => setPeriodoLetivoManual(e.target.value)}
                  disabled={loading || carregandoDisciplinas || turmaSemDisciplinas || carregandoDivisoes}
                >
                  {carregandoDivisoes && divisoesTurma.length === 0 ? (
                    <option value="">Carregando períodos da turma...</option>
                  ) : divisoesTurma.length > 0 ? (
                    divisoesTurma.map((div) => (
                      <option key={div.id_divisao || div.id || div.nome} value={div.nome}>
                        {div.nome} {div.is_atual ? "(Vigente)" : ""}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1º Trimestre">1º Trimestre</option>
                      <option value="2º Trimestre">2º Trimestre</option>
                      <option value="3º Trimestre">3º Trimestre</option>
                    </>
                  )}
                </select>
                <div className="form-text">
                  Período padrão caso o arquivo não especifique colunas por etapa.
                </div>
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
                  disabled={loading || carregandoDisciplinas || turmaSemDisciplinas}
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
                disabled={
                  loading ||
                  !arquivo ||
                  carregandoDisciplinas ||
                  Boolean(erroDisciplinasTurma) ||
                  turmaSemDisciplinas
                }
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
                    Enviar e Sincronizar Notas e Faltas
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 1.5: Conciliação Estrita de Disciplinas da Turma (sem criação/vínculo automático) */}
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
                  Conciliação de Colunas com Disciplinas da Turma
                </strong>
                <small className="text-muted">
                  Algumas colunas da planilha não coincidiram exatamente com os nomes das
                  disciplinas vinculadas a esta turma. Correlacione cada coluna a uma disciplina
                  já vinculada à turma ou opte por ignorá-la (nenhum vínculo curricular será
                  criado ou alterado):
                </small>
              </div>
            </div>

            <div
              className="d-flex flex-column gap-3 mb-4"
              style={{ maxHeight: "360px", overflowY: "auto" }}
            >
              {disciplinasPendentes.map((item, idx) => {
                const chave = item.nome_sanitizado || item.nome_csv;
                const sugestaoNome = item.sugestao_disciplina_nome ?? item.sugestao_nome;
                const decisao = mapeamentosDisciplinas[chave] || {
                  acao: "ignorar",
                  disciplina_id: "",
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
                      {sugestaoNome && (
                        <span className="badge bg-warning-subtle text-dark border">
                          Sugestão na turma: {sugestaoNome}
                        </span>
                      )}
                    </div>

                    {/* Escolha de Ação restrita a correlacionar disciplina da turma ou ignorar */}
                    <div className="row g-2 align-items-end">
                      <div className="col-12 col-md-5">
                        <label
                          htmlFor={`conciliar-acao-${idx}`}
                          className="form-label small fw-bold text-dark mb-1"
                        >
                          Ação de Conciliação:
                        </label>
                        <select
                          id={`conciliar-acao-${idx}`}
                          className="form-select form-select-sm"
                          value={decisao.acao}
                          onChange={(e) =>
                            atualizarDecisaoDisciplina(chave, {
                              acao: e.target.value,
                              disciplina_id:
                                e.target.value === "ignorar"
                                  ? ""
                                  : decisao.disciplina_id || "",
                            })
                          }
                          disabled={loading}
                        >
                          <option value="vincular">
                            Correlacionar a disciplina vinculada à turma
                          </option>
                          <option value="ignorar">Ignorar esta coluna</option>
                        </select>
                      </div>

                      {decisao.acao === "vincular" && (
                        <div className="col-12 col-md-7">
                          <label
                            htmlFor={`conciliar-disc-sel-${idx}`}
                            className="form-label small fw-bold text-dark mb-1"
                          >
                            Disciplina Vinculada à Turma:
                          </label>
                          <select
                            id={`conciliar-disc-sel-${idx}`}
                            className="form-select form-select-sm"
                            value={decisao.disciplina_id || ""}
                            onChange={(e) =>
                              atualizarDecisaoDisciplina(chave, {
                                disciplina_id: e.target.value ? Number(e.target.value) : "",
                              })
                            }
                            disabled={loading}
                            required
                          >
                            <option value="">Selecione uma disciplina da turma...</option>
                            {disciplinasCatalogo.map((d) => (
                              <option key={d.id_disciplina} value={d.id_disciplina}>
                                {formatarDisciplinaCiclo(d)} ({d.aulas_semanais || 4} aulas/sem)
                              </option>
                            ))}
                          </select>
                        </div>
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
                        htmlFor={`amb-${index}-cand-${cand.id}`}
                        className={`form-check-label p-2 rounded-2 border d-flex align-items-center justify-content-between ${
                          mapeamentos[amb.nome_csv] === cand.id
                            ? "bg-white border-primary shadow-sm"
                            : "bg-white-50"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <input
                            id={`amb-${index}-cand-${cand.id}`}
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
                      htmlFor={`amb-${index}-ignorar`}
                      className={`form-check-label p-2 rounded-2 border d-flex align-items-center gap-2 ${
                        mapeamentos[amb.nome_csv] === "ignorar"
                          ? "bg-white border-warning shadow-sm"
                          : "bg-white-50"
                      }`}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        id={`amb-${index}-ignorar`}
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

        {/* ETAPA 3: Resolução de Divergências em Notas e/ou Faltas de Períodos Anteriores */}
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
                  Divergência detectada em notas e/ou faltas de períodos anteriores
                </strong>
                <small className="text-muted">
                  Identificamos que notas e/ou faltas deste arquivo para períodos já cadastrados
                  diferem dos valores atualmente registrados no banco de dados. Compare os
                  lançamentos abaixo e confirme como deseja proceder:
                </small>
              </div>
            </div>

            <div
              className="turmas-notas-tabela-scroll border rounded-3 mb-4"
              tabIndex={0}
              role="region"
              aria-label="Tabela de divergências de notas e faltas"
              style={{ maxHeight: "320px" }}
            >
              <table
                className="table table-sm table-hover align-middle mb-0"
                style={{ fontSize: "0.875rem" }}
              >
                <thead className="table-light">
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
                    <th scope="col" className="text-center">
                      Faltas (Atual → Nova)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {divergencias.map((div, dIdx) => {
                    const mudouNota = div.tipo_divergencia !== "falta";
                    const temFaltasComparaveis =
                      div.faltas_atuais !== null &&
                      div.faltas_atuais !== undefined &&
                      div.novas_faltas !== null &&
                      div.novas_faltas !== undefined;
                    const mudouFalta =
                      temFaltasComparaveis && Number(div.faltas_atuais) !== Number(div.novas_faltas);

                    return (
                      <tr key={dIdx}>
                        <th scope="row" className="ps-3 fw-semibold text-dark text-nowrap">
                          {div.nome_aluno}
                        </th>
                        <td className="text-muted">{div.nome_disciplina}</td>
                        <td className="text-nowrap">
                          <span className="badge bg-secondary-subtle text-secondary border">
                            {div.periodo_letivo}
                          </span>
                        </td>
                        <td className="text-center text-nowrap">
                          <span
                            className={`badge px-2 py-1 ${
                              mudouNota
                                ? "bg-light text-danger border border-danger-subtle"
                                : "bg-light text-secondary border"
                            }`}
                          >
                            {Number(div.nota_atual).toFixed(2).replace(".", ",")}
                          </span>
                        </td>
                        <td className="text-center text-nowrap">
                          <span
                            className={`badge px-2 py-1 ${
                              mudouNota
                                ? "bg-primary-subtle text-primary border border-primary-subtle fw-bold"
                                : "bg-light text-secondary border"
                            }`}
                          >
                            {Number(div.nova_nota).toFixed(2).replace(".", ",")}
                          </span>
                        </td>
                        <td className="text-center text-nowrap">
                          {mudouFalta ? (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 fw-bold">
                              {div.faltas_atuais} → {div.novas_faltas}
                            </span>
                          ) : temFaltasComparaveis ? (
                            <span className="text-muted small">
                              {div.faltas_atuais} (sem alteração)
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                  <span>Atualizar Registros Anteriores</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalImportarNotas;
