import Home from "./routes/Portal/Home"
import { BrowserRouter, Routes, Route } from "react-router";
import PortalPublico from "./Layouts/PortalPublico";
import Login from "./components/common/Sections/Login";
import NoticiaPage from "./routes/Portal/Noticia";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalPublico/>}>
          <Route index element ={<Home/>}/>
          <Route path="Login" element={<Login/>}/>
          <Route path="noticia/:id" element={<NoticiaPage/>}/>
        </Route>
      </Routes>
    </BrowserRouter>

  )
}

export default App