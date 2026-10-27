/**
 * ConteudoWebAba.jsx - Pesquisa de Conteúdo Web via Google Programmable Search Engine
 *
 * Papel Didático:
 * Integra o mecanismo oficial de busca incorporada do Google (cx: a4b2ccff7fbbe46ad):
 * - Carrega o script cse.js como singleton em modo explícito (parsetags: 'explicit');
 * - Renderiza o widget com overlayResults=false para exibir os resultados diretamente
 *   dentro da própria página (sem abrir modal sobreposto externo);
 * - Acopla botões de "Acessar conteúdo ↗" e "+ Adicionar aos planos" diretamente nos
 *   resultados renderizados pelo Google (via MutationObserver) e oferece sugestões rápidas.
 */

import { useEffect, useRef, useState } from 'react';

const GOOGLE_CSE_SCRIPT_ID = 'google-programmable-search-script';
const GOOGLE_CSE_SCRIPT_URL = 'https://cse.google.com/cse.js?cx=a4b2ccff7fbbe46ad';

// Sugestões pedagógicas para facilitar pesquisas rápidas dentro da aba
const SUGESTOES_PESQUISA = [
  'Literatura Brasileira',
  'História do Brasil',
  'Matemática Ensino Médio',
  'Física Mecânica',
  'Biologia Celular',
  'Redação ENEM',
];

// Singleton e contador de instância para evitar duplicidade de scripts ao trocar de abas na SPA
let promessaScriptGoogle = null;
let contadorInstanciaCse = 0;

const carregarScriptGoogle = () => {
  // Se a API do elemento de busca já estiver pronta na janela, resolve imediatamente
  if (window.google?.search?.cse?.element?.render) {
    return Promise.resolve();
  }

  if (promessaScriptGoogle) {
    return promessaScriptGoogle;
  }

  promessaScriptGoogle = new Promise((resolve, reject) => {
    // Define renderização explícita para podermos forçar overlayResults: false (resultados inline)
    window.__gcse = {
      ...(window.__gcse || {}),
      parsetags: 'explicit',
      initializationCallback: () => resolve(),
    };

    const scriptExistente = document.getElementById(GOOGLE_CSE_SCRIPT_ID);
    const script = scriptExistente || document.createElement('script');

    script.addEventListener(
      'load',
      () => {
        if (window.google?.search?.cse?.element?.render) {
          resolve();
        }
      },
      { once: true }
    );

    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error('Não foi possível carregar o mecanismo de busca do Google.'));
      },
      { once: true }
    );

    if (!scriptExistente) {
      script.id = GOOGLE_CSE_SCRIPT_ID;
      script.src = GOOGLE_CSE_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    promessaScriptGoogle = null;
    throw error;
  });

  return promessaScriptGoogle;
};

