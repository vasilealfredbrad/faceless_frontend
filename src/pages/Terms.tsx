import { useState } from "react";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuthModal, { type AuthMode } from "../components/AuthModal";
import {
  FileText,
  Shield,
  Scale,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Youtube,
  Megaphone,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  Ban,
  TrendingUp,
  Settings,
  Gavel,
} from "lucide-react";

interface Props {
  session: Session | null;
  isAdmin: boolean;
  onLogout: () => void;
}

/* ── tiny prose helpers ── */
function Clause({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm leading-relaxed text-white/60">
      <span className="shrink-0 font-mono text-white/25 text-xs pt-0.5 w-8">{num}</span>
      <span>{children}</span>
    </div>
  );
}

function SubClause({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm leading-relaxed text-white/55 ml-4">
      <span className="shrink-0 font-mono text-white/20 text-xs pt-0.5 w-10">{num}</span>
      <span>{children}</span>
    </div>
  );
}

function BulletItem({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-white/60 leading-relaxed">
      <span className="text-primary shrink-0 mt-1">•</span>
      <span>
        {label && <strong className="text-white/80">{label} </strong>}
        {children}
      </span>
    </li>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
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
    id: "general",
    icon: FileText,
    iconBg: "bg-primary/15 text-primary",
    title: "General Terms of Use",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/60 leading-relaxed">
          Our website is provided as a service to our users. By using this website, you signify your
          agreement to these Terms of Use. If you do not agree to these Terms of Use, please do not
          use this website.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          We reserve the right, at our discretion, to change, modify, add, or remove portions of
          these Terms of Use at any time. Please check these Terms of Use periodically for changes.
          Your continued use of this website following the posting of changes to these Terms of Use
          will mean you accept those changes.
        </p>
        <p className="text-sm text-white/60 leading-relaxed">
          Our use and transfer to any other app of information received from Google APIs will adhere
          to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <SectionDivider title="YouTube Terms" />
        <p className="text-sm text-white/60 leading-relaxed">
          By using Invisible Creator to upload or publish content to YouTube, you agree to be bound
          by the{" "}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            YouTube Terms of Service
          </a>
          . Please review these terms carefully before using our YouTube integration features.
        </p>
        <SectionDivider title="Indemnity & Release" />
        <p className="text-sm text-white/60 leading-relaxed">
          You agree to release, indemnify and hold Invisible Creator, its officers, employees,
          directors, and agents and Invisible Creator affiliates and their officers, employees,
          directors, and agents harmless from any and all losses, damages, expenses, including
          reasonable attorneys' fees, rights, claims, actions of any kind and injury (including
          death) arising out of or relating to your use of the Site and/or Services, any User
          Content, your connection to the Service, your violation of these Terms and Conditions or
          your violation of any rights of another.
        </p>
      </div>
    ),
  },
  {
    id: "introduction",
    icon: Eye,
    iconBg: "bg-blue-500/15 text-blue-400",
    title: "1. Introduction",
    content: (
      <div className="space-y-3">
        <Clause num="1.1">
          These Terms of Service ("Terms") govern your use of{" "}
          <strong className="text-white">Invisible Creator</strong> ("our", "we", "us") services and
          products ("Services"). By using our Services, you ("User", "you", "your") agree to be
          bound by these Terms.
        </Clause>
      </div>
    ),
  },
  {
    id: "scope",
    icon: Settings,
    iconBg: "bg-violet-500/15 text-violet-400",
    title: "2. Scope and Service",
    content: (
      <div className="space-y-3">
        <Clause num="2.1">
          We offer a Service that streamlines the content creation process for faceless channels on
          platforms like YouTube, TikTok, Instagram, and more, by using AI to automatically create
          video content based on User-inputted stories. These Services do not include providing
          hosting or sharing content from Users, rather we facilitate Users to share their generated
          content on their chosen platforms.
        </Clause>
        <Clause num="2.2">
          Users may also upload their created content directly to YouTube, Instagram, or TikTok to
          utilize our Services.
        </Clause>
      </div>
    ),
  },
  {
    id: "obligations",
    icon: Shield,
    iconBg: "bg-cyan-500/15 text-cyan-400",
    title: "3. User Obligations",
    content: (
      <div className="space-y-3">
        <Clause num="3.1">
          When using our Services, you agree not to upload, publish, or share content that is
          illegal, harmful, abusive, explicit, violates copyright laws, or otherwise inappropriately
          infringes upon the rights of others.
        </Clause>
        <Clause num="3.2">
          You are solely responsible for the content you upload for generation. We do not pre-screen
          User content, and are not liable for the content shared via our Services.
        </Clause>
        <Clause num="3.3">
          If we receive notice of any uploaded content violating these Terms, we retain the right to
          remove such content and may terminate your access to our Services.
        </Clause>
      </div>
    ),
  },
  {
    id: "ip",
    icon: Gavel,
    iconBg: "bg-teal-500/15 text-teal-400",
    title: "4. Intellectual Property Rights",
    content: (
      <div className="space-y-3">
        <Clause num="4.1">
          By using our Services, you ensure you have all necessary rights and authorizations for any
          content you upload and the subsequent use of that content.
        </Clause>
        <Clause num="4.2">
          You retain ownership of any intellectual property rights to the content provided.
        </Clause>
        <Clause num="4.3">
          By providing content for generation, you grant us the non-exclusive right to use, copy,
          distribute and display the content for the purpose of providing and improving our Services.
        </Clause>
      </div>
    ),
  },
  {
    id: "copying",
    icon: Ban,
    iconBg: "bg-red-500/15 text-red-400",
    title: "5. Prohibition Against Copying",
    badge: "Important",
    content: (
      <div className="space-y-3">
        <Clause num="5.1">
          You agree not to copy, reproduce, distribute, or create derivative works of any aspect of
          our Services, including but not limited to our service functionalities, user interface, site
          design, elements, logo, or overall business model.
        </Clause>
        <Clause num="5.2">
          Unauthorized use or reproduction of any part of our Services will be considered a violation
          of these Terms and may result in legal action.
        </Clause>
        <Clause num="5.3">
          If you are found to be in breach of this prohibition, we reserve the right to take the
          following actions:
        </Clause>
        <div className="space-y-2 ml-4">
          <SubClause num="5.3.1">Immediate termination of your account and access to our Services.</SubClause>
          <SubClause num="5.3.2">
            Pursuit of legal remedies, including seeking injunctive relief, damages, and legal costs.
          </SubClause>
          <SubClause num="5.3.3">
            Notification to relevant authorities and stakeholders of the breach.
          </SubClause>
          <SubClause num="5.3.4">
            Public disclosure of the breach and the actions taken against the offending party.
          </SubClause>
          <SubClause num="5.3.5">
            Blacklisting from future use of our Services and any associated platforms.
          </SubClause>
          <SubClause num="5.3.6">
            Imposition of a monetary penalty as deemed appropriate by a court of law or through
            arbitration.
          </SubClause>
        </div>
      </div>
    ),
  },
  {
    id: "disclaimer",
    icon: AlertTriangle,
    iconBg: "bg-amber-500/15 text-amber-400",
    title: "6. Disclaimer and Limitation of Liability",
    content: (
      <div className="space-y-3">
        <Clause num="6.1">
          Our Services are provided{" "}
          <strong className="text-white">"as is"</strong> and we expressly disclaim any warranties,
          whether express or implied, including warranties of merchantability, fitness for particular
          purpose, non-infringement or any other form of warranty.
        </Clause>
        <Clause num="6.2">
          Under no circumstances shall we be liable for any direct, indirect, incidental, special,
          consequential, or exemplary damages due to your use or inability to use our Services.
        </Clause>
      </div>
    ),
  },
  {
    id: "termination",
    icon: AlertTriangle,
    iconBg: "bg-orange-500/15 text-orange-400",
    title: "7. Termination",
    content: (
      <div className="space-y-3">
        <Clause num="7.1">
          We reserve the right to terminate your access to our Services, without any prior notice,
          for any reason at any time.
        </Clause>
        <Clause num="7.2">
          We reserve the right to delete any inactive, unused, previously used, or pending Series,
          Videos, Accounts or related data after a{" "}
          <strong className="text-white">3 month period of inactivity</strong> from our platform.
        </Clause>
      </div>
    ),
  },
  {
    id: "cancellation",
    icon: CreditCard,
    iconBg: "bg-emerald-500/15 text-emerald-400",
    title: "8. Cancellation Policy",
    content: (
      <div className="space-y-3">
        <Clause num="8.1">
          You can cancel your subscription(s) at any time. There is no binding contract when
          subscribing to our platform.
        </Clause>
        <Clause num="8.2">
          Upon cancellation, you will lose access to the site at your next billing cycle. Your
          subscription will be active for the remainder of the current billing cycle.
        </Clause>
        <Clause num="8.3">
          You can cancel your subscription in three ways:
        </Clause>
        <div className="ml-11">
          <ul className="space-y-2 mt-1">
            <BulletItem>Delete your Series from your dashboard.</BulletItem>
            <BulletItem>
              Press the <strong className="text-white">"Manage Billing"</strong> button from the
              dashboard to access your billing portal.
            </BulletItem>
            <BulletItem>
              From the Contact page, select{" "}
              <strong className="text-white">"I want to unsubscribe"</strong> from the dropdown.
            </BulletItem>
          </ul>
        </div>
        <Clause num="8.4">
          <span className="text-amber-300/90">
            Emails sent to our support team requesting to cancel your subscription do not qualify as
            canceling your subscription. You are responsible for confirming your cancellation request
            via the multiple options mentioned in 8.3.
          </span>
        </Clause>
      </div>
    ),
  },
  {
    id: "refunds",
    icon: RefreshCw,
    iconBg: "bg-rose-500/15 text-rose-400",
    title: "9. Refund Policy",
    content: (
      <div className="space-y-3">
        <Clause num="9.1">
          We do not provide refunds for cancelled subscriptions. Any subscription that is cancelled
          during the term will be downgraded immediately upon cancellation. We advise you to fully
          utilize your subscription until the termination date.
        </Clause>
        <Clause num="9.2">
          In the event that we decide to issue a refund, we hold the right to determine the terms,
          including the amount, at our discretion.
        </Clause>
        <Clause num="9.3">
          By using this platform, you acknowledge that it may encounter errors or glitches and agree
          that such issues do not entitle you to a refund. It is your responsibility to attempt to
          resolve any encountered problems immediately by using the support resources on our contact
          page.
        </Clause>
        <Clause num="9.4">
          <strong className="text-white">Annual Plans:</strong> No partial refunds are typically
          available for annual plans, due to the discount for long-term commitments.
        </Clause>
        <Clause num="9.5">
          <strong className="text-white">Trial Cancellations:</strong> Free trials that are not
          canceled will automatically turn into paid subscriptions. We provide three days of free
          trials to our services. If you fail to cancel your trial before it expires and converts
          into a paid subscription, you are not entitled to a refund.
        </Clause>
      </div>
    ),
  },
  {
    id: "expectations",
    icon: TrendingUp,
    iconBg: "bg-sky-500/15 text-sky-400",
    title: "10. Expectations",
    content: (
      <div className="space-y-3">
        <Clause num="10.1">
          We are not responsible for the performance of your videos, financial expectations, or how
          your videos get administered by the platform's algorithm.
        </Clause>
        <Clause num="10.2">
          We do not guarantee that you will make money by using Invisible Creator. We do not
          guarantee that your videos will get picked up by the algorithm or get any views. Our
          platform's deliverable is solely intended to help create and post videos on your behalf.
        </Clause>
      </div>
    ),
  },
  {
    id: "changes",
    icon: FileText,
    iconBg: "bg-indigo-500/15 text-indigo-400",
    title: "11. Changes to Terms",
    content: (
      <div className="space-y-3">
        <Clause num="11.1">
          We reserve the right to modify these Terms at any time. It is your responsibility to
          review the Terms regularly. Your continued use of our Services will constitute acceptance
          of any modifications.
        </Clause>
      </div>
    ),
  },
  {
    id: "autoposting",
    icon: Youtube,
    iconBg: "bg-red-600/15 text-red-400",
    title: "12. Autoposting",
    content: (
      <div className="space-y-3">
        <Clause num="12.1">
          By using our service, you agree to allow us to post videos on your behalf to your
          connected social media account(s).
        </Clause>
        <Clause num="12.2">
          Each post made to your social media channel(s) is expressly consented to by you.
        </Clause>
        <Clause num="12.3">
          You are satisfied with the video preview for your upcoming video as the basis for the
          video content to be published to your account(s).
        </Clause>
      </div>
    ),
  },
  {
    id: "governing",
    icon: Scale,
    iconBg: "bg-slate-500/15 text-slate-400",
    title: "13. Governing Law and Jurisdiction",
    content: (
      <div className="space-y-3">
        <Clause num="13.1">
          These Terms will be governed by and construed in accordance with the laws of the
          jurisdiction where we are established, without giving effect to any principles of conflicts
          of law.
        </Clause>
      </div>
    ),
  },
  {
    id: "contact-main",
    icon: Mail,
    iconBg: "bg-primary/15 text-primary",
    title: "14. Contact Us",
    content: (
      <div className="space-y-3">
        <Clause num="14.1">
          If you require further information or have any questions about our Terms of Service, please
          contact us at{" "}
          <a
            href="mailto:terms@invisiblecreator.video"
            className="text-primary hover:underline"
          >
            terms@invisiblecreator.video
          </a>
          .
        </Clause>
      </div>
    ),
  },
  {
    id: "advertising",
    icon: Megaphone,
    iconBg: "bg-pink-500/15 text-pink-400",
    title: "Advertising Terms — TikTok",
    badge: "Supplemental",
    content: (
      <div className="space-y-4">
        <div className="rounded-xl bg-white/3 border border-white/8 p-4 text-sm text-white/50 leading-relaxed space-y-2">
          <p>
            <strong className="text-white/70">Effective Date: November 21, 2025</strong>
          </p>
          <p>
            These Supplemental Terms of Service for Advertising on TikTok (the "Advertising Terms")
            govern your use of the services provided by Invisible Creator ("we," "us," or "our") to
            create, manage, or place advertising on the TikTok platform (the "Advertising Services").
          </p>
          <p>
            These Advertising Terms supplement and are incorporated by reference into our main Terms
            of Service (the "General Terms"). By using the Advertising Services, you agree to both
            the General Terms and these Advertising Terms. In the event of any conflict between these
            Advertising Terms and the General Terms, these Advertising Terms shall control with
            respect to your use of the Advertising Services.
          </p>
        </div>

        <SectionDivider title="1. Your Responsibilities as an Advertiser" />
        <p className="text-sm text-white/60 leading-relaxed">
          You are solely responsible for all aspects of your advertising campaigns and content. This
          includes, but is not limited to:
        </p>
        <ul className="space-y-2 ml-2">
          <BulletItem label="Ad Content:">
            All advertising materials, including text, images, videos, audio, and any other creative
            elements ("Ad Content").
          </BulletItem>
          <BulletItem label="Targeting Decisions:">
            Any keywords, audience selections, or other targeting parameters.
          </BulletItem>
          <BulletItem label="Destinations:">
            Any landing pages, websites, applications, or other destinations to which your ads
            direct users.
          </BulletItem>
          <BulletItem label="Promotional Claims:">
            Any products, services, claims, or promotional messages contained within your ads or
            destinations.
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          This responsibility remains with you even if our platform provides tools, suggestions, or
          assistance in the creation or management of your campaigns. We do not review or approve Ad
          Content before it is submitted to TikTok.
        </p>

        <SectionDivider title="2. Compliance with TikTok's Policies" />
        <p className="text-sm text-white/60 leading-relaxed">
          Your use of the Advertising Services is contingent upon your full compliance with all
          applicable TikTok policies. You represent and warrant that you have read, understood, and
          agree to be bound by:
        </p>
        <ul className="space-y-2 ml-2">
          <BulletItem label="TikTok's Advertising Policies:">
            Available at{" "}
            <a
              href="https://ads.tiktok.com/help/article/tiktok-advertising-policies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ads.tiktok.com/help/article/tiktok-advertising-policies
            </a>
          </BulletItem>
          <BulletItem label="TikTok's Commercial Terms of Service:">
            Available at{" "}
            <a
              href="https://ads.tiktok.com/i18n/official/policy/commercial-terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ads.tiktok.com/i18n/official/policy/commercial-terms-of-service
            </a>
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          You acknowledge that these policies are subject to change by TikTok at any time, and you
          are solely responsible for monitoring and complying with the most current versions. A
          violation of any TikTok policy is considered a violation of our Terms and may result in the
          immediate suspension or termination of your account.
        </p>

        <SectionDivider title="3. Intellectual Property Rights in Ads" />
        <p className="text-sm text-white/60 leading-relaxed">
          You represent and warrant that you own or have obtained all necessary rights, licenses,
          consents, and permissions for all Ad Content you submit through our Advertising Services.
          This includes, without limitation, all rights for any:
        </p>
        <ul className="space-y-2 ml-2">
          <BulletItem label="Music:">
            Any musical works or sound recordings not sourced directly from TikTok's own Commercial
            Music Library.
          </BulletItem>
          <BulletItem label="Trademarks & Logos:">
            Use of any third-party names, logos, or trademarks.
          </BulletItem>
          <BulletItem label="Images & Video:">
            All visual content, including rights of publicity for any individuals depicted.
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          You agree not to use any content that infringes upon the copyright, trademark, patent,
          trade secret, or other intellectual property rights of any third party.
        </p>

        <SectionDivider title="4. Indemnification" />
        <p className="text-sm text-white/60 leading-relaxed">
          You agree to defend, indemnify, and hold harmless Invisible Creator, its affiliates,
          officers, directors, employees, and agents from and against any and all claims, damages,
          obligations, losses, liabilities, costs, or debt, and expenses (including but not limited
          to attorney's fees) arising from:
        </p>
        <ul className="space-y-2 ml-2">
          <BulletItem>(a) Your use of and access to the Advertising Services;</BulletItem>
          <BulletItem>
            (b) Your violation of any term of these Advertising Terms or the General Terms;
          </BulletItem>
          <BulletItem>
            (c) Your violation of any third-party right, including without limitation any copyright,
            property, or privacy right;
          </BulletItem>
          <BulletItem>
            (d) Any claim that your Ad Content caused damage to a third party;
          </BulletItem>
          <BulletItem>
            (e) Your violation of any applicable law, rule, or regulation, including but not limited
            to TikTok's policies.
          </BulletItem>
        </ul>
        <p className="text-sm text-white/60 leading-relaxed">
          This defense and indemnification obligation will survive these Advertising Terms and your
          use of the Advertising Services.
        </p>

        <SectionDivider title="5. Disclaimers and Limitation of Liability" />
        <div className="rounded-xl bg-white/3 border border-white/8 p-4 text-xs text-white/45 leading-relaxed font-mono uppercase tracking-wide">
          THE ADVERTISING SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT
          PERMITTED BY LAW, INVISIBLE CREATOR DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, IN
          CONNECTION WITH THE ADVERTISING SERVICES AND YOUR USE THEREOF. WE MAKE NO WARRANTIES OR
          REPRESENTATIONS ABOUT THE ACCURACY, PERFORMANCE, REACH, OR EFFECTIVENESS OF ANY
          ADVERTISING CAMPAIGN.
          <br /><br />
          INVISIBLE CREATOR DOES NOT GUARANTEE THAT YOUR ADS WILL BE ACCEPTED OR DISPLAYED BY
          TIKTOK, NOR DO WE GUARANTEE ANY PARTICULAR OUTCOME OR RETURN ON YOUR ADVERTISING SPEND.
          <br /><br />
          IN NO EVENT SHALL INVISIBLE CREATOR BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL,
          SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER RESULTING FROM ANY (I) ERRORS,
          MISTAKES, OR INACCURACIES OF CONTENT, (II) PERSONAL INJURY OR PROPERTY DAMAGE OF ANY
          NATURE WHATSOEVER RESULTING FROM YOUR ACCESS TO AND USE OF OUR SERVICES, (III) ANY BUGS,
          VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH OUR SERVICES BY
          ANY THIRD PARTY, AND/OR (IV) ANY ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY LOSS OR
          DAMAGE OF ANY KIND INCURRED AS A RESULT OF YOUR USE OF ANY CONTENT POSTED, EMAILED,
          TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES. OUR AGGREGATE LIABILITY TO YOU
          FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE OF THE ADVERTISING SERVICES IS
          LIMITED TO THE GREATER OF (A) THE AMOUNT OF FEES PAID BY YOU TO US FOR THE ADVERTISING
          SERVICES IN THE THREE (3) MONTHS PRIOR TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS
          ($100).
        </div>

        <SectionDivider title="6. Our Role as a Service Provider" />
        <p className="text-sm text-white/60 leading-relaxed">
          Invisible Creator is an independent contractor providing a technology platform to
          facilitate your advertising activities on TikTok. We are not an agent of you or of TikTok.
          Our platform acts as a tool to assist you, but you retain full control over and
          responsibility for your advertising decisions and content.
        </p>

        <SectionDivider title="7. Payment Terms" />
        <p className="text-sm text-white/60 leading-relaxed">
          You agree to pay all applicable fees and authorize us to charge your selected payment
          method. All fees are non-refundable except as required by law or as explicitly stated in
          our payment policy.
        </p>

        <SectionDivider title="8. Termination" />
        <p className="text-sm text-white/60 leading-relaxed">
          We may terminate or suspend your access to the Advertising Services immediately, without
          prior notice or liability, for any reason whatsoever, including without limitation if you
          breach these Advertising Terms or the General Terms. Upon termination, your right to use
          the Advertising Services will immediately cease.
        </p>

        <SectionDivider title="9. Compliance with Laws" />
        <p className="text-sm text-white/60 leading-relaxed">
          You agree to comply with all applicable federal, state, and local laws, rules, and
          regulations, including but not limited to those of the Federal Trade Commission (FTC)
          concerning advertising, endorsements, and consumer protection. You are responsible for
          including any legally required disclosures in your ads.
        </p>

        <p className="text-xs text-white/25 pt-2">Last Updated on 11/21/2025</p>
      </div>
    ),
  },
];

