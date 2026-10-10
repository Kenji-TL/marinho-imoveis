import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getSettings } from "@/lib/public/queries";
import { GENERIC_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/whatsapp";
import { btnGold } from "./buttons";

/** Faixa escura de chamada final, com foto ao fundo */
export async function CtaBand({
  title = "Pronto para encontrar o seu imóvel?",
  text = "Fale com a nossa equipe e receba opções do jeito que você procura, com toda a orientação de que precisa.",
  button = "Falar com um corretor",
}: {
  title?: string;
  text?: string;
  button?: string;
}) {
  const settings = await getSettings();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-marinho-950">
        <Image src="/images/casa-entardecer.jpg" alt="" fill sizes="(min-width: 1280px) 1232px, 100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-marinho-950 via-marinho-950/85 to-marinho-950/30" aria-hidden />
        <div className="flex flex-col gap-8 px-6 py-12 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl text-white sm:text-4xl">{title}</h2>
            <p className="mt-3 text-marinho-100/85">{text}</p>
          </div>
          <div className="flex items-center gap-10">
            <a href={whatsappLink(settings.whatsapp, GENERIC_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer" className={`${btnGold} shrink-0`}>
              {button} <ArrowRight className="size-4" aria-hidden />
            </a>
            <p className="hidden -rotate-6 font-script font-semibold text-3xl leading-tight text-dourado-200 xl:block" aria-hidden>
              Seu próximo
              <br />
              endereço começa
              <br />
              aqui.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
