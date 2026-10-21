import { useAuthStore } from "@/stores/auth/authStore";

export default function SessionCheck() {
  const hydrate = useAuthStore((state) => state.hydrate);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-5 text-zinc-300">
      <section className="max-w-sm text-center">
        <p role="alert">Your session could not be checked. Your current page is safe.</p>
        <button
          type="button"
          onClick={hydrate}
          className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
