export default function GeralMediumCards({ medias = [], frequencias = [], loading = false }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3 my-2">
      {/* Card: Média de Notas por Turma */}
      <div className="col-12 col-lg-8">
        <div className="card border-0 shadow-sm rounded-3 p-4 h-100">
          <h5 className="fw-bold text-dark mb-4">Média de Notas por Turma</h5>

          <div className="d-flex flex-column gap-4">
            {medias.map((item) => {
              const percentagemBarra = item.nota ? (item.nota / 10) * 100 : 0;

              return (
                <div key={item.id}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-secondary small">{item.turma}</span>
                    <span className="fw-bold text-dark small">{item.nota ?? '—'}</span>
                  </div>
                  <div className="progress" style={{ height: '8px', backgroundColor: '#f0f0f0' }}>
                    <div
                      className="progress-bar rounded-pill"
                      role="progressbar"
                      style={{
                        width: `${percentagemBarra}%`,
                        backgroundColor: item.cor,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card: Frequência por Turma */}
      <div className="col-12 col-lg-4">
        <div className="card border-0 shadow-sm rounded-3 p-4 h-100">
          <h5 className="fw-bold text-dark mb-4">Frequência por Turma</h5>

          <div className="d-flex flex-column gap-3">
            {frequencias.map((item) => (
              <div
                key={item.id}
                className="d-flex justify-content-between align-items-center p-3 rounded-3 border-0 bg-light"
              >
                <span className="fw-semibold text-secondary small">{item.turma}</span>
                
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold small" style={{ color: item.cor }}>
                    {item.percentual !== null && item.percentual !== undefined 
                      ? `${item.percentual}%` 
                      : '—'}
                  </span>
                  
                  <svg width="20" height="20" viewBox="0 0 36 36">
                    <path
                      stroke="#e6e6e6"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke={item.cor}
                      strokeDasharray={`${item.percentual || 0}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}