import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";

export async function requireUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Response("Authentication required", { status: 401 });
  }

  return session.user.id;
}

export async function getOptionalUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof Response) {
    return new NextResponse(error.body, { status: error.status, statusText: error.statusText });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "The request payload is invalid.", issues: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
}
