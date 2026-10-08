import { useState } from 'react';

// Subcomponente SVG do Círculo de Progresso Dinâmico
function CircularProgress({ porcentagem }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (porcentagem / 100) * circumference;

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center">
      <svg width="100" height="100" viewBox="0 0 44 44">
        {/* Círculo de Fundo (Translúcido) */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="4"
        />
        {/* Círculo de Preenchimento da Porcentagem */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.5s ease-in-out'
          }}
        />
      </svg>
    </div>
  );
}

export default function StudentStatCard({
  titulo,
  valor,
  subtitulo,
  bgColor,
  porcentagemProgress,
  icone,
  isEditable = false,
  bookDetails,
  onSave
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [bookForm, setBookForm] = useState({});
  const [saveError, setSaveError] = useState('');

  const handleOpenEditor = () => {
    setBookForm({
      livro: bookDetails?.livro ?? valor ?? '',
      autor: bookDetails?.autor ?? '',
      genero: bookDetails?.genero ?? '',
      editora: bookDetails?.editora ?? '',
      pagina: String(bookDetails?.pagina ?? '').match(/\d+/)?.[0] ?? '',
      dataLancamento: bookDetails?.dataLancamento ?? ''
    });
    setSaveError('');
    setIsEditing(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaveError('');

    try {
      await onSave?.({ ...bookForm, pagina: `Pág. ${bookForm.pagina}` });
      setIsEditing(false);
    } catch {
      setSaveError('Não foi possível salvar as alterações. Tente novamente.');
    }
  };

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="card h-100 border-0 shadow-sm rounded-4 text-white"
        style={{
          backgroundColor: bgColor,
          minHeight: '158px',
          height: '158px',
          padding: '0.8rem 0.85rem'
        }}
      >
        <div className="d-flex align-items-center gap-2 h-100">
          
          {/* Renderiza Círculo de Progresso se houver porcentagem definida */}
          {porcentagemProgress !== undefined && (
            <CircularProgress porcentagem={porcentagemProgress} />
          )}

          {/* Renderiza Ícone customizado (se fornecido) */}
          {icone && porcentagemProgress === undefined && (
            <div className="d-flex align-items-center justify-content-center flex-shrink-0 text-white">
              {icone}
            </div>
          )}

          {/* Conteúdo Principal do Card */}
          <div className="d-flex flex-column w-100 overflow-hidden" style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center justify-content-between">
            <span
              className="fw-semibold text-white"
              style={{
                minWidth: 0,
                fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
                lineHeight: 1.2,
                overflowWrap: 'break-word',
              }}
            >
                {titulo}
              </span>

              {/* Botão de Edição para o Card "Leitura Atual" */}
              {isEditable && !isEditing && (
                <button
                  onClick={handleOpenEditor}
                  className="btn btn-link text-white-50 p-0 ms-1 border-0"
                  title="Editar leitura"
                  aria-label="Editar livro"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Valor (Modo Edição vs Modo Visualização) */}
            <span className="fw-bold text-white" style={{ fontSize: 'clamp(1.6rem, 2.3vw, 2.8rem)', lineHeight: 1.05, overflowWrap: 'break-word' }}>
              {valor || '—'}
            </span>

            {/* Subtítulo / Legenda */}
            {subtitulo && (
              <span className="fw-normal text-white mt-1" style={{ fontSize: 'clamp(0.8rem, 0.9vw, 0.95rem)', lineHeight: 1.2, overflowWrap: 'break-word', opacity: 0.9 }}>
                {subtitulo}
              </span>
            )}
          </div>

        </div>
      </div>

      {isEditing && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)', zIndex: 1050, padding: '1rem' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsEditing(false);
          }}
        >
          <div
            className="bg-white rounded-3 shadow-lg text-dark w-100"
            style={{ maxWidth: '760px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-book-title"
          >
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
              <h2 id="edit-book-title" className="fs-5 fw-bold mb-0">Editar livro</h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar"
                onClick={() => setIsEditing(false)}
              />
            </div>

            <form onSubmit={handleSave}>
              <div className="p-4">
                <div className="mb-3">
                  <label htmlFor="book-title" className="form-label small fw-semibold">
                    Título <span className="text-danger">*</span>
                  </label>
                  <input
                    id="book-title"
                    className="form-control"
                    value={bookForm.livro}
                    onChange={(event) => setBookForm({ ...bookForm, livro: event.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="book-author" className="form-label small fw-semibold">
                    Autor <span className="text-danger">*</span>
                  </label>
                  <input
                    id="book-author"
                    className="form-control"
                    value={bookForm.autor}
                    onChange={(event) => setBookForm({ ...bookForm, autor: event.target.value })}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="book-genre" className="form-label small fw-semibold">
                      Gênero <span className="text-danger">*</span>
                    </label>
                    <input
                      id="book-genre"
                      className="form-control"
                      value={bookForm.genero}
                      onChange={(event) => setBookForm({ ...bookForm, genero: event.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="book-publisher" className="form-label small fw-semibold">
                      Editora <span className="text-danger">*</span>
                    </label>
                    <input
                      id="book-publisher"
                      className="form-control"
                      value={bookForm.editora}
                      onChange={(event) => setBookForm({ ...bookForm, editora: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-1">
                  <div className="col-12 col-md-6">
                    <label htmlFor="book-current-page" className="form-label small fw-semibold">
                      Página Atual <span className="text-danger">*</span>
                    </label>
                    <input
                      id="book-current-page"
                      type="number"
                      min="0"
                      className="form-control"
                      value={bookForm.pagina}
                      onChange={(event) => setBookForm({ ...bookForm, pagina: event.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="book-release-date" className="form-label small fw-semibold">
                      Data de lançamento <span className="text-danger">*</span>
                    </label>
                    <input
                      id="book-release-date"
                      type="date"
                      className="form-control"
                      value={bookForm.dataLancamento}
                      onChange={(event) => setBookForm({ ...bookForm, dataLancamento: event.target.value })}
                      required
                    />
                  </div>
                </div>

                {saveError && <div className="alert alert-danger mt-3 mb-0" role="alert">{saveError}</div>}
              </div>

              <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-dark">
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}