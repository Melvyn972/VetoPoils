import { expect, test } from '@playwright/test'

const password = 'VetoPoil-QA-2026!'
const ownerEmail = 'qa.owner.vetopoil@gmail.com'

test('parcours propriétaire : inscription, connexion, animal et code vétérinaire', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /carnet de santé de votre animal/i })).toBeVisible()

  await page.getByRole('link', { name: 'Je suis propriétaire' }).first().click()
  await expect(page).toHaveURL(/inscription\/proprietaire/)

  const email = `qa.owner.vetopoil+e2e${Date.now()}@gmail.com`
  await page.getByRole('textbox', { name: /^Prénom/ }).fill('Essai')
  await page.getByRole('textbox', { name: /^Nom/ }).fill('Parcours')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByRole('heading', { name: /Vérifiez votre e-mail|Tableau de bord/ })).toBeVisible()

  if (page.url().includes('/espace')) {
    await page.evaluate(() => localStorage.clear())
  }

  await page.goto('/connexion')
  await page.getByLabel('E-mail').fill(ownerEmail)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  await expect(page.getByText('Milo').first()).toBeVisible()

  const animalName = `E2E ${Date.now()}`
  await page.goto('/espace/animaux/nouveau')
  await page.getByRole('textbox', { name: /^Nom/ }).fill(animalName)
  await page.getByRole('button', { name: 'Créer la fiche' }).click()
  await expect(page.getByRole('heading', { name: animalName })).toBeVisible()

  await page.getByRole('link', { name: 'Code' }).click()
  await page.getByRole('button', { name: 'Générer un code' }).click()
  const code = (await page.getByTestId('vet-code').innerText()).trim()
  expect(code).toHaveLength(6)

  await page.goto('/acces')
  await page.getByLabel('Code d’accès').fill(code)
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).click()
  await expect(page.getByText(animalName).first()).toBeVisible()

  await page.evaluate(() => localStorage.clear())
  await page.goto('/connexion')
  if (!page.url().includes('/espace')) {
    await page.getByLabel('E-mail').fill(ownerEmail)
    await page.getByLabel('Mot de passe').fill(password)
    await page.getByRole('button', { name: 'Se connecter' }).click()
  }
  await page.getByRole('link', { name: animalName }).first().click()
  await page.getByRole('link', { name: 'Modifier la fiche' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Archiver l’animal' }).click()
  await page.waitForURL(/\/espace\/animaux$/, { timeout: 8_000 }).catch(() => undefined)
})
