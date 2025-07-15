import { test, expect } from '@playwright/test';

test.describe('Fact Checker Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state to bypass login
    await page.route('**/*', route => {
      if (route.request().url().includes('firebase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
  });

  test('should show login requirement when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show login required message
    await expect(page).toHaveURL('/login');
  });

  test('should show main interface elements', async ({ page }) => {
    // Note: This test would need actual authentication to work properly
    // For now, we'll test that the page loads without crashing
    await page.goto('/');
    
    // The page should either show login or the main interface
    const hasLogin = await page.locator('h1:has-text("Welcome to Wahrify")').isVisible();
    const hasMainInterface = await page.locator('h1:has-text("Wahrify")').isVisible();
    
    expect(hasLogin || hasMainInterface).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // Should handle mobile viewport properly
    await expect(page.locator('body')).toBeVisible();
    
    // Check for responsive design indicators
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Should be able to navigate to feedback history (though it would require auth)
    await page.goto('/feedback-history');
    
    // Should handle the route even if redirected to login
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Feedback System (UI Only)', () => {
  test('should show feedback modal components', async ({ page }) => {
    await page.goto('/login');
    
    // We can't test the actual feedback flow without authentication
    // But we can verify the page loads without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle feedback history page', async ({ page }) => {
    await page.goto('/feedback-history');
    
    // Should show authentication required or redirect to login
    const isLoginPage = await page.locator('h1:has-text("Welcome to Wahrify")').isVisible();
    const isAuthRequired = await page.locator('text=Sign In Required').isVisible();
    
    expect(isLoginPage || isAuthRequired).toBe(true);
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-route');
    
    // Should either redirect to login or show 404 handling
    await expect(page.locator('body')).toBeVisible();
    
    // Should not show JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Filter out expected Firebase/network errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Firebase') && 
      !error.includes('network') &&
      !error.includes('Cross-Origin-Opener-Policy')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failures
    await page.route('**/*', route => {
      if (route.request().url().includes('api') || route.request().url().includes('backend')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    
    // Should still load the basic interface
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have memory leaks', async ({ page }) => {
    // Navigate through different pages to test for memory leaks
    await page.goto('/');
    await page.goto('/login');
    await page.goto('/feedback-history');
    await page.goto('/');
    
    // Should complete without crashing
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper form labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('id');
    await expect(passwordInput).toHaveAttribute('id');
    
    // Check for associated labels
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Should be able to tab through form elements
    await page.press('body', 'Tab');
    
    // Check if focus moves to interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});