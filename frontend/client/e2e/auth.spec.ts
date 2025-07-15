import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
    
    // Should see login form
    await expect(page.locator('h1')).toContainText('Welcome to Wahrify');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    
    // Check toggle to signup
    await expect(page.locator('button:has-text("Sign up")')).toBeVisible();
  });

  test('should toggle between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Initially should be login
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Click to toggle to signup
    await page.click('button:has-text("Sign up")');
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    
    // Toggle back to login
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).not.toBeVisible();
  });

  test('should show validation errors for empty email/password', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button:has-text("Sign In")');
    
    // Should show HTML5 validation (email required)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should show forgot password option', async ({ page }) => {
    await page.goto('/login');
    
    // Should see forgot password button
    await expect(page.locator('button:has-text("Forgot your password?")')).toBeVisible();
  });

  test('should handle Google sign-in button click', async ({ page }) => {
    await page.goto('/login');
    
    // Mock the Google sign-in popup to avoid actual authentication
    await page.route('**/*', route => {
      if (route.request().url().includes('accounts.google.com')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Click Google sign-in button
    await page.click('button:has-text("Continue with Google")');
    
    // Should not crash or show error immediately
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/login');
    
    // Should still show all elements
    await expect(page.locator('h1')).toContainText('Welcome to Wahrify');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Form should be properly sized
    const card = page.locator('div[role="dialog"], .max-w-md').first();
    await expect(card).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/login');
    
    // Should maintain proper layout
    await expect(page.locator('h1')).toContainText('Welcome to Wahrify');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });
});