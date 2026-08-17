# Termini — frontend za zakazivanje u salonima

Next.js 14 (App Router) + TypeScript + Tailwind CSS frontend koji se povezuje na tvoj FastAPI backend.

## Pokretanje

```bash
npm install
cp .env.local.example .env.local   # postavi NEXT_PUBLIC_API_URL na adresu backenda
npm run dev
```

Aplikacija radi na `http://localhost:3000`, backend očekuje na `http://localhost:8000` (podesivo u `.env.local`).

## Struktura

```
app/
  page.tsx                          Javna početna — unos koda salona
  shop/[shopId]/page.tsx            Pregled salona i liste usluga
  shop/[shopId]/book/[serviceId]/   Izbor datuma, termina, forma, potvrda (ticket)
  admin/login, admin/register       Prijava / registracija vlasnika
  admin/dashboard                   Lista salona vlasnika + kreiranje novog
  admin/shops/[shopId]              Usluge radnje + dodavanje usluge
  admin/shops/[shopId]/bookings     Pregled i promjena statusa rezervacija
components/
  ui/                               Button, Input, Textarea, Card, Badge
  AuthProvider.tsx                  Kontekst za JWT sesiju (localStorage)
  RequireAuth.tsx                   Štiti admin rute, redirect na /admin/login
  ServiceCard, TimeSlotGrid, BookingForm, PublicHeader, AdminNav
lib/
  api.ts                            Tipizirani klijent za sve backend endpoint-e
  types.ts                          Tipovi usklađeni sa Pydantic šemama
  auth.ts, format.ts                Token storage i formatiranje (cijena, datum, trajanje)
```

## Napomene o backendu

- Backend trenutno nema rutu za listanje **svih** salona, samo `/shops/public/{shop_id}`, pa
  javna početna stranica traži "kod salona" (ID) — klijent dolazi do njega preko linka/QR koda
  koji mu da vlasnik. Ako kasnije dodaš `GET /shops/public` (listu svih aktivnih salona), lako se
  zamijeni landing stranica direktorijem salona.
- `/auth/login` očekuje `application/x-www-form-urlencoded` (OAuth2PasswordRequestForm), što je
  već implementirano u `lib/api.ts`.
- JWT token se čuva u `localStorage` i šalje kao `Authorization: Bearer <token>` na zaštićenim rutama.
- `BookingStatus` u `lib/types.ts` pretpostavlja vrijednosti `PENDING`, `CONFIRMED`, `CANCELLED`,
  `COMPLETED` — uskladi sa stvarnim Python enum-om u `app/models/booking.py` ako se razlikuje.
- Vremena se šalju kao naivan lokalni ISO string (`YYYY-MM-DDTHH:MM:00`), u skladu sa tim kako
  `/bookings/available-slots` generiše slotove (bez timezone-a).

## Dizajn

Vizuelni jezik je inspirisan salonskom "ticket" karticom termina: `Fraunces` (display serif) za
naslove, `Inter` za tekst i `IBM Plex Mono` za vrijeme/cijene/šifre rezervacija — čime brojevi
djeluju kao otisnuti na priznanici. Paleta: krem-siva pozadina (`paper`), tamno mastilo (`ink`),
tamnocrvena "stub" boja za akcente/cijene i borovo zelena (`pine`) za potvrđen status.
