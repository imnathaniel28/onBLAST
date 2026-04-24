import { fetchLegalDemands } from "@/lib/api";
import { LegalDemandsShell } from "./shell";

export default async function LegalDemandsPage() {
  const demands = await fetchLegalDemands();
  return <LegalDemandsShell initialDemands={demands} />;
}
