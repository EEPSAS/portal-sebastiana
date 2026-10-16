import { useState } from "react";

/**
 * CardapioSemanalCard.jsx - Painel de Cardápio da Merenda Escolar
 *
 * Papel Didático:
 * Apresenta a relação do cardápio semanal da escola conforme layout do mockup.
 * Possui navegação de mês e modal completo informativo com o cardápio do mês ao clicar no rodapé.
 */

const CARDAPIO_MOCK = [
  { dia: "Seg", data: "05/05", refeicao: "Arroz, feijão, frango grelhado, salada e fruta" },
  { dia: "Ter", data: "06/05", refeicao: "Macarrão, carne moída, legumes e sobremesa" },
  { dia: "Qua", data: "07/05", refeicao: "Arroz, feijão, peixe assado, salada e fruta" },
  { dia: "Qui", data: "08/05", refeicao: "Polenta, frango, salada e fruta" },
  { dia: "Sex", data: "09/05", refeicao: "Arroz, feijão, carne de panela, farofa e fruta" },
];

export default function CardapioSemanalCard({ itensCardapio = CARDAPIO_MOCK }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [mesAtual] = useState("Maio 2025");

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column justify-content-between">
      <div>
        {/* Cabeçalho */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
            style={{ backgroundColor: "#eff6ff", width: "38px", height: "38px" }}
          >
            <i className="bi bi-cup-hot-fill fs-5"></i>
          </div>
          <h3 className="fs-5 fw-bold mb-0 text-dark">Cardápio Mensal</h3>
        </div>

        {/* Seletor de Mês */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2 rounded-3 mb-3"
          style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <button
            type="button"
            className="btn btn-sm btn-link text-secondary p-0 border-0"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="fw-semibold text-dark small">{mesAtual}</span>
          <button
            type="button"
            className="btn btn-sm btn-link text-secondary p-0 border-0"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>

        {/* Lista de Refeições Diárias */}
        <div className="d-flex flex-column gap-3">
          {itensCardapio.map((item, index) => (
            <div key={`cardapio-${index}`} className="d-flex align-items-start gap-3">
              {/* Coluna Dia / Data */}
              <div className="text-center flex-shrink-0" style={{ width: "42px" }}>
                <span className="d-block fw-bold small text-secondary lh-1">{item.dia}</span>
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>{item.data}</span>
              </div>

              {/* Bolinha verde indicadora */}
              <div className="mt-1 flex-shrink-0">
                <span
                  className="rounded-circle d-inline-block"
                  style={{ width: "8px", height: "8px", backgroundColor: "#10b981" }}
                ></span>
              </div>

              {/* Descrição do Prato */}
              <p className="mb-0 text-secondary small lh-sm">
                {item.refeicao}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Botão de Rodapé para visualização completa */}
      <div className="pt-3 mt-3 border-top">
        <button
          type="button"
          className="btn btn-light w-100 rounded-3 text-primary fw-semibold small d-flex align-items-center justify-content-between px-3 py-2 border"
          onClick={() => setModalAberto(true)}
        >
          <span className="d-flex align-items-center gap-2">
            <i className="bi bi-calendar-check"></i>
            Ver cardápio completo
          </span>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      {/* Modal Didático do Cardápio Completo */}
      {modalAberto && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1060, padding: "1rem" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAberto(false);
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg text-dark p-4 w-100"
            style={{ maxWidth: "560px" }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar-event text-primary fs-4"></i>
                <h5 className="fw-bold mb-0">Cardápio Completo — {mesAtual}</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalAberto(false)}
              ></button>
            </div>

            <div className="py-2" style={{ maxHeight: "360px", overflowY: "auto" }}>
              <p className="small text-muted mb-3">
                Cardápio elaborado pela equipe de nutrição escolar da EEPSAS, balanceado e adequado às diretrizes do PNAE.
              </p>
              <ul className="list-group list-group-flush">
                {itensCardapio.map((item, idx) => (
                  <li key={idx} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-dark me-2">{item.dia} ({item.data}):</strong>
                      <span className="text-secondary small">{item.refeicao}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="d-flex justify-content-end pt-3 border-top mt-3">
              <button
                type="button"
                className="btn btn-secondary rounded-pill px-4"
                onClick={() => setModalAberto(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
