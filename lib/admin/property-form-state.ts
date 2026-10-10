import type { PhotoItem } from "@/components/admin/photo-manager";
import type { DealType, PropertyStatus, PropertyType } from "@/lib/property-options";
import type { PropertyForEdit } from "./queries";

export type PropertyFormValues = {
  deal_type: DealType | "";
  property_type: PropertyType | "";
  title: string;
  status: PropertyStatus;
  visible: boolean;
  featured: boolean;
  accepts_proposal: boolean;
  rent_price: number | null;
  sale_price: number | null;
  condo_fee: number | null;
  iptu: number | null;
  iptu_exempt: boolean;
  price_notes: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  hide_number: boolean;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking_spots: number;
  usable_area: number | null;
  total_area: number | null;
  amenities: string[];
  description: string;
};

export type PropertyFormInitial = {
  id: string | null;
  code: string | null;
  slug: string | null;
  values: PropertyFormValues;
  photos: PhotoItem[];
  coverId: string | null;
};

export const EMPTY_PROPERTY: PropertyFormInitial = {
  id: null,
  code: null,
  slug: null,
  values: {
    deal_type: "",
    property_type: "",
    title: "",
    status: "available",
    visible: true,
    featured: false,
    accepts_proposal: false,
    rent_price: null,
    sale_price: null,
    condo_fee: null,
    iptu: null,
    iptu_exempt: false,
    price_notes: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "Rio de Janeiro",
    state: "RJ",
    hide_number: false,
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parking_spots: 0,
    usable_area: null,
    total_area: null,
    amenities: [],
    description: "",
  },
  photos: [],
  coverId: null,
};

export function toFormInitial(p: PropertyForEdit): PropertyFormInitial {
  return {
    id: p.id,
    code: p.code,
    slug: p.slug,
    values: {
      deal_type: p.deal_type,
      property_type: p.property_type,
      title: p.title,
      status: p.status,
      visible: p.visible,
      featured: p.featured,
      accepts_proposal: p.accepts_proposal,
      rent_price: p.rent_price,
      sale_price: p.sale_price,
      condo_fee: p.condo_fee,
      iptu: p.iptu,
      iptu_exempt: p.iptu_exempt,
      price_notes: p.price_notes ?? "",
      zip_code: p.zip_code ?? "",
      street: p.street ?? "",
      number: p.number ?? "",
      complement: p.complement ?? "",
      neighborhood: p.neighborhood,
      city: p.city,
      state: p.state,
      hide_number: p.hide_number,
      bedrooms: p.bedrooms,
      suites: p.suites,
      bathrooms: p.bathrooms,
      parking_spots: p.parking_spots,
      usable_area: p.usable_area,
      total_area: p.total_area,
      amenities: p.amenities,
      description: p.description ?? "",
    },
    photos: p.images.map((img) => ({
      id: img.id,
      storage_path: img.storage_path,
      preview: img.url,
      width: img.width,
      height: img.height,
      status: "done",
      saved: true,
    })),
    coverId: p.images.find((i) => i.is_cover)?.id ?? p.images[0]?.id ?? null,
  };
}
