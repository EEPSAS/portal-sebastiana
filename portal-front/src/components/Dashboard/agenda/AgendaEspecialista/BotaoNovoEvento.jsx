const BotaoNovoEvento = ({ onClick }) => (
	<button
		type="button"
		onClick={onClick}
		style={{
			border: 0,
			borderRadius: '20px',
			background: '#e6007e',
			color: '#ffffff',
			padding: '8px 14px',
			fontSize: '12px',
			fontWeight: '700',
			cursor: 'pointer',
			whiteSpace: 'nowrap',
		}}
	>
		+ Adicionar Data
	</button>
);

export default BotaoNovoEvento;
