/**
 * DonaNanaFloatingWidget.jsx - Balão Flutuante da Dona Nana no Canto Inferior Direito
 *
 * Papel Didático:
 * Oferece suporte rápido e contextual acessível em qualquer página do Dashboard:
 * 1. Posição flutuante reposicionável pelo usuário e persistida no navegador;
 * 2. Persistência da conversa rápida em `localStorage` para não perder o diálogo ao mudar de tela;
 * 3. Chips de perguntas frequentes para facilitação do aluno/professor;
 * 4. Botão de expansão para navegar diretamente para a aba dedicada `/dashboard/dona-nana`.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import DonaNanaAvatar from './DonaNanaAvatar';
import { enviarMensagem } from '../../../services/donaNanaService';
import './donaNanaFloatingWidget.css';

const LOCAL_STORAGE_KEY = 'portal_dona_nana_balao_historico';
const POSITION_STORAGE_KEY = 'portal_dona_nana_balao_posicao';

let messageCounter = 0;
const createMessageId = (prefix) => `${prefix}-${++messageCounter}`;

const SUGESTOES_RAPIDAS = [
  'Como vejo meu boletim?',
  'Como reservar livros?',
  'Quem foi a Dona Nana?',
  'Me conte um causo de Jaguaraçu!',
];

const MENSAGEM_INICIAL_PADRAO = {
  id: 'init-1',
  role: 'model',
  text: 'Olá, meu querido(a)! Sou a Dona Nana. Em que posso te orientar hoje sobre nossa escola ou sobre o portal?',
};

const carregarPreferenciasPosicao = () => {
  try {
    const preferencias = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || 'null');
    const posicao = preferencias?.posicao;

    return {
      posicao:
        Number.isFinite(posicao?.left) && Number.isFinite(posicao?.top)
          ? posicao
          : null,
      fixado: Boolean(preferencias?.fixado),
    };
  } catch {
    return { posicao: null, fixado: false };
  }
};

const salvarPreferenciasPosicao = (posicao, fixado) => {
  try {
    localStorage.setItem(
      POSITION_STORAGE_KEY,
      JSON.stringify({ posicao, fixado })
    );
  } catch {
    // O widget continua funcional mesmo quando o navegador bloqueia armazenamento local.
  }
};

const DonaNanaFloatingWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [preferenciasIniciais] = useState(carregarPreferenciasPosicao);
  const [posicao, setPosicao] = useState(preferenciasIniciais.posicao);
  const [fixado, setFixado] = useState(preferenciasIniciais.fixado);
  const [arrastando, setArrastando] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignora erro de parse e carrega mensagem inicial padrão
    }
    return [MENSAGEM_INICIAL_PADRAO];
  });

  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);
  const arrasteRef = useRef(null);
  const ultimoArrasteRef = useRef(0);

  // Reajusta a posição quando a janela muda para evitar que o widget fique fora da tela.
  useEffect(() => {
    if (!posicao || !widgetRef.current) return undefined;

    const limitarPosicao = () => {
      const limites = widgetRef.current?.getBoundingClientRect();
      if (!limites) return;

      const proxima = {
        left: Math.max(0, Math.min(posicao.left, window.innerWidth - limites.width)),
        top: Math.max(0, Math.min(posicao.top, window.innerHeight - limites.height)),
      };
      if (proxima.left === posicao.left && proxima.top === posicao.top) return;

      setPosicao(proxima);
      salvarPreferenciasPosicao(proxima, fixado);
    };

    limitarPosicao();
    window.addEventListener('resize', limitarPosicao);
    return () => window.removeEventListener('resize', limitarPosicao);
  }, [posicao, fixado]);

  const iniciarArraste = (event) => {
    if (fixado || event.button !== 0 || !widgetRef.current) return;

    const limites = widgetRef.current.getBoundingClientRect();
    const posicaoInicial = posicao || { left: limites.left, top: limites.top };
    arrasteRef.current = {
      pointerId: event.pointerId,
      inicioX: event.clientX,
      inicioY: event.clientY,
      deslocamentoX: event.clientX - limites.left,
      deslocamentoY: event.clientY - limites.top,
      posicao: posicaoInicial,
      moveu: false,
    };
    setPosicao(posicaoInicial);
    setArrastando(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moverWidget = (event) => {
    const arraste = arrasteRef.current;
    if (!arraste || arraste.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - arraste.inicioX;
    const deltaY = event.clientY - arraste.inicioY;
    if (!arraste.moveu && Math.hypot(deltaX, deltaY) < 4) return;

    arraste.moveu = true;
    const limites = widgetRef.current?.getBoundingClientRect();
    if (!limites) return;

    arraste.posicao = {
      left: Math.max(0, Math.min(event.clientX - arraste.deslocamentoX, window.innerWidth - limites.width)),
      top: Math.max(0, Math.min(event.clientY - arraste.deslocamentoY, window.innerHeight - limites.height)),
    };
    setPosicao(arraste.posicao);
  };

  const finalizarArraste = (event) => {
    const arraste = arrasteRef.current;
    if (!arraste || arraste.pointerId !== event.pointerId) return;

    if (arraste.moveu) {
      ultimoArrasteRef.current = Date.now();
      setPosicao(arraste.posicao);
      salvarPreferenciasPosicao(arraste.posicao, fixado);
    }
    arrasteRef.current = null;
    setArrastando(false);
  };

  const alternarPino = () => {
    const novoEstadoFixado = !fixado;
    setFixado(novoEstadoFixado);
    salvarPreferenciasPosicao(posicao, novoEstadoFixado);
  };

  const ignorarCliqueAposArraste = (event) => {
    if (Date.now() - ultimoArrasteRef.current < 250) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const botaoPino = (compacto = false) => (
    <button
      type="button"
      className={`dona-nana-pin-btn ${compacto ? 'dona-nana-pin-btn-compacto' : ''}`}
      onClick={alternarPino}
      aria-pressed={fixado}
      aria-label={fixado ? 'Desafixar Dona Nana para permitir arraste' : 'Fixar Dona Nana para impedir arraste'}
      title={fixado ? 'Desafixar balão' : 'Fixar balão'}
    >
      <i className={`bi ${fixado ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`} aria-hidden="true" />
    </button>
  );

  // Salva no localStorage sempre que o array de mensagens mudar
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Falha silenciosa de quota em navegadores restritivos
    }
  }, [messages]);

  // Scroll suave automático para a última mensagem
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Esconde o balãozinho de saudação inicial após 12 segundos ou quando aberto
  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
    setShowGreeting(false);
  };

  const handleClearHistory = () => {
    setMessages([MENSAGEM_INICIAL_PADRAO]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignora
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: createMessageId('u'),
      role: 'user',
      text,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Formata histórico simplificado para o Gemini
      const historicoEnvio = messages
        .filter((m) => m.id !== 'init-1')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const response = await enviarMensagem({
        mensagem: text,
        historico: historicoEnvio,
        contextoOrigem: 'balao',
      });

      const modelMsg = {
        id: createMessageId('m'),
        role: 'model',
        text: response.resposta || 'Estou aqui com você, meu filho! Conte comigo.',
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      const errorMsg = {
        id: createMessageId('err'),
        role: 'model',
        text: err.message || 'Tive um pequeno contratempo para responder, meu querido. Tente novamente em instantes!',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFullTab = () => {
    setIsOpen(false);
    navigate('/dashboard/dona-nana');
  };

  const espacoChatAcima = posicao ? posicao.top - 12 : 0;
  const espacoChatAbaixo = posicao
    ? window.innerHeight - posicao.top - 64 - 24
    : 0;
  const chatAbaixo = Boolean(posicao && espacoChatAbaixo > espacoChatAcima);
  const alturaMaximaChat = posicao
    ? `${Math.max(120, Math.min(520, Math.max(espacoChatAcima, espacoChatAbaixo)))}px`
    : undefined;

  return (
    <div
      ref={widgetRef}
      className={`dona-nana-widget-container ${arrastando ? 'is-dragging' : ''} ${fixado ? 'is-pinned' : ''}`}
      style={
        posicao
          ? {
              left: `${posicao.left}px`,
              top: `${posicao.top}px`,
              right: 'auto',
              bottom: 'auto',
            }
          : undefined
      }
      aria-label="Assistente Virtual Dona Nana"
    >
      {/* Balãozinho prévio de saudação (apenas se fechado) */}
      {!isOpen && showGreeting && (
        <div className="dona-nana-greeting-bubble" onClick={handleToggleOpen} role="button" tabIndex={0}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <strong>Dona Nana</strong>
            <button
              type="button"
              className="btn-close btn-close-white p-0"
              style={{ fontSize: '0.65rem' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowGreeting(false);
              }}
              aria-label="Fechar saudação"
            />
          </div>
          <span>Precisa de uma orientação com o portal, meu filho?</span>
        </div>
      )}

      {/* Card Flutuante de Conversa Rápida */}
      {isOpen && (
        <section
          className={`dona-nana-chat-card ${chatAbaixo ? 'is-below' : ''}`}
          style={alturaMaximaChat ? { maxHeight: alturaMaximaChat } : undefined}
          aria-label="Diálogo rápido com a Dona Nana"
        >
          {/* Cabeçalho */}
          <header className="dona-nana-chat-header">
            <div
              className="dona-nana-chat-drag-handle d-flex align-items-center gap-2"
              onPointerDown={iniciarArraste}
              onPointerMove={moverWidget}
              onPointerUp={finalizarArraste}
              onPointerCancel={finalizarArraste}
            >
              <DonaNanaAvatar size="sm" showBadge />
              <div className="dona-nana-chat-title">
                <h6>Dona Nana</h6>
                <small className="d-flex align-items-center gap-1">
                  <span className="badge bg-success p-1 rounded-circle" style={{ width: 6, height: 6 }}></span>
                  Patrona da Escola
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              {botaoPino(true)}
              <button
                type="button"
                className="btn btn-sm btn-outline-light border-0"
                onClick={handleClearHistory}
                title="Limpar histórico deste balão"
                aria-label="Limpar histórico"
              >
                <i className="bi bi-trash3"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light border-0"
                onClick={handleOpenFullTab}
                title="Abrir aba completa no Dashboard"
                aria-label="Abrir aba completa"
              >
                <i className="bi bi-arrows-angle-expand"></i>
              </button>
              <button
                type="button"
                className="btn-close btn-close-white ms-1"
                onClick={handleToggleOpen}
                aria-label="Minimizar Dona Nana"
              />
            </div>
          </header>

          {/* Área de Mensagens */}
          <div className="dona-nana-messages-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`dona-nana-msg-row ${
                  msg.role === 'user' ? 'dona-nana-msg-user' : 'dona-nana-msg-model'
                }`}
              >
                {msg.role === 'model' && <DonaNanaAvatar size="sm" />}
                <div className="dona-nana-msg-bubble">{msg.text}</div>
              </div>
            ))}

            {loading && (
              <div className="dona-nana-msg-row dona-nana-msg-model">
                <DonaNanaAvatar size="sm" />
                <div className="dona-nana-msg-bubble bg-light text-muted fst-italic">
                  <div className="spinner-border spinner-border-sm text-warning me-2" role="status" />
                  Dona Nana está escrevendo com carinho...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips de Perguntas Frequentes */}
          <div className="dona-nana-chips-wrapper">
            {SUGESTOES_RAPIDAS.map((sugestao, idx) => (
              <button
                key={idx}
                type="button"
                className="dona-nana-chip-btn"
                disabled={loading}
                onClick={() => handleSendMessage(sugestao)}
              >
                {sugestao}
              </button>
            ))}
          </div>

          {/* Formulário de Envio */}
          <footer className="dona-nana-chat-footer">
            <form
              className="dona-nana-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                className="form-control"
                placeholder="Pergunte algo à Dona Nana..."
                value={inputMessage}
                disabled={loading}
                onChange={(e) => setInputMessage(e.target.value)}
                maxLength={2000}
                aria-label="Mensagem para Dona Nana"
              />
              <button
                type="submit"
                className="btn btn-primary dona-nana-send-btn"
                disabled={loading || !inputMessage.trim()}
                aria-label="Enviar mensagem"
              >
                <i className="bi bi-send-fill fs-6"></i>
              </button>
            </form>
          </footer>
        </section>
      )}

      {/* Botão de Disparo Flutuante */}
      <div className="dona-nana-widget-controls">
        <button
          type="button"
          className="dona-nana-trigger-btn"
          onPointerDown={iniciarArraste}
          onPointerMove={moverWidget}
          onPointerUp={finalizarArraste}
          onPointerCancel={finalizarArraste}
          onClick={(event) => {
            ignorarCliqueAposArraste(event);
            if (Date.now() - ultimoArrasteRef.current >= 250) handleToggleOpen();
          }}
          aria-expanded={isOpen}
          aria-label="Abrir assistente virtual Dona Nana"
        >
          <DonaNanaAvatar size="md" showBadge />
          <span className="dona-nana-trigger-label">Dona Nana</span>
          <span className="dona-nana-trigger-badge">Ajuda</span>
        </button>
        {botaoPino()}
      </div>
    </div>
  );
};

export default DonaNanaFloatingWidget;
