const Agenda = () => {
  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="row g-4">
        
        {/* =========================================
            COLUNA ESQUERDA (Calendário Maior - Placeholder)
        ========================================= */}
        <div className="col-lg-8">
          <div className="bg-white p-4 rounded-4 shadow-sm h-100 d-flex flex-column">
            
            {/* Cabeçalho do Calendário */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-primary fw-bold mb-0">Agosto 2026</h4>
              <div>
                <button className="btn btn-outline-primary rounded-circle me-2 p-2 lh-1">
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button className="btn btn-outline-primary rounded-circle p-2 lh-1">
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>

            {/* Imagem do Calendário */}
            <div className="flex-grow-1 d-flex align-items-center">
              <img 
                src="https://placehold.co/1200x800" 
                className="img-fluid rounded-4 shadow-sm w-100 object-fit-cover" 
                alt="Placeholder do Calendário" 
              />
            </div>

          </div>
        </div>

        {/* =========================================
            COLUNA DIREITA (Ações e Listas)
        ========================================= */}
        <div className="col-lg-4">
          
          {/* Seção 1: Adicionar Evento */}
          <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
            <h5 className="text-primary fw-bold mb-4">Novo Evento</h5>
            
            <form>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Título</label>
                <input type="text" className="form-control bg-light border-0 py-2" placeholder="Ex: Feira de Ciências" />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Data</label>
                  <input type="date" className="form-control bg-light border-0 py-2" />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small fw-semibold">Hora</label>
                  <input type="time" className="form-control bg-light border-0 py-2" />
                </div>
              </div>
              <button type="button" className="btn btn-danger w-100 py-2 fw-semibold rounded-pill mt-2">
                Adicionar à Agenda
              </button>
            </form>
          </div>

          {/* Seção 2: Próximos Eventos */}
          <div className="bg-white p-4 rounded-4 shadow-sm">
            <h5 className="text-primary fw-bold mb-4">Próximos Eventos</h5>

            <div className="d-flex flex-column gap-3">
              {/* Evento 1 */}
              <div className="border border-0 bg-light rounded-3 p-3 d-flex align-items-center">
                <div className="text-center border-end border-dark border-opacity-10 pe-3 me-3 px-2">
                  <span className="d-block fw-bold text-danger small">AGO</span>
                  <span className="d-block text-primary fw-bold fs-3 lh-1">28</span>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-6">Feira de Ciências</h6>
                  <small className="text-muted d-block">Laboratório Principal</small>
                  <small className="text-dark fw-semibold">08:00 - 12:00</small>
                </div>
              </div>
              
              {/* Evento 2 */}
              <div className="border border-0 bg-light rounded-3 p-3 d-flex align-items-center">
                <div className="text-center border-end border-dark border-opacity-10 pe-3 me-3 px-2">
                  <span className="d-block fw-bold text-danger small">SET</span>
                  <span className="d-block text-primary fw-bold fs-3 lh-1">05</span>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-6">Prova de Matemática</h6>
                  <small className="text-muted d-block">Sala 12</small>
                  <small className="text-dark fw-semibold">09:30</small>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Agenda;