const ConteudoWebAba = ({ onAdicionarAoPlano }) => {
  const [carregandoWidget, setCarregandoWidget] = useState(true);
  const [erroWidget, setErroWidget] = useState('');
  const [termoSugeridoAtivo, setTermoSugeridoAtivo] = useState('');
  const containerRef = useRef(null);
  const elementoCseRef = useRef(null);

  useEffect(() => {
    let componenteAtivo = true;

    const inicializarWidget = async () => {
      try {
        setCarregandoWidget(true);
        setErroWidget('');
        await carregarScriptGoogle();
        if (!componenteAtivo || !containerRef.current) return;

        const apiElemento = window.google?.search?.cse?.element;
        if (apiElemento?.render) {
          // Limpa o container e cria um nó dedicado para a instância atual da aba
          containerRef.current.innerHTML = '';
          const divAlvo = document.createElement('div');
          containerRef.current.appendChild(divAlvo);

          contadorInstanciaCse += 1;
          const nomeInstancia = `biblioteca-conteudo-web-${contadorInstanciaCse}`;

          // Força overlayResults: false para que os resultados apareçam dentro da própria página
          const instancia = apiElemento.render({
            div: divAlvo,
            tag: 'search',
            gname: nomeInstancia,
            attributes: {
              overlayResults: false,
              linkTarget: '_blank',
              enableHistory: false,
            },
          });

          elementoCseRef.current = instancia || apiElemento.getElement?.(nomeInstancia) || null;
        }
      } catch {
        if (componenteAtivo) {
          setErroWidget(
            'Não foi possível carregar a busca integrada do Google. Verifique sua conexão e tente novamente.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoWidget(false);
        }
      }
    };

    inicializarWidget();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  // Observa os resultados renderizados pelo Google para organizar os links e botões de ação
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const organizarResultadosGoogle = () => {
      const resultados = container.querySelectorAll('.gsc-webResult.gsc-result');

      resultados.forEach((resultadoEl) => {
        if (resultadoEl.querySelector('.acoes-resultado-cse')) return;

        const linkEl = resultadoEl.querySelector('a.gs-title');
        const titulo = linkEl?.textContent?.trim();
        const url = linkEl?.getAttribute('data-ctorig') || linkEl?.getAttribute('href') || '';

        if (!titulo || !url) return;

        // Garante que o clique no título redirecione para a página do resultado com segurança
        linkEl.setAttribute('target', '_blank');
        linkEl.setAttribute('rel', 'noopener noreferrer');

        const snippetEl = resultadoEl.querySelector('.gs-snippet');
        const fonteEl =
          resultadoEl.querySelector('.gs-visibleUrl-short') ||
          resultadoEl.querySelector('.gs-visibleUrl');
        const thumbEl = resultadoEl.querySelector('img.gs-image');

        const descricao = snippetEl?.textContent?.trim() || '';
        const fonte = fonteEl?.textContent?.trim() || 'Pesquisa Google Web';
        const thumbnail = thumbEl?.getAttribute('src') || null;

        // Barra inferior de ações do resultado: acessar o conteúdo ou salvar nos planos
        const wrapperAcao = document.createElement('div');
        wrapperAcao.className =
          'acoes-resultado-cse mt-3 pt-2 border-top d-flex flex-wrap justify-content-between align-items-center gap-2';

        const badgeFonte = document.createElement('span');
        badgeFonte.className =
          'badge bg-light text-secondary border rounded-pill px-2 py-1 fw-normal';
        badgeFonte.textContent = `🌐 ${fonte}`;

        const grupoBotoes = document.createElement('div');
        grupoBotoes.className = 'd-flex flex-wrap gap-2 ms-auto';

        const linkAcessar = document.createElement('a');
        linkAcessar.href = url;
        linkAcessar.target = '_blank';
        linkAcessar.rel = 'noopener noreferrer';
        linkAcessar.className =
          'btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold small';
        linkAcessar.textContent = 'Acessar conteúdo ↗';

        grupoBotoes.appendChild(linkAcessar);

        if (onAdicionarAoPlano) {
          const botaoPlano = document.createElement('button');
          botaoPlano.type = 'button';
          botaoPlano.className =
            'btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold small btn-adicionar-plano-cse';
          botaoPlano.textContent = '+ Adicionar aos planos';
          botaoPlano.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdicionarAoPlano({
              tipo: 'conteudo_web',
              conteudo_id: url,
              titulo,
              descricao,
              url,
              thumbnail,
              fonte,
              duracao: null,
            });
          });

          grupoBotoes.appendChild(botaoPlano);
        }

        wrapperAcao.appendChild(badgeFonte);
        wrapperAcao.appendChild(grupoBotoes);
        resultadoEl.appendChild(wrapperAcao);
      });
    };

    const observer = new MutationObserver(() => {
      organizarResultadosGoogle();
    });

    observer.observe(container, { childList: true, subtree: true });
    organizarResultadosGoogle();

    return () => observer.disconnect();
  }, [onAdicionarAoPlano]);

  // Executa uma pesquisa diretamente dentro da página ao clicar em um tema sugerido
  const handlePesquisarSugestao = (termo) => {
    setTermoSugeridoAtivo(termo);
    if (elementoCseRef.current?.execute) {
      elementoCseRef.current.execute(termo);
      return;
    }

    // Fallback preenchendo o campo e acionando o botão de busca do Google CSE
    const inputGoogle = containerRef.current?.querySelector('input.gsc-input');
    const botaoGoogle = containerRef.current?.querySelector('button.gsc-search-button');
    if (inputGoogle && botaoGoogle) {
      inputGoogle.value = termo;
      botaoGoogle.click();
    }
  };

  // Abre o modal permitindo salvar manualmente um conteúdo ou link pesquisado no plano de estudos
  const handleAbrirAdicaoManual = () => {
    const inputGoogle = containerRef.current?.querySelector('input.gsc-input');
    const termoDigitado = inputGoogle?.value?.trim() || termoSugeridoAtivo || '';

    onAdicionarAoPlano?.({
      tipo: 'conteudo_web',
      conteudo_id: null,
      titulo: termoDigitado,
      descricao: '',
      url: '',
      thumbnail: null,
      fonte: 'Pesquisa Google Web',
      duracao: null,
      editavel: true,
    });
  };

  return (
    <section aria-label="Pesquisa de Conteúdo Web no Google">
      {/* Cabeçalho de Orientação e Atalho para Salvar Conteúdo no Plano de Estudos */}
      <div className="bg-light p-3 p-md-4 rounded-4 mb-4 border border-light-subtle">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-1 fs-6">
              Pesquisa Acadêmica Integrada (Google)
            </h5>
            <p className="text-muted small mb-0">
              Pesquise artigos, resumos e materiais didáticos na web. Os resultados aparecem abaixo nesta mesma página.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAbrirAdicaoManual}
            className="btn btn-sm btn-outline-success rounded-pill px-3 py-2 fw-semibold flex-shrink-0"
          >
            + Salvar conteúdo pesquisado no plano
          </button>
        </div>

        {/* Sugestões Rápidas para Pesquisa Imediata Dentro da Aba */}
        <div className="d-flex flex-wrap align-items-center gap-2 pt-2 border-top border-secondary-subtle">
          <span className="text-secondary small fw-semibold me-1">Sugestões rápidas:</span>
          {SUGESTOES_PESQUISA.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() => handlePesquisarSugestao(sugestao)}
              className={`btn btn-sm rounded-pill px-3 py-1 small ${
                termoSugeridoAtivo === sugestao
                  ? 'btn-primary fw-semibold'
                  : 'btn-white bg-white border text-secondary'
              }`}
            >
              {sugestao}
            </button>
          ))}
        </div>
      </div>

      {/* Estado Assíncrono 1: Carregando o Mecanismo de Busca */}
      {carregandoWidget && (
        <div className="py-4 text-center text-muted" role="status">
          <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
          <p className="small mb-0 fw-semibold">
            Carregando barra de pesquisa integrada do Google...
          </p>
        </div>
      )}

      {/* Container Inline do Google Programmable Search Engine (Sem Overlay Externo) */}
      <div
        ref={containerRef}
        className="conteudo-web-google bg-white border rounded-4 p-3 p-md-4 shadow-sm"
      />

      {/* Estado Assíncrono 2: Erro Amigável */}
      {erroWidget && (
        <div className="alert alert-warning mt-3 mb-0 rounded-3 shadow-sm small" role="alert">
          ⚠️ {erroWidget}
        </div>
      )}
    </section>
  );
};

export default ConteudoWebAba;
