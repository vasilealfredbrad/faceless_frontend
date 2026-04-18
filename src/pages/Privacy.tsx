import { useState } from "react";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthModal, { type AuthMode } from "../components/AuthModal";
import {
  Lock,
  Info,
  Database,
  Cookie,
  Share2,
  Shield,
  UserCog,
  RefreshCw,
  Mail,
  Baby,
  Youtube,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  session: Session | null;
  isAdmin: boolean;
  onLogout: () => void;
}

/* ── prose helpers ── */
function Clause({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm leading-relaxed text-white/60">
      <span className="shrink-0 font-mono text-white/25 text-xs pt-0.5 w-8">{num}</span>
      <span>{children}</span>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-white/60 leading-relaxed">
      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-white/60 leading-relaxed">
      <span className="text-primary shrink-0 mt-1">•</span>
      <span>{children}</span>
    </li>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-white/5" />
      <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">{title}</span>
      <div className="h-px flex-1 bg-white/5" />
    </div>
  );
}

interface AccordionSection {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

function Accordion({
  section,
  open,
  onToggle,
}: {
  section: AccordionSection;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        open
          ? "border-white/10 bg-surface-card shadow-lg shadow-black/20"
          : "border-white/5 bg-surface-card/40 hover:bg-surface-card/70 hover:border-white/8"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 sm:p-6 text-left group"
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${section.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm sm:text-base">{section.title}</span>
            {section.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                {section.badge}
              </span>
            )}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/25 shrink-0 group-hover:text-white/40 transition-colors" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-6 sm:px-6 sm:pb-7 space-y-3 border-t border-white/5 pt-5">
          {section.content}
        </div>
      )}
    </div>
  );
}

