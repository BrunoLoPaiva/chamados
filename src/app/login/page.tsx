"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciais inválidas. Verifique seu usuário e senha.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-neutral-50 font-sans 50 p-4 relative overflow-hidden transition-colors">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-navy/10  rounded-full blur-3xl -z-10 pointer-events-none transition-colors"></div>

      <div className="w-full max-w-sm p-8 bg-white/80 backdrop-blur-md /80 rounded-3xl shadow-2xl border border-white/40  transition-all">
        <div className="text-center mb-8">
          <div className="rounded-lg mx-auto flex items-center justify-center mb-0 w-48 transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              width={200}
              height={80}
              sizes="100vw"
              className="w-full h-auto drop-shadow-sm"
              alt="logo"
            />
          </div>
          <p className="text-sm font-medium text-neutral-500  mt-6 transition-colors">
            Faça login para gerenciar os chamados.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50  border border-red-200  rounded-md text-sm text-red-600  font-medium text-center animate-pulse transition-colors">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-neutral-600  uppercase tracking-wider mb-1.5 ml-1 transition-colors">
              Usuário
            </label>
            <div className="relative">
              <input
                type="text"
                required
                className="block w-full px-4 py-3 border border-neutral-200  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/50 focus:border-brand-navy 50  transition-shadow bg-neutral-50/50"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-600  uppercase tracking-wider mb-1.5 ml-1 transition-colors">
              Senha
            </label>
            <input
              type="password"
              required
              className="block w-full px-4 py-3 border border-neutral-200  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/50 focus:border-brand-navy 50  transition-shadow bg-neutral-50/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-md shadow-md text-sm font-bold text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-4 focus:ring-brand-navy/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  Conectando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5 opacity-80 shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="absolute bottom-6 text-xs text-neutral-400  font-medium tracking-wide transition-colors">
        &copy; {new Date().getFullYear()} Suporte TI | ViaRondon
      </div>
    </div>
  );
}
