

const CalendarioSection = () => {
  return (
    <>
    
     <section id="calendario" className="min-vh-100 py-5">
          <img className="img-fluid w-100" src="https://placehold.co/1900x200" alt="imagem da escola com texto calendario escolar" />
          
            <div className="container mt-5">
              <div className="border rounded-4 shadow p-4">
                <h3 className="mb-4">Calendario</h3>
                <div className="row g-3 align-items-center">
                  <div className="col-12 col-md-6">
                    <img className="img-fluid w-100" src="https://placehold.co/250x500" alt="Lista com os próximos eventos" />
                  </div>
                  <div className="col-12 col-md-6">
                    <img className="p-2 img-fluid w-100" src="https://placehold.co/500" alt="calendario inteirisso (data, eventos marcados)" />
                  </div>
                </div>
              </div>
            </div>
        </section>
    
    </>
  )
}

export default CalendarioSection