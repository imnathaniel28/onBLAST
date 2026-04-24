import Link from "next/link";
import { fetchModerationLog } from "@/lib/api";
import { ModLogShell } from "./shell";

export default async function ModerationLogPage() {
  const { entries, nextCursor } = await fetchModerationLog();
  return <ModLogShell initialEntries={entries} initialNextCursor={nextCursor} />;
}
