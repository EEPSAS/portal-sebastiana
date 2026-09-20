const AdminHome = () => {
  return (
    <div className="container-fluid pb-5">
      <h4 className="fw-bold mb-4">Visão Geral</h4>
      
      {/* Row 1 - Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card shadow-sm rounded-4 border-0 h-100" style={{ borderLeft: '5px solid #ef1596' }}>
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(239, 21, 150, 0.1)', color: '#ef1596' }}>
                <i className="bi bi-people fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Total de Alunos</h6>
                <h3 className="mb-0 fw-bold">342</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card shadow-sm rounded-4 border-0 h-100" style={{ borderLeft: '5px solid #198754' }}>
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                <i className="bi bi-bar-chart fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Média Geral de Notas</h6>
                <h3 className="mb-0 fw-bold">7.8</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card shadow-sm rounded-4 border-0 h-100" style={{ borderLeft: '5px solid #ffc107' }}>
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Frequência Média</h6>
                <h3 className="mb-0 fw-bold">89%</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card shadow-sm rounded-4 border-0 h-100" style={{ borderLeft: '5px solid #0dcaf0' }}>
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                <i className="bi bi-newspaper fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Notícias Publicadas</h6>
                <h3 className="mb-0 fw-bold">12</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Charts */}
      <div className="row g-4 mb-5">
        <div className="col-md-8">
          <div className="card shadow-sm rounded-4 border-0 h-100 p-4">
            <h5 className="fw-bold mb-4">Média de Notas por Turma</h5>
            
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-semibold">1º Ano</span>
                <span className="fw-bold text-muted">7.2</span>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar rounded-pill" role="progressbar" style={{ width: '72%', backgroundColor: '#ef1596' }}></div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-semibold">2º Ano</span>
                <span className="fw-bold text-muted">8.1</span>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar rounded-pill bg-primary" role="progressbar" style={{ width: '81%' }}></div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-semibold">3º Ano</span>
                <span className="fw-bold text-muted">7.5</span>
              </div>
              <div className="progress" style={{ height: '10px' }}>
                <div className="progress-bar rounded-pill bg-info" role="progressbar" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm rounded-4 border-0 h-100 p-4">
            <h5 className="fw-bold mb-4">Frequência por Turma</h5>
            
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light border">
                <span className="fw-semibold">1º Ano</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-5 text-success">92%</span>
                  <svg width="24" height="24" viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                    <path className="circle" strokeDasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#198754" strokeWidth="3" />
                  </svg>
                </div>
              </div>
              
              <div className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light border">
                <span className="fw-semibold">2º Ano</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-5 text-success">87%</span>
                  <svg width="24" height="24" viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                    <path className="circle" strokeDasharray="87, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#198754" strokeWidth="3" />
                  </svg>
                </div>
              </div>
              
              <div className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light border">
                <span className="fw-semibold">3º Ano</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-5 text-warning">85%</span>
                  <svg width="24" height="24" viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                    <path className="circle" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ffc107" strokeWidth="3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 - Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm rounded-4 border-0 p-4">
            <h5 className="fw-bold mb-4">Últimas Atualizações</h5>
            
            <div className="list-group list-group-flush border-0">
              <div className="list-group-item border-0 py-3 d-flex align-items-center px-0">
                <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2 me-3 d-flex align-items-center justify-content-center">
                  <i className="bi bi-newspaper"></i>
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0 fw-semibold">Nova notícia publicada: Feira de Ciências 2026</p>
                </div>
                <span className="badge bg-light text-muted border rounded-pill fw-normal">2h atrás</span>
              </div>
              
              <div className="list-group-item border-0 py-3 d-flex align-items-center px-0">
                <div className="rounded-circle bg-success bg-opacity-10 text-success p-2 me-3 d-flex align-items-center justify-content-center">
                  <i className="bi bi-journal-check"></i>
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0 fw-semibold">Notas do 2º bimestre atualizadas — 3º Ano</p>
                </div>
                <span className="badge bg-light text-muted border rounded-pill fw-normal">5h atrás</span>
              </div>
              
              <div className="list-group-item border-0 py-3 d-flex align-items-center px-0">
                <div className="rounded-circle bg-warning bg-opacity-10 text-warning p-2 me-3 d-flex align-items-center justify-content-center">
                  <i className="bi bi-book"></i>
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0 fw-semibold">Livro 'Dom Casmurro' cadastrado na biblioteca</p>
                </div>
                <span className="badge bg-light text-muted border rounded-pill fw-normal">1 dia atrás</span>
              </div>
              
              <div className="list-group-item border-0 py-3 d-flex align-items-center px-0">
                <div className="rounded-circle bg-info bg-opacity-10 text-info p-2 me-3 d-flex align-items-center justify-content-center">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0 fw-semibold">Frequência atualizada — 1º Ano</p>
                </div>
                <span className="badge bg-light text-muted border rounded-pill fw-normal">2 dias atrás</span>
              </div>
              
              <div className="list-group-item border-0 py-3 d-flex align-items-center px-0">
                <div className="rounded-circle bg-secondary bg-opacity-10 text-secondary p-2 me-3 d-flex align-items-center justify-content-center">
                  <i className="bi bi-file-earmark-pdf"></i>
                </div>
                <div className="flex-grow-1">
                  <p className="mb-0 fw-semibold">Apostila de Matemática adicionada</p>
                </div>
                <span className="badge bg-light text-muted border rounded-pill fw-normal">3 dias atrás</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
