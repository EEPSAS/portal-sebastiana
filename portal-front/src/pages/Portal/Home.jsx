import Calendario from "../../components/Portal/calendario/Calendario";
import Hero from "../../components/Portal/Hero";
import Noticias from "../../components/Portal/noticia/Noticias";
import Podcast from "../../components/Portal/podcast/Podcast";
import Sobre from "../../components/Portal/sobre/Sobre";

const Home = () => {
  return (
    <div className="portal-home">
      <Hero />
      <Noticias />
      <Calendario />
      <Podcast />
      <Sobre />
    </div>
  );
};

export default Home;