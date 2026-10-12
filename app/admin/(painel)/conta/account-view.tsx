"use client";

import { AccountForms } from "@/components/admin/account-forms";
import { useAdmin } from "@/components/admin/session";
import { ROLE_LABEL } from "@/lib/admin/roles";

export function AccountView() {
  const { user, refresh } = useAdmin();
  return (
    <AccountForms
      userId={user.id}
      name={user.name}
      email={user.email}
      roleLabel={ROLE_LABEL[user.role]}
      onNameChanged={() => refresh()}
    />
  );
}
