import { expect, test, type Page } from '@playwright/test'

const GTM_ID = 'GTM-MT4KRS2H'

function watchGtm(page: Page) {
  const urls: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com/gtm.js')) urls.push(request.url())
  })
  return urls
}

test('gtm.js ne se charge pas avant l’accord, ni après un refus', async ({ page }) => {
  const urls = watchGtm(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Refuser' })).toBeVisible()

  const before = await page.evaluate(() => {
    const layer = window.dataLayer ?? []
    const commands = layer.map((entry) => Array.from(entry as ArrayLike<unknown>))
    return {
      scripts: document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').length,
      commands,
    }
  })

  expect(before.scripts).toBe(0)
  expect(urls).toEqual([])
  const defaults = before.commands.find((command) => command[0] === 'consent' && command[1] === 'default')
  expect(defaults?.[2]).toMatchObject({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })

  await page.getByRole('button', { name: 'Refuser' }).click()
  await page.waitForTimeout(1200)

  const after = await page.evaluate(() => document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').length)
  expect(after).toBe(0)
  expect(urls).toEqual([])

  const denied = await page.evaluate(() => {
    const layer = window.dataLayer ?? []
    return layer
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter((command) => command[0] === 'consent' && command[1] === 'update')
  })
  expect(denied.at(-1)?.[2]).toMatchObject({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
})

test('gtm.js se charge après acceptation et un changement de route pousse page_view', async ({ page }) => {
  const urls = watchGtm(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Accepter' })).toBeVisible()
  expect(urls).toEqual([])

  const requested = page.waitForRequest(
    (request) => request.url().includes('googletagmanager.com/gtm.js') && request.url().includes(GTM_ID),
  )
  await page.getByRole('button', { name: 'Accepter' }).click()
  const request = await requested
  expect(request.url()).toContain(`id=${GTM_ID}`)
  await expect(page.locator('#gtm-script')).toHaveAttribute('src', new RegExp(`gtm\\.js\\?id=${GTM_ID}`))

  await page.getByRole('banner').getByRole('link', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/connexion/)

  await expect
    .poll(async () =>
      page.evaluate(() =>
        (window.dataLayer ?? [])
          .filter((entry): entry is { event?: string; page_path?: string } => typeof entry === 'object' && entry !== null && 'event' in entry)
          .filter((entry) => entry.event === 'page_view')
          .map((entry) => entry.page_path),
      ),
    )
    .toContain('/connexion')
})
