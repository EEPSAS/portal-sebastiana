/**
 * CadastroEventoModal.jsx - Diálogo Modal de Detalhes, Criação e Edição de Eventos
 *
 * Papel Didático:
 * Atua como componente híbrido de visualização e mutação da Agenda Escolar:
 * - Modo 'view': Exibe os detalhes completos de um evento (leitura/consulta);
 * - Modos 'create' e 'edit': Formulário controlado que sanitiza e envia os dados para a API Laravel.
 *
 * Regras de Negócio (Atualização Módulo 4):
 * - Horário de término, dia inteiro e cor customizada foram removidos;
 * - Categorias restritas: Apenas Especialistas e Administradores podem cadastrar Provas,
 *   Sábados Letivos e Feriados/Recessos. Usuários comuns cadastram apenas eventos comuns.
 */

import { useState } from 'react';
import { categoryOptions, getCategoryDetails } from '../../../utils/agendaConfig';

const CadastroEventoModal = ({
  isOpen,
  mode = 'create', // 'create' | 'edit' | 'view'
  event = null,
  initialDate = '',
  saving = false,
  error = null,
  canEdit = false, // Especialista ou Administrador
  onClose,
  onSave,
  onSwitchToEdit,
}) => {
  const [title, setTitle] = useState(() => event?.title || '');
  const [date, setDate] = useState(() => event?.date || initialDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => event?.endDate || '');
  const [category, setCategory] = useState(() => event?.category || categoryOptions[0].key);
  const [description, setDescription] = useState(() => event?.description || '');
  const [location, setLocation] = useState(() => event?.location || '');
  const [startTime, setStartTime] = useState(() => event?.startTime || '');
  const [important, setImportant] = useState(() => Boolean(event?.important));

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const selectedCategoryObj = getCategoryDetails(category);

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !date || !category) return;

    onSave({
      id: event?.id,
      title: trimmedTitle,
      description: description.trim() || null,
      date,
      endDate: endDate || null,
      startTime: startTime || null,
      category,
      important: canEdit ? important : false,
      location: location.trim() || null,
    });
  };

  return (
    <div
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (!saving && mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
      className="agenda-modal-overlay"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        className="agenda-modal-dialog"
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 id="event-modal-title" className="agenda-modal-title mb-0">
            {isViewMode
              ? 'Detalhes do Evento'
              : mode === 'edit'
                ? 'Editar Evento'
                : 'Novo Evento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-close"
            aria-label="Fechar modal"
            disabled={saving}
          />
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small" role="alert">
            {error.message || 'Erro ao processar o evento.'}
          </div>
        )}

        {isViewMode ? (
          /* Modo Visualização */
          <div className="agenda-view-details">
            <div className="mb-3 d-flex align-items-center gap-2">
              <span
                className="badge px-3 py-2"
                style={{ backgroundColor: selectedCategoryObj.color, color: '#fff', fontSize: '0.85rem' }}
              >
                {selectedCategoryObj.icon} {selectedCategoryObj.label}
              </span>
              {important && <span className="badge bg-danger">Data Importante</span>}
            </div>

            <h3 className="fs-5 fw-bold text-dark mb-2">{title}</h3>

            <div className="text-secondary small mb-3">
              <div>
                <strong>📅 Data:</strong>{' '}
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                  new Date(`${date}T00:00:00`)
                )}
                {endDate && endDate !== date && (
                  <span>
                    {' '}até{' '}
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                      new Date(`${endDate}T00:00:00`)
                    )}
                  </span>
                )}
              </div>

              {startTime && (
                <div className="mt-1">
                  <strong>⏰ Horário de início:</strong> {startTime}
                </div>
              )}

              {location && (
                <div className="mt-1">
                  <strong>📍 Local:</strong> {location}
                </div>
              )}
            </div>

            {description ? (
              <div className="p-3 bg-light rounded-3 text-muted small mb-4">
                <strong>Descrição:</strong>
                <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>{description}</p>
              </div>
            ) : (
              <p className="text-muted fst-italic small mb-4">Nenhuma descrição informada para este evento.</p>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm btn-outline-secondary rounded-pill px-4"
              >
                Fechar
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onSwitchToEdit(event)}
                  className="btn btn-sm btn-primary rounded-pill px-4"
                >
                  ✏️ Editar Evento
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Modo Criação / Edição */
          <form onSubmit={handleSubmit} className="agenda-modal-form">
            <div className="mb-3">
              <label className="form-label small fw-bold">Nome do Evento *</label>
              <input
                autoFocus
                required
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Reunião Pedagógica"
                className="form-control form-control-sm"
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Data Inicial *</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Data de Término</label>
                <input
                  type="date"
                  min={date}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Categoria *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select form-select-sm"
                >
                  {categoryOptions.map((opt) => {
                    const isRestrita = opt.key !== 'eventos';
                    const desabilitada = isRestrita && !canEdit;

                    return (
                      <option
                        key={opt.key}
                        value={opt.key}
                        disabled={desabilitada}
                      >
                        {opt.icon} {opt.label} {desabilitada ? '(Apenas Especialista/Adm)' : ''}
                      </option>
                    );
                  })}
                </select>
                {!canEdit && (
                  <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                    * Provas, Sábados Letivos e Feriados requerem perfil de Especialista ou Administrador.
                  </small>
                )}
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Local</label>
                <input
                  maxLength={255}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex.: Auditório / Pátio"
                  className="form-control form-control-sm"
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Horário de Início</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-control form-control-sm"
                />
              </div>
              {canEdit && (
                <div className="col-12 col-md-6 d-flex align-items-center pt-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="importantCheck"
                      checked={important}
                      onChange={(e) => setImportant(e.target.checked)}
                      className="form-check-input"
                    />
                    <label htmlFor="importantCheck" className="form-check-label small fw-semibold text-danger">
                      <i className="bi bi-bell-fill me-1"></i>
                      Data importante (Alerta super-importante)
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalhes adicionais sobre o evento..."
                className="form-control form-control-sm"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-sm btn-outline-secondary rounded-pill px-4"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-sm btn-primary rounded-pill px-4 fw-bold"
              >
                {saving ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Evento'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default CadastroEventoModal;
