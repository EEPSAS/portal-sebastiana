/**
 * Agenda.jsx - Página de Calendário, Sábados Letivos, Feriados e Horário Escolar (Módulo 4)
 *
 * Papel Didático:
 * Atua como o Container Inteligente (Smart Component) da rota `/dashboard/agenda`:
 * 1. Conecta o estado de autenticação (`useAuth`) para separar criação pessoal de gestão institucional;
 * 2. Sincroniza a navegação interna por abas (`?tab=calendario|sabados|feriados|horarios`) com o menu Aside;
 * 3. Orquestra o ciclo completo de CRUD através do hook oficial `useEventos`;
 * 4. Monta o componente unificado `<Calendario />`, visões filtradas de Sábados Letivos e Feriados,
 *    e a grade de `<HorariosEscolares />`.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { useEventos } from '../../hooks/useEventos';
import Calendario from '../../components/Portal/calendario/Calendario';
import CadastroEventoModal from '../../components/Portal/calendario/CadastroEventoModal';
import HorariosEscolares from '../../components/Dashboard/agenda/HorariosEscolares';
import { createImportantDates } from '../../utils/agendaUtils';
import '../../pages/Portal/portal.css';

const ABAS_AGENDA = [
  { id: 'calendario', label: 'Calendário', icon: 'bi-calendar3' },
  { id: 'sabados', label: 'Sábados Letivos', icon: 'bi-calendar2-check' },
  { id: 'feriados', label: 'Feriados e Recessos', icon: 'bi-calendar2-heart' },
  { id: 'horarios', label: 'Horário Escolar', icon: 'bi-clock-history' },
];

const feriadosNacionais = createImportantDates();

const AgendaPage = () => {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const podeGerenciar = ['especialista', 'adm', 'admin'].includes(role);
  // Qualquer usuário autenticado pode criar eventos na própria agenda.
  const podeCriarEvento = Boolean(user?.id);

  // Sincronização de aba via URL (?tab=...) para integração direta com o Aside
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const abaAtiva = ABAS_AGENDA.some((aba) => aba.id === tabParam)
    ? tabParam
    : 'calendario';

  const handleSelecionarAba = (idAba) => {
    setSearchParams({ tab: idAba });
  };

  // Hook central de leitura e mutação na API /api/eventos
  const {
    eventos,
    loading,
    error,
    create,
    update,
    remove,
    saving,
    mutationError,
    clearMutationError,
    refresh,
  } = useEventos({ publico: false });

  // Estados locais do diálogo modal e notificações
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notificacao, setNotificacao] = useState(null);

  const exibirNotificacao = (mensagem) => {
    setNotificacao(mensagem);
    setTimeout(() => setNotificacao(null), 4000);
  };

  const handleOpenCreate = () => {
    clearMutationError();
    setSelectedEvent(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    clearMutationError();
    setSelectedEvent(event);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSave = async (eventData) => {
    if (modalMode === 'edit') {
      const result = await update(eventData);
      if (result.success) {
        setModalOpen(false);
        exibirNotificacao('Evento atualizado com sucesso!');
      }
    } else {
      const result = await create(eventData);
      if (result.success) {
        setModalOpen(false);
        exibirNotificacao('Evento criado com sucesso!');
      }
    }
  };

  const handleDelete = async (event) => {
    const confirmou = window.confirm(`Deseja realmente excluir o evento "${event.title}"?`);
    if (!confirmou) return;

    const result = await remove(event.id);
    if (result.success) {
      exibirNotificacao('Evento excluído com sucesso.');
    } else {
      alert(result.error?.message || 'Não foi possível excluir o evento.');
    }
  };

  // Filtra eventos que caem em sábados ou possuem menção explícita a Sábado Letivo
  const sabadosLetivos = useMemo(() => {
    const lista = Array.isArray(eventos) ? eventos : [];
    return lista
      .filter((ev) => {
        if (!ev?.date) return false;
        const dataObj = new Date(`${ev.date}T00:00:00`);
        const ehSabado = dataObj.getDay() === 6;
        const mencionaSabado = String(ev.title || '')
          .toLowerCase()
          .includes('sábado') || String(ev.title || '').toLowerCase().includes('sabado');
        return ehSabado || mencionaSabado;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [eventos]);

  // Filtra feriados e recessos do ano atual (nacionais + cadastrados na API)
  const feriadosERecessos = useMemo(() => {
    const anoAtual = String(new Date().getFullYear());
    const daApi = (Array.isArray(eventos) ? eventos : []).filter(
      (ev) => ev?.category === 'feriados' || ev?.category === 'comemorativas'
    );
    const nacionaisAno = feriadosNacionais.filter((f) =>
      String(f.date || '').startsWith(anoAtual)
    );
    const mesclados = [...nacionaisAno, ...daApi];
    return mesclados.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [eventos]);

  return (
    <div className="position-relative">
      {/* Toast Flutuante de Confirmação */}
      {notificacao && (
        <div
          className="alert alert-success position-fixed top-0 end-0 m-3 shadow-sm py-2 px-3 small z-3"
          role="status"
        >
          ✓ {notificacao}
        </div>
      )}

      {/* Painel Central Branco com Cantos Arredondados */}
      <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
        {/* Subbarra Superior e Navegação Interna do Módulo Agenda */}
        <header className="mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom">
            <div>
              <h2 className="fw-bold mb-1 text-primary fs-4">Agenda Escolar</h2>
              <p className="text-muted mb-0 small">
                Planejamento de eventos institucionais, sábados letivos, feriados e horário escolar.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={refresh}
                disabled={loading}
                title="Atualizar eventos"
              >
                <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spinner-border spinner-border-sm' : ''}`}></i>
                Atualizar
              </button>

              {podeCriarEvento && abaAtiva !== 'horarios' && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                  onClick={handleOpenCreate}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Novo Evento
                </button>
              )}
            </div>
          </div>

          {/* Barra de Abas Internas sincronizada com o Aside */}
          <ul className="nav nav-pills gap-2 mt-3" role="tablist">
            {ABAS_AGENDA.map((aba) => {
              const ativa = abaAtiva === aba.id;
              return (
                <li className="nav-item" key={aba.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={ativa}
                    className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                      ativa ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleSelecionarAba(aba.id)}
                  >
                    <i className={`bi ${aba.icon} me-2`}></i>
                    {aba.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </header>

        {/* Aba 1: Calendário Completo */}
        {abaAtiva === 'calendario' && (
          <div className="portal-scope w-100">
            <Calendario
              showHero={false}
              publico={false}
              eventos={eventos}
              loading={loading}
              error={error}
              onEditEvent={podeGerenciar ? handleOpenEdit : null}
              onDeleteEvent={podeGerenciar ? handleDelete : null}
            />
          </div>
        )}

        {/* Aba 2: Sábados Letivos */}
        {abaAtiva === 'sabados' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-calendar2-check text-primary me-2"></i>
                Sábados Letivos Programados
              </h5>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                {sabadosLetivos.length} registro(s)
              </span>
            </div>

            {sabadosLetivos.length === 0 ? (
              <div className="alert alert-light border text-center py-4 mb-0">
                <p className="mb-1 fw-semibold">Nenhum sábado letivo cadastrado até o momento.</p>
                <small className="text-muted">
                  Utilize o botão &ldquo;Novo Evento&rdquo; selecionando uma data de sábado para registrar atividades letivas.
                </small>
              </div>
            ) : (
              <div className="row g-3">
                {sabadosLetivos.map((ev) => (
                  <div className="col-12 col-md-6 col-xl-4" key={ev.id}>
                    <div className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-primary rounded-pill">
                          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
                            new Date(`${ev.date}T00:00:00`)
                          )}
                        </span>
                        {podeGerenciar && (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => handleOpenEdit(ev)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(ev)}
                              title="Excluir"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      <h6 className="fw-bold mb-1">{ev.title}</h6>
                      {ev.description && (
                        <p className="text-muted small mb-0">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba 3: Feriados e Recessos */}
        {abaAtiva === 'feriados' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-calendar2-heart text-danger me-2"></i>
                Feriados Nacionais, Recessos e Datas Comemorativas
              </h5>
              <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
                {feriadosERecessos.length} data(s)
              </span>
            </div>

            <div
              className="dashboard-table-scroll border"
              tabIndex={0}
              role="region"
              aria-label="Tabela de feriados e recessos escolares"
            >
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Descrição</th>
                    <th scope="col">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {feriadosERecessos.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold text-nowrap">
                        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
                          new Date(`${item.date}T00:00:00`)
                        )}
                      </td>
                      <th scope="row" className="fw-semibold">
                        {item.title}
                      </th>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            item.category === 'feriados'
                              ? 'bg-danger-subtle text-danger'
                              : 'bg-info-subtle text-dark'
                          }`}
                        >
                          {item.category === 'feriados' ? 'Feriado / Recesso' : 'Data Comemorativa'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aba 4: Horário Escolar */}
        {abaAtiva === 'horarios' && <HorariosEscolares />}
      </div>

      {/* Diálogo Modal de Cadastro e Edição (Montado sob demanda) */}
      <CadastroEventoModal
        key={`${selectedEvent?.id || 'new'}-${modalMode}`}
        isOpen={modalOpen}
        mode={modalMode}
        event={selectedEvent}
        canEdit={podeGerenciar}
        saving={saving}
        error={mutationError}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default AgendaPage;
