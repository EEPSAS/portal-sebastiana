const AdminHeader = () => {
  return (
    <header className="dashboard-header admin-header d-flex justify-content-between align-items-center p-4 shadow-sm bg-white">
      <div>
        <h5 className="mb-0 fw-bold">Painel Administrativo</h5>
        <span className="text-muted small">Gerencie turmas, notícias e biblioteca.</span>
      </div>
      
      <div className="d-flex align-items-center gap-4">
        <div className="input-group shadow-sm rounded-pill">
          <span className="input-group-text bg-white rounded-start-pill border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input type="text" className="form-control rounded-end-pill border-start-0 shadow-none" placeholder="Pesquisar..." />
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle position-relative p-2 border-0 shadow-sm" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-bell-fill text-muted"></i>
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">Novas notificações</span>
            </span>
          </button>
          
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px' }}>
              AD
            </div>
            <i className="bi bi-chevron-down text-muted small"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
