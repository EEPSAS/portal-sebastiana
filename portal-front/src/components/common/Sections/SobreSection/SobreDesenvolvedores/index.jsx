const SobreDesenvolvedores = () => {
  return (
    <>
       <section id="sobre-jaguaracu" className="py-5">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg-6 order-lg-1">
            <h1 className="mb-3 text-primary">
              Nossa equipe de <span className="text-danger bg-alert">Devs</span>
            </h1>
            <h2 className="mb-3">Desenvolvedores</h2>
            <p className="mb-4">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Mollitia quisquam maxime laudantium molestias molestiae libero officia, sit qui? Mollitia, dolorum! Magni porro rem ab recusandae adipisci quasi laborum laudantium iusto!
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Foto de perfil Carlos Eduardo"
              />
              <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Foto de perfil Rhaynner"
              />
            </div>
          </div>
          <div className="col-12 col-lg-6 order-lg-2">
            <img
              className="img-fluid w-100"
              src="https://placehold.co/500"
              alt="Foto de perfil Ana Lívia"
            />
            <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Foto de perfil Yasmin Teixeira"
              />
              <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Foto de perfil Davi"
              />
              <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Foto de perfil Natã"
              />
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default SobreDesenvolvedores;
