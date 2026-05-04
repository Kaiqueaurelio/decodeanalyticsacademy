import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Renderizar o app diretamente sem nenhuma lógica de segurança ou monitoramento que possa causar tela branca
createRoot(document.getElementById("root")!).render(<App />);
