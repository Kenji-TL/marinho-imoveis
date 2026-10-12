import { Suspense } from "react";
import { DashboardView } from "./dashboard-view";

export default function AdminHomePage() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  );
}
