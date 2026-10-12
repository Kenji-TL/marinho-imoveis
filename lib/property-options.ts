import type { Enums } from "@/lib/database.types";

export type DealType = Enums<"deal_type">;
export type PropertyType = Enums<"property_type">;
export type PropertyStatus = Enums<"property_status">;

export const DEAL_TYPES = ["rent", "sale"] as const satisfies readonly DealType[];

export const DEAL_LABEL: Record<DealType, string> = {
  rent: "Aluguel",
  sale: "Venda",
};

export const PROPERTY_TYPES = [
  "apartamento",
  "casa",
  "cobertura",
  "kitnet",
  "sala_comercial",
  "loja",
  "galpao",
  "terreno",
  "outro",
] as const satisfies readonly PropertyType[];

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  cobertura: "Cobertura",
  kitnet: "Kitnet / Studio",
  sala_comercial: "Sala comercial",
  loja: "Loja",
  galpao: "Galpão",
  terreno: "Terreno",
  outro: "Outro",
};

export const PROPERTY_STATUSES = [
  "available",
  "reserved",
  "rented",
  "sold",
] as const satisfies readonly PropertyStatus[];

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  available: "Disponível",
  reserved: "Reservado",
  rented: "Alugado",
  sold: "Vendido",
};

/** Status que fazem sentido para cada tipo de negócio */
export const STATUS_BY_DEAL: Record<DealType, PropertyStatus[]> = {
  rent: ["available", "reserved", "rented"],
  sale: ["available", "reserved", "sold"],
};

export const AMENITIES = [
  "Aceita pet",
  "Mobiliado",
  "Semimobiliado",
  "Ar-condicionado",
  "Armários embutidos",
  "Varanda",
  "Piscina",
  "Churrasqueira",
  "Área gourmet",
  "Academia",
  "Salão de festas",
  "Playground",
  "Quintal",
  "Jardim",
  "Área de serviço",
  "Dependência de empregada",
  "Elevador",
  "Portaria 24h",
  "Gás encanado",
  "Vista para o mar",
] as const;

export const MAX_PHOTOS = 40;
