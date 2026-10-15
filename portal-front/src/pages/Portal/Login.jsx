import { useEffect, useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const LoginSection = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Inicializa o Google Identity Services (GIS) quando disponível e renderiza o botão oficial
  useEffect(() => {
    // Client ID do Google OAuth institucional (lido do .env com fallback seguro)
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "165413597858-7eavnsmrf0am8gukjeo8itrbe6gcvbtn.apps.googleusercontent.com";

    // Função para inicializar e renderizar o botão oficial do Google
    const initGoogle = () => {
      if (!googleClientId || !window.google?.accounts?.id) return false;

      // Inicialização segura com suporte a FedCM ativado
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          if (!response?.credential) return;
          setGoogleSubmitting(true);
          setError(null);
          try {
            // Envia o id_token do Google para autenticação no backend Laravel
            await loginWithGoogle({ credential: response.credential });
            navigate("/dashboard");
          } catch (err) {
            setError(err.message);
          } finally {
            setGoogleSubmitting(false);
          }
        },
      });

      // Renderiza o botão oficial do Google no contêiner dedicado
      const buttonTarget = document.getElementById("googleButtonContainer");
      if (buttonTarget) {
        buttonTarget.innerHTML = "";
        window.google.accounts.id.renderButton(buttonTarget, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 320,
        });
      }

      return true;
    };

    // Tenta inicializar de imediato
    if (initGoogle()) return;

    // Caso o script do Google ainda esteja baixando (async/defer), tenta a cada 250ms
    const interval = setInterval(() => {
      if (initGoogle()) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [loginWithGoogle, navigate]);

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
    <section className="portal-login-section">
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
                    Identifique-se com sua conta Google institucional ou credenciais.
                  </p>
                </div>

                {/* Botão Oficial: Renderização direta do Google Identity Services com FedCM */}
                <div className="d-flex flex-column align-items-center mb-4">
                  {googleSubmitting && (
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Conectando ao Google...</span>
                    </div>
                  )}
                  <div
                    id="googleButtonContainer"
                    data-testid="loginwithgoogle"
                    className="w-100 d-flex justify-content-center"
                    style={{ minHeight: "44px" }}
                  ></div>
                </div>

                {/* Divisor Visual */}
                <div className="d-flex align-items-center mb-4">
                  <hr className="flex-grow-1 my-0 text-muted" />
                  <span className="px-3 text-secondary small fw-medium text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                    ou acesse com e-mail e senha
                  </span>
                  <hr className="flex-grow-1 my-0 text-muted" />
                </div>

                {/* Alerta de erro */}
                {error && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    {error}
                  </div>
                )}

                {/* Formulário de Login Tradicional */}
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