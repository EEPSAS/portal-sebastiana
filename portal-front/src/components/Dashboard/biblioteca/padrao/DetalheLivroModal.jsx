import { useState } from 'react';

const DetalheLivroModal = ({ livro, aberto, onClose, onAddComment }) => {
  const [texto, setTexto] = useState('');
  const [nota, setNota] = useState('');

  if (!aberto || !livro) return null;

  const enviarComentario = (event) => {
    event.preventDefault();
    const comentario = texto.trim();
    if (!comentario) return;

    onAddComment({
      nome: 'Você',
      texto: comentario,
      nota: nota ? Number(nota) : null,
      data: new Intl.DateTimeFormat('pt-BR').format(new Date())
    });
    setTexto('');
    setNota('');
  };

  const comentarios = livro.comentarios ?? [];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050
      }}
      onClick={onClose}
      role="presentation"
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '520px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhe-livro-titulo"
      >
        <button 
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: 'none',
            background: 'transparent',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          ✕
        </button>

        <h3 id="detalhe-livro-titulo" className="fw-bold mb-1" style={{ fontSize: '20px', color: '#0f172a' }}>
          {livro.titulo}
        </h3>
        <p className="text-muted mb-3" style={{ fontSize: '13px' }}>
          {livro.autor}
        </p>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center gap-1 text-warning" style={{ fontSize: '16px' }}>
              <span>★★★★★</span>
              <span className="fw-bold text-dark ms-1" style={{ fontSize: '14px' }}>{livro.nota || '4.7'}</span>
            </div>
            <small className="text-muted" style={{ fontSize: '12px' }}>
              {livro.avaliacoes || '27'} avaliações
            </small>
          </div>

          <span 
            className="px-3 py-1 rounded-pill"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '500', color: '#334155' }}
          >
            {livro.emprestimos || '41'} empréstimos
          </span>
        </div>

        <h5 className="fw-bold mb-1" style={{ fontSize: '14px', color: '#0f172a' }}>
          Principais comentários
        </h5>
        <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
          Comentários dos leitores sobre este livro.
        </p>

        <div className="d-flex flex-column gap-3 mb-3" style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {comentarios.length === 0 ? (
            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Ainda não há comentários para este livro.</p>
          ) : comentarios.map((comentario, index) => (
            <div className="border-bottom pb-2" key={`${livro.id}-${index}`}>
              <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{comentario.nome}</strong>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  {comentario.nota ? (
                    <span className="text-warning" style={{ fontSize: '12px' }}>
                      {'★'.repeat(comentario.nota)}{'☆'.repeat(5 - comentario.nota)}
                    </span>
                  ) : null}
                  <span className="text-muted" style={{ fontSize: '11px' }}>{comentario.data}</span>
                </div>
              </div>
              <p className="text-secondary mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                {comentario.texto}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={enviarComentario}>
          <label htmlFor="novo-comentario" className="form-label fw-semibold mb-1" style={{ fontSize: '12px' }}>
            Escreva um comentário
          </label>
          <textarea
            id="novo-comentario"
            className="form-control form-control-sm mb-2"
            rows="3"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            maxLength={500}
            placeholder="O que você achou deste livro?"
            required
          />
          <div className="d-flex justify-content-between align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: '180px' }}
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              aria-label="Nota opcional"
            >
              <option value="">Sem nota</option>
              {[5, 4, 3, 2, 1].map((valor) => (
                <option key={valor} value={valor}>{valor} estrela{valor !== 1 ? 's' : ''}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-sm text-white fw-semibold" style={{ backgroundColor: '#e6007e' }}>
              Enviar comentário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DetalheLivroModal;