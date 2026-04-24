import { fetchPetition } from "@/lib/api";
import { PetitionShell } from "./shell";
import { notFound } from "next/navigation";

export default async function PetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const petition = await fetchPetition(id);
    return <PetitionShell initialPetition={petition} />;
  } catch (error) {
    if ((error as Error).message.startsWith("404")) notFound();
    throw error;
  }
}
