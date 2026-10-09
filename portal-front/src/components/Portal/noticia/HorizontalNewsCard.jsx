const HorizontalNewsCard = ({ noticia, loading }) => (
	<a className="noticias-card-link" href={`/noticia/${noticia?.id || '#'}`} target="_blank" rel="noreferrer">
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
						<img className="img-fluid w-100 rounded-3" src={noticia?.miniatura} alt="" />
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

export default HorizontalNewsCard;
