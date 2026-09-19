const HorizontalNewsCard = ({ noticia }) => (
	<a className="noticias-card-link" href={`/noticia/${noticia.id}`} target="_blank" rel="noreferrer">
		<article className="noticias-card rounded-4 bg-white p-3 shadow-sm">
			<div className="row h-100 align-items-center g-3">
				<div className="col-12 col-md-7">
					<img className="img-fluid w-100 rounded-3" src={noticia.miniatura} alt="" />
				</div>
				<div className="col-12 col-md-5">
					<h3 className="h2 text-secondary">{noticia.titulo}</h3>
					<p className="mb-0">{noticia.descricao}</p>
				</div>
			</div>
		</article>
	</a>
);

export default HorizontalNewsCard;

