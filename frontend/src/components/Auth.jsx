export default function Auth({ onLogin, onRegister }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-zinc-200/60">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Bienvenido</h2>
          <p className="text-zinc-500 text-sm mt-1.5">Ingresa a tu cuenta o regístrate</p>
        </div>

        <div className="space-y-7">
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
              <input 
                name="email" type="email" required 
                className="w-full px-3.5 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Contraseña</label>
              <input 
                name="password" type="password" required 
                className="w-full px-3.5 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-zinc-900 text-white font-medium py-2.5 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900">
              Iniciar Sesión
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-zinc-400 font-medium text-xs uppercase tracking-wider">O crea una cuenta nueva</span>
            </div>
          </div>

          <form onSubmit={onRegister} className="space-y-3.5 bg-zinc-50/80 p-5 rounded-xl border border-zinc-100">
            <input 
              name="email" type="email" required 
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm placeholder:text-zinc-400"
              placeholder="Nuevo email"
            />
            <input 
              name="password" type="password" required 
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm placeholder:text-zinc-400"
              placeholder="Nueva contraseña"
            />
            <button type="submit" className="w-full bg-white border border-zinc-200 text-zinc-700 font-medium py-2 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-200">
              Registrar cuenta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
