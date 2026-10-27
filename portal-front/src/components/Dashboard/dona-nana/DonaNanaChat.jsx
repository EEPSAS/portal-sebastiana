/**
 * DonaNanaChat.jsx - Componente Central da Aba de Conversação com a Dona Nana
 *
 * Papel Didático:
 * Interface conversacional rica no Dashboard:
 * 1. Histórico de sessões múltiplas (estilo LLM moderno) persistido em `localStorage`;
 * 2. Banner pedagógico de homenagem à fundadora da escola;
 * 3. Botão de configuração de persona acessível para Especialistas e Administradores;
 * 4. Cards temáticos de sugestões pedagógicas e causos históricos da EEPSAS.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import DonaNanaAvatar from './DonaNanaAvatar';
import { useAuth } from '../../../hooks/useAuth';
import { enviarMensagem } from '../../../services/donaNanaService';
import './donaNana.css';

const SESSIONS_STORAGE_KEY = 'portal_dona_nana_sessoes';

let sessionCounter = 0;
let messageCounter = 0;

const createSessionId = () => `sessao-${++sessionCounter}`;
const createMessageId = (prefix) => `${prefix}-${++messageCounter}`;

const SUGESTOES_INICIAIS = [
  {
    categoria: 'Portal & Boletim',
    icone: 'bi-journal-check',
    pergunta: 'Como consultar minhas notas e faltas no Boletim?',
    descricao: 'Orientações passo a passo sobre o cálculo bimestral via CSV.',
  },
  {
    categoria: 'Biblioteca Escolar',
    icone: 'bi-book-half',
    pergunta: 'O que encontro no acervo da Biblioteca e como reservo um livro?',
    descricao: 'Informações sobre acervo físico, YouTube e Google Books.',
  },
  {
    categoria: 'Memória & História',
    icone: 'bi-heart-pulse-fill',
    pergunta: 'Quem foi a Professora Sebastiana e como nasceu a escola?',
    descricao: 'Causos afetuosos sobre a fundação da EEPSAS em Jaguaraçu-MG.',
  },
  {
    categoria: 'Dicas de Estudo',
    icone: 'bi-mortarboard-fill',
    pergunta: 'Dona Nana, você pode me dar conselhos para organizar meus estudos?',
    descricao: 'Conselhos acolhedores e pedagógicos para o ano letivo.',
  },
];

const criarNovaSessao = () => ({
  id: createSessionId(),
  titulo: 'Nova conversa',
  messages: [],
});

const DonaNanaChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || 'aluno';
  const podeConfigurar = userRole === 'adm' || userRole === 'especialista' || user?.realRole === 'adm';

  // Gerenciamento de Sessões
  const [sessions, setSessions] = useState(() => {
    try {
      const salvas = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (salvas) {
        const parsed = JSON.parse(salvas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignora erro de JSON e inicia nova sessão limpa
    }
    return [criarNovaSessao()];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || 'default');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const chatEndRef = useRef(null);

  // Sessão atualmente aberta
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Sincroniza as sessões com o localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Falha silenciosa
    }
  }, [sessions]);

  // Rola até o final ao receber novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, loading]);

  const handleCreateNewSession = () => {
    const nova = criarNovaSessao();
    setSessions((prev) => [nova, ...prev]);
    setActiveSessionId(nova.id);
    setErrorMsg('');
  };

  const handleDeleteSession = (e, idParaDeletar) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      // Se for a única, reseta para uma nova em branco
      const reset = criarNovaSessao();
      setSessions([reset]);
      setActiveSessionId(reset.id);
      return;
    }

    const filtradas = sessions.filter((s) => s.id !== idParaDeletar);
    setSessions(filtradas);
    if (activeSessionId === idParaDeletar) {
      setActiveSessionId(filtradas[0].id);
    }
  };

  const handleSendMessage = async (textoPersonalizado) => {
    const texto = (textoPersonalizado || inputText).trim();
    if (!texto || loading) return;

    setErrorMsg('');
    const userMessage = {
      id: createMessageId('u'),
      role: 'user',
      text: texto,
    };

    // Atualiza título da sessão caso seja a primeira pergunta
    const tituloSessao =
      activeSession.messages.length === 0
        ? texto.length > 32
          ? `${texto.slice(0, 32)}...`
          : texto
        : activeSession.titulo;

    const novasMensagens = [...activeSession.messages, userMessage];

    // Atualiza estado local imediatamente
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, titulo: tituloSessao, messages: novasMensagens }
          : s
      )
    );

    setInputText('');
    setLoading(true);

    try {
      const historicoEnvio = activeSession.messages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const response = await enviarMensagem({
        mensagem: texto,
        historico: historicoEnvio,
        contextoOrigem: 'aba',
      });

      const modelMessage = {
        id: createMessageId('m'),
        role: 'model',
        text: response.resposta,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, modelMessage] }
            : s
        )
      );
    } catch (err) {
      setErrorMsg(
        err.message || 'Não foi possível obter resposta da Dona Nana no momento.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="dona-nana-page-container">
      {/* Banner Superior de Boas-Vindas */}
      <section className="dona-nana-hero-card d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <DonaNanaAvatar size="lg" showBadge />
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h5 fw-bold mb-0 text-dark">
                Professora Sebastiana de Almeida e Silva
              </h1>
              <span className="dona-nana-hero-badge">Dona Nana</span>
            </div>
            <p className="text-muted small mb-0">
              Patrona da escola e mentora pedagógica virtual — sempre com uma palavra de apoio,
              orientações do portal e causos afetuosos de Jaguaraçu.
            </p>
          </div>
        </div>

        {podeConfigurar && (
          <button
            type="button"
            className="btn btn-outline-warning text-dark fw-semibold d-flex align-items-center gap-2 shadow-sm"
            onClick={() => navigate('/dashboard/dona-nana/configuracao')}
            title="Ajustar a persona e os campos instrucionais do System Prompt"
          >
            <i className="bi bi-sliders text-warning"></i>
            <span>Configurar Persona</span>
          </button>
        )}
      </section>

      {/* Layout Principal: Histórico à Esquerda e Chat à Direita */}
      <div className="dona-nana-main-layout">
        {/* Barra Lateral de Sessões de Conversa */}
        <aside className="dona-nana-sidebar">
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-semibold w-100 rounded-3 py-2"
            onClick={handleCreateNewSession}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Nova Conversa</span>
          </button>

          <span className="text-muted small fw-bold text-uppercase px-1 mt-2">
            Histórico de Diálogos
          </span>

          <div className="dona-nana-sessions-list">
            {sessions.map((sessao) => (
              <button
                key={sessao.id}
                type="button"
                className={`dona-nana-session-item ${
                  sessao.id === activeSession.id ? 'active' : ''
                }`}
                onClick={() => setActiveSessionId(sessao.id)}
              >
                <div className="d-flex align-items-center gap-2 text-truncate">
                  <i className="bi bi-chat-text text-muted"></i>
                  <span className="text-truncate">{sessao.titulo}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-link link-danger p-0 ms-2 opacity-75 hover-opacity-100"
                  onClick={(e) => handleDeleteSession(e, sessao.id)}
                  title="Excluir este diálogo"
                  aria-label="Excluir conversa"
                >
                  <i className="bi bi-trash3 fs-6"></i>
                </button>
              </button>
            ))}
          </div>
        </aside>

        {/* Área Central de Conversação */}
        <main className="dona-nana-chat-area">
          <header className="dona-nana-chat-area-header">
            <div className="d-flex align-items-center gap-2">
              <DonaNanaAvatar size="sm" />
              <div>
                <strong className="d-block text-dark small">{activeSession.titulo}</strong>
                <small className="text-success fw-semibold">
                  <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                  Gemini 3.8 Flash Ativo
                </small>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => {
                setSessions((prev) =>
                  prev.map((s) => (s.id === activeSession.id ? { ...s, messages: [] } : s))
                );
              }}
              title="Limpar mensagens desta sessão"
            >
              <i className="bi bi-eraser"></i>
              <span>Limpar Diálogo</span>
            </button>
          </header>

          {/* Corpo do Diálogo */}
          <div className="dona-nana-chat-area-body">
            {activeSession.messages.length === 0 ? (
              <div className="dona-nana-empty-welcome">
                <DonaNanaAvatar size="xl" showBadge className="mb-3" />
                <h2 className="h4 fw-bold text-dark mb-2">
                  Que bom ter você aqui com a Dona Nana!
                </h2>
                <p className="text-muted">
                  Pergunte o que desejar sobre o funcionamento da escola, suas notas, a biblioteca
                  ou peça para ouvir um dos meus causos sobre a nossa cidade.
                </p>

                <div className="dona-nana-suggestions-grid">
                  {SUGESTOES_INICIAIS.map((sug, i) => (
                    <div
                      key={i}
                      className="dona-nana-prompt-card"
                      onClick={() => handleSendMessage(sug.pergunta)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1 text-primary fw-bold small">
                        <i className={`bi ${sug.icone}`}></i>
                        <span>{sug.categoria}</span>
                      </div>
                      <strong className="d-block text-dark small mb-1">{sug.pergunta}</strong>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {sug.descricao}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`dona-nana-page-msg ${
                    msg.role === 'user' ? 'dona-nana-page-msg-user' : 'dona-nana-page-msg-model'
                  }`}
                >
                  {msg.role === 'model' && <DonaNanaAvatar size="md" />}
                  <div className="dona-nana-page-msg-content">{msg.text}</div>
                </div>
              ))
            )}

            {loading && (
              <div className="dona-nana-page-msg dona-nana-page-msg-model">
                <DonaNanaAvatar size="md" />
                <div className="dona-nana-page-msg-content bg-white text-muted fst-italic">
                  <div className="spinner-border spinner-border-sm text-warning me-2" role="status" />
                  Dona Nana está refletindo com carinho para te responder...
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 my-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <span className="small">{errorMsg}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Rodapé de Entrada */}
          <footer className="dona-nana-chat-area-footer">
            <div className="dona-nana-input-box">
              <textarea
                className="form-control"
                rows={2}
                placeholder="Escreva sua pergunta para a Dona Nana (pressione Enter para enviar)..."
                value={inputText}
                disabled={loading}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={2000}
                aria-label="Campo de mensagem para Dona Nana"
              />
              <button
                type="button"
                className="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3"
                disabled={loading || !inputText.trim()}
                onClick={() => handleSendMessage()}
              >
                <span>Enviar</span>
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DonaNanaChat;
