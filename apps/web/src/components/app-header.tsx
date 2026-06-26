import Link from "next/link";
import { signOut, auth } from "@/auth";
import { Button } from "@pixelsync/ui";

export async function AppHeader(): Promise<JSX.Element> {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
          <span className="grid size-7 place-items-center rounded bg-slate-950 text-xs text-cyan-300 dark:bg-cyan-300 dark:text-slate-950">
            PX
          </span>
          PixelSync
        </Link>
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link className="text-sm text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-sm text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" href="/settings">
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
