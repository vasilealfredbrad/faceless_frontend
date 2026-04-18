import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ResultsMarquee from "./components/ResultsMarquee";
import GuestGenerator from "./components/GuestGenerator";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import AuthModal, { type AuthMode } from "./components/AuthModal";
import Preview from "./pages/Preview";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { supabase } from "./lib/supabase";
import { checkIsAdmin, clearAdminCache } from "./lib/admin";

function LandingPage({
  session,
  isAdmin,
  onLogout,
}: {
  session: Session | null;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const guestGeneratorRef = useRef<HTMLDivElement>(null);

  const handleGenerateStart = () => {
    if (session) {
      window.location.assign("/dashboard");
    } else {
      // Scroll to guest generator section
      guestGeneratorRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        session={session}
        isAdmin={isAdmin}
        onOpenAuth={(mode) => setAuthMode(mode)}
        onLogout={onLogout}
      />
      <Hero onStart={handleGenerateStart} />
      <ResultsMarquee />
      <GuestGenerator sectionRef={guestGeneratorRef} />
      <HowItWorks />
      <FAQ />
      <Footer />
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
        />
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) checkIsAdmin().then(setIsAdmin);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        checkIsAdmin().then(setIsAdmin);
      } else {
        setIsAdmin(false);
        clearAdminCache();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              session={session}
              isAdmin={isAdmin}
              onLogout={() => supabase.auth.signOut()}
            />
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <Dashboard
              session={session}
              isAdmin={isAdmin}
              onLogout={() => supabase.auth.signOut()}
            />
          }
        />
        <Route
          path="/pricing"
          element={
            <Pricing
              session={session}
              isAdmin={isAdmin}
              onLogout={() => supabase.auth.signOut()}
            />
          }
        />
        <Route
          path="/terms"
          element={
            <Terms
              session={session}
              isAdmin={isAdmin}
              onLogout={() => supabase.auth.signOut()}
            />
          }
        />
        <Route
          path="/privacy"
          element={
            <Privacy
              session={session}
              isAdmin={isAdmin}
              onLogout={() => supabase.auth.signOut()}
            />
          }
        />
        <Route path="/preview/:jobId" element={<Preview />} />
        <Route path="/admin" element={<Admin session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
