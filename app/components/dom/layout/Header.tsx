import { Link } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import MenuIcon from "./MenuIcon.client";

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}

export default function Header({ isMenuOpen, onMenuToggle, onMenuClose }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
      {/* Logo (top-left) */}
      <Link
        to="/"
        onClick={onMenuClose}
        className="text-lg md:text-xl font-bold tracking-tight text-text/60 neon-glow hover:text-neon-cyan hover:neon-glow-strong transition-all duration-500"
      >
        UnchainedX DAO
      </Link>

      {/* Menu button (top-right) */}
      <div className="flex items-center gap-4 md:gap-6">
        <ClientOnly fallback={<div className="w-8 h-8" />}>
          {() => <MenuIcon isOpen={isMenuOpen} onClick={onMenuToggle} />}
        </ClientOnly>
      </div>
    </header>
  );
}
