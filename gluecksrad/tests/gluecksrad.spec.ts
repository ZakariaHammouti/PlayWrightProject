import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Jeder Test startet in einem frischen Browser-Kontext – der localStorage ist also leer.

async function addList(page: Page, names: string[]) {
  await page.getByLabel('Liste einfügen (ein Name pro Zeile)').fill(names.join('\n'))
  await page.getByRole('button', { name: 'Liste übernehmen' }).click()
}

async function addSingle(page: Page, name: string) {
  await page.getByLabel('Einzelnen Namen eingeben').fill(name)
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click()
}

function row(page: Page, name: string) {
  return page.getByRole('row').filter({ hasText: name })
}

/** Rad drehen und den gezogenen Namen aus der Gratulation lesen */
async function spinAndGetWinner(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Rad drehen' }).click()
  const dialog = page.getByRole('dialog', { name: 'Herzlichen Glückwunsch!' })
  await expect(dialog).toBeVisible()
  return (await dialog.locator('.celebration-name').textContent()) ?? ''
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('Namen eintragen', () => {
  test('leeres Rad zeigt einen Hinweis und lässt sich nicht drehen', async ({ page }) => {
    await expect(page.getByText('Trage zuerst Namen ein.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rad drehen' })).toBeDisabled()
  })

  test('einzeln und als Liste hinzufügen', async ({ page }) => {
    await addSingle(page, 'Anna Müller')
    await expect(page.getByRole('status')).toHaveText('1 Name hinzugefügt.')

    await addList(page, ['Ben Schmidt', '', 'Clara Weber'])
    await expect(page.getByRole('status')).toHaveText('2 Namen hinzugefügt.')

    await expect(page.getByRole('row')).toHaveCount(4) // Kopfzeile + 3 Personen
    await expect(page.getByText('3 Personen · 3 verfügbar')).toBeVisible()
  })

  test('Duplikate werden erkannt – auch bei anderer Schreibweise und Leerzeichen', async ({ page }) => {
    await addList(page, ['Anna Müller', '  anna   müller ', 'ANNA MÜLLER', 'Ben Schmidt'])

    const status = page.getByRole('status')
    await expect(status).toContainText('2 Namen hinzugefügt.')
    await expect(status).toContainText('„anna müller“')
    await expect(status).toContainText('„ANNA MÜLLER“')
    await expect(status).toHaveClass(/warning/)
    await expect(page.getByRole('row')).toHaveCount(3)
  })

  test('ein doppelter Einzelname bleibt zum Korrigieren im Feld stehen', async ({ page }) => {
    await addSingle(page, 'Anna Müller')
    await addSingle(page, 'anna müller')

    await expect(page.getByRole('status')).toHaveText('„anna müller“ ist schon vorhanden und wurde nicht hinzugefügt.')
    await expect(page.getByLabel('Einzelnen Namen eingeben')).toHaveValue('anna müller')
  })
})

test.describe('Ziehen und Sperre', () => {
  test('Ziehung zeigt Gratulation und sperrt die Person für 24 Stunden', async ({ page }) => {
    await addList(page, ['Anna Müller', 'Ben Schmidt', 'Clara Weber'])

    const winner = await spinAndGetWinner(page)
    expect(['Anna Müller', 'Ben Schmidt', 'Clara Weber']).toContain(winner)

    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    const winnerRow = row(page, winner)
    await expect(winnerRow.getByRole('cell').nth(1)).toHaveText('1')
    await expect(winnerRow).toContainText('gesperrt, noch 24 h 0 min')
    await expect(page.getByText('3 Personen · 2 verfügbar')).toBeVisible()
  })

  test('das Rad bleibt mit dem Zeiger auf der gezogenen Person stehen', async ({ page }) => {
    const names = ['Anna Müller', 'Ben Schmidt', 'Clara Weber', 'David Fischer', 'Emma Wagner']
    await addList(page, names)

    const winner = await spinAndGetWinner(page)

    // Rotation des Rads auslesen und berechnen, welches Segment oben unter dem Zeiger liegt
    const style = (await page.locator('.wheel > g').first().getAttribute('style')) ?? ''
    const rotation = Number(/rotate\(([-\d.]+)deg\)/.exec(style)?.[1])
    const angleAtPointer = (((-rotation) % 360) + 360) % 360
    const index = Math.floor(angleAtPointer / (360 / names.length))
    expect(names[index]).toBe(winner)
  })

  test('eine gesperrte Person wird nicht noch einmal gezogen', async ({ page }) => {
    await addList(page, ['Anna Müller', 'Ben Schmidt', 'Clara Weber'])

    const first = await spinAndGetWinner(page)
    await page.getByRole('button', { name: 'Weiter' }).click()
    const second = await spinAndGetWinner(page)

    expect(second).not.toBe(first)
  })

  test('mit nur einer Person lässt sich das Rad nicht drehen', async ({ page }) => {
    const spinButton = page.getByRole('button', { name: 'Rad drehen' })

    await addSingle(page, 'Anna Müller')
    await expect(spinButton).toBeDisabled()
    await expect(page.getByText('Trage mindestens 2 Namen ein, damit gelost werden kann.')).toBeVisible()

    await addSingle(page, 'Ben Schmidt')
    await expect(spinButton).toBeEnabled()
    await expect(page.getByText(/mindestens 2 Namen/)).toHaveCount(0)
  })

  test('ist nur noch eine Person verfügbar, ist das Rad aus – „Sperre aufheben“ gibt es wieder frei', async ({ page }) => {
    await addList(page, ['Anna Müller', 'Ben Schmidt'])
    const winner = await spinAndGetWinner(page)
    const other = winner === 'Anna Müller' ? 'Ben Schmidt' : 'Anna Müller'
    await page.getByRole('button', { name: 'Weiter' }).click()

    const spinButton = page.getByRole('button', { name: 'Rad drehen' })
    await expect(spinButton).toBeDisabled()
    await expect(page.getByText(`Nur noch „${other}“ ist verfügbar.`, { exact: false })).toBeVisible()

    await row(page, winner).getByRole('button', { name: 'Sperre aufheben' }).click()
    await expect(row(page, winner)).toContainText('verfügbar')
    await expect(spinButton).toBeEnabled()
  })

  test('sind alle gesperrt (z. B. aus gespeicherten Daten), zeigt das Rad einen Hinweis', async ({ page }) => {
    const lockedUntil = Date.now() + 60 * 60 * 1000
    await page.evaluate((until) => {
      const persons = ['Anna Müller', 'Ben Schmidt'].map((name, i) => ({
        id: `p${i}`, name, drawCount: 1, lastDrawnAt: Date.now(), lockedUntil: until,
      }))
      localStorage.setItem('gluecksrad.personen.v1', JSON.stringify(persons))
    }, lockedUntil)
    await page.reload()

    await expect(page.getByRole('button', { name: 'Rad drehen' })).toBeDisabled()
    await expect(page.getByText(/Alle Personen sind gesperrt/)).toBeVisible()
  })
})

