import { Link } from "react-router-dom";
import logo from "@/assets/Images/nebula-logo.png";

export default function AuthLayout({ children }) {
  return <main className="min-h-[100dvh] bg-[#08080a] text-white">
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:flex">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="" className="h-11 w-11 rounded-xl object-contain" />
            <span><b className="block text-lg font-semibold">Nebula AI</b><small className="text-xs text-zinc-500">Studio</small></span>
          </Link>
          <div className="max-w-lg">
            <p className="mb-5 text-sm font-medium text-purple-400">YOUR CREATIVE WORKSPACE</p>
            <h2 className="text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">Create without <span className="block text-purple-400">limits.</span></h2>
            <p className="mt-6 max-w-md text-base leading-7 text-zinc-500">Generate images, videos, characters and stories from one powerful creative workspace.</p>
          </div>
          <p className="text-xs text-zinc-700">© {new Date().getFullYear()} Nebula AI Studio</p>
        </div>
      </section>
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-700/10 blur-[120px] lg:hidden" />
        <div className="relative w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-3 lg:hidden"><img src={logo} alt="" className="h-10 w-10 rounded-xl object-contain"/><span><b className="block">Nebula AI</b><small className="text-xs text-zinc-500">Studio</small></span></Link>
          {children}
        </div>
      </section>
    </div>
  </main>;
}
