import AppRouter from "@/router/AppRouter";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth/authStore";

function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <AppRouter />;
}

export default App;
