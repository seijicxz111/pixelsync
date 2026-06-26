import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hashInviteToken } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { Button } from "@pixelsync/ui";

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  const { token } = await params;

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/invite/${token}`);
  }

  async function acceptInvite(): Promise<void> {
    "use server";

    const currentSession = await auth();
    if (!currentSession?.user?.id) {
      redirect(`/sign-in?callbackUrl=/invite/${token}`);
    }

    const invite = await prisma.invite.findUnique({
      where: { tokenHash: hashInviteToken(token) }
    });

    if (invite === null || invite.expiresAt < new Date()) {
      redirect("/dashboard");
    }

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: invite.projectId, userId: currentSession.user.id } },
      update: { role: invite.role },
      create: { projectId: invite.projectId, userId: currentSession.user.id, role: invite.role }
    });

    redirect(`/projects/${invite.projectId}`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold">Join PixelSync project</h1>
        <p className="mt-2 text-sm text-slate-400">Accept this invite to add the project to your dashboard.</p>
        <form action={acceptInvite} className="mt-6">
          <Button variant="primary" type="submit">
            Accept invite
          </Button>
        </form>
      </section>
    </main>
  );
}
