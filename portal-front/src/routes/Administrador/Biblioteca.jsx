import { useEffect, useRef, useState } from 'react';

// Dados demonstrativos; o painel ordena os livros pela quantidade de empréstimos.
const popularBooks = [
  {
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    requests: 48,
    rating: 4.8,
    ratingCount: 32,
    color: '#e3f2fd',
    icon: 'primary',
    comments: [
      { author: 'Ana Oliveira', rating: 5, date: '12/09/2026', text: 'A história prende a atenção e rende ótimas conversas em sala.' },
      { author: 'Lucas Ferreira', rating: 5, date: '08/09/2026', text: 'Um clássico que vale a leitura. A edição está muito bem conservada.' },
      { author: 'Maria Silva', rating: 4, date: '02/09/2026', text: 'Gostei bastante dos personagens e do jeito como a história é contada.' },
    ],
  },
  {
    title: 'Capitães da Areia',
    author: 'Jorge Amado',
    requests: 41,
    rating: 4.7,
    ratingCount: 27,
    color: '#fce4ec',
    icon: 'danger',
    comments: [
      { author: 'João Santos', rating: 5, date: '14/09/2026', text: 'Uma leitura emocionante que faz pensar sobre a realidade dos personagens.' },
      { author: 'Beatriz Costa', rating: 4, date: '10/09/2026', text: 'Gostei muito da narrativa e recomendo para a turma.' },
    ],
  },
  {
    title: 'Vidas Secas',
    author: 'Graciliano Ramos',
    requests: 36,
    rating: 4.6,
    ratingCount: 24,
    color: '#e8f5e9',
    icon: 'success',
    comments: [
      { author: 'Pedro Costa', rating: 5, date: '11/09/2026', text: 'A escrita é direta e os personagens ficam na memória.' },
      { author: 'Júlia Martins', rating: 4, date: '05/09/2026', text: 'Livro importante, com uma história que continua atual.' },
    ],
  },
  {
    title: 'O Cortiço',
    author: 'Aluísio Azevedo',
    requests: 29,
    rating: 4.4,
    ratingCount: 19,
    color: '#fff3e0',
    icon: 'warning',
    comments: [
      { author: 'Rafael Mendes', rating: 5, date: '09/09/2026', text: 'A descrição do ambiente ajuda muito a imaginar a história.' },
      { author: 'Camila Rocha', rating: 4, date: '01/09/2026', text: 'Leitura interessante para entender melhor o naturalismo.' },
    ],
  },
  {
    title: 'A Moreninha',
    author: 'Joaquim Manuel de Macedo',
    requests: 22,
    rating: 4.5,
    ratingCount: 16,
    color: '#e0f7fa',
    icon: 'info',
    comments: [
      { author: 'Isabela Nunes', rating: 5, date: '13/09/2026', text: 'Uma história leve e divertida. Li em poucos dias.' },
      { author: 'Diego Alves', rating: 4, date: '04/09/2026', text: 'Gostei do romance e do contexto histórico.' },
    ],
  },
];

const RatingStars = ({ rating }) => (
  <span className="d-inline-flex gap-1 text-warning" role="img" aria-label={`${rating.toLocaleString('pt-BR')} de 5 estrelas`}>
    {Array.from({ length: 5 }, (_, index) => {
      // Médias fracionadas usam meia estrela; notas inteiras deixam o restante vazio.
      const icon = rating >= index + 1 ? 'bi-star-fill' : rating > index ? 'bi-star-half' : 'bi-star';

      return <i className={`bi ${icon}`} aria-hidden="true" key={index} />;
    })}
  </span>
);

