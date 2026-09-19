const VerticalNewsCard = ({ noticia }) => (
	<a className="noticias-card-link" href={`/noticia/${noticia.id}`} target="_blank" rel="noreferrer">
		<article className="noticias-card h-100 rounded-4 bg-white p-3 shadow-sm">
			<img className="img-fluid w-100 rounded-3" src={noticia.miniatura} alt="" />
			<h3 className="h4 text-secondary mt-3">{noticia.titulo}</h3>
			<p className="mb-0">{noticia.descricao}</p>
		</article>
	</a>
);

export default VerticalNewsCard;
