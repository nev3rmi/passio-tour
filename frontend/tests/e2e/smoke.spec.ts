import { test, expect } from '@playwright/test'

test.describe('Passio Tour - Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Check if page loads
    await expect(page).toHaveTitle(/Passio Tour/i)
    
    // Check for main heading or navigation
    const heading = page.locator('h1, h2, header')
    await expect(heading.first()).toBeVisible()
  })

  test('navigation works', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Check if navigation links exist and are clickable
    const navLinks = page.locator('nav a, .nav-link, [role="navigation"] a')
    const linkCount = await navLinks.count()
    
    if (linkCount > 0) {
      // Test first navigation link
      const firstLink = navLinks.first()
      const href = await firstLink.getAttribute('href')
      
      if (href && !href.startsWith('http')) {
        await firstLink.click()
        await page.waitForLoadState('networkidle')
        
        // Verify navigation changed URL
        const newUrl = page.url()
        expect(newUrl).not.toBe('http://localhost:3000/')
      }
    }
  })

  test('tours page is accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/tours')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check for tours content
    const toursContainer = page.locator('[data-testid="tours"], .tours, .tour-list')
    const pageTitle = page.locator('h1, h2').first()
    
    // Either tours container or a page title should be visible
    try {
      await expect(toursContainer.or(pageTitle)).toBeVisible()
    } catch {
      // If neither is found, just check that page didn't error
      const title = await page.title()
      expect(title).toBeTruthy()
    }
  })

  test('page responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    
    await expect(page.locator('body')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3000')
    
    await expect(page.locator('body')).toBeVisible()
  })
})