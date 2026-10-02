import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const LoginSection = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
                
                {/* Cabeçalho do Formulário */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark mb-2">Acesso ao Portal</h2>
                  <p className="text-secondary small">
                    Informe suas credenciais para acessar o painel.
                  </p>
                </div>

                {/* Alerta de erro */}
                {error && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    {error}
                  </div>
                )}

                {/* Formulário de Login */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="loginEmail" className="form-label fw-medium text-dark">
                      E-mail
                    </label>
                    <input 
                      type="email" 
                      className="form-control form-control-lg bg-light border-0 shadow-none" 
                      id="loginEmail" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="loginPassword" className="form-label fw-medium text-dark">
                      Senha
                    </label>
                    <input 
                      type="password" 
                      className="form-control form-control-lg bg-light border-0 shadow-none" 
                      id="loginPassword" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <div className="d-grid mt-5">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg fw-semibold py-3 shadow-sm"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginSection;