import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex bg-zinc-950">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #a855f7 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-violet-950/10" />
          {/* Glow orbs */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl" />
        </div>

        {/* Logo + wordmark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-xl border border-purple-500/20 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/logo.png"
              width={36}
              height={36}
              alt="ImgGen"
              className="object-cover p-0.5"
            />
          </div>
          <span className="text-zinc-100 font-semibold text-lg tracking-tight">
            ImgGen
          </span>
        </div>

        {/* Center copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-zinc-100 leading-tight tracking-tight">
              Generate. Edit.
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                Imagine anything.
              </span>
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
              A powerful AI image editor that turns your ideas into reality in
              seconds.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              "Prompt-based image generation",
              "Non-destructive layer editing",
              "One-click style transfers",
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-zinc-400 text-sm"
              >
                <span className="size-1.5 rounded-full bg-purple-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-zinc-600 text-xs">
            &copy; {new Date().getFullYear()} ImgGen. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:border-l lg:border-white/5 overflow-y-auto">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
