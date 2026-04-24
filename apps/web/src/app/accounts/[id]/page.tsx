import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAccount, fetchPosts } from "@/lib/api";
import { AccountShell } from "./shell";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [account, postsPage] = await Promise.all([
      fetchAccount(id),
      fetchPosts({ authorId: id }),
    ]);
    return <AccountShell account={account} initialPosts={postsPage.posts} initialNextCursor={postsPage.nextCursor} />;
  } catch (error) {
    if ((error as Error).message.startsWith("404")) notFound();
    throw error;
  }
}
