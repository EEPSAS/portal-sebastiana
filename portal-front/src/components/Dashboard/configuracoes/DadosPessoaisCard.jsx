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
  const [formData, setFormData] = useState(() => ({
    name: user?.name || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
    telefone: formatarTelefone(user?.telefone || ''),
    data_nascimento: user?.data_nascimento ? user.data_nascimento.slice(0, 10) : '',
  }));

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erros, setErros] = useState({});

  // Atualiza os campos do formulário
  const handleChange = (e) => {
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
    setFormData((prev) => ({ ...prev, data_nascimento: '' }));
  };

  // Submete o formulário de atualização
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso('');
    setErros({});

    try {
      // Envia apenas os campos editáveis; nome e e-mail institucionais são bloqueados
      const payload = {
        nickname: formData.nickname.trim() || null,
        telefone: formData.telefone.trim() || null,
        data_nascimento: formData.data_nascimento || null,
      };

      const usuarioAtualizado = await atualizarPerfil(user.id, payload);
      onUserUpdated(usuarioAtualizado);
      setFormData({
        name: usuarioAtualizado.name || '',
        nickname: usuarioAtualizado.nickname || '',
        email: usuarioAtualizado.email || '',
        telefone: formatarTelefone(usuarioAtualizado.telefone || ''),
        data_nascimento: usuarioAtualizado.data_nascimento ? usuarioAtualizado.data_nascimento.slice(0, 10) : '',
      });
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
    <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
      <h5 className="fw-bold text-dark mb-1">
        <i className="bi bi-person-lines-fill text-primary me-2"></i>
        Informações Pessoais
      </h5>
      <p className="text-muted small mb-4">
        Mantenha seus dados de contato e preferências sempre em dia.
      </p>

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

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Nome Institucional Completo (Bloqueado para edição: vem do e-mail institucional) */}
          <div className="col-12 col-md-6">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-dark mb-0">
                Nome Completo Institucional
              </label>
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-lock-fill me-1"></i>Bloqueado
              </span>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-person-fill"></i>
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                disabled
                readOnly
                className="form-control border-start-0 bg-light text-muted"
                style={{ cursor: 'not-allowed' }}
                title="O nome institucional não pode ser alterado pelo usuário."
              />
            </div>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Nome vinculado à sua conta institucional.
            </small>
          </div>

          {/* E-mail Institucional (Bloqueado para edição) */}
          <div className="col-12 col-md-6">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-dark mb-0">
                E-mail Institucional
              </label>
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-0" style={{ fontSize: '0.72rem' }}>
                <i className="bi bi-lock-fill me-1"></i>Bloqueado
              </span>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-envelope-fill"></i>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                readOnly
                className="form-control border-start-0 bg-light text-muted"
                style={{ cursor: 'not-allowed' }}
                title="O e-mail institucional não pode ser alterado diretamente pelo usuário."
              />
            </div>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Identificador único vinculado à matrícula/conta institucional.
            </small>
          </div>

          {/* Nickname / Nome de Exibição */}
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-dark">
              Apelido / Como prefere ser chamado (Nickname)
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-tag-fill"></i>
              </span>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="Ex: Bia, Prof. Carlos, Leo"
                className={`form-control border-start-0 ${erros.nickname ? 'is-invalid' : ''}`}
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
            <label className="form-label small fw-semibold text-dark">
              Telefone / WhatsApp
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-telephone-fill"></i>
              </span>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(31) 99999-9999"
                className={`form-control border-start-0 ${erros.telefone ? 'is-invalid' : ''}`}
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
              {formData.data_nascimento && (
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
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-calendar-event"></i>
              </span>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className={`form-control border-start-0 ${erros.data_nascimento ? 'is-invalid' : ''}`}
              />
            </div>
            {erros.data_nascimento && (
              <div className="text-danger small mt-1">{erros.data_nascimento[0]}</div>
            )}

            {/* Aviso Didático de Sincronização com o Calendário */}
            <div className="d-flex align-items-start gap-2 bg-primary-subtle text-primary-emphasis p-3 rounded-3 mt-3 border border-primary-subtle">
              <i className="bi bi-calendar-heart fs-5 flex-shrink-0 mt-1"></i>
              <div className="small">
                <strong>Sincronização com a Agenda:</strong> Ao cadastrar ou atualizar sua data de nascimento, seu aniversário é automaticamente adicionado ao calendário escolar. Se você remover a data ou o evento na agenda, ambos permanecerão sincronizados.
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="col-12 d-flex justify-content-end mt-4">
            <button
              type="submit"
              className="btn btn-primary rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg fs-6"></i>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DadosPessoaisCard;
