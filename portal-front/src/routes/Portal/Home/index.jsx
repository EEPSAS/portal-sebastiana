import CalendarioSection from "../../../components/common/Sections/Calendario";
import HeroSection from "../../../components/common/Sections/Hero";
import NoticiasSection from "../../../components/common/Sections/Noticias";
import PodcastSection from "../../../components/common/Sections/Podcast";
import SobreSection from "../../../components/common/Sections/SobreSection";
import PortalLayout from "../../../Layouts/PortalLayout";

const Home = () => {
  return (
    <PortalLayout>
      <main>
        <HeroSection />
        <NoticiasSection />
        <CalendarioSection />
        <PodcastSection />
        <SobreSection />
      </main>
    </PortalLayout>
  );
};

export default Home;
