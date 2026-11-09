import { Link } from 'react-router';

/**
 * VerticalNewsCard.jsx - Card Lateral Vertical de Notícia
 *
 * Papel Didático:
 * Ocupa a coluna lateral direita da seção de notícias na Home, mantendo
 * altura total alinhada à coluna principal por meio de classes Flexbox (`flex-grow-1`).
 */
const VerticalNewsCard = ({ noticia, loading }) => {
	// Se terminou de carregar e não há notícia cadastrada para a coluna vertical,
	// renderiza o card vazio preenchendo 100% da coluna vertical (flex-grow-1) com conteúdo centralizado
	if (!loading && !noticia) {
		return (
			<article className="noticias-card h-100 flex-grow-1 w-100 rounded-4 bg-white p-3 shadow-sm d-flex flex-column justify-content-center text-center text-muted py-5">
				<div className="mb-3">
					<i className="bi bi-newspaper fs-1 text-secondary opacity-50" aria-hidden="true" />
				</div>
				<h3 className="h5 text-secondary mb-2">Sem notícia disponível</h3>
				<p className="small mb-0 text-muted">Em breve novas publicações da EEPSAS.</p>
			</article>
		);
	}

	const imagemMiniatura =
		noticia?.url_miniatura || noticia?.miniatura || noticia?.url_foto || noticia?.imagem;

	// Renderiza o card com notícia ou esqueleto, ocupando toda a extensão da coluna
	return (
		<Link
			className="noticias-card-link d-flex flex-column flex-grow-1 h-100 w-100"
			to={noticia?.id ? `/noticia/${noticia.id}` : '#!'}
			target="_self"
		>
			<article className="noticias-card h-100 rounded-4 bg-white p-3 shadow-sm d-flex flex-column flex-grow-1">
				{loading ? (
					<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 flex-grow-1 noticias-card__skeleton--vertical" style={{ minHeight: '220px' }}>
						<div className="spinner-border text-primary" role="status">
							<span className="visually-hidden">Carregando...</span>
						</div>
					</div>
				) : imagemMiniatura ? (
					<div className="vertical-card-img-wrapper rounded-3 overflow-hidden flex-grow-1 mb-3 position-relative bg-light d-flex align-items-center justify-content-center" style={{ minHeight: '220px' }}>
						<img
							className="img-fluid w-100 h-100 rounded-3 object-fit-cover shadow-sm"
							src={imagemMiniatura}
							alt={noticia?.titulo || ''}
							onError={(e) => {
								e.currentTarget.style.display = 'none';
								if (e.currentTarget.nextElementSibling) {
									e.currentTarget.nextElementSibling.style.display = 'flex';
								}
							}}
						/>
						<div className="align-items-center justify-content-center text-muted py-5 w-100 h-100" style={{ display: 'none' }}>
							<i className="bi bi-image fs-1 opacity-50"></i>
						</div>
					</div>
				) : (
					<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 flex-grow-1 mb-3 py-5 text-muted" style={{ minHeight: '220px' }}>
						<i className="bi bi-image fs-1 opacity-50"></i>
					</div>
				)}
				<div className="vertical-card-content mt-auto">
					{!loading && noticia?.categoria && (
						<span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-1 mb-2 fw-semibold d-inline-block" style={{ fontSize: '0.75rem' }}>
							{noticia.categoria}
						</span>
					)}
					<h3 className="h4 text-secondary mb-2">{loading ? 'Carregando...' : noticia?.titulo}</h3>
					<p className="mb-0 text-muted">{loading ? 'Aguarde...' : noticia?.descricao}</p>
				</div>
			</article>
		</Link>
	);
};

export default VerticalNewsCard;

