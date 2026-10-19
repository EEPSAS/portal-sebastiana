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

	// Renderiza o card com notícia ou esqueleto, ocupando toda a extensão da coluna
	return (
		<a className="noticias-card-link d-flex flex-column flex-grow-1 h-100 w-100" href={noticia?.id ? `/noticia/${noticia.id}` : '#!'} target={noticia?.id ? '_blank' : '_self'} rel="noreferrer">
			<article className="noticias-card h-100 rounded-4 bg-white p-3 shadow-sm d-flex flex-column flex-grow-1">
				{loading ? (
					<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 flex-grow-1 noticias-card__skeleton--vertical" style={{ minHeight: '220px' }}>
						<div className="spinner-border text-primary" role="status">
							<span className="visually-hidden">Carregando...</span>
						</div>
					</div>
				) : (
					<div className="vertical-card-img-wrapper rounded-3 overflow-hidden flex-grow-1 mb-3" style={{ minHeight: '220px' }}>
						<img className="img-fluid w-100 h-100 rounded-3 object-fit-cover" src={noticia?.miniatura} alt={noticia?.titulo || ''} />
					</div>
				)}
				<div className="vertical-card-content mt-auto">
					<h3 className="h4 text-secondary mb-2">{loading ? 'Carregando...' : noticia?.titulo}</h3>
					<p className="mb-0 text-muted">{loading ? 'Aguarde...' : noticia?.descricao}</p>
				</div>
			</article>
		</a>
	);
};

export default VerticalNewsCard;

