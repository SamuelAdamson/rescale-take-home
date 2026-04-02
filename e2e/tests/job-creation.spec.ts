import { test, expect, type Page } from '@playwright/test';

async function waitForListReady(page: Page): Promise<void> {
  // Wait for the loading spinner to disappear
  await expect(page.locator('[aria-label="Loading"]')).not.toBeVisible({ timeout: 15000 });
}

test.describe('Job Creation', () => {
  test('creates a job and it appears in the list', async ({ page }) => {
    const jobName = `e2e-job-${Date.now()}`;

    await page.goto('/');
    await waitForListReady(page);

    // Open the create job modal
    await page.getByRole('button', { name: 'Create Job +' }).click();

    // Verify the modal is open
    await expect(page.getByRole('heading', { name: 'Create Job' })).toBeVisible();

    // Fill in the job name and submit
    await page.locator('#job-name').fill(jobName);
    await page.getByRole('button', { name: 'Create Job', exact: true }).click();

    // Modal should close after successful creation
    await expect(page.getByRole('heading', { name: 'Create Job' })).not.toBeVisible({ timeout: 10000 });

    // Search for the newly created job by name to confirm it was persisted
    await page.getByPlaceholder('Search jobs…').fill(jobName);

    // Wait for debounce + API response and verify the job appears
    await expect(page.getByText(jobName)).toBeVisible({ timeout: 10000 });
  });

  test('shows validation error when submitting an empty name', async ({ page }) => {
    await page.goto('/');
    await waitForListReady(page);

    await page.getByRole('button', { name: 'Create Job +' }).click();
    await expect(page.getByRole('heading', { name: 'Create Job' })).toBeVisible();

    // Submit without filling in the name
    await page.getByRole('button', { name: 'Create Job', exact: true }).click();

    await expect(page.getByText('Job name is required.')).toBeVisible();
    // Modal stays open on validation error
    await expect(page.getByRole('heading', { name: 'Create Job' })).toBeVisible();
  });

  test('shows validation error when name contains spaces', async ({ page }) => {
    await page.goto('/');
    await waitForListReady(page);

    await page.getByRole('button', { name: 'Create Job +' }).click();
    await expect(page.getByRole('heading', { name: 'Create Job' })).toBeVisible();

    await page.locator('#job-name').fill('job with spaces');
    await page.getByRole('button', { name: 'Create Job', exact: true }).click();

    await expect(page.getByText('Job name must not contain spaces.')).toBeVisible();
    // Modal stays open on validation error
    await expect(page.getByRole('heading', { name: 'Create Job' })).toBeVisible();
  });

  test('cancels job creation and no job is created', async ({ page }) => {
    const jobName = `e2e-cancel-${Date.now()}`;

    await page.goto('/');
    await waitForListReady(page);

    await page.getByRole('button', { name: 'Create Job +' }).click();
    await expect(page.getByRole('heading', { name: 'Create Job' })).toBeVisible();

    await page.locator('#job-name').fill(jobName);
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Create Job' })).not.toBeVisible();

    // Job should not be in the list
    await page.getByPlaceholder('Search jobs…').fill(jobName);
    await expect(page.getByText(jobName)).not.toBeVisible({ timeout: 5000 });
  });
});