export default function Terms({ session, isAdmin, onLogout }: Props) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [openId, setOpenId] = useState<string | null>("general");

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

          {/* Page header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5 uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5" />
              Legal
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="text-white/40 text-sm">
              Last updated:{" "}
              <span className="text-white/60">November 21, 2025</span>
              &nbsp;·&nbsp;Effective immediately upon use of our Services
            </p>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 sm:p-6 mb-8 flex gap-4">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-white/55 leading-relaxed">
              <strong className="text-white">TL;DR:</strong> By using Invisible Creator you agree
              to use the platform responsibly, own the rights to content you upload, and understand
              we provide the service "as is." You can cancel anytime — no binding contracts. Refunds
              are not provided for cancelled subscriptions. We are not responsible for your video
              performance or earnings.
            </p>
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
              <h3 className="font-semibold text-white mb-1">Questions about these Terms?</h3>
              <p className="text-white/40 text-sm">
                Contact us at{" "}
                <a
                  href="mailto:terms@invisiblecreator.video"
                  className="text-primary hover:underline"
                >
                  terms@invisiblecreator.video
                </a>
              </p>
            </div>
            <a
              href="mailto:terms@invisiblecreator.video"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
            >
              Contact Us
            </a>
          </div>

          {/* Bottom nav */}
          <div className="mt-8 text-center text-sm text-white/30 space-x-4">
            <Link to="/" className="hover:text-white/60 transition-colors">← Back to Home</Link>
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
