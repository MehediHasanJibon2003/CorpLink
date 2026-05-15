import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import PainPoints from "../../components/landing/PainPoints";
import CoreFeatures from "../../components/landing/CoreFeatures";
import Workflow from "../../components/landing/Workflow";
import DashboardPreview from "../../components/landing/DashboardPreview";
import Security from "../../components/landing/Security";
import Testimonials from "../../components/landing/Testimonials";
import Pricing from "../../components/landing/Pricing";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";
import BackgroundOrbs from "../../components/landing/BackgroundOrbs";

function Landing() {
  return (
    <div className="landing-page-root bg-slate-950 w-full min-h-screen overflow-x-hidden relative selection:bg-orange-500 selection:text-white">
      <BackgroundOrbs />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <PainPoints />
        <CoreFeatures />
        <Workflow />
        <DashboardPreview />
        <Security />
        <Testimonials />
        <Pricing />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}

export default Landing;


