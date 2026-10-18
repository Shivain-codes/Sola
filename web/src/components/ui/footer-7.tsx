import type { ReactElement, MouseEvent } from "react";

interface Footer7Props {
  title?: string;
  titleHref?: string;
  onTitleClick?: (e: MouseEvent) => void;
  sections?: Array<{
    title: string;
    links: Array<{
      name: string;
      href: string;
      external?: boolean;
      onClick?: (e: MouseEvent) => void;
    }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    onClick?: (e: MouseEvent) => void;
  }>;
}

const Footer7 = ({
  title = "Sola",
  titleHref = "#top",
  onTitleClick,
  sections = [],
  description = "",
  socialLinks = [],
  copyright = "© 2026 Sola",
  legalLinks = [],
}: Footer7Props) => {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            {/* Brand */}
            <div className="flex items-center gap-2 lg:justify-start">
              <a
                href={titleHref}
                onClick={onTitleClick}
                className="font-display text-xl text-ink"
              >
                {title}
              </a>
            </div>
            {description && (
              <p className="max-w-[70%] text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {socialLinks.length > 0 && (
              <ul className="flex items-center space-x-6 text-muted-foreground">
                {socialLinks.map((social, idx) => (
                  <li key={idx} className="font-medium hover:text-primary">
                    <a href={social.href} aria-label={social.label}>
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx} className="font-medium hover:text-primary">
                      {link.href ? (
                        <a
                          href={link.href}
                          onClick={link.onClick}
                          {...(link.external
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                        >
                          {link.name}
                        </a>
                      ) : (
                        <span>{link.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-line py-6 text-xs font-medium text-muted-foreground md:flex-row md:items-center md:text-left">
          <p className="order-2 lg:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-6">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-primary">
                <button
                  type="button"
                  onClick={link.onClick}
                  className="cursor-pointer"
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export { Footer7 };
