const BotaoNovoEvento = ({ onClick, disabled = false }) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled}
		style={{
			border: 0,
			borderRadius: '20px',
			background: '#e6007e',
			color: '#ffffff',
			padding: '8px 14px',
			fontSize: '12px',
			fontWeight: '700',
			cursor: disabled ? 'wait' : 'pointer',
			opacity: disabled ? 0.7 : 1,
			whiteSpace: 'nowrap',
		}}
	>
		+ Adicionar Data
	</button>
);

export default BotaoNovoEvento;
