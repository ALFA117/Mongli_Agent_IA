export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning ring */}
        <div className="relative w-10 h-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx={20} cy={20} r={16} fill="none" stroke="rgba(0,255,136,0.08)" strokeWidth={3} />
            <circle
              cx={20} cy={20} r={16} fill="none"
              stroke="#00ff88" strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="60 40"
              className="animate-spin origin-center"
              style={{ transformOrigin: "20px 20px", animationDuration: "0.9s" }}
            />
          </svg>
        </div>
        <span className="text-xs font-mono text-slate-700 tracking-widest uppercase">Loading</span>
      </div>
    </div>
  );
}
