import { playClick } from "~/core/adapters/audio";
import type { ProjectStatus } from "~/core/adapters/sanity";

const STATUS_OPTIONS: (ProjectStatus | "All")[] = ["All", "In Dev", "Live", "Archived"];

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeStatus: ProjectStatus | "All";
  onStatusChange: (status: ProjectStatus | "All") => void;
}

export default function PortfolioHeader({
  searchQuery,
  onSearchChange,
  activeStatus,
  onStatusChange,
}: Props) {
  return (
    <div className="fixed md:relative z-30 top-0 left-0 right-0 pt-28 pb-4 px-8 md:px-16">
      <h1
        className="text-4xl md:text-5xl font-bold tracking-wider mb-3 neon-glow-strong"
        style={{ fontFamily: "Rubik, sans-serif", color: "#00F0FF" }}
      >
        Portfolio
      </h1>
      <p className="text-sm max-w-xl leading-relaxed mb-6 neon-glow" style={{ color: "rgba(0,240,255,0.6)" }}>
        Projects we&apos;re building, shipping.
      </p>

      <div className="flex items-center gap-2 md:gap-4 flex-wrap mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-xs font-mono px-4 py-2 rounded-full outline-none transition-all duration-300 w-full md:w-48 md:focus:w-64"
            style={{
              backgroundColor: "rgba(0,240,255,0.05)",
              color: "#E0E0FF",
              border: "1px solid rgba(0,240,255,0.1)",
              caretColor: "#00F0FF",
            }}
          />
        </div>

        {STATUS_OPTIONS.map((status) => {
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                playClick();
                onStatusChange(status);
              }}
              className="text-[11px] uppercase tracking-[0.2em] font-mono px-4 py-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isActive ? "rgba(0,240,255,0.1)" : "rgba(255,255,255,0.03)",
                color: isActive ? "#00F0FF" : "rgba(224,224,255,0.45)",
                border: `1px solid ${isActive ? "rgba(0,240,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                boxShadow: isActive ? "0 0 10px rgba(0,240,255,0.15), 0 0 20px rgba(0,240,255,0.06)" : "none",
                textShadow: isActive ? "0 0 8px rgba(0,240,255,0.4)" : "none",
              }}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
