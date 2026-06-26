import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { Card, CardContent } from "@pixelsync/ui";

export const metadata = {
  title: "Account settings"
};

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold">Account settings</h1>
        <Card className="mt-6">
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Name</dt>
                <dd className="mt-1">{session.user.name ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="mt-1">{session.user.email ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">User ID</dt>
                <dd className="mt-1 font-mono text-xs">{session.user.id}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
