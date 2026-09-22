
const CalendarioSection = () => {
  return (
    <section id="calendario" className="min-vh-100 bg-light pb-5">
      
      {/* Banner Principal em Largura Total */}
      <div className="container-fluid px-0 mb-5">
        <img 
          className="img-fluid w-100 object-fit-cover shadow-sm" 
          src="https://placehold.co/1900x200" 
          alt="imagem da escola com texto calendario escolar" 
        />
      </div>
      
      <div className="container mt-4 mt-lg-5">
        {/* Card Elevado Padrão de Mercado */}
        <div className="bg-white border-0 rounded-4 shadow p-4 p-lg-5">
          
          <div className="mb-5 text-center text-lg-start">
            <h3 className="display-6 fw-bold text-dark mb-3">Calendario</h3>
            <p className="lead text-secondary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          <div className="row g-4 g-lg-5 align-items-center justify-content-center">
            
            {/* Imagem de Eventos (Coluna Menor) */}
            <div className="col-12 col-md-6 col-lg-5 text-center">
              <img 
                className="img-fluid w-100 rounded-4 shadow-sm border border-light" 
                src="https://placehold.co/400x600" 
                alt="Lista com os próximos eventos" 
              />
            </div>
            
            {/* Imagem do Calendário (Coluna Maior) */}
            <div className="col-12 col-md-6 col-lg-7 text-center">
              <img 
                className="img-fluid w-100 rounded-4 shadow-sm border border-light" 
                src="https://placehold.co/800x600" 
                alt="calendario inteirisso (data, eventos marcados)" 
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default CalendarioSection;