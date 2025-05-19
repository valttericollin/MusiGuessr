import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import "./App.css";
import JoinLobby from "./pages/joinlobby";
import TopBar from "./components/TopBar";
import LobbyOptions from "./pages/lobbyoptions";

function App() {
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="joinlobby" element={<JoinLobby />} />
        <Route path="lobbyoptions" element={<LobbyOptions />} />
      </Routes>
    </>
  );
}

export default App;
