import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import Home from "./pages/Home";
import HumanizePage from "./pages/HumanizePage";
import About from "./pages/About";
import HistoryPage from "./pages/HistoryPage";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { useToast } from "./hooks/useToast";

export default function App() {
  const { toasts, show } = useToast();

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home showToast={show} />} />
          <Route path="humanize" element={<HumanizePage showToast={show} />} />
          <Route path="about" element={<About />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
        </Route>
      </Routes>
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>
    </AuthProvider>
  );
}
