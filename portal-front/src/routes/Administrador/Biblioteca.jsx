import { useState } from 'react';

const AdminBiblioteca = () => {
  const [activeTab, setActiveTab] = useState('livros');

  return (
    <div className="container-fluid pb-5">
      <h4 className="fw-bold mb-4">Gerenciar Biblioteca</h4>

      <ul className="nav nav-tabs mb-4 border-bottom-0 gap-2">
        <li className="nav-item">
          <button 
            className={`nav-link fw-semibold rounded-top-3 ${activeTab === 'livros' ? 'active shadow-sm border-bottom-0 bg-white' : 'bg-light text-muted border-0'}`}
            onClick={() => setActiveTab('livros')}
            style={activeTab === 'livros' ? { color: '#ef1596' } : {}}
          >
            Acervo de Livros
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link fw-semibold rounded-top-3 ${activeTab === 'videoaulas' ? 'active shadow-sm border-bottom-0 bg-white' : 'bg-light text-muted border-0'}`}
            onClick={() => setActiveTab('videoaulas')}
            style={activeTab === 'videoaulas' ? { color: '#ef1596' } : {}}
          >
            Videoaulas
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link fw-semibold rounded-top-3 ${activeTab === 'apostilas' ? 'active shadow-sm border-bottom-0 bg-white' : 'bg-light text-muted border-0'}`}
            onClick={() => setActiveTab('apostilas')}
            style={activeTab === 'apostilas' ? { color: '#ef1596' } : {}}
          >
            Apostilas
          </button>
        </li>
      </ul>

      <div className="card shadow-sm rounded-4 border-0 p-4 rounded-top-0 bg-white">
        
        {activeTab === 'livros' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="input-group w-50 shadow-sm rounded-pill">
                <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input type="text" className="form-control bg-white border-start-0 rounded-end-pill shadow-none" placeholder="Buscar livros por título, autor..." />
              </div>
              <button className="btn text-white rounded-pill px-4 fw-semibold shadow-sm" style={{ backgroundColor: '#ef1596' }}>
                <i className="bi bi-plus-lg me-2"></i>
                Cadastrar Livro
              </button>
            </div>

            <div className="row g-4">
              {[
                { title: 'Dom Casmurro', author: 'Machado de Assis', status: 'Disponível', color: '#e3f2fd', icon: 'primary' },
                { title: 'O Cortiço', author: 'Aluísio Azevedo', status: 'Emprestado', loan: 'João Silva — 2º Ano', color: '#fff3e0', icon: 'warning' },
                { title: 'Vidas Secas', author: 'Graciliano Ramos', status: 'Disponível', color: '#e8f5e9', icon: 'success' },
                { title: 'Capitães da Areia', author: 'Jorge Amado', status: 'Disponível', color: '#fce4ec', icon: 'danger' },
                { title: 'Memórias Póstumas', author: 'Machado de Assis', status: 'Emprestado', loan: 'Maria Souza — 3º Ano', color: '#f3e5f5', icon: 'purple' },
                { title: 'Iracema', author: 'José de Alencar', status: 'Disponível', color: '#e0f7fa', icon: 'info' },
                { title: 'Grande Sertão', author: 'Guimarães Rosa', status: 'Disponível', color: '#fff8e1', icon: 'warning' },
                { title: 'A Moreninha', author: 'Joaquim Manuel', status: 'Disponível', color: '#e3f2fd', icon: 'primary' }
              ].map((book, idx) => (
                <div className="col-md-3" key={idx}>
                  <div className="card h-100 border bg-light shadow-sm rounded-4 overflow-hidden position-relative pt-3 px-3 pb-3">
                    <div className="rounded-3 d-flex justify-content-center align-items-center mb-3" style={{ height: '150px', backgroundColor: book.color }}>
                      <i className={`bi bi-book-half fs-1 text-${book.icon}`}></i>
                    </div>
                    <h6 className="fw-bold mb-1 text-truncate" title={book.title}>{book.title}</h6>
                    <p className="small text-muted mb-2">{book.author}</p>
                    
                    <div className="mt-auto">
                      {book.status === 'Disponível' ? (
                        <span className="badge bg-success bg-opacity-25 text-success rounded-pill mb-3 w-100 py-2">Disponível</span>
                      ) : (
                        <div className="mb-3">
                          <span className="badge bg-warning bg-opacity-25 text-warning rounded-pill w-100 py-2 mb-1">Emprestado</span>
                          <small className="text-muted d-block text-truncate" style={{ fontSize: '0.75rem' }}>{book.loan}</small>
                        </div>
                      )}
                      
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary rounded-pill flex-fill">Editar</button>
                        <button className="btn btn-sm btn-outline-danger rounded-pill flex-fill">Excluir</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'videoaulas' && (
          <div>
            <div className="input-group w-50 mb-4 shadow-sm rounded-pill">
              <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input type="text" className="form-control bg-white border-start-0 rounded-end-pill shadow-none" placeholder="Buscar videoaulas..." />
            </div>

            <div className="row g-4">
              {[
                { title: 'Equações do 2º Grau', subject: 'Matemática', color: 'primary' },
                { title: 'Revolução Industrial', subject: 'História', color: 'warning' },
                { title: 'Leis de Newton', subject: 'Física', color: 'info' },
                { title: 'Células e Tecidos', subject: 'Biologia', color: 'success' },
                { title: 'Geopolítica Atual', subject: 'Geografia', color: 'secondary' },
                { title: 'Verbos no Inglês', subject: 'Inglês', color: 'danger' }
              ].map((video, idx) => (
                <div className="col-md-4" key={idx}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-light">
                    <div className="bg-dark d-flex justify-content-center align-items-center position-relative" style={{ height: '180px' }}>
                      <i className="bi bi-play-circle text-white opacity-75" style={{ fontSize: '3rem' }}></i>
                      <span className={`position-absolute top-0 end-0 m-3 badge bg-${video.color} rounded-pill`}>{video.subject}</span>
                    </div>
                    <div className="card-body">
                      <h6 className="fw-bold mb-2">{video.title}</h6>
                      <p className="text-muted small mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Breve descrição do conteúdo do vídeo para os alunos.</p>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary rounded-pill">Editar</button>
                        <button className="btn btn-sm btn-outline-danger rounded-pill">Excluir</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'apostilas' && (
          <div>
            <div className="input-group w-50 mb-4 shadow-sm rounded-pill">
              <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input type="text" className="form-control bg-white border-start-0 rounded-end-pill shadow-none" placeholder="Buscar apostilas..." />
            </div>

            <div className="list-group border-0 gap-3">
              {[
                { title: 'Apostila de Matemática — 1º Ano', subject: 'Matemática', color: 'primary' },
                { title: 'Resumo de História — 3º Ano', subject: 'História', color: 'warning' },
                { title: 'Guia de Redação ENEM', subject: 'Português', color: 'danger' },
                { title: 'Exercícios de Química Orgânica', subject: 'Química', color: 'info' }
              ].map((doc, idx) => (
                <div className="list-group-item border rounded-4 shadow-sm p-3 d-flex align-items-center justify-content-between bg-light" key={idx}>
                  <div className="d-flex align-items-center">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-3 me-3">
                      <i className="bi bi-file-earmark-pdf fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{doc.title}</h6>
                      <span className={`badge bg-${doc.color} bg-opacity-25 text-${doc.color} rounded-pill`}>{doc.subject}</span>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-primary rounded-circle p-2" title="Baixar">
                      <i className="bi bi-download"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-secondary rounded-circle p-2" title="Editar">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger rounded-circle p-2" title="Excluir">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminBiblioteca;
