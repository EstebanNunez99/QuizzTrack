import { LogOut, User } from 'lucide-react';

export default function Layout({ user, onLogout, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="font-semibold text-zinc-900 text-lg tracking-tight">QuizzTrack</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
                <User size={14} className="text-zinc-500" />
                <span className="font-medium">{user.email}</span>
                <span className="text-[10px] font-bold uppercase bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-600 ml-1 tracking-wider">
                  {user.role}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-200"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