const SECTIONS: AccordionSection[] = [
  {
    id: "intro",
    icon: Info,
    iconBg: "bg-primary/15 text-primary",
    title: "1. Introduction and Your Acceptance",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          This privacy policy has been outlined to inform users of{" "}
          <strong className="text-white">Invisible Creator</strong>, a SaaS-based content creation
          tool for faceless channels ("we", "us", "our"), about what information is collected, how
          it is used, and how it is protected.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          This policy applies to all users who access our application and website. By using our
          service, you consent to the collection, storage, use and disclosure of your personal
          information as described in this Privacy Policy.
        </p>
      </div>
    ),
  },
  {
    id: "collection",
    icon: Database,
    iconBg: "bg-blue-500/15 text-blue-400",
    title: "2. Information Collection and Use",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          When you use Invisible Creator, we may collect information about you, including your name,
          email address, and user-inputted content. This information will be used for:
        </p>
        <ul className="space-y-2 ml-1">
          <BulletItem>Creating custom content on your behalf</BulletItem>
          <BulletItem>Contacting you about updates and support</BulletItem>
          <BulletItem>Improving our services</BulletItem>
          <BulletItem>Additional uses as permitted by law</BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          You have the right to choose not to provide some or all of this information; however, it
          may affect your use of certain functions, features, or resources.
        </p>

        <SectionDivider title="2.1 YouTube API Services" />
        <Clause num="2.1">
          Invisible Creator uses YouTube API Services to enable you to upload and manage video
          content on YouTube. When you use these features, your use of YouTube is also subject to
          the{" "}
          <a
            href="http://www.google.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google Privacy Policy
          </a>
          . We encourage you to review Google's privacy practices to understand how your information
          is handled when using YouTube features through our service.
        </Clause>
      </div>
    ),
  },
  {
    id: "cookies",
    icon: Cookie,
    iconBg: "bg-amber-500/15 text-amber-400",
    title: "3. Cookies and Tracking Technologies",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          We use cookies and similar tracking technologies to enhance your experience, analyse
          trends, administer the website, understand user behaviour, and to clearly understand what
          portions of our services are of most interest to our users.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          Cookies are small files which are stored on your computer's hard drive. You have the
          ability to accept or decline cookies by modifying your web browser; however, if you choose
          to decline cookies, some parts of our services may not function as intended.
        </p>
      </div>
    ),
  },
  {
    id: "sharing",
    icon: Share2,
    iconBg: "bg-violet-500/15 text-violet-400",
    title: "4. Information Sharing and Disclosure",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          We do not sell, rent, or otherwise provide your personally identifiable information to
          third parties for marketing purposes.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          However, we may disclose your information to trusted third party service providers as
          necessary to provide our services to you or to fulfil legal obligations. We will ensure
          these third parties comply with strict data protection requirements.
        </p>
      </div>
    ),
  },
  {
    id: "security",
    icon: Shield,
    iconBg: "bg-emerald-500/15 text-emerald-400",
    title: "5. Data Protection and Security",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          We take the security of your personal information very seriously and have implemented
          stringent security measures to protect it.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          However, no method of transmission or electronic storage is completely secure; therefore,
          while we strive to use commercially acceptable means to protect your personal information,
          we cannot guarantee its absolute security.
        </p>
      </div>
    ),
  },
  {
    id: "rights",
    icon: UserCog,
    iconBg: "bg-cyan-500/15 text-cyan-400",
    title: "6. Your Rights",
    badge: "Important",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          You have the right to access and update your personal information at any time by logging
          into your account. You also have the right to delete your account by visiting our contact
          page and selecting{" "}
          <strong className="text-white">"delete my account"</strong>, which will erase all personal
          information we hold about you, except where we are required by law to retain it.
        </p>

        <SectionDivider title="6.1 Revoking YouTube API Access" />
        <Clause num="6.1">
          If you have connected your YouTube account to Invisible Creator, you can revoke our access
          to your YouTube data at any time through the{" "}
          <a
            href="https://security.google.com/settings/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google security settings page
          </a>
          . Revoking access will prevent Invisible Creator from uploading or managing content on
          your YouTube channel, but will not delete your Invisible Creator account. You can also
          delete any data we have stored by deleting your Invisible Creator account as described
          above.
        </Clause>

        <div className="rounded-xl bg-white/3 border border-white/8 p-4 mt-1">
          <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">
            How to revoke third-party app access to your Google / YouTube account:
          </p>
          <ol className="space-y-2.5">
            <Step n={1}>
              Visit{" "}
              <a
                href="https://security.google.com/settings/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                security.google.com/settings/
              </a>
            </Step>
            <Step n={2}>Navigate to <strong className="text-white/70">"Third-party apps with account access"</strong></Step>
            <Step n={3}>Find <strong className="text-white/70">"Invisible Creator"</strong> in the list</Step>
            <Step n={4}>Click <strong className="text-white/70">"Remove Access"</strong> to revoke permissions</Step>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "changes",
    icon: RefreshCw,
    iconBg: "bg-indigo-500/15 text-indigo-400",
    title: "7. Changes to the Privacy Policy",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          We reserve the right to modify this Privacy Policy at any time. Any changes will be posted
          on this page. Your continued use of Invisible Creator after changes to the Privacy Policy
          signifies your consent to any changes implemented.
        </p>
      </div>
    ),
  },
  {
    id: "contact",
    icon: Mail,
    iconBg: "bg-primary/15 text-primary",
    title: "8. Contact Us",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          If you have inquiries or complaints regarding our Privacy Policy, please contact us at{" "}
          <a
            href="mailto:privacy@invisiblecreator.video"
            className="text-primary hover:underline"
          >
            privacy@invisiblecreator.video
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    id: "children",
    icon: Baby,
    iconBg: "bg-rose-500/15 text-rose-400",
    title: "9. Children's Privacy",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          Invisible Creator is intended for users who are at least{" "}
          <strong className="text-white">13 years of age</strong>. We do not knowingly collect
          personally identifiable information from children under 13. If we become aware that a
          child under 13 has provided us with personal information, we will take steps to remove
          such information.
        </p>
      </div>
    ),
  },
  {
    id: "youtube-api",
    icon: Youtube,
    iconBg: "bg-red-600/15 text-red-400",
    title: "YouTube API — Additional Disclosures",
    badge: "Google / YouTube",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          Invisible Creator integrates with the YouTube Data API to allow you to upload, manage, and
          publish video content to your YouTube channel directly from our platform.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          By connecting your YouTube account you authorise Invisible Creator to act on your behalf
          within the scope of permissions you grant. Your use of YouTube through our integration is
          additionally governed by:
        </p>
        <ul className="space-y-2 ml-1">
          <BulletItem>
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              YouTube Terms of Service
            </a>
          </BulletItem>
          <BulletItem>
            <a
              href="http://www.google.com/policies/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Privacy Policy
            </a>
          </BulletItem>
          <BulletItem>
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google API Services User Data Policy
            </a>{" "}
            (including Limited Use requirements)
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          You can revoke Invisible Creator's access to your Google account at any time via{" "}
          <a
            href="https://security.google.com/settings/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            security.google.com/settings/
          </a>
          .
        </p>
      </div>
    ),
  },
  {
    id: "tiktok",
    icon: Smartphone,
    iconBg: "bg-pink-500/15 text-pink-400",
    title: "10. TikTok Integration — Privacy Disclosures",
    badge: "TikTok API",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-white/60 leading-relaxed">
          Invisible Creator integrates with the{" "}
          <strong className="text-white">TikTok for Developers API</strong> (including the Content
          Posting API and Login Kit) to allow you to publish and manage video content to your TikTok
          channel directly from our platform. This section explains how that integration affects your
          privacy and what data is involved.
        </p>

        <SectionDivider title="Data We Access via TikTok" />
        <p className="text-sm text-white/60 leading-relaxed">
          We only access the TikTok data you explicitly authorize through TikTok's OAuth permission
          consent screen. Depending on the features you use, this may include:
        </p>
        <ul className="space-y-2 ml-1">
          <BulletItem>
            <strong className="text-white/80">Basic profile information</strong> — display name,
            avatar, and open ID (used to identify your connected account)
          </BulletItem>
          <BulletItem>
            <strong className="text-white/80">Content posting permissions</strong> — the ability to
            upload and publish videos to your TikTok channel on your behalf
          </BulletItem>
          <BulletItem>
            <strong className="text-white/80">Video list access</strong> — if requested, to display
            your published content within the platform
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          We adhere to the principle of{" "}
          <strong className="text-white">minimum necessary access</strong> — we only request
          permission scopes that are strictly required to deliver the features you use.
        </p>

        <SectionDivider title="How We Use Your TikTok Data" />
        <ul className="space-y-2 ml-1">
          <BulletItem>
            To authenticate and identify your connected TikTok account within our platform
          </BulletItem>
          <BulletItem>
            To upload and publish AI-generated videos to your TikTok channel at your direction
          </BulletItem>
          <BulletItem>
            To display relevant account information within your Invisible Creator dashboard
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          We will <strong className="text-white">not</strong> sell, share, or disclose your TikTok
          data to any third party without your explicit consent, and we will never use it for
          cross-context behavioral advertising.
        </p>

        <SectionDivider title="Data Security & Retention" />
        <p className="text-sm text-white/60 leading-relaxed">
          We implement appropriate technical and organizational security measures to protect all data
          received through the TikTok API. We do not retain your personal TikTok data longer than
          necessary to provide the service. You may request deletion of your data at any time by
          deleting your Invisible Creator account.
        </p>

        <SectionDivider title="TikTok's Own Data Collection" />
        <p className="text-sm text-white/60 leading-relaxed">
          When you connect your TikTok account or interact with TikTok features through our
          platform, TikTok may independently collect data in accordance with their own privacy
          policy. Our privacy practices govern only the data we collect and process — not data
          collected independently by TikTok. Please review TikTok's policies for full details:
        </p>
        <ul className="space-y-2 ml-1">
          <BulletItem>
            <a
              href="https://www.tiktok.com/legal/page/us/privacy-policy/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TikTok Privacy Policy
            </a>
          </BulletItem>
          <BulletItem>
            <a
              href="https://www.tiktok.com/legal/page/global/tik-tok-developer-terms-of-service/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TikTok Developer Terms of Service
            </a>
          </BulletItem>
          <BulletItem>
            <a
              href="https://www.tiktok.com/legal/page/global/tiktok-data-sharing-agreement/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TikTok Developer Data Sharing Agreement
            </a>
          </BulletItem>
          <BulletItem>
            <a
              href="https://www.tiktok.com/legal/page/global/partner-privacy-policy/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TikTok Partner Privacy Policy
            </a>
          </BulletItem>
        </ul>

        <SectionDivider title="Revoking TikTok Access" />
        <p className="text-sm text-white/60 leading-relaxed">
          You can revoke Invisible Creator's access to your TikTok account at any time. Revoking
          access will immediately prevent us from publishing or managing any content on your TikTok
          channel, but will not delete your Invisible Creator account.
        </p>

        <div className="rounded-xl bg-white/3 border border-white/8 p-4 mt-1">
          <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">
            How to revoke access via the TikTok mobile app:
          </p>
          <ol className="space-y-2.5">
            <Step n={1}>Open the TikTok app and tap <strong className="text-white/70">Profile</strong></Step>
            <Step n={2}>Tap the menu icon (three horizontal lines) in the top right</Step>
            <Step n={3}>Go to <strong className="text-white/70">Settings and privacy</strong></Step>
            <Step n={4}>Tap <strong className="text-white/70">Security and login</strong></Step>
            <Step n={5}>Tap <strong className="text-white/70">Manage app permissions</strong></Step>
            <Step n={6}>Find <strong className="text-white/70">Invisible Creator</strong> in the list and tap <strong className="text-white/70">Remove access</strong></Step>
          </ol>
          <p className="text-xs text-white/30 mt-3">
            Note: Revoking access is only available through the TikTok mobile app, not the website.
          </p>
        </div>

        <SectionDivider title="Compliance" />
        <p className="text-sm text-white/60 leading-relaxed">
          Our TikTok integration is built and maintained in compliance with the{" "}
          <a
            href="https://developers.tiktok.com/doc/our-guidelines-developer-guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            TikTok Developer Guidelines
          </a>{" "}
          and the TikTok Developer Data Sharing Agreement. Any third-party processors we use to
          handle TikTok data are contractually required to comply with applicable data protection
          laws. If required by law to disclose data to authorities, we will notify TikTok as
          permitted and required under the Developer Terms.
        </p>
      </div>
    ),
  },
];

