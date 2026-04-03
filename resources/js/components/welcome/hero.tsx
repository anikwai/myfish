import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export function WelcomeHero() {
  return (
    <>
      <style>{`
                @keyframes heroFadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .hero-item { animation: heroFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

      <div className="relative mb-14 overflow-hidden sm:mb-20">
        <DotPattern
          width={20}
          height={20}
          cr={1.5}
          className={cn(
            "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
          )}
        />

        <div className="relative py-10 sm:py-14">
          {/* Eyebrow with left accent bar */}
          <div
            className="hero-item mb-6 flex items-center gap-3"
            style={{ animationDelay: "0ms" }}
          >
            <span className="h-4 w-px bg-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Solomon Islands
            </p>
          </div>

          <h1
            className="hero-item text-5xl font-bold leading-[0.92] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Fresh
            <br />
            fish,
            <br />
            <span className="text-primary">delivered.</span>
          </h1>

          <p
            className="hero-item mt-8 max-w-[30ch] text-sm leading-relaxed text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            Order online — filleting and delivery available across Solomon
            Islands.
          </p>

          <div
            className="hero-item mt-6 flex flex-wrap gap-2"
            style={{ animationDelay: "240ms" }}
          >
            {["Ocean-fresh", "Filleted to order", "Doorstep delivery"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
