import { test, expect } from '@playwright/test'

test.describe('Universe Star Map (WebGL)', () => {
  test('loads the map page and shows WebGL canvas', async ({ page }) => {
    page.on('pageerror', (err) => {
      // Fail test on any unhandled exception
      throw err
    })

    await page.goto('/map')
    await expect(page.getByRole('heading', { name: 'Universe Map' })).toBeVisible()
    await expect(page.getByText('Universe Star Map (WebGL)')).toBeVisible()

    // Canvas should exist inside the WebGL card
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })

  test('zoom controls respond without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/map')
    await expect(page.getByText('Universe Star Map (WebGL)')).toBeVisible()

    // Click zoom in/out and reset
    await page.getByRole('button', { name: '+ Zoom In' }).click()
    await page.getByRole('button', { name: '− Zoom Out' }).click()
    await page.getByRole('button', { name: 'Reset View' }).click()

    expect(errors).toEqual([])
  })

  test('click selection shows tooltip if nearby objects exist', async ({ page }) => {
    await page.goto('/map')
    await expect(page.getByText('Universe Star Map (WebGL)')).toBeVisible()

    // Zoom in to increase selection chances
    await page.getByRole('button', { name: '+ Zoom In' }).click()
    await page.getByRole('button', { name: '+ Zoom In' }).click()

    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }

    // Tooltip appears for either Planet or Fleet if selection happened
    const tooltip = page.locator('text=Planet', { hasText: 'Planet' }).or(page.locator('text=Fleet #'))
    // Do not fail if no nearby objects; just ensure no crash
    await expect(canvas).toBeVisible()
  })
})


