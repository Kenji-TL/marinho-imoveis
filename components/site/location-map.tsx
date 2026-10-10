/**
 * Mapa do Google Maps a partir do endereço (sem chave de API).
 * Com o número oculto, o mapa usa só rua e bairro e fica mais afastado.
 */
export function LocationMap({
  street,
  number,
  neighborhood,
  city,
  state,
  approximate,
}: {
  street: string | null;
  number: string | null;
  neighborhood: string;
  city: string;
  state: string;
  approximate: boolean;
}) {
  const place = [street && (approximate || !number ? street : `${street}, ${number}`), neighborhood, `${city} - ${state}`]
    .filter(Boolean)
    .join(", ");
  const zoom = approximate || !street ? 14 : 16;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=${zoom}&hl=pt-BR&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-areia-300 bg-areia-200">
      <iframe
        title={`Mapa: ${place}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-[16/10] w-full sm:aspect-[16/8]"
      />
    </div>
  );
}
