#!/usr/bin/env node
/**
 * Seed de démonstration Vet'OPoil.
 *
 * Usage (jamais committer la clé) :
 *   SUPABASE_URL=https://lmdszelnnibexzvnaubp.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   DEMO_OWNER_EMAIL=demo.proprio@example.com \
 *   DEMO_OWNER_PASSWORD='MotDePasseLocal!' \
 *   node scripts/seed-demo.mjs
 *
 * Crée 1 propriétaire, 2 animaux, 2 événements (dont 1 pending) et 1 rappel.
 */

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.DEMO_OWNER_EMAIL ?? 'demo.proprio@example.com'
const password = process.env.DEMO_OWNER_PASSWORD

if (!url || !serviceKey || !password) {
  console.error(
    'Variables requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_OWNER_PASSWORD.\nNe commitez jamais la clé service_role.',
  )
  process.exit(1)
}

const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { account_type: 'owner', nom: 'Demo', prenom: 'Melvyn' },
})

if (createError && !String(createError.message).toLowerCase().includes('already')) {
  console.error(createError)
  process.exit(1)
}

const { data: users } = await supabase.auth.admin.listUsers()
const owner = created?.user ?? users.users.find((user) => user.email === email)
if (!owner) {
  console.error('Utilisateur démo introuvable.')
  process.exit(1)
}

await supabase.from('profiles').upsert({
  id: owner.id,
  nom: 'Demo',
  prenom: 'Melvyn',
  email,
})

const { data: existingAnimals, error: listError } = await supabase
  .from('animaux')
  .select('id, nom')
  .eq('proprietaire_id', owner.id)
  .is('deleted_at', null)

if (listError) {
  console.error(listError)
  process.exit(1)
}

let animals = existingAnimals ?? []
if (animals.length === 0) {
  const { data: inserted, error: insertError } = await supabase
    .from('animaux')
    .insert([
      {
        proprietaire_id: owner.id,
        nom: 'Milo',
        espece: 'Chien',
        race: 'Labrador',
        sexe: 'male',
        couleur: 'Sable',
      },
      {
        proprietaire_id: owner.id,
        nom: 'Luna',
        espece: 'Chat',
        race: 'Européen',
        sexe: 'femelle',
        couleur: 'Gris',
      },
    ])
    .select('id, nom')

  if (insertError) {
    console.error(insertError)
    process.exit(1)
  }
  animals = inserted ?? []
}

const milo = animals.find((animal) => animal.nom === 'Milo') ?? animals[0]

const { count: eventCount, error: eventCountError } = await supabase
  .from('medical_events')
  .select('id', { count: 'exact', head: true })
  .eq('animal_id', milo.id)

if (eventCountError) {
  console.error(eventCountError)
  process.exit(1)
}

if (!eventCount) {
  const { error: eventsError } = await supabase.from('medical_events').insert([
    {
      animal_id: milo.id,
      type: 'vaccination',
      titre: 'Vaccin annuel',
      diagnostic: 'CHPPi + rage',
      status: 'validated',
      date_event: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
    {
      animal_id: milo.id,
      type: 'consultation',
      titre: 'Contrôle - en attente de validation',
      diagnostic: 'Cicatrisation à surveiller',
      status: 'pending',
      date_event: new Date().toISOString(),
    },
  ])
  if (eventsError) {
    console.error(eventsError)
    process.exit(1)
  }
}

const { count: reminderCount, error: reminderCountError } = await supabase
  .from('reminders')
  .select('id', { count: 'exact', head: true })
  .eq('animal_id', milo.id)

if (reminderCountError) {
  console.error(reminderCountError)
  process.exit(1)
}

if (!reminderCount) {
  const { error: reminderError } = await supabase.from('reminders').insert({
    animal_id: milo.id,
    type: 'antiparasitaire',
    titre: 'Pipette antiparasitaire',
    notes: 'À poser le soir',
    date_echeance: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    statut: 'actif',
    canal: 'both',
  })
  if (reminderError) {
    console.error(reminderError)
    process.exit(1)
  }
}

console.log(`Seed OK - propriétaire ${email}, animaux : ${animals.map((a) => a.nom).join(', ')}`)
