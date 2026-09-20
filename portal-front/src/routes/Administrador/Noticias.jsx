const AdminNoticias = () => {
  return (
    <div className="container-fluid pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Gerenciar Notícias</h4>
        <button className="btn text-white rounded-pill px-4 fw-semibold shadow-sm" style={{ backgroundColor: '#ef1596' }}>
          <i className="bi bi-plus-lg me-2"></i>
          Nova Notícia
        </button>
      </div>

      <div className="row g-4">
        {/* Form Modal Mockup */}
        <div className="col-12 mb-2">
          <div className="card shadow-sm rounded-4 border-0 p-4">
            <h5 className="fw-bold mb-4 border-bottom pb-3">Adicionar / Editar Notícia</h5>
            
            <form>
              <div className="mb-3">
                <label className="form-label fw-semibold">Título</label>
                <input type="text" className="form-control rounded-3 bg-light border-0 py-2" placeholder="Digite o título da notícia" />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Imagem</label>
                <div className="rounded-3 p-5 text-center bg-light text-muted" style={{ border: '2px dashed #dee2e6' }}>
                  <i className="bi bi-cloud-arrow-up fs-2"></i>
                  <p className="mb-0 mt-2">Clique ou arraste uma imagem aqui para fazer upload</p>
                  <small>JPG, PNG ou GIF (Máx. 2MB)</small>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-semibold">Descrição</label>
                <textarea className="form-control rounded-3 bg-light border-0 py-2" rows="4" placeholder="Conteúdo da notícia..."></textarea>
              </div>
              
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-secondary rounded-pill px-4">Cancelar</button>
                <button type="button" className="btn btn-success rounded-pill px-4">Salvar</button>
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="col-12">
          <div className="card shadow-sm rounded-4 border-0 p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="py-3 px-4 text-secondary">#</th>
                    <th className="py-3 text-secondary">Título</th>
                    <th className="py-3 text-secondary">Data</th>
                    <th className="py-3 text-secondary">Status</th>
                    <th className="py-3 px-4 text-end text-secondary">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 fw-semibold text-muted">1</td>
                    <td className="fw-semibold">Feira de Ciências 2026</td>
                    <td className="text-muted">15/09/2026</td>
                    <td><span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2">Publicada</span></td>
                    <td className="px-4 text-end">
                      <button className="btn btn-sm btn-outline-primary rounded-circle p-2 me-2">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-circle p-2">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 fw-semibold text-muted">2</td>
                    <td className="fw-semibold">Jogos Internos</td>
                    <td className="text-muted">10/09/2026</td>
                    <td><span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2">Publicada</span></td>
                    <td className="px-4 text-end">
                      <button className="btn btn-sm btn-outline-primary rounded-circle p-2 me-2">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-circle p-2">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 fw-semibold text-muted">3</td>
                    <td className="fw-semibold">Semana da Pátria</td>
                    <td className="text-muted">01/09/2026</td>
                    <td><span className="badge bg-warning bg-opacity-25 text-warning rounded-pill px-3 py-2">Rascunho</span></td>
                    <td className="px-4 text-end">
                      <button className="btn btn-sm btn-outline-primary rounded-circle p-2 me-2">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-circle p-2">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 fw-semibold text-muted">4</td>
                    <td className="fw-semibold">Palestra sobre Meio Ambiente</td>
                    <td className="text-muted">25/08/2026</td>
                    <td><span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2">Publicada</span></td>
                    <td className="px-4 text-end">
                      <button className="btn btn-sm btn-outline-primary rounded-circle p-2 me-2">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-circle p-2">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNoticias;
