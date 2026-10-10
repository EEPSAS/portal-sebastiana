/**
 * CadastroEventoModal.jsx - Formulário Modal de Criação e Edição de Eventos
 *
 * Papel Didático:
 * Renderiza um diálogo modal com formulário controlado (`controlled components`).
 * Todos os estilos inline foram extraídos para o arquivo `Agenda.css`, garantindo
 * organização de código, manutenibilidade e separação clara entre regra e visual.
 */

import { useState } from 'react';

const CadastroEventoModal = ({ categories, event, initialDate, error, saving, onClose, onSave }) => {
	const [title, setTitle] = useState(event?.title || '');
	const [date, setDate] = useState(event?.date || initialDate);
	const [category, setCategory] = useState(event?.category || categories[0].key);
	const [description, setDescription] = useState(event?.description || '');
	const [endDate, setEndDate] = useState(event?.endDate || '');
	const [startTime, setStartTime] = useState(event?.startTime || '');
	const [endTime, setEndTime] = useState(event?.endTime || '');
	const [allDay, setAllDay] = useState(event?.allDay || false);
	const [important, setImportant] = useState(event?.important || false);
	const [location, setLocation] = useState(event?.location || '');
	const [color, setColor] = useState(event?.color || '');

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
			startTime: allDay ? null : startTime || null,
			endTime: allDay ? null : endTime || null,
			allDay,
			category,
			important,
			location: location.trim() || null,
			color: color.trim() || null,
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
				aria-labelledby="event-form-title"
				className="agenda-modal-dialog"
			>
				<h2 id="event-form-title" className="agenda-modal-title">
					{event ? 'Editar evento' : 'Adicionar data'}
				</h2>
				{error && <p role="alert" className="agenda-modal-error">{error.message}</p>}
				<form onSubmit={handleSubmit} className="agenda-modal-form">
					<label className="agenda-form-field">
						Nome do evento
						<input
							autoFocus
							required
							maxLength={255}
							value={title}
							onChange={(inputEvent) => setTitle(inputEvent.target.value)}
							placeholder="Ex.: Reunião de pais"
							className="agenda-form-input"
						/>
					</label>
					<label className="agenda-form-field">
						Data
						<input
							required
							type="date"
							value={date}
							onChange={(inputEvent) => setDate(inputEvent.target.value)}
							className="agenda-form-input"
						/>
					</label>
					<label className="agenda-form-field">
						Data de término
						<input
							type="date"
							min={date}
							value={endDate}
							onChange={(inputEvent) => setEndDate(inputEvent.target.value)}
							className="agenda-form-input"
						/>
					</label>
					<label className="agenda-form-field">
						Categoria
						<select
							required
							value={category}
							onChange={(inputEvent) => setCategory(inputEvent.target.value)}
							className="agenda-form-select"
						>
							{categories.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
						</select>
					</label>
					<label className="agenda-form-field">
						Local
						<input
							maxLength={255}
							value={location}
							onChange={(inputEvent) => setLocation(inputEvent.target.value)}
							placeholder="Ex.: Pátio central"
							className="agenda-form-input"
						/>
					</label>
					<label className="agenda-form-field">
						Descrição
						<textarea
							value={description}
							onChange={(inputEvent) => setDescription(inputEvent.target.value)}
							rows={3}
							className="agenda-form-textarea"
						/>
					</label>
					<div className="agenda-form-row-2col">
						<label className="agenda-form-field">
							Horário de início
							<input
								type="time"
								disabled={allDay}
								value={startTime}
								onChange={(inputEvent) => setStartTime(inputEvent.target.value)}
								className="agenda-form-input"
							/>
						</label>
						<label className="agenda-form-field">
							Horário de término
							<input
								type="time"
								disabled={allDay}
								value={endTime}
								onChange={(inputEvent) => setEndTime(inputEvent.target.value)}
								className="agenda-form-input"
							/>
						</label>
					</div>
					<div className="agenda-checkbox-group">
						<label className="agenda-checkbox-label">
							<input type="checkbox" checked={allDay} onChange={(inputEvent) => setAllDay(inputEvent.target.checked)} />
							Dia inteiro
						</label>
						<label className="agenda-checkbox-label">
							<input type="checkbox" checked={important} onChange={(inputEvent) => setImportant(inputEvent.target.checked)} />
							Data importante
						</label>
					</div>
					<label className="agenda-form-field">
						Cor
						<input
							type="text"
							maxLength={30}
							value={color}
							onChange={(inputEvent) => setColor(inputEvent.target.value)}
							placeholder="Ex.: #4287f5"
							className="agenda-form-input"
						/>
					</label>
					<div className="agenda-modal-actions">
						<button type="button" onClick={onClose} disabled={saving} className="agenda-modal-btn-cancel">
							Cancelar
						</button>
						<button type="submit" disabled={saving} className="agenda-modal-btn-submit">
							{saving ? 'Salvando...' : event ? 'Salvar alterações' : 'Adicionar data'}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
};

export default CadastroEventoModal;
