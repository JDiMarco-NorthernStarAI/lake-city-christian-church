import { Link } from "wouter";
import { SiInstagram, SiFacebook, SiYoutube } from "react-icons/si";
import whiteLogoPath from "@assets/White_Logo_1770933488639.png";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Who We Are", href: "/about" },
  { label: "Watch", href: "/encounter" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/lakecitycc",
    icon: SiInstagram,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/LakeCityCCOhio",
    icon: SiFacebook,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@LakeCityChristianChurch",
    icon: SiYoutube,
  },
];

export default function Footer() {
  return (
    <footer
      data-testid="footer"
      className="bg-[#0A0A0A] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div data-testid="footer-column-logo">
            <Link href="/" data-testid="footer-link-logo">
              <img
                src={whiteLogoPath}
                alt="Lake City Christian Church"
                className="h-auto w-[140px] mb-6"
                data-testid="footer-img-logo"
              />
            </Link>
            <p
              className="text-white/70 text-sm leading-relaxed"
              data-testid="footer-text-tagline"
            >
              Connecting people to a life-changing relationship with Jesus.
            </p>
          </div>

          <div data-testid="footer-column-links">
            <h3
              className="text-white font-semibold mb-4"
              data-testid="footer-heading-links"
            >
              Quick Links
            </h3>
            <ul className="space-y-3" data-testid="footer-list-links">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <span className="text-white/70 hover:text-white transition-colors text-sm">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div data-testid="footer-column-info">
            <h3
              className="text-white font-semibold mb-4"
              data-testid="footer-heading-info"
            >
              Info
            </h3>
            <div className="space-y-4" data-testid="footer-info-content">
              <div>
                <p
                  className="text-white/70 text-sm"
                  data-testid="footer-text-address"
                >
                  6717 Fry Road, Middleburg Heights, OH
                </p>
              </div>
              <div>
                <p
                  className="text-white/70 text-sm"
                  data-testid="footer-text-service-time"
                >
                  Service Time: Sunday @ 10:00 AM
                </p>
              </div>
            </div>
          </div>

          <div data-testid="footer-column-social">
            <h3
              className="text-white font-semibold mb-4"
              data-testid="footer-heading-social"
            >
              Connect
            </h3>
            <div className="flex gap-4" data-testid="footer-social-icons">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`footer-link-${social.name.toLowerCase()}`}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" data-testid={`footer-icon-${social.name.toLowerCase()}`} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className="border-t border-white/10"
        data-testid="footer-divider"
      />

      <div
        className="mx-auto max-w-7xl px-4 py-8 lg:px-6 text-center"
        data-testid="footer-bottom-bar"
      >
        <p
          className="text-white/70 text-sm"
          data-testid="footer-text-copyright"
        >
          © Lake City Christian Church
        </p>
      </div>
    </footer>
  );
}
