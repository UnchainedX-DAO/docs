const SOCIAL_LINKS = [
  {
    label: "X",
    href: "https://x.com/0xunchainedx",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/unchained-x",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
] as const;

export default function Footer() {
  return (
    <footer
      className="relative px-6 py-16 md:px-10 md:py-24 min-h-screen overflow-hidden flex items-center"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Neon accent lines — matching menu overlay style */}
      <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent" />
      <div className="absolute right-[15%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-purple/10 to-transparent" />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
        {/* GET IN TOUCH */}
        <h2 data-footer-item className="text-3xl md:text-5xl font-bold uppercase tracking-wider text-neon-cyan neon-glow-strong">
          Get In Touch
        </h2>

        {/* Email */}
        <a
          data-footer-item
          href="mailto:hello@unchainedx.io"
          className="text-lg md:text-xl text-text-muted neon-glow hover:text-neon-purple hover:neon-glow-purple transition-all duration-500"
        >
          hello@unchainedx.io
        </a>

        {/* Social links */}
        <div data-footer-item className="flex gap-6">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-neon-cyan hover:scale-110 transition-all duration-300"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p data-footer-item className="text-xs text-text-muted pt-8">
          © 2026 UnchainedX Inc.
        </p>
      </div>
    </footer>
  );
}
