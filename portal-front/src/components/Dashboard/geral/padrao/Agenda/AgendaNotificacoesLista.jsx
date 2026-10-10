// Função para retornar o ícone correto baseado no tipo
const RenderIcon = ({ tipo }) => {
  switch (tipo) {
    case 'biblioteca': // Livro Azul
      return (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
        </svg>
      );
    case 'nota': // Tabela Azul Claro
      return (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H5V5h14v12zm-2-7H7v2h11v-2zM7 14h11v2H7v-2zm0-6h11v2H7V8z"/>
        </svg>
      );
    case 'lembrete': // Sino Rosa
      return (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      );
    case 'tarefa': // Calendário Verde
      return (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      );
    case 'concurso': // Medalha Laranja
      return (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l-2.42 5.12L4 7.95l4.17 3.86L7.05 17 12 14.23 16.95 17l-1.12-5.19L20 7.95l-5.58-.83z"/>
        </svg>
      );
    case 'evento': // Relógio Verde
      return (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      );
    default:
      return null;
  }
};

// Função para definir a cor de fundo do ícone
const getEstiloPorTipo = (tipo) => {
  switch (tipo) {
    case 'biblioteca': return 'bg-primary bg-opacity-10 text-primary';
    case 'nota': return 'bg-info bg-opacity-10 text-info';
    case 'lembrete': return 'bg-danger bg-opacity-10 text-danger';
    case 'tarefa': return 'bg-success bg-opacity-10 text-success';
    case 'concurso': return 'bg-warning bg-opacity-10 text-warning';
    case 'evento': return 'bg-success bg-opacity-10 text-success';
    default: return 'bg-secondary bg-opacity-10 text-secondary';
  }
};

export default function AgendaList({ itens }) {
  return (
    <div
      className="card border-0 shadow-sm rounded-4 p-4 mt-4 w-100 h-100"
      style={{ background: '#f7f7f7' }}
    >
      <h5 className="fw-bold mb-4" style={{ fontSize: '1.1rem' }}>
        Agenda e Notificações (Expandida)
      </h5>
      
      <div className="d-flex flex-column gap-3">
        {itens.map((item) => (
          <div key={item.id} className="d-flex align-items-start gap-2">
            <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
              {/* Ícone Circular */}
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${getEstiloPorTipo(item.tipo)}`}
                style={{ width: '36px', height: '36px' }}
              >
                <RenderIcon tipo={item.tipo} />
              </div>
              
              {/* Texto da Notificação */}
              <span className="text-dark flex-grow-1" style={{ fontSize: '0.9rem', lineHeight: '1.4', minWidth: 0 }}>
                {item.texto}
              </span>
            </div>

            {/* Tempo */}
            <span className="text-muted flex-shrink-0 text-nowrap" style={{ fontSize: '0.7rem' }}>
              {item.tempo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}