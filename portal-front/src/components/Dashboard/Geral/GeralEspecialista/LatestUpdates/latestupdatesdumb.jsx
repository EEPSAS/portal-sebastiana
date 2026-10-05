// components/LatestUpdates/UpdateItem.jsx

// Função auxiliar para renderizar o ícone com base no tipo de atualização
function RenderUpdateIcon({ tipo }) {
  if (tipo === 'noticia') {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
         <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H5V5h14v12zm-2-7H7v2h11v-2zM7 14h11v2H7v-2zm0-6h11v2H7V8z"/>
      </svg>
    );
  }
  if (tipo === 'notas') {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
    );
  }
  
  // Ícone padrão
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

// Define as cores dinamicamente via Bootstrap com base no tipo
function getEstiloIcone(tipo) {
  switch (tipo) {
    case 'noticia': return 'bg-primary-subtle text-primary';
    case 'notas': return 'bg-success-subtle text-success';
    default: return 'bg-secondary-subtle text-secondary';
  }
}

export default function UpdateItem({ tipo, texto, tempoAtras }) {
  const estiloIcone = getEstiloIcone(tipo);

  return (
    <div className="d-flex align-items-center justify-content-between py-3 border-bottom border-light">
      <div className="d-flex align-items-center gap-3">
        {/* Ícone Redondo */}
        <div 
          className={`rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 ${estiloIcone}`} 
          style={{ width: '32px', height: '32px' }}
        >
          <RenderUpdateIcon tipo={tipo} />
        </div>
        
        {/* Texto da Atualização */}
        <span className="text-dark fs-6" style={{ fontSize: '0.9rem' }}>
          {texto}
        </span>
      </div>

      {/* Tempo Atrás */}
      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
        {tempoAtras}
      </span>
    </div>
  );
}