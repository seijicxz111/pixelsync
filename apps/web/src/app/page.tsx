import Link from "next/link";
import { ArrowRight, History, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@pixelsync/ui";

const pixels = [
  0, 0, 0, 4, 4, 4, 0, 0, 0, 2, 2, 2, 4, 4, 0, 0,
  0, 0, 4, 3, 3, 3, 4, 0, 2, 5, 5, 2, 3, 4, 4, 0,
  0, 4, 3, 3, 1, 3, 3, 4, 2, 5, 1, 5, 2, 3, 4, 0,
  4, 3, 3, 1, 1, 1, 3, 4, 2, 5, 5, 5, 2, 3, 3, 4,
  4, 3, 3, 3, 1, 3, 3, 4, 0, 2, 5, 2, 0, 4, 3, 4,
  0, 4, 3, 3, 3, 3, 4, 0, 0, 0, 2, 0, 4, 3, 3, 4,
  0, 0, 4, 4, 4, 4, 0, 0, 0, 2, 2, 2, 4, 3, 3, 4,
  0, 6, 6, 6, 6, 6, 6, 0, 2, 5, 5, 5, 2, 4, 4, 0,
  6, 6, 7, 7, 7, 7, 6, 6, 2, 5, 1, 5, 2, 0, 0, 0,
  6, 7, 7, 8, 8, 7, 7, 6, 0, 2, 5, 2, 0, 0, 0, 0,
  6, 7, 8, 8, 8, 8, 7, 6, 0, 0, 2, 0, 0, 0, 0, 0,
  6, 7, 7, 8, 8, 7, 7, 6, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 6, 7, 7, 7, 7, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 6, 6, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

const palette = ["transparent", "#0f172a", "#22d3ee", "#94a3b8", "#020617", "#a7f3d0", "#ec4899", "#f9a8d4", "#fef08a"];
const featureBadges = [
  { label: "Realtime rooms", Icon: RadioTower },
  { label: "Version history", Icon: History },
  { label: "Role security", Icon: ShieldCheck }
] as const;

export default function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AppHeader />
      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="mx-auto grid min-h-[calc(100vh-56px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-4 inline-flex rounded bg-cyan-300/10 px-3 py-1 text-sm text-cyan-200 ring-1 ring-cyan-300/20">
                Server-authoritative pixel collaboration
              </p>
              <h1 className="text-4xl font-semibold tracking-normal sm:text-6xl">PixelSync</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                A multiplayer pixel art workspace for teams building game-ready sprites, palettes,
                and versioned canvas assets together.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button variant="primary">
                    Open workspace <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/public/c/demo_canvas_hero">
                  <Button variant="secondary">View public canvas</Button>
                </Link>
              </div>
            </div>

            <div className="relative z-10 rounded-lg border border-white/10 bg-white/[0.03] p-4 shadow-glow">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Crystal Knight Idle</p>
                  <p className="text-xs text-slate-400">32 x 32 live canvas</p>
                </div>
                <div className="flex -space-x-2">
                  <span className="grid size-8 place-items-center rounded border border-slate-950 bg-cyan-300 text-xs font-semibold text-slate-950">
                    AD
                  </span>
                  <span className="grid size-8 place-items-center rounded border border-slate-950 bg-pink-300 text-xs font-semibold text-slate-950">
                    JR
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-16 overflow-hidden rounded bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-4">
                <div className="grid aspect-square w-full grid-cols-16 bg-slate-900">
                  {pixels.map((value, index) => (
                    <span key={index} style={{ backgroundColor: palette[value] ?? "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto -mt-10 grid max-w-7xl grid-cols-1 gap-3 px-4 pb-10 sm:grid-cols-3 sm:px-6 lg:px-8">
            {featureBadges.map(({ label, Icon }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                <Icon className="mb-3 text-cyan-200" size={20} aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            "Canvas rendering uses typed arrays and the Canvas API, not one DOM node per pixel.",
            "Socket events are validated by shared Zod schemas and ordered by the realtime server.",
            "Snapshots plus operation logs keep persistence efficient without losing recoverability."
          ].map((text) => (
            <article key={text} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Sparkles size={20} className="mb-4 text-cyan-600" aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
