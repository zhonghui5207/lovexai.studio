import { auth } from "@/auth";

export async function getUserUuid() {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }
  return "";
}

export async function getUserEmail() {
  const session = await auth();
  if (session?.user?.email) {
    return session.user.email;
  }
  return "";
}
