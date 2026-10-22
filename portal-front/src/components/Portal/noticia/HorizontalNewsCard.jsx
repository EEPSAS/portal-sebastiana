import { Link } from 'react-router';

/**
 * HorizontalNewsCard.jsx - Card Principal da Notícia em Destaque
 *
 * Papel Didático:
 * Renderiza a matéria principal em formato horizontal amplo. Trata os estados
 * de carregamento (skeleton com spinner) e vazio (quando não há destaque cadastrado).
 */
const HorizontalNewsCard = ({ noticia, loading }) => {
	// Se terminou de carregar e não há notícia de destaque cadastrada
	if (!loading && !noticia) {
		return (
			<article className="noticias-card rounded-4 bg-white p-4 shadow-sm d-flex flex-column align-items-center justify-content-center text-center text-muted py-5">
				<div className="mb-3">
					<i className="bi bi-newspaper fs-1 text-secondary opacity-50" aria-hidden="true" />
				</div>
				<h3 className="h4 text-secondary mb-2">Sem notícia de destaque</h3>
				<p className="mb-0 text-muted">Ainda não há notícias cadastradas no portal da EEPSAS.</p>
			</article>
		);
	}

	// Nos cards do Portal, a Miniatura é a imagem principal de exibição (com fallback para a capa se miniatura não foi enviada)
	const imagemCard =
		noticia?.url_miniatura || noticia?.miniatura || noticia?.url_foto || noticia?.imagem;

	return (
		<Link
			className="noticias-card-link"
			to={noticia?.id ? `/noticia/${noticia.id}` : '#!'}
			target="_self"
		>
			<article className="noticias-card rounded-4 bg-white p-3 shadow-sm">
				<div className="row h-100 align-items-center g-3">
					<div className="col-12 col-md-7">
						{loading ? (
							<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 noticias-card__skeleton--horizontal">
								<div className="spinner-border text-primary" role="status">
									<span className="visually-hidden">Carregando...</span>
								</div>
							</div>
						) : imagemCard ? (
							<img
								className="img-fluid w-100 rounded-3 shadow-sm"
								style={{ maxHeight: '280px', objectFit: 'cover' }}
								src={imagemCard}
								alt={noticia?.titulo || ''}
								onError={(e) => {
									e.currentTarget.style.display = 'none';
								}}
							/>
						) : (
							<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 py-5 text-muted">
								<i className="bi bi-image fs-1 opacity-50"></i>
							</div>
						)}
					</div>
					<div className="col-12 col-md-5">
						<h3 className="h2 text-secondary">{loading ? 'Carregando destaque...' : noticia?.titulo}</h3>
						<p className="mb-0">{loading ? 'Buscando informações atualizadas do portal...' : noticia?.descricao}</p>
					</div>
				</div>
			</article>
		</Link>
	);
};

export default HorizontalNewsCard;

