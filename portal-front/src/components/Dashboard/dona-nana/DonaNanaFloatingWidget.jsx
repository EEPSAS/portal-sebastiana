/**
 * DonaNanaFloatingWidget.jsx - Balão Flutuante da Dona Nana no Canto Inferior Direito
 *
 * Papel Didático:
 * Oferece suporte rápido e contextual acessível em qualquer página do Dashboard:
 * 1. Posição fixa no canto inferior direito (`bottom: 24px; right: 24px;`);
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

const DonaNanaFloatingWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
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

  return (
    <div className="dona-nana-widget-container" aria-label="Assistente Virtual Dona Nana">
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
        <section className="dona-nana-chat-card" aria-label="Diálogo rápido com a Dona Nana">
          {/* Cabeçalho */}
          <header className="dona-nana-chat-header">
            <div className="d-flex align-items-center gap-2">
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
      <button
        type="button"
        className="dona-nana-trigger-btn"
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-label="Abrir assistente virtual Dona Nana"
      >
        <DonaNanaAvatar size="md" showBadge />
        <span className="dona-nana-trigger-label">Dona Nana</span>
        <span className="dona-nana-trigger-badge">Ajuda</span>
      </button>
    </div>
  );
};

export default DonaNanaFloatingWidget;
