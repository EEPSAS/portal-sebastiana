import Footer from "../../components/common/footer"
import NavBar from "../../components/common/navbar"

const PortalLayout = ({children}) => {
  return (
    <>
    <header>
        <NavBar/>
    </header>
    <main>
        {children}
    </main>
    <Footer/>
    </>
  )
}

export default PortalLayout