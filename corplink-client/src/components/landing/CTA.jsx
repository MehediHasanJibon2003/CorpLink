import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <div className="relative isolate overflow-hidden bg-slate-900">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Transform the way your company operates.
            <br />
            Start working smarter today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Join thousands of modern enterprises using CorpLink to connect their employees, bridge their workflows, and accelerate growth.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-400 transition"
            >
              Start Your Journey with CorpLink
            </Link>
          </div>
        </div>
      </div>
      <svg
        viewBox="0 0 1024 1024"
        className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
        aria-hidden="true"
      >
        <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.2" />
        <defs>
          <radialGradient id="gradient">
            <stop stopColor="#f97316" />
            <stop offset={1} stopColor="#f97316" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
