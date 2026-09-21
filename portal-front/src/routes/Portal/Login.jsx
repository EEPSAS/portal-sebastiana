import { useNavigate } from "react-router";

const LoginSection = () => {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return (
    <section className="bg-light py-5 min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            
            {/* Padrão de Mercado: Formulário encapsulado em um Card com sombra */}
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5">
                
                {/* Cabeçalho do Formulário (Adicionado para Padrão de Mercado) */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark mb-2">Título do Formulário</h2>
                  <p className="text-secondary small">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>

                {/* Formulário Original Preservado e Estilizado */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="exampleInputEmail1" className="form-label fw-medium text-dark">
                      Email address
                    </label>
                    <input 
                      type="email" 
                      className="form-control form-control-lg bg-light border-0 shadow-none" 
                      id="exampleInputEmail1" 
                      aria-describedby="emailHelp" 
                    />
                    <div id="emailHelp" className="form-text small text-muted">
                      We'll never share your email with anyone else.
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="exampleInputPassword1" className="form-label fw-medium text-dark">
                      Password
                    </label>
                    <input 
                      type="password" 
                      className="form-control form-control-lg bg-light border-0 shadow-none" 
                      id="exampleInputPassword1" 
                    />
                  </div>
                  
                  <div className="mb-4 form-check d-flex align-items-center">
                    <input 
                      type="checkbox" 
                      className="form-check-input mt-0 me-2 shadow-none" 
                      id="exampleCheck1" 
                    />
                    <label className="form-check-label text-secondary" htmlFor="exampleCheck1">
                      Check me out
                    </label>
                  </div>
                  
                  <div className="d-grid mt-5">
                    <button type="submit" className="btn btn-primary btn-lg fw-semibold py-3 shadow-sm">
                      Submit
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