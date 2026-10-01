const SmallNewsCard = ({ noticia, loading }) => (
	<a className="noticias-card-link" href={`/noticia/${noticia?.id || '#'}`} target="_blank" rel="noreferrer">
		<article className="noticias-card h-100 rounded-4 bg-white p-3 shadow-sm">
			{loading ? (
				<div className="d-flex align-items-center justify-content-center bg-light rounded-3 w-100" style={{ height: "140px" }}>
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Carregando...</span>
					</div>
				</div>
			) : (
				<img className="img-fluid w-100 rounded-3" src={noticia?.miniatura} alt="" />
			)}
			<h3 className="h5 text-secondary mt-3 mb-0">{noticia?.titulo || "Notícia"}</h3>
		</article>
	</a>
);

export default SmallNewsCard;
