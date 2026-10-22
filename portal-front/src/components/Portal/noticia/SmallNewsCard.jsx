import { Link } from 'react-router';

/**
 * SmallNewsCard.jsx - Card Compacto de Notícia da Grade Secundária
 *
 * Papel Didático:
 * Exibe miniatura e título das notícias secundárias na grade de 3 colunas da Home.
 */
const SmallNewsCard = ({ noticia, loading }) => {
	// Se terminou de carregar e não há notícia cadastrada para este slot,
	// exibe card vazio centralizado preenchendo a altura completa da grade
	if (!loading && !noticia) {
		return (
			<article className="noticias-card h-100 flex-grow-1 w-100 rounded-4 bg-white p-3 shadow-sm d-flex flex-column justify-content-center text-center text-muted py-4">
				<div className="mb-2">
					<i className="bi bi-newspaper fs-1 text-secondary opacity-50" aria-hidden="true" />
				</div>
				<h3 className="h6 text-secondary mb-1">Sem notícia disponível</h3>
				<p className="small mb-0 text-muted">Em breve novas publicações da EEPSAS.</p>
			</article>
		);
	}

	const imagemMiniatura =
		noticia?.url_miniatura || noticia?.miniatura || noticia?.url_foto || noticia?.imagem;

	// Renderiza o card menor garantindo altura uniforme (flex-grow-1) com os demais cards
	return (
		<Link
			className="noticias-card-link d-flex flex-column flex-grow-1 h-100 w-100"
			to={noticia?.id ? `/noticia/${noticia.id}` : '#!'}
			target="_self"
		>
			<article className="noticias-card h-100 flex-grow-1 rounded-4 bg-white p-3 shadow-sm d-flex flex-column">
				{loading ? (
					<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 noticias-card__skeleton--small">
						<div className="spinner-border text-primary" role="status">
							<span className="visually-hidden">Carregando...</span>
						</div>
					</div>
				) : imagemMiniatura ? (
					<img
						className="img-fluid w-100 rounded-3 shadow-sm"
						style={{ height: '140px', objectFit: 'cover' }}
						src={imagemMiniatura}
						alt={noticia?.titulo || ''}
						onError={(e) => {
							e.currentTarget.style.display = 'none';
						}}
					/>
				) : (
					<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 py-4 text-muted">
						<i className="bi bi-image fs-3 opacity-50"></i>
					</div>
				)}
				<h3 className="h5 text-secondary mt-3 mb-0">{loading ? 'Carregando...' : noticia?.titulo}</h3>
			</article>
		</Link>
	);
};

export default SmallNewsCard;