export default function Privacy({ session, isAdmin, onLogout }: Props) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [openId, setOpenId] = useState<string | null>("intro");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        session={session}
        isAdmin={isAdmin}
        onOpenAuth={setAuthMode}
        onLogout={onLogout}
      />

      <main className="pt-28 pb-24 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5 uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              Legal
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-white/40 text-sm">
              Last updated:{" "}
              <span className="text-white/60">October 7, 2025</span>
              &nbsp;·&nbsp;Effective immediately upon use of our Services
            </p>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 sm:p-6 mb-8 flex gap-4">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-white/55 leading-relaxed">
              <strong className="text-white">TL;DR:</strong> We collect only the information
              needed to run the service (name, email, content you upload). We never sell your data.
              You can delete your account and all associated data at any time. YouTube access can be
              revoked independently through your Google security settings.
            </p>
          </div>

          {/* Acceptance notice */}
          <div className="rounded-xl bg-white/3 border border-white/8 p-4 mb-6 text-sm text-white/45 leading-relaxed text-center">
            By using our services, you confirm that you have read and accepted this Privacy Policy.
            If you do not agree to this policy, please refrain from using our services.
          </div>

          {/* Accordion */}
          <div className="space-y-2.5">
            {SECTIONS.map((section) => (
              <Accordion
                key={section.id}
                section={section}
                open={openId === section.id}
                onToggle={() => toggle(section.id)}
              />
            ))}
          </div>

          {/* Contact card */}
          <div className="mt-10 rounded-2xl bg-surface-card border border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Questions about this Privacy Policy?</h3>
              <p className="text-white/40 text-sm">
                Contact us at{" "}
                <a
                  href="mailto:privacy@invisiblecreator.video"
                  className="text-primary hover:underline"
                >
                  privacy@invisiblecreator.video
                </a>
              </p>
            </div>
            <a
              href="mailto:privacy@invisiblecreator.video"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
            >
              Contact Us
            </a>
          </div>

          {/* Bottom nav */}
          <div className="mt-8 text-center text-sm text-white/30 space-x-4">
            <Link to="/" className="hover:text-white/60 transition-colors">← Back to Home</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
          </div>
        </div>
      </main>

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
