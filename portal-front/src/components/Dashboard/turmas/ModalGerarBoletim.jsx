import { useEffect, useId, useRef, useState } from "react";
import { fetchTurmaNotas } from "../../../services/turmasService";
import { BoletimEmissaoSchema, validarFormularioZod } from "../../../utils/academicoSchemas";

/**
 * ModalGerarBoletim.jsx - Emissão do Boletim Escolar Técnico Oficial (PDF A4 e Excel)
 *
 * Papel Didático:
 * 1. Substitui opções redundantes por uma caixa de seleção direta de alunos (checkboxes)
 *    com barra de rolagem controlada, evitando que o modal estoure na tela.
 * 2. Valida os parâmetros de emissão em tempo real via Zod (BoletimEmissaoSchema).
 * 3. Utiliza um <iframe> de impressão isolado com CSS técnico A4 próprio, garantindo que
 *    o PDF impresso saia idêntico ao modelo visualizado (sem cortes ou deslocamentos do modal).
 */
export default function ModalGerarBoletim({
  isOpen = false,
  onClose,
  turma,
  alunos = [],
  notas = [],
  periodosDisponiveis = [],
  alunoPreSelecionadoId = "",
}) {
  const tituloDialogId = useId();
  const dialogRef = useRef(null);

  const [alunosSelecionadosIds, setAlunosSelecionadosIds] = useState([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("todos");
  const [formato, setFormato] = useState("pdf");
  const [modoVisualizacao, setModoVisualizacao] = useState(false);
  const [notasCompletasTurma, setNotasCompletasTurma] = useState([]);
  const [carregandoNotas, setCarregandoNotas] = useState(false);
  const [erroValidacao, setErroValidacao] = useState("");

  // Sincroniza abertura/fechamento do <dialog> nativo na top-layer do navegador
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && turma) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, turma]);

  // Ao abrir o modal, pré-seleciona o aluno filtrado (ou todos os alunos) e carrega todas as notas da turma
  useEffect(() => {
    if (!isOpen || !turma?.id_turma) return;

    let cancelado = false;
    const selecaoInicial = alunoPreSelecionadoId
      ? [String(alunoPreSelecionadoId)]
      : alunos.map((a) => String(a.id));

    // Busca assíncrona de todas as etapas da turma (revalidada pelo Zod em turmasService)
    Promise.resolve().then(() => {
      if (cancelado) return;
      setAlunosSelecionadosIds(selecaoInicial);
      setModoVisualizacao(false);
      setErroValidacao("");
      setCarregandoNotas(true);

      fetchTurmaNotas(turma.id_turma)
        .then((lista) => {
          if (!cancelado) {
            setNotasCompletasTurma(Array.isArray(lista) ? lista : []);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setNotasCompletasTurma(notas);
          }
        })
        .finally(() => {
          if (!cancelado) {
            setCarregandoNotas(false);
          }
        });
    });

    return () => {
      cancelado = true;
    };
  }, [isOpen, turma?.id_turma, alunoPreSelecionadoId, alunos, notas]);

  if (!isOpen || !turma) return null;

  const nomeTurma = turma.nome_identificador || "Turma Escolar";
  const anoTurma = turma.ano_letivo || new Date().getFullYear();
  const turnoTurma = turma.turno || "Integral";

  // Base de notas para montagem do boletim (prioriza carga consolidada de todos os períodos)
  const fonteNotas = notasCompletasTurma.length > 0 ? notasCompletasTurma : notas;

  // Colunas de etapas dinâmicas conforme o período selecionado
  const etapasColunas =
    periodoSelecionado === "todos"
      ? periodosDisponiveis.length > 0
        ? periodosDisponiveis.map((p) => p.nome)
        : ["1º Trimestre", "2º Trimestre", "3º Trimestre"]
      : [periodoSelecionado];

  // Filtra alunos marcados na caixa de seleção
  const alunosParaBoletim = alunos.filter((a) =>
    alunosSelecionadosIds.includes(String(a.id))
  );

  // Consolida notas e faltas por disciplina para cada aluno selecionado
  const relatorioConsolidado = alunosParaBoletim.map((aluno) => {
    const notasAluno = fonteNotas.filter((n) => {
      const mesmoAluno = String(n.usuario_id) === String(aluno.id);
      if (!mesmoAluno) return false;
      if (periodoSelecionado !== "todos") {
        return String(n.periodo_letivo).toLowerCase() === String(periodoSelecionado).toLowerCase();
      }
      return true;
    });

    const disciplinasMap = {};
    notasAluno.forEach((n) => {
      const discNome = n.disciplina?.nome || "Disciplina";
      const discId = n.disciplina_id;

      if (!disciplinasMap[discId]) {
        disciplinasMap[discId] = {
          id: discId,
          nome: discNome,
          notasPorPeriodo: {},
          somaNotas: 0,
          totalPontos: 0,
          percentualFaltas: Number(n.percentual_faltas ?? 0),
          totalFaltas: Number(n.total_faltas ?? 0),
        };
      }

      const valorNota = Number(n.valor_nota) || 0;
      const valorMax = Number(n.valor_maximo_periodo || n.valor_maximo) || 30;

      disciplinasMap[discId].notasPorPeriodo[n.periodo_letivo] = valorNota;
      disciplinasMap[discId].somaNotas += valorNota;
      disciplinasMap[discId].totalPontos += valorMax;

      if (n.percentual_faltas !== null && n.percentual_faltas !== undefined) {
        disciplinasMap[discId].percentualFaltas = Number(n.percentual_faltas);
      }
      if (n.total_faltas !== null && n.total_faltas !== undefined) {
        disciplinasMap[discId].totalFaltas = Number(n.total_faltas);
      }
    });

    return {
      aluno,
      disciplinas: Object.values(disciplinasMap),
    };
  });

  const todosMarcados =
    alunos.length > 0 && alunosSelecionadosIds.length === alunos.length;

  // Alterna marcação de todos os estudantes da turma
  const handleAlternarTodos = () => {
    setErroValidacao("");
    if (todosMarcados) {
      setAlunosSelecionadosIds([]);
    } else {
      setAlunosSelecionadosIds(alunos.map((a) => String(a.id)));
    }
  };

  // Alterna marcação de um estudante individual na caixa rolável
  const handleAlternarAluno = (idStr) => {
    setErroValidacao("");
    setAlunosSelecionadosIds((prev) =>
      prev.includes(idStr) ? prev.filter((item) => item !== idStr) : [...prev, idStr]
    );
  };

  // Exporta tabela técnica compatível com Microsoft Excel (.csv com UTF-8 BOM)
  const handleExportarExcel = () => {
    const separador = ";";
    const linhas = [];

    linhas.push("ESCOLA: EE PROFESSORA SEBASTIANA DE ALMEIDA E SILVA - SRE CORONEL FABRICIANO");
    linhas.push(`BOLETIM ESCOLAR TECNICO OFICIAL - ANO LETIVO: ${anoTurma}`);
    linhas.push(`TURMA: ${nomeTurma} - TURNO: ${turnoTurma}`);
    linhas.push(`DATA DE EMISSAO: ${new Date().toLocaleDateString("pt-BR")}`);
    linhas.push("");

    linhas.push(
      [
        "ALUNO",
        "DISCIPLINA",
        ...etapasColunas.map((e) => e.toUpperCase()),
        "TOTAL PONTOS",
        "NOTA OBTIDA",
        "FALTAS",
        "% FALTAS",
        "SITUACAO",
      ].join(separador)
    );

    relatorioConsolidado.forEach(({ aluno, disciplinas }) => {
      if (disciplinas.length === 0) {
        linhas.push(
          [
            `"${aluno.name}"`,
            '"Sem lancamentos"',
            ...etapasColunas.map(() => "-"),
            "-",
            "0.0",
            "0",
            "0.0%",
            "SEM REGISTRO",
          ].join(separador)
        );
        return;
      }

      disciplinas.forEach((d) => {
        const valoresEtapas = etapasColunas.map((nomeEtapa) =>
          d.notasPorPeriodo[nomeEtapa] !== undefined
            ? d.notasPorPeriodo[nomeEtapa].toFixed(1)
            : "-"
        );
        const teto = periodoSelecionado === "todos" ? 100 : d.totalPontos || 30;
        const percentualAproveitamento = teto > 0 ? (d.somaNotas / teto) * 100 : 0;
        const situacao = percentualAproveitamento >= 60 ? "APROVADO / NA MEDIA" : "ABAIXO DA MEDIA";

        linhas.push(
          [
            `"${aluno.name}"`,
            `"${d.nome}"`,
            ...valoresEtapas,
            teto,
            d.somaNotas.toFixed(1),
            d.totalFaltas,
            `${d.percentualFaltas.toFixed(1)}%`,
            situacao,
          ].join(separador)
        );
      });
    });

    const csvContent = "\uFEFF" + linhas.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Boletim_Tecnico_${nomeTurma.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Gera e imprime o PDF em um <iframe> A4 isolado fora do modal (fidelidade 1:1 com o preview)
  const handleImprimirPdfIsolado = () => {
    const areaPreview = document.getElementById("boletim-tecnico-print-area");
    if (!areaPreview) return;

    const iframeAntigo = document.getElementById("iframe-impressao-boletim-oficial");
    if (iframeAntigo) {
      iframeAntigo.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "iframe-impressao-boletim-oficial";
    iframe.setAttribute("title", "Impressão de Boletim Escolar Técnico");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Documento HTML5 autônomo com regras de página A4 e tabela técnica de linhas e letras pretas
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Boletim Escolar - ${nomeTurma}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.35;
    }
    .boletim-cabecalho {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .boletim-cabecalho h1 {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 3px 0;
      letter-spacing: 0.4px;
    }
    .boletim-cabecalho h2 {
      font-size: 10.5pt;
      font-weight: 700;
      margin: 0 0 3px 0;
    }
    .boletim-cabecalho p {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 3px 0;
    }
    .boletim-cabecalho .meta {
      font-size: 8.5pt;
      color: #000000;
    }
    .boletim-bloco-aluno {
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .boletim-aluno-barra {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #000000;
      border-bottom: none;
      background-color: #f2f2f2;
      padding: 5px 8px;
      font-size: 9pt;
    }
    table.boletim-tabela-tecnica {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      font-size: 8.5pt;
    }
    table.boletim-tabela-tecnica thead {
      display: table-header-group;
    }
    table.boletim-tabela-tecnica th,
    table.boletim-tabela-tecnica td {
      border: 1px solid #000000;
      padding: 4px 6px;
      color: #000000;
      text-align: center;
      vertical-align: middle;
    }
    table.boletim-tabela-tecnica th {
      background-color: #e5e5e5;
      font-weight: 700;
      text-transform: uppercase;
    }
    table.boletim-tabela-tecnica td.col-esquerda {
      text-align: left;
      font-weight: 600;
    }
    table.boletim-tabela-tecnica td.col-negrito {
      font-weight: 700;
    }
  </style>
</head>
<body>
  ${areaPreview.innerHTML}
</body>
</html>`);
    doc.close();

    // Dispara a janela nativa de impressão sobre o documento A4 limpo
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 150);
  };

  // Submete e valida via Zod a configuração escolhida pelo usuário
  const handleConfirmarGeracao = (e) => {
    e.preventDefault();
    const validacao = validarFormularioZod(BoletimEmissaoSchema, {
      alunosSelecionadosIds,
      formato,
      periodoSelecionado,
    });

    if (!validacao.valido) {
      setErroValidacao(validacao.mensagem);
      return;
    }

    setErroValidacao("");
    if (formato === "excel") {
      handleExportarExcel();
      onClose();
    } else {
      setModoVisualizacao(true);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tituloDialogId}
      onClose={onClose}
      className="boletim-native-dialog border-0 rounded-4 shadow-lg p-0"
      style={{
        width: modoVisualizacao ? "min(96vw, 1040px)" : "min(94vw, 760px)",
        maxHeight: "88vh",
        overflow: "hidden",
      }}
    >
      <form onSubmit={handleConfirmarGeracao} className="d-flex flex-column" style={{ maxHeight: "88vh" }}>
        {/* Cabeçalho do Modal */}
        <div className="bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-spreadsheet-fill text-warning fs-4"></i>
            <div>
              <h5 id={tituloDialogId} className="fw-bold mb-0">
                Gerar Boletim Escolar Técnico
              </h5>
              <small className="text-white-50">
                {nomeTurma} • Ano Letivo {anoTurma}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
            aria-label="Fechar janela de geração de boletim"
          ></button>
        </div>

        {/* Corpo com scroll contido */}
        <div className="p-4 bg-white" style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
          {erroValidacao && (
            <div className="alert alert-danger py-2 px-3 rounded-3 small fw-semibold mb-3" role="alert" aria-live="polite">
              <i className="bi bi-exclamation-triangle-fill me-1.5"></i>
              {erroValidacao}
            </div>
          )}

          {!modoVisualizacao ? (
            <div className="row g-4">
              {/* Coluna Esquerda: Caixa de Seleção Direta de Alunos com Barra de Rolagem */}
              <div className="col-12 col-md-6">
                <fieldset className="m-0 p-0 border-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <legend className="form-label fw-bold small text-dark mb-0 fs-6">
                      Alunos da Turma
                    </legend>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {alunosSelecionadosIds.length} de {alunos.length}
                    </span>
                  </div>

                  {/* Barra superior: Marcar / Desmarcar Todos */}
                  <div className="p-2 border rounded-top-3 bg-light d-flex align-items-center justify-content-between">
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="boletim-check-todos"
                        name="selecionar_todos"
                        checked={todosMarcados}
                        onChange={handleAlternarTodos}
                        disabled={alunos.length === 0}
                      />
                      <label className="form-check-label small fw-bold text-dark ms-1" htmlFor="boletim-check-todos">
                        Selecionar todos os alunos
                      </label>
                    </div>
                  </div>

                  {/* Lista de Alunos com Barra de Rolagem Fixa (não estoura o modal) */}
                  <div
                    className="border border-top-0 rounded-bottom-3 bg-white p-2"
                    style={{
                      maxHeight: "210px",
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                    }}
                  >
                    {alunos.length === 0 ? (
                      <div className="text-center text-muted small py-4">
                        Nenhum aluno matriculado nesta turma.
                      </div>
                    ) : (
                      alunos.map((aluno) => {
                        const idStr = String(aluno.id);
                        const marcado = alunosSelecionadosIds.includes(idStr);
                        const inputId = `boletim-aluno-chk-${idStr}`;

                        return (
                          <div
                            key={idStr}
                            className={`form-check py-1.5 px-2 rounded-2 mb-1 d-flex align-items-center ${
                              marcado ? "bg-primary-subtle bg-opacity-50" : ""
                            }`}
                          >
                            <input
                              className="form-check-input ms-0 me-2 flex-shrink-0"
                              type="checkbox"
                              id={inputId}
                              name="alunos_boletim"
                              value={idStr}
                              checked={marcado}
                              onChange={() => handleAlternarAluno(idStr)}
                            />
                            <label
                              className="form-check-label small fw-semibold text-dark text-truncate w-100"
                              htmlFor={inputId}
                              style={{ cursor: "pointer" }}
                            >
                              {aluno.name}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </fieldset>
              </div>

              {/* Coluna Direita: Formato de Saída e Etapa */}
              <div className="col-12 col-md-6">
                <fieldset className="m-0 p-0 border-0 mb-3">
                  <legend className="form-label fw-bold small text-dark mb-2 fs-6">
                    Formato de Saída
                  </legend>
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check p-2.5 border rounded-3 bg-light">
                      <input
                        className="form-check-input ms-1"
                        type="radio"
                        name="formatoBoletim"
                        id="formatoPdf"
                        checked={formato === "pdf"}
                        onChange={() => setFormato("pdf")}
                      />
                      <label className="form-check-label ms-2 fw-semibold" htmlFor="formatoPdf">
                        <i className="bi bi-file-earmark-pdf-fill text-danger me-1"></i>
                        PDF Técnico (Visualizar e Imprimir A4)
                      </label>
                      <small className="text-muted d-block ms-4" style={{ fontSize: "0.75rem" }}>
                        Tabela técnica oficial de linhas e letras pretas com cabeçalhos em negrito.
                      </small>
                    </div>

                    <div className="form-check p-2.5 border rounded-3 bg-light">
                      <input
                        className="form-check-input ms-1"
                        type="radio"
                        name="formatoBoletim"
                        id="formatoExcel"
                        checked={formato === "excel"}
                        onChange={() => setFormato("excel")}
                      />
                      <label className="form-check-label ms-2 fw-semibold" htmlFor="formatoExcel">
                        <i className="bi bi-file-earmark-excel-fill text-success me-1"></i>
                        Planilha Excel (.csv estruturado)
                      </label>
                      <small className="text-muted d-block ms-4" style={{ fontSize: "0.75rem" }}>
                        Arquivo pronto para abertura direta no Excel (codificação UTF-8 BOM).
                      </small>
                    </div>
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="selectPeriodoBoletim" className="form-label fw-bold small text-dark mb-1">
                    Período de Referência
                  </label>
                  <select
                    id="selectPeriodoBoletim"
                    name="periodo_boletim"
                    className="form-select form-select-sm"
                    value={periodoSelecionado}
                    onChange={(e) => setPeriodoSelecionado(e.target.value)}
                  >
                    <option value="todos">Consolidado Anual (Todos os Períodos)</option>
                    {periodosDisponiveis.map((p) => (
                      <option key={p.id_divisao || p.id || p.nome} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Pré-visualização Técnica idêntica ao PDF A4 impresso */
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  onClick={() => setModoVisualizacao(false)}
                >
                  <i className="bi bi-arrow-left me-1"></i> Voltar à Seleção
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-dark rounded-pill px-4 fw-bold d-flex align-items-center gap-1.5"
                  onClick={handleImprimirPdfIsolado}
                >
                  <i className="bi bi-printer-fill"></i>
                  <span>Imprimir / Salvar PDF A4</span>
                </button>
              </div>

              {carregandoNotas ? (
                <div className="text-center py-4 text-muted">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Consolidando lançamentos do diário escolar...
                </div>
              ) : (
                <div
                  id="boletim-tecnico-print-area"
                  className="bg-white p-3 border"
                  style={{ color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" }}
                >
                  <div
                    className="boletim-cabecalho text-center mb-3 pb-2"
                    style={{ borderBottom: "2px solid #000" }}
                  >
                    <h1 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px 0" }}>
                      Governo do Estado de Minas Gerais — Secretaria de Estado de Educação
                    </h1>
                    <h2 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "0 0 2px 0" }}>
                      ESCOLA ESTADUAL PROFESSORA SEBASTIANA DE ALMEIDA E SILVA
                    </h2>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", margin: "0 0 2px 0" }}>
                      Boletim de Rendimento e Frequência Escolar — Ano Letivo {anoTurma}
                    </p>
                    <div className="meta" style={{ fontSize: "0.78rem" }}>
                      Turma: <strong>{nomeTurma}</strong> | Turno: <strong>{turnoTurma}</strong> | Emissão:{" "}
                      {new Date().toLocaleDateString("pt-BR")}
                    </div>
                  </div>

                  {relatorioConsolidado.map(({ aluno, disciplinas }, aIdx) => (
                    <div key={aluno.id} className="boletim-bloco-aluno mb-4">
                      <div
                        className="boletim-aluno-barra d-flex justify-content-between align-items-center px-2 py-1"
                        style={{
                          border: "1px solid #000",
                          borderBottom: "none",
                          backgroundColor: "#f2f2f2",
                          fontSize: "0.82rem",
                        }}
                      >
                        <strong>
                          {aIdx + 1}. ALUNO(A): {aluno.name}
                        </strong>
                        <span>E-mail: {aluno.email}</span>
                      </div>

                      <table
                        className="boletim-tabela-tecnica w-100"
                        style={{
                          borderCollapse: "collapse",
                          border: "1px solid #000",
                          fontSize: "0.8rem",
                          color: "#000",
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: "#e5e5e5" }}>
                            <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "left", width: "32%" }}>
                              DISCIPLINA
                            </th>
                            {etapasColunas.map((etapa) => (
                              <th key={etapa} style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>
                                {etapa.toUpperCase()}
                              </th>
                            ))}
                            <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>
                              TOTAL
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>
                              FALTAS
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>
                              % FALTAS
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>
                              SITUAÇÃO
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {disciplinas.length === 0 ? (
                            <tr>
                              <td
                                colSpan={etapasColunas.length + 5}
                                style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}
                              >
                                Sem notas ou frequências lançadas para o período selecionado.
                              </td>
                            </tr>
                          ) : (
                            disciplinas.map((d) => {
                              const teto = periodoSelecionado === "todos" ? 100 : d.totalPontos || 30;
                              const aproveitamento = teto > 0 ? (d.somaNotas / teto) * 100 : 0;
                              const situacao = aproveitamento >= 60 ? "NA MÉDIA / APROVADO" : "ABAIXO DA MÉDIA";

                              return (
                                <tr key={d.id}>
                                  <td
                                    className="col-esquerda"
                                    style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "left", fontWeight: 600 }}
                                  >
                                    {d.nome}
                                  </td>
                                  {etapasColunas.map((etapa) => (
                                    <td
                                      key={etapa}
                                      style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}
                                    >
                                      {d.notasPorPeriodo[etapa] !== undefined
                                        ? d.notasPorPeriodo[etapa].toFixed(1)
                                        : "—"}
                                    </td>
                                  ))}
                                  <td
                                    className="col-negrito"
                                    style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontWeight: 700 }}
                                  >
                                    {d.somaNotas.toFixed(1)} / {teto}
                                  </td>
                                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                                    {d.totalFaltas}
                                  </td>
                                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                                    {d.percentualFaltas.toFixed(1)}%
                                  </td>
                                  <td
                                    className="col-negrito"
                                    style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontWeight: 700 }}
                                  >
                                    {situacao}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="bg-light border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            onClick={onClose}
          >
            Fechar
          </button>

          {!modoVisualizacao && (
            <button
              type="submit"
              disabled={carregandoNotas}
              className="btn btn-sm btn-primary rounded-pill px-4 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
            >
              {formato === "excel" ? (
                <>
                  <i className="bi bi-download"></i>
                  <span>Baixar Planilha Excel ({alunosSelecionadosIds.length})</span>
                </>
              ) : (
                <>
                  <i className="bi bi-eye-fill"></i>
                  <span>Visualizar Boletim PDF ({alunosSelecionadosIds.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
