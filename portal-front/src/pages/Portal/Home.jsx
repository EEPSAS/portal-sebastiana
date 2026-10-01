import Calendario from "../../components/Portal/Calendario";
import Hero from "../../components/Portal/Hero";
import Noticias from "../../components/Portal/noticia/Noticias";
import Podcast from "../../components/Portal/Podcast";
import Sobre from "../../components/Portal/sobre/Sobre";

const Home = () => {
  return (

    <>


      <main>
        <Hero />
        <Noticias />
        <Calendario />
        <Podcast />
        <Sobre />
      </main>

    </>

  );
};

export default Home;