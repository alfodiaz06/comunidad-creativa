export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-aurora-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-aurora-500 animate-spin" />
        </div>
        <span className="font-display text-sm text-slate-500 tracking-widest uppercase">
          Cargando
        </span>
      </div>
    </div>
  );
}
