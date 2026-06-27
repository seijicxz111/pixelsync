import Link from "next/link";
import { signOut, auth } from "@/auth";
import { Button } from "@pixelsync/ui";

export async function AppHeader(): Promise<JSX.Element> {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/[0.82] dark:shadow-black/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-full px-1.5 py-1.5 font-semibold text-slate-950 transition hover:bg-slate-950/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
        >
          <span className="grid size-9 place-items-center rounded-2xl bg-slate-950 text-xs text-cyan-300 shadow-lg shadow-cyan-950/20 transition group-hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950">
            PX
          </span>
          PixelSync
        </Link>
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                className="rounded-full px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-950/[0.05] hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="rounded-full px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-950/[0.05] hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                href="/settings"
              >
                Settings
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button size="sm" variant="secondary" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/sign-in">
              <Button size="sm" variant="primary">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
