import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-16">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-2 text-[34px] sm:text-[40px] leading-tight font-semibold">This page does not exist</h1>
      <p className="mt-3 text-[17px] text-ink-2">
        The address may be mistyped, or the page was moved. The signal feed is the best place to start.
      </p>
      <Link to="/" className="btn-primary mt-8">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the live feed
      </Link>
    </div>
  );
}
