import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GlobalAnnouncement } from "@/components/layout/global-announcement";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <>
      <GlobalAnnouncement />
      {children}
    </>
  );
}
