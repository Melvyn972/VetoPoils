import {
  IconActivity,
  IconClock,
  IconFile,
  IconStethoscope,
  IconSyringe,
} from '../../../components/icons/Icons'
import { EventStatusBadge } from '../../../components/ui/Badge'
import { BrowserFrame, DemoQr, LiveCountdown, PhoneFrame, SectionIntro } from './Kit'

const QR_STEPS = [
  { title: 'Vous générez un code', text: 'Un QR code et un code à 6 caractères, valables 4 heures, révocables à tout moment.' },
  { title: 'Le vétérinaire l’ouvre', text: 'Il scanne ou saisit le code : le dossier complet s’affiche, sans création de compte.' },
  { title: 'Il complète le dossier', text: 'Consultation, vaccin, ordonnance, poids ou rappel : la saisie prend quelques secondes.' },
  { title: 'Vous validez', text: 'Chaque ajout arrive en attente. Vous l’acceptez ou le refusez, et l’historique reste fiable.' },
]

export function QrShowcase() {
  return (
    <section
      id="acces-veterinaire"
      aria-labelledby="acces-veterinaire-title"
      className="relative overflow-hidden bg-[#eaf5f2]"
    >
      <div className="relative mx-auto grid max-w-[1320px] gap-14 px-5 py-24 sm:px-8 md:py-32 grid-cols-1 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-28">
        <p
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-6 select-none font-title text-[clamp(90px,15vw,230px)] font-semibold leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_rgb(44_110_99/0.13)]"
        >
          04:00:00
        </p>
        <div className="relative lg:col-span-5">
          <SectionIntro
            kicker="Accès vétérinaire"
            titleId="acces-veterinaire-title"
            title="Quatre heures. Pas une de plus."
          >
            Le jour du rendez-vous, vous ouvrez le dossier à votre vétérinaire. Il n’a besoin ni d’application ni
            de compte, et l’accès se ferme tout seul.
          </SectionIntro>
          <ol className="relative mt-10 flex flex-col gap-6 pl-11">
            <span aria-hidden="true" className="absolute bottom-3 left-[13px] top-3 w-[2px] rounded-full bg-primary" />
            {QR_STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-11 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white font-body text-[12px] font-semibold text-primary ring-1 ring-primary/25"
                >
                  {index + 1}
                </span>
                <h3 className="font-title text-[20px] font-semibold tracking-[-0.02em] text-ink">
                  <span className="sr-only">Étape {index + 1} : </span>
                  {step.title}
                </h3>
                <p className="mt-1 max-w-[430px] font-body text-[15px] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div aria-hidden="true" className="relative lg:col-span-7">
          <BrowserFrame label="Portail vétérinaire · accès par code" className="ml-auto w-full sm:w-[88%]">
            <div className="relative min-h-[430px]">
              <div className="no-scrollbar flex gap-1 overflow-hidden border-b border-line-soft px-4 py-2 sm:pl-[150px]">
                {[
                  { label: 'Dossier', Icon: IconFile, on: true },
                  { label: 'Consultation', Icon: IconStethoscope },
                  { label: 'Vaccins', Icon: IconSyringe },
                  { label: 'Poids', Icon: IconActivity },
                ].map((item) => (
                  <span
                    key={item.label}
                    className={`flex shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 font-body text-[11.5px] font-medium ${
                      item.on ? 'bg-mint text-primary-pressed' : 'text-[#5b6461]'
                    }`}
                  >
                    <item.Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="relative p-4 sm:pl-[150px]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-mint font-title text-lg font-semibold text-primary-pressed">
                    M
                  </span>
                  <div className="min-w-0">
                    <p className="font-title text-[16px] font-semibold text-ink">Milo</p>
                    <p className="font-body text-[11.5px] text-muted">Chien · Border collie · 4 ans · 12,4 kg</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 rounded-full bg-mint-soft px-2.5 py-1 font-body text-[11px] font-semibold text-primary-pressed">
                    <IconClock className="h-3.5 w-3.5" />
                    <LiveCountdown seconds={14_340} />
                  </span>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  <div className="rounded-[14px] border border-line-soft p-3.5">
                    <p className="font-body text-[12.5px] font-semibold text-ink">Nouvelle consultation</p>
                    <div className="mt-3 flex flex-col gap-2">
                      {[
                        { label: 'Motif', value: 'Contrôle annuel, RAS' },
                        { label: 'Poids', value: '12,6 kg' },
                      ].map((field) => (
                        <div key={field.label} className="rounded-[10px] border border-[#e3e8e6] px-3 py-2">
                          <p className="font-body text-[10px] text-muted">{field.label}</p>
                          <p className="min-h-[18px] font-body text-[12.5px] font-semibold text-ink">{field.value}</p>
                        </div>
                      ))}
                    </div>
                    <span className="mt-3 block rounded-[10px] bg-primary py-2.5 text-center font-body text-[12px] font-semibold text-white">
                      Soumettre au propriétaire
                    </span>
                  </div>
                  <div className="rounded-[14px] border border-line-soft p-3.5">
                    <p className="font-body text-[12.5px] font-semibold text-ink">Historique</p>
                    <ul className="mt-3 flex flex-col gap-2">
                      <li className="flex items-center justify-between gap-2 rounded-[10px] bg-amber-soft/60 px-2.5 py-2">
                        <span className="font-body text-[11.5px] font-semibold text-ink">Contrôle annuel</span>
                        <EventStatusBadge status="validated" />
                      </li>
                      {['Vaccin CHPPiL + rage', 'Bilan sanguin annuel', 'Traitement de l’otite'].map((row) => (
                        <li key={row} className="flex items-center justify-between gap-2 rounded-[10px] bg-canvas px-2.5 py-2">
                          <span className="font-body text-[11.5px] text-[#3f4744]">{row}</span>
                          <EventStatusBadge status="validated" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>

          <div className="relative z-10 -mt-24 ml-2 w-[226px] sm:absolute sm:-bottom-8 sm:-left-3 sm:mt-0 lg:-left-6">
            <PhoneFrame className="h-[468px] w-[226px]">
              <div className="flex h-full flex-col px-3.5 pb-4">
                <p className="pt-1 text-center font-body text-[12px] font-semibold text-ink">Partager avec un vétérinaire</p>
                <div className="mt-3 rounded-[18px] bg-white p-3.5 text-center">
                  <div className="relative mx-auto w-fit rounded-[10px] bg-white p-1.5 ring-1 ring-line-soft">
                    <DemoQr className="h-[112px] w-[112px]" />
                  </div>
                  <p className="mt-3 font-mono text-[21px] font-semibold tracking-[0.2em] text-ink">K7P2QX</p>
                  <p className="mt-1 flex items-center justify-center gap-1 font-body text-[10.5px] font-medium text-primary">
                    <IconClock className="h-3 w-3" />
                    Expire dans <LiveCountdown />
                  </p>
                </div>
                <span className="mt-2.5 rounded-[11px] border border-red-ink/25 py-2 text-center font-body text-[11px] font-semibold text-red-ink">
                  Révoquer l’accès
                </span>
                <div className="mt-auto rounded-[16px] bg-white p-3">
                  <p className="font-body text-[10.5px] text-muted">Dr Martin · à l’instant</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-body text-[12px] font-semibold text-ink">Contrôle annuel</p>
                    <EventStatusBadge status="validated" />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <span className="flex-1 rounded-[9px] bg-primary py-1.5 text-center font-body text-[10.5px] font-semibold text-white">
                      Valider
                    </span>
                    <span className="flex-1 rounded-[9px] bg-red-soft py-1.5 text-center font-body text-[10.5px] font-semibold text-red-ink">
                      Refuser
                    </span>
                  </div>
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  )
}
