import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertiesView } from "./properties-view";

export const metadata: Metadata = { title: "Imóveis" };

export default function PropertiesPage() {
  return (
    <Suspense>
      <PropertiesView />
    </Suspense>
  );
}
