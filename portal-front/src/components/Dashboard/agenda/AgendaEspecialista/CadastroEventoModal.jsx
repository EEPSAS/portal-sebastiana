import { useState } from 'react';

const CadastroEventoModal = ({ categories, event, initialDate, onClose, onSave, error, isSaving }) => {
	const [title, setTitle] = useState(event?.title || '');
	const [date, setDate] = useState(event?.date || initialDate);
	const [category, setCategory] = useState(event?.category || categories[0].key);

	const handleSubmit = async (submitEvent) => {
		submitEvent.preventDefault();
		const trimmedTitle = title.trim();
		if (!trimmedTitle || !date || !category) return;

		await onSave({
			id: event?.id,
			title: trimmedTitle,
			date,
			category,
			type: category === event?.category ? event?.type : undefined,
			important: event?.important,
		});
	};

	return (
		<div
			role="presentation"
			onMouseDown={(mouseEvent) => {
				if (!isSaving && mouseEvent.target === mouseEvent.currentTarget) onClose();
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
					maxWidth: '420px',
					padding: '24px',
					borderRadius: '12px',
					background: '#ffffff',
					boxShadow: '0 16px 48px rgba(15, 23, 42, 0.2)',
				}}
			>
				<h2 id="event-form-title" style={{ margin: '0 0 20px', color: '#1e3a8a', fontSize: '20px' }}>
					{event ? 'Editar evento' : 'Adicionar data'}
				</h2>
				<form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Nome do evento
						<input
							autoFocus
							required
							maxLength={255}
							  disabled={isSaving}
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
							  disabled={isSaving}
							value={date}
							onChange={(inputEvent) => setDate(inputEvent.target.value)}
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
						/>
					</label>
					<label style={{ display: 'grid', gap: '6px', color: '#334155', fontSize: '13px', fontWeight: '600' }}>
						Categoria
						<select
							required
							  disabled={isSaving}
							value={category}
							onChange={(inputEvent) => setCategory(inputEvent.target.value)}
							style={{ boxSizing: 'border-box', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', fontSize: '14px' }}
						>
							{categories.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
						</select>
					</label>
					{error && <p role="alert" aria-live="polite" style={{ margin: 0, color: '#be123c', fontSize: '13px' }}>{error}</p>}
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
						<button type="button" onClick={onClose} disabled={isSaving} style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', color: '#334155', fontWeight: '600', cursor: isSaving ? 'wait' : 'pointer' }}>
							Cancelar
						</button>
						<button type="submit" disabled={isSaving} style={{ padding: '9px 14px', border: 0, borderRadius: '8px', background: '#e6007e', color: '#ffffff', fontWeight: '700', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
							{isSaving ? 'Salvando...' : (event ? 'Salvar alterações' : 'Adicionar data')}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
};

export default CadastroEventoModal;
