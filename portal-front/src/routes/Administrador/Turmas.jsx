import { useState } from 'react';

const AdminTurmas = () => {
  const [activeTab, setActiveTab] = useState('1ano');

  const getGradeColor = (grade) => {
    if (grade === '—') return 'text-muted';
    const num = parseFloat(grade);
    if (num < 6.0) return 'text-danger fw-bold';
    if (num < 7.0) return 'text-warning fw-bold';
    return 'text-success fw-bold';
  };

  const getFreqColor = (freq) => {
    const num = parseInt(freq);
    if (num < 75) return 'text-danger fw-bold';
    if (num < 85) return 'text-warning fw-bold';
    return 'text-success fw-bold';
  };

  return (
    <div className="container-fluid pb-5">
      <h4 className="fw-bold mb-4">Minhas Turmas</h4>

      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button 
            className={`nav-link rounded-pill fw-semibold px-4 shadow-sm ${activeTab === '1ano' ? 'active text-white' : 'bg-white text-muted'}`}
            onClick={() => setActiveTab('1ano')}
            style={activeTab === '1ano' ? { backgroundColor: '#ef1596' } : {}}
          >
            1º Ano
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link rounded-pill fw-semibold px-4 shadow-sm ${activeTab === '2ano' ? 'active text-white' : 'bg-white text-muted'}`}
            onClick={() => setActiveTab('2ano')}
            style={activeTab === '2ano' ? { backgroundColor: '#ef1596' } : {}}
          >
            2º Ano
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link rounded-pill fw-semibold px-4 shadow-sm ${activeTab === '3ano' ? 'active text-white' : 'bg-white text-muted'}`}
            onClick={() => setActiveTab('3ano')}
            style={activeTab === '3ano' ? { backgroundColor: '#ef1596' } : {}}
          >
            3º Ano
          </button>
        </li>
      </ul>

      {/* Summary Row */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm rounded-4 border-0 p-3 h-100">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-people fs-3"></i>
              </div>
              <div>
                <h6 className="text-muted mb-0 small text-uppercase fw-bold">Total de Alunos</h6>
                <h3 className="mb-0 fw-bold">38</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm rounded-4 border-0 p-3 h-100">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 text-success p-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-award fs-3"></i>
              </div>
              <div>
                <h6 className="text-muted mb-0 small text-uppercase fw-bold">Média de Notas</h6>
                <h3 className="mb-0 fw-bold">7.2</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm rounded-4 border-0 p-3 h-100">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 text-warning p-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-calendar-check fs-3"></i>
              </div>
              <div>
                <h6 className="text-muted mb-0 small text-uppercase fw-bold">Frequência Média</h6>
                <h3 className="mb-0 fw-bold">92%</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card shadow-sm rounded-4 border-0 p-0 overflow-hidden mb-4">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Alunos e Desempenho</h5>
          <div className="input-group shadow-sm rounded-pill" style={{ width: '300px' }}>
            <span className="input-group-text bg-white border-end-0 rounded-start-pill">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input type="text" className="form-control bg-white border-start-0 rounded-end-pill shadow-none" placeholder="Buscar aluno..." />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle text-center">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4 text-start text-secondary">#</th>
                <th className="py-3 text-start text-secondary">Aluno</th>
                <th className="py-3 text-secondary">Nota B1</th>
                <th className="py-3 text-secondary">Nota B2</th>
                <th className="py-3 text-secondary">Nota B3</th>
                <th className="py-3 text-secondary">Nota B4</th>
                <th className="py-3 text-secondary">Média</th>
                <th className="py-3 text-secondary">Frequência</th>
                <th className="py-3 px-4 text-end text-secondary">Ações</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 1, name: 'Maria Silva', b1: '8.5', b2: '7.0', b3: '9.0', b4: '—', avg: '8.2', freq: '95%' },
                { id: 2, name: 'João Santos', b1: '6.0', b2: '7.5', b3: '6.5', b4: '—', avg: '6.7', freq: '88%' },
                { id: 3, name: 'Ana Oliveira', b1: '9.0', b2: '8.5', b3: '9.5', b4: '—', avg: '9.0', freq: '97%' },
                { id: 4, name: 'Pedro Costa', b1: '5.5', b2: '6.0', b3: '5.0', b4: '—', avg: '5.5', freq: '78%' },
                { id: 5, name: 'Lucas Ferreira', b1: '7.0', b2: '7.5', b3: '8.0', b4: '—', avg: '7.5', freq: '91%' }
              ].map((student) => (
                <tr key={student.id}>
                  <td className="px-4 fw-semibold text-muted text-start">{student.id}</td>
                  <td className="fw-semibold text-start">{student.name}</td>
                  <td className={getGradeColor(student.b1)}>{student.b1}</td>
                  <td className={getGradeColor(student.b2)}>{student.b2}</td>
                  <td className={getGradeColor(student.b3)}>{student.b3}</td>
                  <td className={getGradeColor(student.b4)}>{student.b4}</td>
                  <td className={`fw-bolder ${getGradeColor(student.avg)}`}>{student.avg}</td>
                  <td className={getFreqColor(student.freq)}>{student.freq}</td>
                  <td className="px-4 text-end">
                    <button className="btn btn-sm btn-outline-primary rounded-circle p-2">
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white border-top p-4 d-flex justify-content-between">
          <button className="btn text-white rounded-pill px-4 fw-semibold shadow-sm" style={{ backgroundColor: '#ef1596' }}>
            <i className="bi bi-plus-lg me-2"></i>
            Adicionar Aluno
          </button>
          <button className="btn btn-outline-secondary rounded-pill px-4 fw-semibold">
            <i className="bi bi-file-earmark-arrow-down me-2"></i>
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Edit Modal Mockup */}
      <div className="card shadow-sm rounded-4 border-0 p-4 border-top border-5" style={{ borderTopColor: '#ef1596' }}>
        <h5 className="fw-bold mb-4">Editar Notas e Frequência</h5>
        
        <form>
          <div className="row g-3">
            <div className="col-md-12 mb-3">
              <label className="form-label fw-semibold">Aluno</label>
              <input type="text" className="form-control bg-light border-0 py-2" value="Maria Silva" readOnly />
            </div>
            
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Nota B1</label>
              <input type="number" className="form-control border py-2" defaultValue="8.5" step="0.1" />
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Nota B2</label>
              <input type="number" className="form-control border py-2" defaultValue="7.0" step="0.1" />
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Nota B3</label>
              <input type="number" className="form-control border py-2" defaultValue="9.0" step="0.1" />
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label fw-semibold">Nota B4</label>
              <input type="number" className="form-control border py-2" placeholder="—" step="0.1" />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Frequência (%)</label>
              <input type="number" className="form-control border py-2" defaultValue="95" />
            </div>
          </div>
          
          <div className="d-flex gap-2 justify-content-end mt-4">
            <button type="button" className="btn btn-secondary rounded-pill px-4">Cancelar</button>
            <button type="button" className="btn btn-success rounded-pill px-4">Salvar Alterações</button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default AdminTurmas;
