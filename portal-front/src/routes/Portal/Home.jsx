import Calendario from "../../components/Portal/Calendario";
import Hero from "../../components/Portal/Hero";
import Noticias from "../../components/Portal/noticia/Noticias";
import Podcast from "../../components/Portal/Podcast";
import Sobre from "../../components/Portal/Sobre";

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