import ServerStatus from "@/components/ServerStatus";
import PatchNotes from "@/components/PatchNotes";
import Particles from "@/components/Particles";
import DownloadButton from "@/components/DownloadButton";

const features = [
  {
    title: "AI Dungeon Master",
    description:
      "MadGod, our AI companion, creates dynamic events, challenges, and chaos tailored to your gameplay.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "170+ Mods",
    description:
      "MineColonies, Mekanism, Create, ProjectE, Gobber, and much more on NeoForge 1.21.1.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: "Custom Launcher",
    description:
      "One-click install and auto-updates with the TZP Launcher. No manual mod management needed.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

const stats = [
  { label: "Mods", value: "170+" },
  { label: "AI Powered", value: "MadGod" },
  { label: "NeoForge", value: "1.21.1" },
  { label: "Always", value: "Updated" },
];

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Particles />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight gradient-text-animated">
            TZP
          </span>
          <div className="flex items-center gap-6">
            <a
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-accent transition-colors link-underline"
            >
              Dashboard
            </a>
            <ServerStatus compact />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-10" />
        {/* Secondary glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-nether)_0%,_transparent_50%)] opacity-5" />

        <div className="relative z-10">
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter gradient-text-animated animate-fade-in-up">
            TZP
          </h1>

          <p className="mt-6 text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delay-1">
            A modded Minecraft experience with an{" "}
            <span className="text-accent font-semibold">AI Dungeon Master</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up-delay-2">
            <DownloadButton />
            <a
              href="/dashboard"
              className="px-8 py-3.5 glass rounded-lg text-text-primary hover:text-accent font-semibold transition-all duration-300 hover:border-accent/40"
            >
              View Dashboard
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fade-in-up-delay-3">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span
                  className="text-2xl md:text-3xl font-bold font-mono text-accent"
                  style={{ animation: `count-up 0.5s ease-out ${0.6 + i * 0.15}s both` }}
                >
                  {stat.value}
                </span>
                <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-4">
          Why <span className="gradient-text-animated">TZP</span>?
        </h2>
        <p className="text-text-secondary text-center mb-16 max-w-xl mx-auto">
          Not your average modded server. Every detail is curated for the ultimate experience.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass rounded-xl p-8 card-hover group"
            >
              <div className="w-14 h-14 bg-primary/20 text-accent rounded-lg flex items-center justify-center mb-5 group-hover:glow-purple transition-shadow duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Patch Notes */}
      <section className="max-w-4xl mx-auto px-6 py-24 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-4">Latest Updates</h2>
        <p className="text-text-secondary text-center mb-12">
          What&apos;s new in the world of TZP
        </p>
        <PatchNotes limit={1} />
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/10 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold gradient-text-animated">TZP</span>
              <span className="text-sm text-text-secondary">
                Modded Minecraft &mdash; NeoForge 1.21.1
              </span>
            </div>
            <div className="flex items-center gap-6">
              {/* GitHub */}
              <a
                href="https://github.com/TheZackPack"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-accent transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-accent transition-colors"
                aria-label="Discord (coming soon)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-primary/10 text-center">
            <span className="text-xs text-text-secondary/60 font-mono">
              Built by NightMoon_ // Powered by chaos
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
