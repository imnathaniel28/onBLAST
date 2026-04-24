import { fetchPost } from "@/lib/api";
import { PostShell } from "./shell";
import { notFound } from "next/navigation";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const post = await fetchPost(id);
    return <PostShell initialPost={post} />;
  } catch (error) {
    if ((error as Error).message.startsWith("404")) notFound();
    throw error;
  }
}
