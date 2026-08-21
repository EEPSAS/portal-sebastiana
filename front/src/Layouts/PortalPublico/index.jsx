import { Outlet } from "react-router"
import Footer from "../../components/common/footer"
import NavBar from "../../components/common/navbar"


const PortalPublico = () => {
  return (
    <>
    <header>
        <NavBar/>
    </header>
    <main>
      {<Outlet/>}
        
    </main>
    <Footer/>
    </>
  )
}

export default PortalPublico