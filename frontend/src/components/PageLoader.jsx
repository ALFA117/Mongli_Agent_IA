export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" role="status" aria-live="polite">
      <div className="w-48">
        <div className="skeleton h-1.5 w-full" />
        <p className="mt-3 text-center text-[13px] text-muted">Loading page…</p>
      </div>
    </div>
  );
}
