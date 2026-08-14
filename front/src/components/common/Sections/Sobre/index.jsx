

const SobreSection = () => {
  return (
    <>
     <section id="Sobre nos" className="py-5">
          <div className="container">
            <div className="row align-items-center g-4">
              <div className="col-12 col-lg-6 order-lg-1">
                <h1 className="mb-3">Quem somos nós</h1>
                <h2 className="mb-3">Jaguaraçu,MG</h2>
                <p className="mb-4">Localizada no coração Norte de Minas , Jaguaraçu é uma cidade acolhedora, rica em cultura , tradições e belezas naturais. Um lugar de gente trabalhadora, que valoriza suas raízes e olha para o futuro com esperança e união.</p>
                <div className="d-flex gap-2 flex-wrap">
                  <img className="p-1 img-fluid" src="https://placehold.co/200x150" alt="Habitantes" />
                  <img className="p-1 img-fluid" src="https://placehold.co/200x150" alt="Area territorial" />
                </div>
              </div>
              <div className="col-12 col-lg-6 order-lg-2">
                <img className="img-fluid w-100" src="https://placehold.co/500" alt="" />
              </div>
            </div>
          </div>
        </section>
    
    </>
  )
}

export default SobreSection