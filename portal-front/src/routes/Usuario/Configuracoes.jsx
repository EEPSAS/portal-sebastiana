const tasks = [
  { title: "Revisar material de matemática", date: "Hoje, 18:00", status: "Pendente" },
  { title: "Enviar trabalho de história", date: "Amanhã, 12:00", status: "Em andamento" },
  { title: "Ler capítulo 4 de biologia", date: "24 de maio", status: "Concluído" },
];

const statusClass = {
  Pendente: "text-danger bg-danger-subtle",
  "Em andamento": "text-warning bg-warning-subtle",
  Concluído: "text-success bg-success-subtle",
};

const Configuracoes = () => (
  <section className="container-fluid p-4 bg-light min-vh-100">
    <div className="mb-4">
      <span className="text-secondary small">Conta e preferências</span>
      <h1 className="h3 text-primary fw-bold mt-1 mb-2">Configurações</h1>
      <p className="text-secondary mb-0">Personalize seu perfil e organize sua rotina de estudos.</p>
    </div>

    <div className="row g-4">
      <div className="col-xl-5">
        <article className="bg-white rounded-4 shadow-sm p-4 h-100">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="h5 text-primary fw-bold mb-1">Meu perfil</h2>
              <p className="text-secondary small mb-0">Atualize seus dados pessoais</p>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill">
              <i className="bi bi-pencil me-1" /> Editar
            </button>
          </div>

          <div className="d-flex align-items-center gap-3 mb-4">
            <img className="settings-profile-avatar rounded-circle" src="https://placehold.co/120x120/fde7f0/9d174d?text=YG" alt="Avatar de Yasmim Gomes" />
            <div>
              <h3 className="h5 text-dark mb-1">Yasmin Teixeira</h3>
              <p className="text-secondary small mb-0">Estudante · 3º ano</p>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-sm-6">
              <label className="form-label text-secondary small fw-semibold">Nome completo</label>
              <input className="form-control bg-light border-0" value="Yasmim Gomes" readOnly />
            </div>
            <div className="col-sm-6">
              <label className="form-label text-secondary small fw-semibold">E-mail</label>
              <input className="form-control bg-light border-0" value="yasmim@email.com" readOnly />
            </div>
          </div>
        </article>
      </div>

      <div className="col-xl-7">
        <article className="bg-white rounded-4 shadow-sm p-4 h-100">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="h5 text-primary fw-bold mb-1">Meus afazeres</h2>
              <p className="text-secondary small mb-0">Organize as tarefas da sua semana</p>
            </div>
            <button type="button" className="btn btn-danger rounded-pill">
              <i className="bi bi-plus-lg me-1" /> Novo afazer
            </button>
          </div>

          <div className="d-flex flex-column">
            {tasks.map((task) => (
              <div className="settings-task-row d-flex align-items-center gap-3 py-3" key={task.title}>
                <input className="form-check-input mt-0" type="checkbox" aria-label={`Concluir ${task.title}`} />
                <div className="flex-grow-1">
                  <h3 className="h6 text-dark mb-1">{task.title}</h3>
                  <small className="text-secondary"><i className="bi bi-clock me-1" />{task.date}</small>
                </div>
                <span className={`badge rounded-pill px-3 py-2 ${statusClass[task.status]}`}>{task.status}</span>
                <button type="button" className="btn btn-sm btn-light text-secondary" aria-label={`Mais opções para ${task.title}`}>
                  <i className="bi bi-three-dots-vertical" />
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="col-12">
        <article className="bg-white rounded-4 shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h5 text-primary fw-bold mb-1">Aparência</h2>
              <p className="text-secondary small mb-0">Escolha como o portal deve aparecer para você.</p>
            </div>
            <div className="form-check form-switch mb-0">
              <input className="form-check-input settings-toggle" type="checkbox" role="switch" id="dark-mode" />
              <label className="form-check-label ms-2 fw-semibold text-dark" htmlFor="dark-mode">Modo escuro</label>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
);

export default Configuracoes;