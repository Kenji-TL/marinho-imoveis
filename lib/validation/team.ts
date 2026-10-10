import { z } from "zod";

export const PASSWORD_MIN = 8;

const password = z
  .string()
  .min(PASSWORD_MIN, `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`)
  .max(72, "Use no máximo 72 caracteres.");

export const memberSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome.").max(80, "Use no máximo 80 caracteres."),
    email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido.")),
    role: z.enum(["dono", "corretor"], { error: "Escolha o acesso." }),
    mode: z.enum(["convite", "senha"]),
    password: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "senha") {
      const check = password.safeParse(v.password);
      if (!check.success) ctx.addIssue({ code: "custom", path: ["password"], message: check.error.issues[0].message });
    }
  });

export type MemberInput = z.input<typeof memberSchema>;

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não são iguais." });

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Informe a senha atual."), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não são iguais." })
  .refine((v) => v.password !== v.current, { path: ["password"], message: "A nova senha precisa ser diferente da atual." });

export function firstErrors(error: z.ZodError) {
  const errors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
}

/** Traduz os erros mais comuns do Supabase Auth para o dono do painel */
export function authErrorMessage(error: { code?: string; message: string }) {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return "Já existe uma conta com esse e-mail.";
    case "weak_password":
      return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Limite de envio de e-mails atingido. Aguarde alguns minutos ou use a opção de senha provisória.";
    case "email_address_invalid":
      return "Esse e-mail não foi aceito. Confira se está correto.";
    case "same_password":
      return "A nova senha precisa ser diferente da atual.";
    default:
      return `Não foi possível concluir: ${error.message}`;
  }
}
