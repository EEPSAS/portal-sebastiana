import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../../services/authService';

const LoginSection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Não foi possível entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-light py-5 min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            
            <div className="card portal-login-card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark mb-2">Entrar no portal</h2>
                  <p className="text-secondary small">Use suas credenciais institucionais.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="exampleInputEmail1" className="form-label fw-medium text-dark">
                      E-mail
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg bg-light border-0 shadow-none"
                      id="exampleInputEmail1"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="exampleInputPassword1" className="form-label fw-medium text-dark">
                      Senha
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg bg-light border-0 shadow-none"
                      id="exampleInputPassword1"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(inputEvent) => setPassword(inputEvent.target.value)}
                    />
                  </div>

                  {error && <p className="text-danger small" role="alert">{error}</p>}

                  <div className="d-grid mt-5">
                    <button type="submit" className="btn btn-primary btn-lg fw-semibold py-3 shadow-sm" disabled={isSubmitting}>
                      {isSubmitting ? 'Entrando...' : 'Entrar'}
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