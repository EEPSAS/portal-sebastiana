import { useState } from "react";

/**
 * Funções auxiliares para geração inicial de divisões
 */
const gerarDivisoesPadrao = (tipo, anoRef) => {
  if (tipo === "bimestre") {
    return [
      { numero: 1, nome: "1º Bimestre", pontos: 25, data_inicio: `${anoRef}-02-05`, data_fim: `${anoRef}-04-15` },
      { numero: 2, nome: "2º Bimestre", pontos: 25, data_inicio: `${anoRef}-04-16`, data_fim: `${anoRef}-06-30` },
      { numero: 3, nome: "3º Bimestre", pontos: 25, data_inicio: `${anoRef}-08-01`, data_fim: `${anoRef}-09-30` },
      { numero: 4, nome: "4º Bimestre", pontos: 25, data_inicio: `${anoRef}-10-01`, data_fim: `${anoRef}-12-18` },
    ];
  }
  if (tipo === "semestre") {
    return [
      { numero: 1, nome: "1º Semestre", pontos: 50, data_inicio: `${anoRef}-02-05`, data_fim: `${anoRef}-06-30` },
      { numero: 2, nome: "2º Semestre", pontos: 50, data_inicio: `${anoRef}-08-01`, data_fim: `${anoRef}-12-18` },
    ];
  }
  // Padrão Trimestre (30, 30 e 40 pts)
  return [
    { numero: 1, nome: "1º Trimestre", pontos: 30, data_inicio: `${anoRef}-02-05`, data_fim: `${anoRef}-04-30` },
    { numero: 2, nome: "2º Trimestre", pontos: 30, data_inicio: `${anoRef}-05-02`, data_fim: `${anoRef}-08-31` },
    { numero: 3, nome: "3º Trimestre", pontos: 40, data_inicio: `${anoRef}-09-01`, data_fim: `${anoRef}-12-18` },
  ];
};

