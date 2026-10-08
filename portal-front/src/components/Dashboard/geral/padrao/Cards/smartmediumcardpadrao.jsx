import { useBoletim } from '../../../../../hooks/geral/padrao/useMediumCardPadrao.js';
import MediumCard from './dumbmediumcardpadrao.jsx';

export default function BoletimDetalhado() {
  // Apenas extraímos os dados, os loadings e errors
  const { 
    itensVisiveis, 
    loading, 
    error
  } = useBoletim();

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 w-100 text-center text-muted">
        A carregar dados do boletim...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-4">
        Erro ao carregar o boletim: {error}
      </div>
    );
  }

  if (!itensVisiveis || itensVisiveis.length === 0) {
    return null;
  }

  return (
    <MediumCard
      itensVisiveis={itensVisiveis}
    />
  );
}