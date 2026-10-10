/**
 * Noticias.jsx - Página de Gestão de Notícias (Especialista e Adm)
 *
 * Papel Didático:
 * Rota restrita sob `/dashboard/noticias`. Permite a especialistas e administradores
 * visualizar e gerenciar as notícias escolares publicadas no portal.
 * Cumpre a exigência dos 3 estados de tela (Carregando, Dados/Vazio, Erro).
 */

import { useEffect, useState } from 'react';
import { listarNoticias } from '../../services/noticiasService';

const DashboardNoticias = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelado = false;

    // Busca notícias via serviço centralizado
    listarNoticias()
      .then((dados) => {
        if (!cancelado) {
          setNoticias(Array.isArray(dados) ? dados : []);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err.message || 'Não foi possível carregar as notícias escolares.');
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1">Gestão de Notícias</h2>
          <p className="text-muted small mb-0">Publique e gerencie matérias para a comunidade escolar.</p>
        </div>
        <button type="button" className="btn btn-primary fw-semibold btn-sm d-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i> Nova Notícia
        </button>
      </div>

      {/* Estado 1: Carregando */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2 small">Carregando notícias...</p>
        </div>
      )}

      {/* Estado 2: Erro Amigável */}
      {!loading && erro && (
        <div className="alert alert-danger d-flex align-items-center rounded-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          <div>{erro}</div>
        </div>
      )}

      {/* Estado 3: Lista Vazia */}
      {!loading && !erro && noticias.length === 0 && (
        <div className="card border-0 shadow-sm text-center py-5 rounded-4">
          <div className="card-body">
            <i className="bi bi-newspaper fs-1 text-muted d-block mb-3"></i>
            <h5 className="fw-semibold text-dark">Nenhuma notícia encontrada</h5>
            <p className="text-muted small">Clique no botão "Nova Notícia" para publicar o primeiro artigo.</p>
          </div>
        </div>
      )}

      {/* Estado com Dados Reais */}
      {!loading && !erro && noticias.length > 0 && (
        <div className="row g-3">
          {noticias.map((item) => (
            <div className="col-12 col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100 border-0 shadow-sm rounded-3">
                <div className="card-body d-flex flex-column">
                  <h6 className="card-title fw-bold text-dark">{item.titulo}</h6>
                  <p className="card-text text-muted small flex-grow-1">
                    {item.resumo || item.conteudo?.slice(0, 100) + '...'}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                    <span className="badge bg-secondary-subtle text-secondary small">
                      {item.data || 'Recente'}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-primary">
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardNoticias;
