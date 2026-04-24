import { fetchBusinesses, fetchModerationLog, fetchPetitions, fetchPosts } from "@/lib/api";
import { HomeShell } from "./shell";

export default async function HomePage() {
  const [businesses, postsPage, moderationLog, petitions] = await Promise.all([
    fetchBusinesses(),
    fetchPosts(),
    fetchModerationLog(),
    fetchPetitions(),
  ]);

  return (
    <HomeShell
      initialBusinesses={businesses}
      initialPosts={postsPage.posts}
      initialNextCursor={postsPage.nextCursor}
      initialModerationEntries={moderationLog.entries}
      initialPetitions={petitions}
    />
  );
}
