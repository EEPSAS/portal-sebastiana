import PortalLayout from "./layouts/Portal/PortalLayout";
import DashboardLayout from "./layouts/Dashboard/DashboardLayout";
import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./routes/Portal/Login";
import PublicHome from "./routes/Portal/Home";

const EmptyDashboardPage = () => null;

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="login" element={<Login />} />
        </Route>

        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<EmptyDashboardPage />} />
          <Route path="geral" element={<EmptyDashboardPage />} />
          <Route path="biblioteca" element={<EmptyDashboardPage />} />
          <Route path="turmas" element={<EmptyDashboardPage />} />
          <Route path="configuracoes" element={<EmptyDashboardPage />} />
          <Route path="agenda" element={<EmptyDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
