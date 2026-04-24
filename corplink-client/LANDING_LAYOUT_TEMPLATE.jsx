// This is a reference template showing the Tea House layout adapted with CorpLink sizing
// Use this as a guide for your landing page component structure

import { ArrowRight } from "lucide-react";

export default function AdaptedLandingLayout() {
  return (
    <div className="font-sans bg-white">
      {/* ===== HERO SECTION (2-Column Layout) ===== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* LEFT: Text Content */}
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
              Unified Corporate <br />
              Solutions for <br />
              Modern Teams
            </h1>

            <p className="text-base lg:text-lg text-slate-600 max-w-md">
              Streamline employee management, tasks, collaboration, and
              corporate networking in one powerful platform.
            </p>

            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition">
              Explore More
              <ArrowRight className="w-4 h-4 -rotate-45" />
            </button>
          </div>

          {/* RIGHT: Image & Rating Card */}
          <div className="relative lg:w-1/2 flex justify-center">
            {/* Main Hero Image - Adjusted size */}
            <img
              className="w-72 lg:w-96 h-auto object-cover rounded-lg"
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80"
              alt="CorpLink Dashboard"
            />

            {/* Rating/Trust Card - Positioned absolutely */}
            <div className="absolute -bottom-6 left-8 lg:left-16 flex items-center gap-3 bg-white shadow-lg px-5 py-3 rounded-lg border border-slate-100">
              <div className="text-2xl">⭐</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">4.9/5</h3>
                <p className="text-sm text-slate-600">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION (4-Column Grid) ===== */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Our Core Features
            </h2>
            <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your organization efficiently. From
              employee profiles to task tracking and team collaboration.
            </p>
          </div>

          {/* Feature Cards Grid - 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card Template - Repeat as needed */}
            {[
              {
                title: "Employee Management",
                desc: "Organize teams and maintain profiles",
              },
              {
                title: "Task Tracking",
                desc: "Monitor progress with Kanban views",
              },
              {
                title: "Team Collaboration",
                desc: "Secure file sharing and communication",
              },
              { title: "Analytics", desc: "Real-time performance insights" },
            ].map((card, idx) => (
              <div
                key={idx}
                className="rounded-lg shadow-md bg-white p-6 text-center hover:shadow-lg transition"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TWO-COLUMN CONTENT SECTION ===== */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Image Grid (2x2 style) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl"></div>
            <div className="bg-slate-100 rounded-xl h-40 flex items-center justify-center">
              <img
                className="w-24 h-24 object-cover"
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=200&q=80"
                alt=""
              />
            </div>
            <div className="bg-slate-100 rounded-xl h-40 flex items-center justify-center">
              <img
                className="w-24 h-24 object-cover"
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=200&q=80"
                alt=""
              />
            </div>
            <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl"></div>
          </div>

          {/* RIGHT: Text Content */}
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              Powerful Management Tools
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              CorpLink brings together all the tools your organization needs.
              Manage employees, track projects, collaborate securely, and gain
              insights through advanced analytics—all in one unified platform.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Intuitive Interface
                </h3>
                <p className="text-sm text-slate-600">
                  Modern design that your team will love using every day.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Enterprise Ready
                </h3>
                <p className="text-sm text-slate-600">
                  Built for organizations of any size with role-based access
                  control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION (Gradient Background) ===== */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-white">
              {/* LEFT: Header Text */}
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  What Our Clients Say
                </h2>
                <p className="text-base lg:text-lg text-white/90 mb-6 leading-relaxed">
                  Join hundreds of companies transforming their operations with
                  CorpLink. Experience the difference a unified platform makes.
                </p>
                <button className="inline-flex w-fit bg-white text-orange-600 px-5 py-2 rounded-lg font-semibold hover:bg-orange-50 transition">
                  View All Reviews
                </button>
              </div>

              {/* RIGHT: Testimonial Cards (Stacked) */}
              <div className="relative space-y-4 lg:space-y-0">
                {/* Main Testimonial Card */}
                <div className="relative z-10 bg-white text-slate-900 rounded-xl p-6 shadow-lg">
                  <p className="text-sm leading-relaxed mb-4">
                    "CorpLink completely transformed how our team collaborates.
                    We've reduced meeting time by 40% and improved project
                    delivery."
                  </p>
                  <div>
                    <p className="font-semibold text-sm">Sarah Johnson</p>
                    <p className="text-xs text-slate-600">Operations Manager</p>
                  </div>
                </div>

                {/* Secondary Cards (Faded) */}
                <div className="relative -mt-4 ml-4 bg-white text-slate-900 rounded-xl p-6 shadow-md opacity-60 lg:hidden">
                  <p className="text-sm leading-relaxed mb-4">
                    "The best investment we made this year."
                  </p>
                  <p className="font-semibold text-sm">Michael Chen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-100 text-slate-700 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Top Section: Logo + CTA */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 pb-10 border-b border-slate-300">
            <h2 className="text-xl font-bold text-slate-900 mb-4 lg:mb-0">
              CorpLink
            </h2>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <p className="text-sm">Ready to transform your organization?</p>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg transition">
                Get Started
              </button>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                Product
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                Company
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                Follow Us
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-orange-600 transition">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-6 border-t border-slate-300">
            <p className="text-xs text-slate-600">
              © 2026 CorpLink. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
