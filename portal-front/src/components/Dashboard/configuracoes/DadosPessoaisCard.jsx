/**
 * DadosPessoaisCard.jsx - Formulário de Informações Pessoais e Contato
 *
 * Papel Didático:
 * Permite a edição do apelido (nickname), nome institucional, telefone com máscara
 * e data de nascimento com sincronização bidirecional automática com a Agenda Escolar.
 */

import { useState } from 'react';
import { atualizarPerfil } from '../../../services/usuarioService';

// Aplica máscara automática de telefone brasileiro (DDD + 8 ou 9 dígitos)
const formatarTelefone = (valor) => {
  if (!valor) return '';
  const apenasDigitos = valor.replace(/\D/g, '').slice(0, 11);
  if (apenasDigitos.length <= 2) return `(${apenasDigitos}`;
  if (apenasDigitos.length <= 6) return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2)}`;
  if (apenasDigitos.length <= 10) {
    return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 6)}-${apenasDigitos.slice(6)}`;
  }
  return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 7)}-${apenasDigitos.slice(7, 11)}`;
};

const DadosPessoaisCard = ({ user, onUserUpdated }) => {
  // Verifica se o usuário autenticado possui perfil de Administrador (permite editar também Nome e E-mail/Usuário)
  const isAdmin = user?.role === 'adm' || user?.realRole === 'adm';

  // Função auxiliar para montar o estado inicial/resetado a partir do user atual
  const montarEstadoInicial = (u) => ({
    name: u?.name || '',
    nickname: u?.nickname || '',
    email: u?.email || '',
    telefone: formatarTelefone(u?.telefone || ''),
    data_nascimento: u?.data_nascimento ? u.data_nascimento.slice(0, 10) : '',
  });

  const [formData, setFormData] = useState(() => montarEstadoInicial(user));
  // Controla o bloqueio do formulário: inicia bloqueado (false) e só libera após clicar em "Editar"
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erros, setErros] = useState({});

  // Cancela a edição restaurando os valores originais do usuário e voltando a bloquear o formulário
  const handleCancelarEdicao = () => {
    setFormData(montarEstadoInicial(user));
    setErros({});
    setEditando(false);
  };

  // Atualiza os campos do formulário
  const handleChange = (e) => {
    if (!editando) return;
    const { name, value } = e.target;
    if (name === 'telefone') {
      setFormData((prev) => ({ ...prev, [name]: formatarTelefone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Limpa erro do campo alterado
    if (erros[name]) {
      setErros((prev) => {
        const novos = { ...prev };
        delete novos[name];
        return novos;
      });
    }
  };

  // Remove a data de nascimento do formulário
  const handleLimparDataNascimento = () => {
    if (!editando) return;
    setFormData((prev) => ({ ...prev, data_nascimento: '' }));
  };

  // Submete o formulário de atualização e retorna o card para o estado bloqueado
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setMensagemSucesso('');
    setErros({});

    try {
      // Envia os campos editáveis; se for Administrador, inclui também nome completo e e-mail/usuário
      const payload = {
        nickname: formData.nickname.trim() || null,
        telefone: formData.telefone.trim() || null,
        data_nascimento: formData.data_nascimento || null,
      };

      if (isAdmin) {
        if (!formData.name.trim()) {
          setErros({ name: ['O nome completo é obrigatório.'] });
          setSalvando(false);
          return;
        }
        payload.name = formData.name.trim();
        payload.email = formData.email.trim() || formData.name.trim().toLowerCase();
      }

      const usuarioAtualizado = await atualizarPerfil(user.id, payload);
      onUserUpdated(usuarioAtualizado);
      setFormData(montarEstadoInicial(usuarioAtualizado));
      setEditando(false);
      setMensagemSucesso('Dados pessoais atualizados com sucesso!');

      setTimeout(() => {
        setMensagemSucesso('');
      }, 5000);
    } catch (err) {
      if (err.errors) {
        setErros(err.errors);
      } else {
        setErros({ geral: err.message || 'Erro ao salvar os dados.' });
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 p-3 p-md-4 flex-grow-1 d-flex flex-column">
      <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1">
        {/* Cabeçalho do Card com botão Editar / Salvar alinhado à direita na mesma altura do título */}
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              <i className="bi bi-person-lines-fill text-primary me-2"></i>
              Informações Pessoais
            </h5>
            <p className="text-muted small mb-0">
              Mantenha seus dados de contato e preferências sempre em dia.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            {!editando ? (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 fw-semibold"
                onClick={() => {
                  setMensagemSucesso('');
                  setEditando(true);
                }}
              >
                <i className="bi bi-pencil-square"></i>
                Editar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-pill px-3 py-1 fw-medium text-secondary border"
                  onClick={handleCancelarEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 fw-semibold"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>
                      Salvar Alterações
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alertas */}
        {mensagemSucesso && (
          <div className="alert alert-success d-flex align-items-center py-2 px-3 small rounded-3 mb-3">
            <i className="bi bi-check-circle-fill me-2 fs-6"></i>
            <div>{mensagemSucesso}</div>
          </div>
        )}
        {erros.geral && (
          <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
            <div>{erros.geral}</div>
          </div>
        )}

        <div className="row g-3 my-auto">
          {/* Nome Institucional Completo (Bloqueado para usuários comuns; editável para Administrador) */}
          <div className="col-12 col-md-6">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-dark mb-0">
                Nome Completo Institucional
              </label>
              {!isAdmin && (
                <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.72rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Bloqueado
                </span>
              )}
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-person-fill"></i>
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isAdmin || !editando || salvando}
                readOnly={!isAdmin}
                className={`form-control border-start-0 ${!isAdmin || !editando ? 'bg-light text-muted' : ''} ${erros.name ? 'is-invalid' : ''}`}
                style={!isAdmin ? { cursor: 'not-allowed' } : undefined}
                title={!isAdmin ? 'O nome institucional não pode ser alterado pelo usuário.' : undefined}
              />
            </div>
            {erros.name && <div className="text-danger small mt-1">{erros.name[0]}</div>}
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              {isAdmin ? 'Como Administrador, você pode editar seu nome completo.' : 'Nome vinculado à sua conta institucional.'}
            </small>
          </div>

          {/* E-mail Institucional / Usuário (Bloqueado para usuários comuns; editável para Administrador) */}
          <div className="col-12 col-md-6">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-dark mb-0">
                {isAdmin ? 'Usuário / E-mail de Acesso' : 'E-mail Institucional'}
              </label>
              {!isAdmin && (
                <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.72rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Bloqueado
                </span>
              )}
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-envelope-fill"></i>
              </span>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isAdmin || !editando || salvando}
                readOnly={!isAdmin}
                className={`form-control border-start-0 ${!isAdmin || !editando ? 'bg-light text-muted' : ''} ${erros.email ? 'is-invalid' : ''}`}
                style={!isAdmin ? { cursor: 'not-allowed' } : undefined}
                title={!isAdmin ? 'O e-mail institucional não pode ser alterado diretamente pelo usuário.' : undefined}
              />
            </div>
            {erros.email && <div className="text-danger small mt-1">{erros.email[0]}</div>}
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              {isAdmin ? 'Identificador de login do Administrador (não exige e-mail institucional).' : 'Identificador único vinculado à matrícula/conta institucional.'}
            </small>
          </div>

          {/* Nickname / Nome de Exibição */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Apelido / Como prefere ser chamado (Nickname)
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-tag-fill"></i>
              </span>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                disabled={!editando || salvando}
                placeholder="Ex: Bia, Prof. Carlos, Leo"
                className={`form-control border-start-0 ${!editando ? 'bg-light text-muted' : ''} ${erros.nickname ? 'is-invalid' : ''}`}
                maxLength={50}
              />
            </div>
            {erros.nickname && <div className="text-danger small mt-1">{erros.nickname[0]}</div>}
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Substitui o nome longo nas mensagens e saudações do painel.
            </small>
          </div>

          {/* Telefone / WhatsApp */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark mb-1">
              Telefone / WhatsApp
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-telephone-fill"></i>
              </span>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                disabled={!editando || salvando}
                placeholder="(31) 99999-9999"
                className={`form-control border-start-0 ${!editando ? 'bg-light text-muted' : ''} ${erros.telefone ? 'is-invalid' : ''}`}
                maxLength={15}
              />
            </div>
            {erros.telefone && <div className="text-danger small mt-1">{erros.telefone[0]}</div>}
          </div>

          {/* Data de Nascimento */}
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-dark mb-0">
                Data de Nascimento
              </label>
              {editando && formData.data_nascimento && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-danger text-decoration-none p-0 d-flex align-items-center gap-1"
                  onClick={handleLimparDataNascimento}
                  title="Excluir data de nascimento"
                >
                  <i className="bi bi-x-circle"></i>
                  Remover data
                </button>
              )}
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-calendar-event"></i>
              </span>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                disabled={!editando || salvando}
                className={`form-control border-start-0 ${!editando ? 'bg-light text-muted' : ''} ${erros.data_nascimento ? 'is-invalid' : ''}`}
              />
            </div>
            {erros.data_nascimento && (
              <div className="text-danger small mt-1">{erros.data_nascimento[0]}</div>
            )}

            {/* Aviso Didático de Sincronização com o Calendário */}
            <div className="d-flex align-items-start gap-2 bg-primary-subtle text-primary-emphasis p-2 px-3 rounded-3 mt-2 border border-primary-subtle">
              <i className="bi bi-calendar-heart fs-6 flex-shrink-0 mt-1"></i>
              <div className="small">
                <strong>Sincronização com a Agenda:</strong> Ao cadastrar ou atualizar sua data de nascimento, seu aniversário é automaticamente adicionado ao calendário escolar. Se você remover a data ou o evento na agenda, ambos permanecerão sincronizados.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DadosPessoaisCard;
