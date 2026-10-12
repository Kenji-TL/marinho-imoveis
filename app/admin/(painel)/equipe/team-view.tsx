"use client";

import { useRef } from "react";
import { useAdmin } from "@/components/admin/session";
import { TeamManager } from "@/components/admin/team-manager";
import { Notice } from "@/components/admin/ui";
import { getTeam } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";

export function TeamView() {
  const { user } = useAdmin();
  const { data, error, reload } = useLoad(getTeam);
  const leaving = useRef(false);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-white" aria-hidden />;

  return (
    <TeamManager
      members={data.members}
      canManage={data.canManage}
      meId={user.id}
      onChanged={(change) => {
        if (change?.demotedMe) {
          // Virou corretor: recarrega o painel já com o acesso novo
          leaving.current = true;
          window.location.replace("/admin?aviso=papel-alterado");
        } else if (!leaving.current) {
          reload();
        }
      }}
    />
  );
}
