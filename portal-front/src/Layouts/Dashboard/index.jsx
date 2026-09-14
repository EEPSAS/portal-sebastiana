import { Outlet } from "react-router"
import Aside from "../../components/common/aside"
import Header from "../../components/common/header"

const Dashboard = () => {
  return (
    <>
      <header>
        <Aside />
        <Header />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default Dashboard