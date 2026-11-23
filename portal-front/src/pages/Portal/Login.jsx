import { useEffect, useRef, useState } from "react";
// Import em minúsculo para compatibilidade com sistemas de arquivos case-sensitive
import "./login.css";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const LoginSection = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Mantém referência atualizada da função de login Google sem disparar re-execução do useEffect
  const loginWithGoogleRef = useRef(loginWithGoogle);
  const navigateRef = useRef(navigate);
  useEffect(() => {
    loginWithGoogleRef.current = loginWithGoogle;
    navigateRef.current = navigate;
  }, [loginWithGoogle, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  // Controla a exibição do formulário secundário de acesso por Usuário e Senha (inicia recolhido para priorizar o Google)
  const [mostrarLoginCredenciais, setMostrarLoginCredenciais] = useState(false);

  // Inicializa o Google Identity Services (GIS) uma única vez na montagem e renderiza o botão oficial
  useEffect(() => {
    // Client ID do Google OAuth institucional (lido exclusivamente de VITE_GOOGLE_CLIENT_ID no .env)
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

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
            // Envia o id_token (JWT) do Google para validação e emissão do token Sanctum no Laravel
            await loginWithGoogleRef.current({ credential: response.credential });
            navigateRef.current("/dashboard");
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
          width: 380,
        });
      }

      return true;
    };

    // Tenta inicializar de imediato caso o script já esteja carregado
    if (initGoogle()) return;

    // Caso o script do Google ainda esteja baixando (async/defer), verifica a cada 250ms
    const interval = setInterval(() => {
      if (initGoogle()) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

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
      <div className="container py-2">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-11 col-md-10 col-lg-8 col-xl-7">
            
            {/* Padrão de Mercado: Formulário encapsulado em um Card com sombra */}
            <div className="card portal-login-card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5">
                
                {/* Cabeçalho do Formulário: orienta alunos e professores ao login institucional prioritário */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark mb-3">Acesso ao Portal</h2>
                  <p className="text-secondary fs-6 mb-0 px-md-3">
                    Alunos e professores: acessem prioritariamente com sua conta{" "}
                    <strong>Google institucional</strong> (<code>@aluno.mg.gov.br</code> ou{" "}
                    <code>@educacao.mg.gov.br</code>).
                  </p>
                </div>

                {/* Alerta de erro exibido no topo para cobrir tanto falhas do Google quanto de credenciais */}
                {error && (
                  <div className="alert alert-danger py-2 small mb-4" role="alert">
                    {error}
                  </div>
                )}

                {/* Botão Oficial Prioritário: Renderização direta do Google Identity Services com FedCM */}
                <div className="portal-google-highlight d-flex flex-column align-items-center p-4 rounded-4 mb-4">
                  <span className="badge rounded-pill text-bg-light border text-secondary small fw-semibold mb-3 px-3 py-2">
                    <i className="bi bi-shield-check text-success me-1" aria-hidden="true"></i>
                    Acesso Institucional Recomendado
                  </span>
                  {googleSubmitting && (
                    <div className="spinner-border text-primary mb-3" role="status">
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

                {/* Botão expansível discreto para revelar o login por Usuário e Senha (administrativo/credenciais) */}
                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn portal-login-toggle-btn d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill text-secondary fw-medium"
                    onClick={() => setMostrarLoginCredenciais((prev) => !prev)}
                    aria-expanded={mostrarLoginCredenciais}
                    aria-controls="collapseLoginCredenciais"
                  >
                    <span>Acesso com Usuário e Senha</span>
                    <i
                      className={`bi ${mostrarLoginCredenciais ? "bi-chevron-up" : "bi-chevron-down"}`}
                      aria-hidden="true"
                    ></i>
                  </button>
                </div>

                {/* Formulário Secundário Recolhido: exibido apenas quando o usuário expande */}
                {mostrarLoginCredenciais && (
                  <div id="collapseLoginCredenciais" className="portal-login-collapsible mt-3 pt-3 border-top">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="loginUsuario" className="form-label fw-medium text-dark small">
                          Usuário
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg bg-light border-0 shadow-none"
                          id="loginUsuario"
                          placeholder="Digite seu usuário"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="username"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="loginPassword" className="form-label fw-medium text-dark small">
                          Senha
                        </label>
                        <input
                          type="password"
                          className="form-control form-control-lg bg-light border-0 shadow-none"
                          id="loginPassword"
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                      </div>

                      <div className="d-grid">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg fw-semibold py-2 shadow-sm"
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