function FormPeriodoLetivo({
  periodoEmEdicao,
  onFechar,
  onSalvar,
  salvando,
}) {
  const anoInicial = periodoEmEdicao?.ano || new Date().getFullYear();
  const tipoInicial = periodoEmEdicao?.tipo_divisao || "trimestre";

  const [ano, setAno] = useState(anoInicial);
  const [dataInicioAno, setDataInicioAno] = useState(periodoEmEdicao?.data_inicio || `${anoInicial}-02-05`);
  const [dataFimAno, setDataFimAno] = useState(periodoEmEdicao?.data_fim || `${anoInicial}-12-18`);
  const [tipoDivisao, setTipoDivisao] = useState(tipoInicial);
  const [totalPontos, setTotalPontos] = useState(periodoEmEdicao?.total_pontos || 100);
  const [ativo, setAtivo] = useState(Boolean(periodoEmEdicao?.ativo));
  const [erroLocal, setErroLocal] = useState("");

  const [divisoes, setDivisoes] = useState(() => {
    if (periodoEmEdicao?.divisoes?.length > 0) {
      return periodoEmEdicao.divisoes.map((d) => ({
        id_divisao: d.id_divisao,
        numero: d.numero,
        nome: d.nome,
        pontos: Number(d.pontos),
        data_inicio: d.data_inicio || "",
        data_fim: d.data_fim || "",
      }));
    }
    return gerarDivisoesPadrao(tipoInicial, anoInicial);
  });

  const handleTrocarTipoDivisao = (novoTipo) => {
    setTipoDivisao(novoTipo);
    if (!periodoEmEdicao) {
      setDivisoes(gerarDivisoesPadrao(novoTipo, ano));
    }
  };

  const handleAlterarDivisao = (index, campo, valor) => {
    setDivisoes((prev) => {
      const atualizadas = [...prev];
      atualizadas[index] = {
        ...atualizadas[index],
        [campo]: campo === "pontos" ? Number(valor) : valor,
      };
      return atualizadas;
    });
  };

  // Cálculo da soma em tempo real
  const somaPontos = divisoes.reduce((acc, d) => acc + (Number(d.pontos) || 0), 0);
  const pontosConferem = Math.abs(somaPontos - Number(totalPontos)) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroLocal("");

    if (!pontosConferem) {
      setErroLocal(
        `A soma das etapas (${somaPontos} pts) diverge do total de pontos estipulado (${totalPontos} pts). Ajuste os valores antes de salvar.`
      );
      return;
    }

    if (dataFimAno < dataInicioAno) {
      setErroLocal("A data de término do ano letivo deve ser posterior à data de início.");
      return;
    }

    const payload = {
      ano: Number(ano),
      tipo_divisao: tipoDivisao,
      total_pontos: Number(totalPontos),
      data_inicio: dataInicioAno,
      data_fim: dataFimAno,
      ativo: Boolean(ativo),
      divisoes: divisoes.map((d, idx) => ({
        ...(d.id_divisao ? { id_divisao: d.id_divisao } : {}),
        numero: d.numero || idx + 1,
        nome: d.nome,
        pontos: Number(d.pontos),
        data_inicio: d.data_inicio,
        data_fim: d.data_fim,
        ordem: idx + 1,
      })),
    };

    try {
      await onSalvar(payload);
    } catch (err) {
      // Exibe a mensagem de falha da API diretamente dentro do modal
      setErroLocal(err.message || "Erro ao salvar período letivo.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="modal-content rounded-4 border-0 shadow d-flex flex-column"
      style={{ maxHeight: "calc(100vh - 3.5rem)" }}
    >
      {/* Cabeçalho Fixo do Modal */}
      <div className="modal-header border-bottom px-4 pt-4 pb-3 flex-shrink-0">
        <div>
          <h5 className="modal-title fw-bold text-dark fs-5">
            {periodoEmEdicao ? `Editar Período Letivo (${ano})` : "Novo Período Letivo"}
          </h5>
          <p className="text-muted small mb-0">
            Configure as diretrizes do ano letivo, as etapas avaliativas e o cronograma escolar.
          </p>
        </div>
        <button
          type="button"
          className="btn-close"
          aria-label="Fechar"
          onClick={onFechar}
          disabled={salvando}
        ></button>
      </div>

      {/* Corpo Rolável do Modal (overflow-y auto) */}
      <div className="modal-body px-4 py-3 overflow-y-auto flex-grow-1">
        {erroLocal && (
          <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3 d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-5 text-danger flex-shrink-0"></i>
            <div>{erroLocal}</div>
          </div>
        )}

        {/* 1. Definição do Ano e Datas Gerais */}
        <div className="card rounded-3 border bg-light-subtle p-3 mb-4">
          <h6 className="fw-bold text-primary small text-uppercase mb-3">
            1. Ano Letivo e Intervalo Geral
          </h6>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Ano Letivo *</label>
              <input
                type="number"
                className="form-control"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                min="2000"
                max="2100"
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Início do Ano Letivo *</label>
              <input
                type="date"
                className="form-control"
                value={dataInicioAno}
                onChange={(e) => setDataInicioAno(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Término do Ano Letivo *</label>
              <input
                type="date"
                className="form-control"
                value={dataFimAno}
                onChange={(e) => setDataFimAno(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Estrutura e Total de Pontos */}
        <div className="card rounded-3 border bg-light-subtle p-3 mb-4">
          <h6 className="fw-bold text-primary small text-uppercase mb-3">
            2. Estrutura de Divisão e Pontuação Global
          </h6>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Divisões do Ano Letivo *</label>
              <select
                className="form-select"
                value={tipoDivisao}
                onChange={(e) => handleTrocarTipoDivisao(e.target.value)}
                disabled={Boolean(periodoEmEdicao)}
                required
              >
                <option value="trimestre">Trimestral (3 divisões)</option>
                <option value="bimestre">Bimestral (4 divisões)</option>
                <option value="semestre">Semestral (2 divisões)</option>
              </select>
              {periodoEmEdicao && (
                <small className="text-muted d-block mt-1">
                  A estrutura de divisões não pode ser alterada após a criação.
                </small>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Total de Pontos (Ano Completo) *</label>
              <input
                type="number"
                className="form-control"
                value={totalPontos}
                onChange={(e) => setTotalPontos(e.target.value)}
                min="1"
                step="0.5"
                required
              />
            </div>
          </div>

          {/* Validador de Soma de Pontos */}
          <div
            className="mt-3 p-2 rounded-3 border d-flex justify-content-between align-items-center"
            style={{ backgroundColor: pontosConferem ? "#f0fdf4" : "#fef2f2" }}
          >
            <span className="small">
              Soma das Etapas: <strong>{somaPontos} pts</strong> de <strong>{totalPontos} pts</strong>
            </span>
            {pontosConferem ? (
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1">
                <i className="bi bi-check-lg me-1"></i> Pontuação balanceada
              </span>
            ) : (
              <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-1">
                <i className="bi bi-x-circle me-1"></i> Divergência de {Math.abs(somaPontos - totalPontos).toFixed(1)} pts
              </span>
            )}
          </div>
        </div>

        {/* 3. Cronograma e Pesos de Cada Etapa */}
        <div className="card rounded-3 border bg-light-subtle p-3 mb-3">
          <h6 className="fw-bold text-primary small text-uppercase mb-3">
            3. Cronograma e Pontuação de Cada Etapa ({divisoes.length})
          </h6>

          <div className="d-flex flex-column gap-3">
            {divisoes.map((div, index) => (
              <div key={div.numero || index} className="p-3 bg-white border rounded-3 shadow-xs">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Nome da Etapa {index + 1}
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-semibold"
                      value={div.nome}
                      onChange={(e) => handleAlterarDivisao(index, "nome", e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Pontos *
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={div.pontos}
                      onChange={(e) => handleAlterarDivisao(index, "pontos", e.target.value)}
                      min="0.5"
                      step="0.5"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Início *
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={div.data_inicio}
                      onChange={(e) => handleAlterarDivisao(index, "data_inicio", e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Término *
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={div.data_fim}
                      onChange={(e) => handleAlterarDivisao(index, "data_fim", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkbox para tornar o período vigente */}
        <div className="form-check form-switch ps-4 py-2">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="periodo-ativo-check"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          <label className="form-check-label fw-semibold small text-dark" htmlFor="periodo-ativo-check">
            Definir imediatamente como o Período Letivo Vigente da escola
          </label>
        </div>
      </div>

      {/* Rodapé Fixo do Modal */}
      <div className="modal-footer border-top px-4 py-3 flex-shrink-0 bg-white rounded-bottom-4">
        <button
          type="button"
          className="btn btn-light border rounded-pill px-4"
          onClick={onFechar}
          disabled={salvando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary rounded-pill px-4 fw-semibold"
          disabled={salvando || !pontosConferem}
        >
          {salvando ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Salvando...
            </>
          ) : (
            <>
              <i className="bi bi-check2-circle me-1"></i>
              {periodoEmEdicao ? "Atualizar Período" : "Criar Período Letivo"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * ModalPeriodoLetivo.jsx - Modal Principal
 */
export default function ModalPeriodoLetivo({
  aberto = false,
  periodoEmEdicao = null,
  onFechar,
  onSalvar,
  salvando = false,
}) {
  if (!aberto) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <FormPeriodoLetivo
          key={periodoEmEdicao ? periodoEmEdicao.id_periodo_letivo : "novo"}
          periodoEmEdicao={periodoEmEdicao}
          onFechar={onFechar}
          onSalvar={onSalvar}
          salvando={salvando}
        />
      </div>
    </div>
  );
}