test.describe('Statistik verwalten', () => {
  test('Namen bearbeiten – Duplikate und leere Namen werden abgelehnt', async ({ page }) => {
    await addSingle(page, 'Ben Schmidt')
    await addSingle(page, 'Anna Müller')

    await row(page, 'Ben Schmidt').getByRole('button', { name: 'Bearbeiten' }).click()
    const input = page.getByLabel('Neuer Name für Ben Schmidt')

    await input.fill('  anna  müller')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('„Anna Müller“ ist schon vorhanden.')).toBeVisible()

    await input.fill('')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Der Name darf nicht leer sein.')).toBeVisible()

    await input.fill('  Benjamin   S. ')
    await input.press('Enter')
    await expect(row(page, 'Benjamin S.')).toBeVisible()
    await expect(page.locator('.wheel text', { hasText: 'Benjamin S.' })).toBeVisible()
  })

  test('Umbenennen behält Ziehungen und Sperre', async ({ page }) => {
    await addList(page, ['Anna Müller', 'Ben Schmidt'])
    const winner = await spinAndGetWinner(page)
    await page.getByRole('button', { name: 'Weiter' }).click()

    await row(page, winner).getByRole('button', { name: 'Bearbeiten' }).click()
    await page.getByLabel(`Neuer Name für ${winner}`).fill('Umbenannt')
    await page.getByRole('button', { name: 'Speichern' }).click()

    const renamed = row(page, 'Umbenannt')
    await expect(renamed.getByRole('cell').nth(1)).toHaveText('1')
    await expect(renamed).toContainText('gesperrt')
  })

  test('Bearbeiten mit Escape abbrechen', async ({ page }) => {
    await addSingle(page, 'Anna Müller')
    await row(page, 'Anna Müller').getByRole('button', { name: 'Bearbeiten' }).click()
    await page.getByLabel('Neuer Name für Anna Müller').fill('Etwas anderes')
    await page.getByLabel('Neuer Name für Anna Müller').press('Escape')

    await expect(row(page, 'Anna Müller')).toBeVisible()
    await expect(page.getByText('Etwas anderes')).toHaveCount(0)
  })

  test('Name löschen nach Bestätigung', async ({ page }) => {
    await addList(page, ['Anna Müller', 'Ben Schmidt'])

    page.once('dialog', (dialog) => dialog.accept())
    await row(page, 'Anna Müller').getByRole('button', { name: 'Löschen' }).click()

    await expect(row(page, 'Anna Müller')).toHaveCount(0)
    await expect(row(page, 'Ben Schmidt')).toBeVisible()
  })

  test('Löschen abbrechen behält den Namen', async ({ page }) => {
    await addSingle(page, 'Anna Müller')

    page.once('dialog', (dialog) => dialog.dismiss())
    await row(page, 'Anna Müller').getByRole('button', { name: 'Löschen' }).click()

    await expect(row(page, 'Anna Müller')).toBeVisible()
  })
})

test.describe('Darstellung und Speicherung', () => {
  test('keine Farbe kommt im Rad doppelt vor', async ({ page }) => {
    const names = Array.from({ length: 20 }, (_, i) => `Person ${i + 1}`)
    await addList(page, names)

    const fills = await page.locator('.wheel path').evaluateAll((paths) => paths.map((p) => p.getAttribute('fill')))
    expect(fills).toHaveLength(20)
    expect(new Set(fills).size).toBe(20)
  })

  test('Namen, Statistik und Sperre bleiben nach dem Neuladen erhalten', async ({ page }) => {
    await addList(page, ['Anna Müller', 'Ben Schmidt'])
    const winner = await spinAndGetWinner(page)
    await page.getByRole('button', { name: 'Weiter' }).click()

    await page.reload()

    await expect(page.getByRole('row')).toHaveCount(3)
    await expect(row(page, winner).getByRole('cell').nth(1)).toHaveText('1')
    await expect(row(page, winner)).toContainText('gesperrt')
  })

  test('Ton-Schalter wird gespeichert', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Ton (an|aus)/ })
    await expect(toggle).toHaveText('🔊 Ton an')

    await toggle.click()
    await expect(toggle).toHaveText('🔇 Ton aus')

    await page.reload()
    await expect(page.getByRole('button', { name: /Ton (an|aus)/ })).toHaveText('🔇 Ton aus')
  })
})
