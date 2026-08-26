import CalendarioSection from "../../../components/common/Sections/Calendario";
import HeroSection from "../../../components/common/Sections/Hero";
import NoticiasSection from "../../../components/common/Sections/Noticias";
import PodcastSection from "../../../components/common/Sections/Podcast";
import SobreSection from "../../../components/common/Sections/Sobre";

const Home = () => {
  return (
      <main>
        <HeroSection />
        <NoticiasSection />
        <CalendarioSection />
        <PodcastSection />
        <SobreSection />
      </main>
  );
};

export default Home;
