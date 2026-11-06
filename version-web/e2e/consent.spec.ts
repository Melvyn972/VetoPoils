import { expect, test, type Page, type Request } from '@playwright/test'

const MEASUREMENT_ID = 'G-WYTP4MV8TM'

function isGtagScript(url: string) {
  return url.includes('googletagmanager.com/gtag/js')
}

function isPageViewCollect(request: Request) {
  const url = request.url()
  if (!url.includes('google-analytics.com/g/collect')) return false
  const payload = `${url}&${request.postData() ?? ''}`
  return payload.includes(`tid=${MEASUREMENT_ID}`) && payload.includes('en=page_view')
}

function watchMeasurement(page: Page) {
  const scripts: string[] = []
  const pageViews: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (isGtagScript(url)) scripts.push(url)
    if (isPageViewCollect(request)) pageViews.push(url)
  })
  return { scripts, pageViews }
}

test('gtag/js ne part pas avant le choix, ni après un refus', async ({ page }) => {
  const seen = watchMeasurement(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Refuser' })).toBeVisible()

  const before = await page.evaluate(() => {
    const layer = window.dataLayer ?? []
    const commands = layer.map((entry) => Array.from(entry as ArrayLike<unknown>))
    return {
      scripts: document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length,
      commands,
    }
  })

  expect(before.scripts).toBe(0)
  expect(seen.scripts).toEqual([])
  expect(seen.pageViews).toEqual([])
  const defaults = before.commands.find((command) => command[0] === 'consent' && command[1] === 'default')
  expect(defaults?.[2]).toMatchObject({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })

  await page.getByRole('button', { name: 'Refuser' }).click()
  await page.waitForTimeout(1200)

  const after = await page.evaluate(
    () => document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length,
  )
  expect(after).toBe(0)
  expect(seen.scripts).toEqual([])
  expect(seen.pageViews).toEqual([])

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

test('gtag/js et page_view partent après acceptation, y compris au changement de route', async ({ page }) => {
  const seen = watchMeasurement(page)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Accepter' })).toBeVisible()
  expect(seen.scripts).toEqual([])
  expect(seen.pageViews).toEqual([])

  const scriptRequest = page.waitForRequest(
    (request) => isGtagScript(request.url()) && request.url().includes(MEASUREMENT_ID),
  )
  const firstPageView = page.waitForRequest((request) => isPageViewCollect(request))
  await page.getByRole('button', { name: 'Accepter' }).click()

  const script = await scriptRequest
  expect(script.url()).toContain(`id=${MEASUREMENT_ID}`)
  await expect(page.locator('#ga-script')).toHaveAttribute('src', new RegExp(`gtag/js\\?id=${MEASUREMENT_ID}`))
  await firstPageView
  expect(seen.pageViews.length).toBeGreaterThan(0)

  const beforeNavigation = seen.pageViews.length
  const nextPageView = page.waitForRequest((request) => isPageViewCollect(request))
  await page.getByRole('banner').getByRole('link', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/connexion/)
  await nextPageView
  expect(seen.pageViews.length).toBeGreaterThan(beforeNavigation)
})
