import { AdminSignInScreen } from "@/components/admin/admin-sign-in-screen";

export const metadata = {
  title: "Sign In",
  description: "Admin sign in for moderation and operations.",
};

export default async function AdminSignInPage({ searchParams }) {
  const q = await searchParams;
  let nextPath = "/";
  if (typeof q?.next === "string" && q.next.startsWith("/") && !q.next.startsWith("//")) {
    nextPath = q.next;
  }
  return <AdminSignInScreen nextPath={nextPath} />;
}
