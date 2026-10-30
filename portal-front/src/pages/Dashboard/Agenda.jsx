/**
 * Agenda.jsx - Página de Calendário, Sábados Letivos, Feriados e Horário Escolar (Módulo 4)
 *
 * Papel Didático:
 * Atua como o Container Inteligente (Smart Component) da rota `/dashboard/agenda`:
 * 1. Conecta o estado de autenticação (`useAuth`) para separar criação pessoal de gestão institucional;
 * 2. Sincroniza a navegação interna por abas (`?tab=calendario|sabados|feriados|horarios`) com o menu Aside;
 * 3. Orquestra o ciclo completo de CRUD através do hook oficial `useEventos`;
 * 4. Disponibiliza o fluxo unitário ("Novo Evento") e o fluxo em lote ("Cadastro em Massa" - Item 5.6);
 * 5. Monta o componente unificado `<Calendario />`, visões filtradas de Sábados Letivos e Feriados,
 *    e a grade de `<HorariosEscolares />`.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { useEventos } from '../../hooks/useEventos';
import Calendario from '../../components/Portal/calendario/Calendario';
import CadastroEventoModal from '../../components/Portal/calendario/CadastroEventoModal';
import ModalCadastroEmMassa from '../../components/Dashboard/agenda/ModalCadastroEmMassa';
import HorariosEscolares from '../../components/Dashboard/agenda/HorariosEscolares';
import PainelModulo from '../../components/Dashboard/common/PainelModulo';
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
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const abaAtiva = ABAS_AGENDA.some((aba) => aba.id === tabParam)
    ? tabParam
    : 'calendario';

  

  // Hook central de leitura e mutação na API /api/eventos
  const {
    eventos,
    loading,
    error,
    create,
    createEmMassa,
    update,
    remove,
    saving,
    mutationError,
    clearMutationError,
    } = useEventos({ publico: false });

  // Estados locais do diálogo modal unitário, em massa e notificações
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEmMassaOpen, setModalEmMassaOpen] = useState(false);
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

  const handleSaveEmMassa = async (listaEventos) => {
    const result = await createEmMassa(listaEventos);
    if (result.success) {
      setModalEmMassaOpen(false);
      const total = Array.isArray(result.data) ? result.data.length : listaEventos.length;
      exibirNotificacao(`${total} data(s) escolar(es) cadastrada(s) com sucesso em lote!`);
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

  // Somente eventos da categoria 'Sábados Letivos' (critério estrito: feriados em sábado não entram aqui)
  const sabadosLetivos = useMemo(() => {
    const lista = Array.isArray(eventos) ? eventos : [];
    return lista
      .filter((ev) => ev?.date && ev.category === 'sabados')
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

  const acoesAgenda = (
    <>
      {podeGerenciar && abaAtiva !== 'horarios' && (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
          onClick={() => {
            clearMutationError();
            setModalEmMassaOpen(true);
          }}
          title="Cadastrar múltiplos sábados letivos e feriados em tabela"
        >
          <i className="bi bi-table me-1"></i>
          Cadastro em Massa
        </button>
      )}

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
    </>
  );

  return (
    <div className="position-relative">
      {/* Toast Flutuante de Confirmação */}
      {notificacao && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {notificacao}
        </div>
      )}

      <PainelModulo acoes={acoesAgenda}>
        {/* Aba 1: Calendário Completo (Embedded remove fundo cinza e barra vertical - Item 1) */}
        {abaAtiva === 'calendario' && (
          <div className="portal-scope portal-scope--embedded w-100">
            <Calendario
              showHero={false}
              embedded={true}
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
                  Utilize o botão &ldquo;Cadastro em Massa&rdquo; ou &ldquo;Novo Evento&rdquo; para registrar sábados letivos.
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
      </PainelModulo>

      {/* Diálogo Modal de Cadastro e Edição Unitária */}
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

      {/* Diálogo Modal de Cadastro em Massa (Item 5.6) */}
      {/* Montagem condicional: ao fechar, o componente é desmontado e a tabela volta "zerada" na próxima abertura */}
      {modalEmMassaOpen && (
        <ModalCadastroEmMassa
          isOpen
          saving={saving}
          error={mutationError}
          onClose={() => setModalEmMassaOpen(false)}
          onSave={handleSaveEmMassa}
        />
      )}
    </div>
  );
};

export default AgendaPage;
