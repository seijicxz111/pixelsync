import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { env } from "@/lib/env";
import { Button, Input, Label } from "@pixelsync/ui";

export const metadata = {
  title: "Sign in"
};

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  const { error } = await searchParams;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <div className="mb-6">
          <div className="mb-4 grid size-10 place-items-center rounded bg-cyan-300 text-sm font-semibold text-slate-950">
            PX
          </div>
          <h1 className="text-2xl font-semibold">Sign in to PixelSync</h1>
          <p className="mt-2 text-sm text-slate-400">Use OAuth in production or the local demo account while developing.</p>
        </div>

        {env.NEXT_PUBLIC_DEMO_MODE ? (
          <form
            className="space-y-4"
            action={async (formData) => {
              "use server";
              const submittedEmail = formData.get("email");
              try {
                await signIn("demo", {
                  email: typeof submittedEmail === "string" ? submittedEmail : "demo@pixelsync.dev",
                  redirectTo: "/dashboard"
                });
              } catch (signInError) {
                if (getRedirectTarget(signInError)?.startsWith("/dashboard")) {
                  throw signInError;
                }

                redirect("/sign-in?error=demo-database");
              }
            }}
          >
            {error === "demo-database" ? (
              <div className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100" role="alert">
                Demo sign-in needs Postgres running on <code>localhost:5432</code>. Start the database, run migrations, then try again.
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Demo email
              </Label>
              <Input id="email" name="email" type="email" defaultValue="demo@pixelsync.dev" />
            </div>
            <Button className="w-full" variant="primary" type="submit">
              Continue
            </Button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button className="w-full" variant="primary" type="submit">
              Continue with GitHub
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

function getRedirectTarget(error: unknown): string | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("digest" in error) ||
    typeof error.digest !== "string" ||
    !error.digest.startsWith("NEXT_REDIRECT")
  ) {
    return null;
  }

  return error.digest.split(";")[2] ?? null;
}
