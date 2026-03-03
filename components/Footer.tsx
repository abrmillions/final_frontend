import Link from "next/link";
import { Building2 } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

const servicesLinks: FooterLink[] = [
  { label: "Contractor License (Grades 1-7)", href: "/register" },
  { label: "Professional Competency", href: "/register"  },
  { label: "Machinery Import/Export", href: "/register"  },
  { label: "Joint Venture Partnerships", href: "/register"  },
];

const supportLinks: FooterLink[] = [
  { label: "Support", href: "/support" },
  { label: "Help Center & Workflow", href: "/help-center" },
  { label: "Contact JIT Team & Authority", href: "/contact" },
  { label: "System FAQs", href: "/faqs" },
];

const legalLinks: FooterLink[] = [
  { label: "Legal", href: "/legal" },
  { label: "Privacy Policy (Data Protection)", href: "/privacy-policy" },
  { label: "Terms of Service & Signatures", href: "/terms-of-service" },
];

const publicLinks: FooterLink[] = [
  { label: "Verify License", href: "/verify" },
  { label: "Partnership Verification", href: "/partner/public/verify" },
];

export function Footer() {
  return (
    <footer className="bg-[#343A40] text-[#F8F9FA] border-t border-gray-700 font-sans">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Column 1: Branding & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1B54DA] rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CLMS</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              A digital transformation initiative for the Oromia Construction and Urban Development Bureau. 
              The system is designed to automate construction licensing, improve transparency.
            </p>
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Services</h3>
            <ul className="space-y-3">
              {servicesLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#F8F9FA] hover:text-white hover:underline decoration-[#1B54DA] decoration-2 underline-offset-4 transition-colors text-sm block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#F8F9FA] hover:text-white hover:underline decoration-[#1B54DA] decoration-2 underline-offset-4 transition-colors text-sm block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Public */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Public</h3>
            <ul className="space-y-3">
              {publicLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#F8F9FA] hover:text-white hover:underline decoration-[#1B54DA] decoration-2 underline-offset-4 transition-colors text-sm block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#F8F9FA] hover:text-white hover:underline decoration-[#1B54DA] decoration-2 underline-offset-4 transition-colors text-sm block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-600 bg-[#2b3035]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 text-xs text-gray-400">
            {/* <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-center md:text-left">
                System compliant with WCAG 2.1 AA accessibility standards and optimized for high-performance processing (&lt; 5 seconds per document).
              </p>
            </div> */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-700 pt-4 mt-2">
              <p className="text-center md:text-left">
                &copy; 2026 Construction License Management System (CLMS)
              </p>
              <p className="text-center md:text-right">
                Developed by Oromia Construction Authority
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
