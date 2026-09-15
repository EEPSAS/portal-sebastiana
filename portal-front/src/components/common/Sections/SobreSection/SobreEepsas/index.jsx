const SobreEepsas = () => {
  return (
    <section id="sobre-eepsas" className="py-5">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg-6 order-lg-1">
            <h1 className="mb-3 text-primary">
              A nossa <span className="text-danger bg-alert">escola</span>
            </h1>
            <h2 className="mb-3">
              Escola Estadual Professora Sebastiana de Almeida e Silva
            </h2>
            <p className="mb-4">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Deserunt
              quam veniam quaerat modi nemo, doloremque distinctio libero ullam
              ut dolor cum dignissimos minima nulla. Consectetur blanditiis
              culpa quos explicabo excepturi.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Habitantes"
              />
              <img
                className="p-1 img-fluid"
                src="https://placehold.co/200x150"
                alt="Area territorial"
              />
            </div>
          </div>
          <div className="col-12 col-lg-6 order-lg-2">
            <img
              className="img-fluid w-100"
              src="https://placehold.co/500"
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SobreEepsas;
