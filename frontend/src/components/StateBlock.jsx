// Shared empty / error block: says what happened and what to do next.
export default function StateBlock({ icon: Icon, title, children, action, tone = "neutral" }) {
  const ring = tone === "error" ? "border-danger text-danger bg-danger-soft" : "border-ink text-ink bg-surface-2";
  return (
    <div className="flex flex-col items-center text-center px-6 py-14" role={tone === "error" ? "alert" : undefined}>
      {Icon && (
        <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded border ${ring}`}>
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      <p className="font-display text-[20px] font-semibold text-ink">{title}</p>
      {children && <p className="mt-1.5 max-w-md text-[15px] text-ink-2">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
