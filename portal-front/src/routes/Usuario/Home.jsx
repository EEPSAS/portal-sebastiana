import { Link } from "react-router";

const highlights = [
	{ label: "Atividades pendentes", value: "3", icon: "bi-list-check" },
	{ label: "Frequência", value: "88%", icon: "bi-person-check" },
	{ label: "Média geral", value: "8,4", icon: "bi-graph-up-arrow" },
];

const Home = () => (
	<section className="container-fluid p-4 bg-light min-vh-100">
		<div className="mb-4">
			<span className="text-secondary small">Olá, Yasmin Teixeira!</span>
			<h1 className="h3 text-primary fw-bold mt-1 mb-2">Bem-vinda ao seu ambiente virtual</h1>
			<p className="text-secondary mb-0">Acompanhe seus cursos, atividades e seu progresso.</p>
		</div>

		<div className="row g-4 mb-4">
			{highlights.map((highlight) => (
				<div className="col-md-4" key={highlight.label}>
					<article className="bg-white rounded-4 shadow-sm p-4 h-100">
						<i className={`${highlight.icon} text-primary fs-3`} aria-hidden="true" />
						<p className="text-secondary small mt-3 mb-1">{highlight.label}</p>
						<strong className="text-dark fs-3">{highlight.value}</strong>
					</article>
				</div>
			))}
		</div>

		<div className="row g-4">
			<div className="col-lg-8">
				<article className="bg-white rounded-4 shadow-sm p-4 h-100">
					<div className="d-flex justify-content-between align-items-center mb-3">
						<h2 className="h5 text-primary fw-bold mb-0">Atividades recentes</h2>
						<Link to="/dashboard/agenda" className="text-danger text-decoration-none small fw-semibold">Ver agenda</Link>
					</div>
					<div className="list-group list-group-flush">
						<div className="list-group-item px-0 d-flex justify-content-between">
							<span><i className="bi bi-file-earmark-text text-primary me-2" />Novo material disponível</span>
							<small className="text-muted">2h atrás</small>
						</div>
						<div className="list-group-item px-0 d-flex justify-content-between">
							<span><i className="bi bi-check-circle text-success me-2" />Atividade entregue com sucesso</span>
							<small className="text-muted">1 dia atrás</small>
						</div>
						<div className="list-group-item px-0 d-flex justify-content-between">
							<span><i className="bi bi-camera-video text-primary me-2" />PodCast atualizado</span>
							<small className="text-muted">2 dias atrás</small>
						</div>
					</div>
				</article>
			</div>
			<div className="col-lg-4">
				<article className="bg-white rounded-4 shadow-sm p-4 h-100">
					<h2 className="h5 text-primary fw-bold mb-3">Próximo compromisso</h2>
					<p className="text-danger fw-bold mb-1">22 MAI · 07:00</p>
					<h3 className="h6 text-dark">Entrega de Trabalho</h3>
					<p className="text-secondary small">Análise de Dados</p>
					<Link to="/dashboard/calendario" className="btn btn-outline-primary btn-sm rounded-pill">Abrir calendário</Link>
				</article>
			</div>
		</div>
	</section>
);

export default Home;
