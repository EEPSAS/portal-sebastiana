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

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erros, setErros] = useState({});

  const handleChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso('');
    setErros({});

    if (formData.password.length < 8) {
      setErros({ password: ['A nova senha deve ter pelo menos 8 caracteres.'] });
      setSalvando(false);
      return;
    }

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
    <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
      <h5 className="fw-bold text-dark mb-1">
        <i className="bi bi-shield-lock-fill text-primary me-2"></i>
        Segurança e Acesso
      </h5>
      <p className="text-muted small mb-4">
        Gerencie a senha de autenticação da sua conta no portal escolar.
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

      {/* Caso seja conta exclusiva do Google sem senha local definida */}
      {user?.google_vinculado && !user?.tem_senha ? (
        <div className="p-3 bg-light rounded-3 border text-center my-auto">
          <i className="bi bi-google text-danger fs-1 mb-2 d-block"></i>
          <h6 className="fw-bold text-dark mb-1">Autenticação Gerenciada pelo Google</h6>
          <p className="text-muted small mb-0">
            Sua conta utiliza o login seguro institucional do Google. Não é necessário criar ou gerenciar senhas locais avulsas.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {user?.tem_senha && (
              <div className="col-12">
                <label className="form-label small fw-semibold text-dark">
                  Senha Atual <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-key-fill"></i>
                  </span>
                  <input
                    type="password"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    required
                    placeholder="Digite sua senha atual"
                    className={`form-control border-start-0 ${erros.current_password ? 'is-invalid' : ''}`}
                  />
                </div>
                {erros.current_password && (
                  <div className="text-danger small mt-1">{erros.current_password[0]}</div>
                )}
              </div>
            )}

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Nova Senha <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Mínimo 8 dígitos"
                  className={`form-control border-start-0 ${erros.password ? 'is-invalid' : ''}`}
                />
              </div>
              {erros.password && <div className="text-danger small mt-1">{erros.password[0]}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Confirmar Nova Senha <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  placeholder="Repita a nova senha"
                  className={`form-control border-start-0 ${erros.password_confirmation ? 'is-invalid' : ''}`}
                />
              </div>
              {erros.password_confirmation && (
                <div className="text-danger small mt-1">{erros.password_confirmation[0]}</div>
              )}
            </div>

            <div className="col-12 d-flex justify-content-end mt-4">
              <button
                type="submit"
                className="btn btn-outline-primary rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold"
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
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SegurancaCard;
