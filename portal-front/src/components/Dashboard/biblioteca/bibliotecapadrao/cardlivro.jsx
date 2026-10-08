export default function CardLivro({ livro, onEditar, onExcluir, onVerDetalhes }) {
  const disponivel = livro.status === 'Disponível';

  return (
    <div className="col-12 col-sm-6 col-md-4 col-xl-3">
      <div 
        className="card h-100 border-0 shadow-sm"
        style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff', border: '1px solid #f1f3f5' }}
      >
        {/* Capa do Livro */}
        <div 
          style={{ 
            height: '150px', 
            backgroundColor: livro.corCapa || '#f8f9fa', 
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {livro.imagem ? (
            <img 
              src={livro.imagem} 
              alt={livro.titulo} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', color: livro.corIcone || '#3b82f6' }}>
              📖
            </div>
          )}

          {/* Destaque de Nota / Avaliação no Acervo */}
          <div 
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            ★ <span>{livro.nota || '4.5'}</span>
          </div>
        </div>

        {/* Informações */}
        <div className="card-body d-flex flex-column p-3">
          <h5 className="card-title fw-bold mb-1 text-truncate" style={{ fontSize: '15px', color: '#1e293b' }} title={livro.titulo}>
            {livro.titulo}
          </h5>
          <p className="card-text text-muted mb-2 text-truncate" style={{ fontSize: '12px' }}>
            {livro.autor}
          </p>

          {livro.comentarios?.length > 0 && (
            <p className="text-secondary mb-2" style={{ fontSize: '11px' }}>
              “{livro.comentarios[0].texto}”
            </p>
          )}

          <button 
            type="button"
            onClick={() => onVerDetalhes(livro)}
            className="btn btn-link p-0 text-start text-decoration-none fw-semibold mb-3"
            style={{ color: '#2563eb', fontSize: '11px' }}
          >
            Ver {livro.comentarios?.length ?? 0} comentário(s) 💬
          </button>

          <div className="mt-auto">
            {disponivel ? (
              <div 
                className="text-center py-1 mb-3 rounded-pill fw-semibold"
                style={{ backgroundColor: '#d1fae5', color: '#065f46', fontSize: '11px' }}
              >
                Disponível
              </div>
            ) : (
              <div className="mb-3 text-center">
                <div 
                  className="py-1 rounded-pill fw-semibold"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px' }}
                >
                  Emprestado
                </div>
                {livro.aluno && (
                  <span className="text-muted d-block mt-1 text-truncate" style={{ fontSize: '10px' }}>
                    {livro.aluno}
                  </span>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="d-flex gap-2">
              <button 
                type="button"
                onClick={() => onEditar(livro)}
                className="btn btn-sm w-50 rounded-pill"
                style={{ border: '1px solid #3b82f6', color: '#2563eb', fontSize: '12px', fontWeight: '500' }}
              >
                Editar
              </button>
              <button 
                type="button"
                onClick={() => onExcluir(livro.id)}
                className="btn btn-sm w-50 rounded-pill"
                style={{ border: '1px solid #f43f5e', color: '#e11d48', fontSize: '12px', fontWeight: '500' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}