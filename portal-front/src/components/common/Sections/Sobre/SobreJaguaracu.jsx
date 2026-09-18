import areaTerritorial from "../../../../assets/img/area-territorial.png";
import habitantes from "../../../../assets/img/habitantes.png";

const SobreJaguaracu = () => {
  return (
    <section id="sobre-jaguaracu" className="sobre-panel">
      <div className="sobre-copy">
        <p className="sobre-eyebrow">Nossa cidade</p>
        <h2>Jaguaraçu, MG</h2>
        <p className="sobre-description">
              Localizada no coração Norte de Minas , Jaguaraçu é uma cidade
              acolhedora, rica em cultura , tradições e belezas naturais. Um
              lugar de gente trabalhadora, que valoriza suas raízes e olha para
              o futuro com esperança e união.
        </p>
        <div className="sobre-stats">
          <div className="sobre-stat">
            <img src={habitantes} alt="" />
            <strong>3.092</strong>
            <span>habitantes.</span>
          </div>
          <div className="sobre-stat">
            <img src={areaTerritorial} alt="" />
            <strong>163,76 km²</strong>
            <span>Área Territorial</span>
          </div>
        </div>
      </div>
      <div className="sobre-gallery sobre-gallery-city">
        <img src="https://placehold.co/600x420" alt="Paisagem de Jaguaraçu" />
        <img src="https://placehold.co/600x420" alt="Cultura de Jaguaraçu" />
      </div>
    </section>
  );
};

export default SobreJaguaracu;
