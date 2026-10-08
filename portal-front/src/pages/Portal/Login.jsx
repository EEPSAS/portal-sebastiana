import { useState } from "react";
import { useNavigate } from "react-router";
import { login, register, startDemoSession } from "../../services/portalApi";

const LoginSection = () => {
  const navigate = useNavigate();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '', confirmacaoSenha: '' });

  const handleEntradaDesenvolvedor = () => {
    startDemoSession();
    navigate('/dashboard/biblioteca', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      if (modoCadastro) {
        await register({
          name: formulario.nome,
          email: formulario.email,
          password: formulario.senha,
          password_confirmation: formulario.confirmacaoSenha
        });
      } else {
        await login({ email: formulario.email, password: formulario.senha });
      }

      navigate('/dashboard/biblioteca', { replace: true });
    } catch (error) {
      setErro(error.status === 401
        ? `${error.message} No primeiro acesso, selecione "Criar conta".`
        : error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="bg-light py-5 min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            
            {/* Padrão de Mercado: Formulário encapsulado em um Card com sombra */}
            <div className="card portal-login-card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5">
                
                {/* Cabeçalho do Formulário (Adicionado para Padrão de Mercado) */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark mb-2">{modoCadastro ? 'Criar conta' : 'Entrar no portal'}</h2>
                  <p className="text-secondary small mb-0">Acesse sua biblioteca e seus planos de estudo.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {modoCadastro && (
                    <div className="mb-3">
                      <label htmlFor="nome" className="form-label fw-medium text-dark">Nome</label>
                      <input id="nome" name="nome" type="text" className="form-control form-control-lg bg-light border-0 shadow-none" value={formulario.nome} onChange={(event) => setFormulario({ ...formulario, nome: event.target.value })} autoComplete="name" required />
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium text-dark">E-mail</label>
                    <input id="email" name="email" type="email" className="form-control form-control-lg bg-light border-0 shadow-none" value={formulario.email} onChange={(event) => setFormulario({ ...formulario, email: event.target.value })} autoComplete="email" required />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="senha" className="form-label fw-medium text-dark">Senha</label>
                    <input id="senha" name="senha" type="password" className="form-control form-control-lg bg-light border-0 shadow-none" value={formulario.senha} onChange={(event) => setFormulario({ ...formulario, senha: event.target.value })} autoComplete={modoCadastro ? 'new-password' : 'current-password'} minLength={modoCadastro ? 8 : undefined} required />
                  </div>

                  {modoCadastro && (
                    <div className="mb-3">
                      <label htmlFor="confirmacao-senha" className="form-label fw-medium text-dark">Confirmar senha</label>
                      <input id="confirmacao-senha" name="confirmacaoSenha" type="password" className="form-control form-control-lg bg-light border-0 shadow-none" value={formulario.confirmacaoSenha} onChange={(event) => setFormulario({ ...formulario, confirmacaoSenha: event.target.value })} autoComplete="new-password" minLength={8} required />
                    </div>
                  )}

                  {erro && <div className="alert alert-danger py-2" role="alert" style={{ fontSize: '13px' }}>{erro}</div>}
                  
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg fw-semibold py-3 shadow-sm" disabled={enviando}>
                      {enviando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => setModoCadastro((valorAtual) => !valorAtual)}
                  >
                    {modoCadastro ? 'Já tenho conta. Entrar' : 'Ainda não tenho conta. Criar conta'}
                  </button>
                </div>

                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={handleEntradaDesenvolvedor}
                    className="btn w-100 text-white fw-bold mb-3 mt-2"
                    style={{ backgroundColor: '#e6007e', border: 'none', borderRadius: '8px' }}
                  >
                    Entrar (Modo Dev) 🚀
                  </button>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginSection;