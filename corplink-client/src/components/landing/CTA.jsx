import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900"
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div
        className="text-center w-full"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <h2
          style={{ fontSize: "clamp(3.5rem, 5vw, 5rem)" }}
          className="font-bold tracking-tight text-white mb-10"
        >
          Transform the way your company operates.
          <br />
          Start working smarter today.
        </h2>
        <p
          style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
          className="leading-relaxed text-slate-300 mb-14"
        >
          Join thousands of modern enterprises using CorpLink to connect their
          employees, bridge their workflows, and accelerate growth.
        </p>
        <div className="flex items-center justify-center gap-6">
          <Link
            to="/register"
            className="rounded-2xl bg-orange-500 px-12 py-6 text-2xl font-bold text-white shadow-xl hover:bg-orange-400 transition hover:-translate-y-1"
          >
            Start Your Journey with CorpLink
          </Link>
        </div>
      </div>
      <svg
        viewBox="0 0 1024 1024"
        className="absolute left-1/2 top-1/2 -z-10 h-screen w-screen -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
        aria-hidden="true"
      >
        <circle
          cx={512}
          cy={512}
          r={512}
          fill="url(#gradient)"
          fillOpacity="0.2"
        />
        <defs>
          <radialGradient id="gradient">
            <stop stopColor="#f97316" />
            <stop offset={1} stopColor="#f97316" />
          </radialGradient>
        </defs>
      </svg>
    </section>
  );
}
