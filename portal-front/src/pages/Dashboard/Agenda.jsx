/**
 * Agenda.jsx - Página de Calendário e Eventos Escolares do Dashboard (Módulo 4)
 *
 * Papel Didático:
 * Atua como o Container Inteligente (Smart Component) da rota `/dashboard/agenda`:
 * 1. Conecta o estado de autenticação (`useAuth`) para separar criação pessoal de gestão institucional;
 * 2. Orquestra o ciclo completo de CRUD através do hook oficial `useEventos`;
 * 3. Renderiza a subbarra superior harmonizada com os módulos de Turmas e Biblioteca;
 * 4. Monta o componente unificado `<Calendario />` com `showHero={false}`;
 * 5. Injeta as ações de consulta (👁️), edição (✏️) e exclusão (🗑️) nos eventos;
 * 6. Gerencia o diálogo modal `<CadastroEventoModal />` de forma declarativa e sob demanda.
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useEventos } from '../../hooks/useEventos';
import Calendario from '../../components/Portal/calendario/Calendario';
import CadastroEventoModal from '../../components/Portal/calendario/CadastroEventoModal';
import '../../pages/Portal/portal.css';

const AgendaPage = () => {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const podeGerenciar = ['especialista', 'adm', 'admin'].includes(role);
  // Qualquer usuário autenticado pode criar eventos na própria agenda.
  const podeCriarEvento = Boolean(user?.id);

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
        {/* Subbarra Superior (Menu de Agenda no padrão dos demais módulos) */}
        <header className="mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom">
            <div>
              <h2 className="fw-bold mb-1 text-primary fs-4">Agenda Escolar</h2>
              <p className="text-muted mb-0 small">
                Planejamento de eventos institucionais, feriados e datas pedagógicas importantes.
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

              {podeCriarEvento && (
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
        </header>

        {/* Componente Unificado de Calendário com showHero={false} e ações injetadas */}
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
