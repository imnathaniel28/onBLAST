import { fetchBusiness, fetchPosts } from "@/lib/api";
import { BusinessShell } from "./shell";
import { notFound } from "next/navigation";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const business = await fetchBusiness(slug);
    const postsPage = await fetchPosts({ businessId: business.id });
    return (
      <BusinessShell
        business={business}
        initialPosts={postsPage.posts}
        initialNextCursor={postsPage.nextCursor}
      />
    );
  } catch (error) {
    if ((error as Error).message.startsWith("404")) notFound();
    throw error;
  }
}