const AdminBiblioteca = () => {
  const [activeTab, setActiveTab] = useState('livros');
  const [selectedBook, setSelectedBook] = useState(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(null);

  // Abre o diálogo nativo, trata Escape e devolve o foco ao livro que o acionou.
  useEffect(() => {
    if (!selectedBook || !dialogRef.current) return undefined;

    const dialog = dialogRef.current;
    dialog.showModal();
    closeButtonRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      if (dialog.open) dialog.close();
      triggerRef.current?.focus();
    };
  }, [selectedBook]);

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
            className={`nav-link fw-semibold rounded-top-3 ${activeTab === 'populares' ? 'active shadow-sm border-bottom-0 bg-white' : 'bg-light text-muted border-0'}`}
            onClick={() => setActiveTab('populares')}
            style={activeTab === 'populares' ? { color: '#ef1596' } : {}}
          >
            Livros Populares
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

        {activeTab === 'populares' && (
          <section aria-labelledby="popular-books-heading">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
              <div>
                <h5 id="popular-books-heading" className="fw-bold mb-1">Livros mais requisitados</h5>
                <p className="text-muted small mb-0">Ranking por empréstimos e avaliações dos leitores.</p>
              </div>
              <span className="badge rounded-pill bg-light text-secondary border">{popularBooks.length} livros</span>
            </div>

            <div className="row g-4">
              {/* Ordena uma cópia para não alterar a lista de demonstração durante a renderização. */}
              {[...popularBooks].sort((first, second) => second.requests - first.requests).map((book, index) => (
                <div className="col-12 col-sm-6 col-xl-3" key={book.title}>
                  <button
                    className="card popular-book-trigger h-100 w-100 border bg-light shadow-sm rounded-4 p-3 text-start"
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`Ver avaliações e comentários de ${book.title}`}
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setSelectedBook(book);
                    }}
                  >
                    <div className="rounded-3 d-flex justify-content-center align-items-center mb-3 position-relative" style={{ height: '150px', backgroundColor: book.color }}>
                      <span className="position-absolute top-0 start-0 m-2 badge rounded-pill bg-white text-dark shadow-sm">#{index + 1} requisitado</span>
                      <i className={`bi bi-book-half fs-1 text-${book.icon}`} aria-hidden="true"></i>
                    </div>
                    <h6 className="fw-bold mb-1 text-truncate" title={book.title}>{book.title}</h6>
                    <p className="small text-muted mb-3">{book.author}</p>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                      <span className="small fw-semibold text-dark">{book.requests} empréstimos</span>
                      <span className="d-inline-flex align-items-center gap-2">
                        <RatingStars rating={book.rating} />
                        <span className="small fw-semibold">{book.rating.toLocaleString('pt-BR')}</span>
                      </span>
                    </div>
                    <span className="small text-muted mt-auto">{book.ratingCount} avaliações · {book.comments.length} comentários</span>
                    <span className="small fw-semibold text-primary mt-2">Ver comentários <i className="bi bi-chat-left-text ms-1" aria-hidden="true"></i></span>
                  </button>
                </div>
              ))}
            </div>
          </section>
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

      {selectedBook && (
        <dialog
          className="popular-book-dialog"
          ref={dialogRef}
          aria-labelledby="popular-book-dialog-title"
          onClick={(event) => {
            // Só fecha ao clicar no fundo do diálogo, sem afetar os comentários.
            if (event.target === event.currentTarget) dialogRef.current?.close();
          }}
          onClose={() => setSelectedBook(null)}
        >
          <div className="modal-content popular-book-dialog-content shadow-lg rounded-4">
            <div className="modal-header px-4 pt-4 pb-3">
              <div className="flex-grow-1">
                <h2 id="popular-book-dialog-title" className="modal-title fs-5 fw-bold text-truncate">{selectedBook.title}</h2>
                <p className="text-muted small mb-0">{selectedBook.author}</p>
              </div>
              <button
                className="btn-close ms-3"
                type="button"
                aria-label="Fechar comentários"
                ref={closeButtonRef}
                onClick={() => dialogRef.current?.close()}
              />
            </div>
            <div className="modal-body px-4 pt-0 pb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 rounded-3 bg-white border p-3 mb-4">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <RatingStars rating={selectedBook.rating} />
                    <span className="fw-bold">{selectedBook.rating.toLocaleString('pt-BR')}</span>
                  </div>
                  <span className="text-muted small">{selectedBook.ratingCount} avaliações</span>
                </div>
                <span className="badge rounded-pill bg-white text-dark border px-3 py-2">{selectedBook.requests} empréstimos</span>
              </div>

              <h3 className="h6 fw-bold mb-1">Principais comentários</h3>
              <p className="text-muted small mb-2">Comentários dos leitores sobre este livro.</p>
              <div aria-label={`Comentários de ${selectedBook.title}`}>
                {selectedBook.comments.map((comment) => (
                  <article className="border-top py-3" key={`${comment.author}-${comment.date}`}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                      <strong className="small">{comment.author}</strong>
                      <span className="d-inline-flex align-items-center gap-2">
                        <RatingStars rating={comment.rating} />
                        <time className="text-muted small" dateTime={comment.date.split('/').reverse().join('-')}>{comment.date}</time>
                      </span>
                    </div>
                    <p className="mb-0 text-secondary">{comment.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default AdminBiblioteca;
