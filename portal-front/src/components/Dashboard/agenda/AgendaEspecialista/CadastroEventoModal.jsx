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
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '16px',
				background: 'rgba(15, 23, 42, 0.45)',
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="event-form-title"
				style={{
					width: '100%',
					maxWidth: '560px',
					maxHeight: 'calc(100vh - 32px)',
					padding: '24px',
					borderRadius: '12px',
					background: '#ffffff',
					boxShadow: '0 16px 48px rgba(15, 23, 42, 0.2)',
					overflowY: 'auto',
				}}
			>
				<h2 id="event-form-title" style={{ margin: '0 0 20px', color: '#1e3a8a', fontSize: '20px' }}>
					{event ? 'Editar evento' : 'Adicionar data'}
				</h2>
				{error && <p role="alert" style={{ margin: '0 0 14px', color: '#b91c1c', fontSize: '13px' }}>{error.message}</p>}
				<form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Nome do evento
						<input
							autoFocus
							required
							maxLength={255}
							value={title}
							onChange={(inputEvent) => setTitle(inputEvent.target.value)}
							placeholder="Ex.: Reunião de pais"
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
						/>
					</label>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Data
						<input
							required
							type="date"
							value={date}
							onChange={(inputEvent) => setDate(inputEvent.target.value)}
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
						/>
					</label>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Data de término
						<input
							type="date"
							min={date}
							value={endDate}
							onChange={(inputEvent) => setEndDate(inputEvent.target.value)}
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
						/>
					</label>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Categoria
						<select
							required
							value={category}
							onChange={(inputEvent) => setCategory(inputEvent.target.value)}
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', fontSize: '14px' }}
						>
							{categories.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
						</select>
					</label>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Local
						<input
							maxLength={255}
							value={location}
							onChange={(inputEvent) => setLocation(inputEvent.target.value)}
							placeholder="Ex.: Pátio central"
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
						/>
					</label>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Descrição
						<textarea
							value={description}
							onChange={(inputEvent) => setDescription(inputEvent.target.value)}
							rows={3}
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
						/>
					</label>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
						<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
							Horário de início
							<input
								type="time"
								disabled={allDay}
								value={startTime}
								onChange={(inputEvent) => setStartTime(inputEvent.target.value)}
								style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
							/>
						</label>
						<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
							Horário de término
							<input
								type="time"
								disabled={allDay}
								value={endTime}
								onChange={(inputEvent) => setEndTime(inputEvent.target.value)}
								style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
							/>
						</label>
					</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
							<input type="checkbox" checked={allDay} onChange={(inputEvent) => setAllDay(inputEvent.target.checked)} />
							Dia inteiro
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
							<input type="checkbox" checked={important} onChange={(inputEvent) => setImportant(inputEvent.target.checked)} />
							Data importante
						</label>
					</div>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Cor
						<input
							type="text"
							maxLength={30}
							value={color}
							onChange={(inputEvent) => setColor(inputEvent.target.value)}
							placeholder="Ex.: #4287f5"
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
						/>
					</label>
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
						<button type="button" onClick={onClose} disabled={saving} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', color: '#334155', fontWeight: '600', cursor: saving ? 'wait' : 'pointer' }}>
							Cancelar
						</button>
						<button type="submit" disabled={saving} style={{ padding: '9px 14px', border: 0, borderRadius: '8px', background: '#e6007e', color: '#ffffff', fontWeight: '700', cursor: saving ? 'wait' : 'pointer' }}>
							{saving ? 'Salvando...' : event ? 'Salvar alterações' : 'Adicionar data'}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
};

export default CadastroEventoModal;
