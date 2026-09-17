const Aluno = () => {
  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <div className="row g-4">
        
        {/* =========================================
            COLUNA ESQUERDA (Maior)
        ========================================= */}
        <div className="col-lg-8">
          
          {/* Seção 1: Acesso Rápido (Versão Imagens Placeholder) */}
          <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-primary fw-bold mb-0">Acesso Rápido</h5>
              <a href="#" className="text-decoration-none fw-semibold text-danger">
                Ver todos os cursos <i className="bi bi-arrow-right"></i>
              </a>
            </div>

            <div className="row g-3">
              {/* Imagem/Card 1 */}
              <div className="col-md-3">
                <img 
                  src="https://placehold.co/1900x800" 
                  className="img-fluid rounded-4 shadow-sm w-100" 
                  alt="Placeholder Curso 1" 
                />
              </div>
              {/* Imagem/Card 2 */}
              <div className="col-md-3">
                <img 
                  src="https://placehold.co/1900x800" 
                  className="img-fluid rounded-4 shadow-sm w-100" 
                  alt="Placeholder Curso 2" 
                />
              </div>
              {/* Imagem/Card 3 */}
              <div className="col-md-3">
                <img 
                  src="https://placehold.co/1900x800" 
                  className="img-fluid rounded-4 shadow-sm w-100" 
                  alt="Placeholder Curso 3" 
                />
              </div>
              {/* Imagem/Card 4 */}
              <div className="col-md-3">
                <img 
                  src="https://placehold.co/1900x800" 
                  className="img-fluid rounded-4 shadow-sm w-100" 
                  alt="Placeholder Curso 4" 
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Atividades Recentes */}
          <div className="bg-white p-4 rounded-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-primary fw-bold mb-0">Atividades Recentes</h5>
            </div>

            <div className="d-flex flex-column gap-2">
              {/* Item de Atividade 1 */}
              <div className="bg-light p-3 rounded-3 d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle p-3 d-flex justify-content-center align-items-center me-3">
                  <i className="bi bi-file-eartext-fill fs-5"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold text-dark fs-6">Novo material disponível</h6>
                  <small className="text-muted">Material avaliativo • Didático - Logaritmo</small>
                </div>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <span>2h atrás</span>
                  <i className="bi bi-chevron-right"></i>
                </div>
              </div>

              {/* Item de Atividade 2 */}
              <div className="bg-light p-3 rounded-3 d-flex align-items-center">
                <div className="bg-success text-white rounded-circle p-3 d-flex justify-content-center align-items-center me-3">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold text-dark fs-6">Atividade entregue com sucesso</h6>
                  <small className="text-muted">Classes Gramaticais • Lista de Exercícios 3</small>
                </div>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <span>1 dia atrás</span>
                  <i className="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <a href="#" className="text-decoration-none fw-semibold text-danger">
                Ver todas as atividades <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>

        </div>

        {/* =========================================
            COLUNA DIREITA (Menor)
        ========================================= */}
        <div className="col-lg-4">
          
          {/* Seção 3: Agenda */}
          <div className="bg-white p-4 rounded-4 shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-primary fw-bold mb-0">Agenda</h5>
              <a href="#" className="text-decoration-none text-danger small">
                Ver calendário <i className="bi bi-arrow-right"></i>
              </a>
            </div>

            <div className="d-flex flex-column gap-3">
              {/* Item Agenda 1 */}
              <div className="border rounded-3 p-3 d-flex align-items-center">
                <div className="text-center border-end pe-3 me-3 px-2">
                  <span className="d-block fw-bold text-danger small">MAI</span>
                  <span className="d-block text-primary fw-bold fs-3 lh-1">22</span>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-6">Entrega de Trabalho</h6>
                  <small className="text-muted d-block">Análise de Dados</small>
                  <small className="text-dark fw-semibold">07:00</small>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <a href="#" className="text-decoration-none text-danger small">
                Ver todas as atividades
              </a>
            </div>
          </div>

          {/* Seção 4: Meu Desempenho */}
          <div className="bg-white p-4 rounded-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-primary fw-bold mb-0">Meu Desempenho</h5>
              <a href="#" className="text-decoration-none text-danger small">
                Ver relatório <i className="bi bi-arrow-right"></i>
              </a>
            </div>

            <div>
              <small className="text-muted">Média geral</small>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <h1 className="fw-bold mb-0 text-danger display-4">8,4</h1>
                <small className="text-success fw-bold"><i className="bi bi-arrow-up"></i> 0.4</small>
                <small className="text-muted small">em relação ao mês passado</small>
              </div>
              <div className="progress mb-4">
                <div className="progress-bar bg-danger w-75"></div>
              </div>

              <div className="d-flex justify-content-between text-center mt-4">
                <div>
                  <small className="text-primary d-block">Participação</small>
                  <span className="fs-5 text-primary fw-bold">90%</span>
                </div>
                <div>
                  <small className="text-primary d-block">Atividades</small>
                  <span className="fs-5 text-primary fw-bold">12/15</span>
                </div>
                <div>
                  <small className="text-primary d-block">Frequência</small>
                  <span className="fs-5 text-primary fw-bold">88%</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Aluno;