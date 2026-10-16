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

	return (
		<a className="noticias-card-link" href={noticia?.id ? `/noticia/${noticia.id}` : '#!'} target={noticia?.id ? '_blank' : '_self'} rel="noreferrer">
			<article className="noticias-card rounded-4 bg-white p-3 shadow-sm">
				<div className="row h-100 align-items-center g-3">
					<div className="col-12 col-md-7">
						{loading ? (
							<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100 noticias-card__skeleton--horizontal">
								<div className="spinner-border text-primary" role="status">
									<span className="visually-hidden">Carregando...</span>
								</div>
							</div>
						) : (
							<img className="img-fluid w-100 rounded-3" src={noticia?.miniatura} alt={noticia?.titulo || ''} />
						)}
					</div>
					<div className="col-12 col-md-5">
						<h3 className="h2 text-secondary">{noticia?.titulo || "Notícia Destaque"}</h3>
						<p className="mb-0">{noticia?.descricao || "Carregando descrição..."}</p>
					</div>
				</div>
			</article>
		</a>
	);
};

export default HorizontalNewsCard;
