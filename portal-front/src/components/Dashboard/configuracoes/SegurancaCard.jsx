/**
 * SegurancaCard.jsx - Gestão de Senha e Segurança da Conta
 *
 * Papel Didático:
 * Permite aos usuários com autenticação tradicional alterar sua senha de acesso.
 * Usuários cadastrados com Google OAuth são informados de forma didática sobre o
 * gerenciamento centralizado de credenciais.
 */

import { useState } from 'react';
import { atualizarPerfil } from '../../../services/usuarioService';

const SegurancaCard = ({ user }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Controla o bloqueio do formulário de senha: inicia bloqueado (false) e libera ao clicar em "Editar"
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erros, setErros] = useState({});

  const somenteGoogle = Boolean(user?.google_vinculado && !user?.tem_senha);

  // Cancela a edição limpando os campos de senha e voltando a bloquear o formulário
  const handleCancelarEdicao = () => {
    setFormData({
      current_password: '',
      password: '',
      password_confirmation: '',
    });
    setErros({});
    setEditando(false);
  };

  // Atualiza o campo digitado e limpa mensagens de erro associadas àquele input
  const handleChange = (e) => {
    if (!editando) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) {
      setErros((prev) => {
        const novos = { ...prev };
        delete novos[name];
        return novos;
      });
    }
  };

  // Valida o tamanho mínimo e a confirmação da nova senha antes de enviar o PUT para a API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setMensagemSucesso('');
    setErros({});

    // Validação rápida no cliente para evitar requisição desnecessária com senha curta
    if (formData.password.length < 8) {
      setErros({ password: ['A nova senha deve ter pelo menos 8 caracteres.'] });
      setSalvando(false);
      return;
    }

    // Garante que os dois campos de nova senha sejam idênticos antes do envio
    if (formData.password !== formData.password_confirmation) {
      setErros({ password_confirmation: ['A confirmação da nova senha não confere.'] });
      setSalvando(false);
      return;
    }

    try {
      const payload = {
        name: user.name,
        email: user.email,
        password: formData.password,
      };

      // Se o usuário já possui senha local, envia current_password para validação no UpdateUsuarioRequest
      if (user.tem_senha && formData.current_password) {
        payload.current_password = formData.current_password;
      }

      await atualizarPerfil(user.id, payload);
      setMensagemSucesso('Senha atualizada com sucesso!');
      setFormData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setEditando(false);

      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err) {
      if (err.errors) {
        setErros(err.errors);
      } else {
        setErros({ geral: err.message || 'Erro ao atualizar a senha.' });
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 p-3 p-md-4 flex-grow-1 d-flex flex-column">
      <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1">
        {/* Cabeçalho do Card com botão Editar / Atualizar Senha alinhado à direita na mesma altura do título */}
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              <i className="bi bi-shield-lock-fill text-primary me-2"></i>
              Segurança e Acesso
            </h5>
            <p className="text-muted small mb-0">
              Gerencie a senha de autenticação da sua conta no portal escolar.
            </p>
          </div>

          {!somenteGoogle && (
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
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check"></i>
                        Atualizar Senha
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
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

        {/* Caso seja conta exclusiva do Google sem senha local definida */}
        {somenteGoogle ? (
          <div className="p-3 bg-light rounded-3 border text-center my-auto">
            <i className="bi bi-google text-danger fs-3 mb-1 d-block"></i>
            <h6 className="fw-bold text-dark mb-1">Autenticação Gerenciada pelo Google</h6>
            <p className="text-muted small mb-0">
              Sua conta utiliza o login seguro institucional do Google. Não é necessário criar ou gerenciar senhas locais avulsas.
            </p>
          </div>
        ) : (
          <div className="row g-3 my-auto">
            {user?.tem_senha && (
              <div className="col-12">
                <label className="form-label small fw-semibold text-dark mb-1">
                  Senha Atual <span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-key-fill"></i>
                  </span>
                  <input
                    type="password"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    disabled={!editando || salvando}
                    required={editando}
                    placeholder="Digite sua senha atual"
                    className={`form-control border-start-0 ${!editando ? 'bg-light text-muted' : ''} ${erros.current_password ? 'is-invalid' : ''}`}
                  />
                </div>
                {erros.current_password && (
                  <div className="text-danger small mt-1">{erros.current_password[0]}</div>
                )}
              </div>
            )}

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark mb-1">
                Nova Senha <span className="text-danger">*</span>
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={!editando || salvando}
                  required={editando}
                  placeholder="Mínimo 8 dígitos"
                  className={`form-control border-start-0 ${!editando ? 'bg-light text-muted' : ''} ${erros.password ? 'is-invalid' : ''}`}
                />
              </div>
              {erros.password && <div className="text-danger small mt-1">{erros.password[0]}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark mb-1">
                Confirmar Nova Senha <span className="text-danger">*</span>
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  disabled={!editando || salvando}
                  required={editando}
                  placeholder="Repita a nova senha"
                  className={`form-control border-start-0 ${!editando ? 'bg-light text-muted' : ''} ${erros.password_confirmation ? 'is-invalid' : ''}`}
                />
              </div>
              {erros.password_confirmation && (
                <div className="text-danger small mt-1">{erros.password_confirmation[0]}</div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SegurancaCard;
