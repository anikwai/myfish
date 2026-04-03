import { Marquee } from "@/components/ui/marquee";

const clients = [
  { name: "Solomon Islands National University", logo: "" },
  { name: "Heritage Park Hotel", logo: "" },
  { name: "Honiara Hotel", logo: "" },
];

export function WelcomeClients() {
  return (
    <div className="mt-12 sm:mt-16">
      <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Trusted by
      </p>

      {/* Fade edges */}
      <div
        className="overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem]">
          {clients.map((client) => (
            <div
              key={client.name}
              className="flex items-center gap-2.5 rounded-full border border-border bg-background px-4 py-2 transition-colors hover:bg-muted"
            >
              {client.logo ? (
                <img
                  src={client.logo}
                  alt={client.name}
                  className="size-5 object-contain"
                />
              ) : (
                <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                  {client.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
              )}
              <span className="text-xs font-medium text-foreground">
                {client.name}
              </span>
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
