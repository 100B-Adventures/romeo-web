// R21 매거진 톤 CSS 토큰·utility 클래스 전수 검증
import { test, expect } from '@playwright/test';

test.describe('R21 cupid-tokens.css 토큰 전수', () => {
  test('--cupid-accent #A83C3C (Romeo wine)', async ({ page }) => {
    await page.goto('/');
    const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--cupid-accent').trim());
    expect(v.toLowerCase()).toBe('#a83c3c');
  });

  test('--cupid-serif Georgia fallback', async ({ page }) => {
    await page.goto('/');
    const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--cupid-serif').trim());
    expect(v.toLowerCase()).toContain('georgia');
  });

  test('--cupid-meta-label·meta-border·image-grayscale 정의', async ({ page }) => {
    await page.goto('/');
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        metaLabel: s.getPropertyValue('--cupid-meta-label').trim(),
        metaBorder: s.getPropertyValue('--cupid-meta-border').trim(),
        grayscale: s.getPropertyValue('--cupid-image-grayscale').trim(),
      };
    });
    expect(tokens.metaLabel).toBeTruthy();
    expect(tokens.metaBorder).toBeTruthy();
    expect(tokens.grayscale).toBe('0.4');
  });

  test('.cupid-meta·.cupid-headline·.cupid-quote-mark 클래스 적용', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      const test = (cls: string) => {
        const el = document.createElement('div');
        el.className = cls;
        el.textContent = 'x';
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        const out = { font: cs.fontFamily, color: cs.color, ts: cs.textTransform };
        document.body.removeChild(el);
        return out;
      };
      return {
        meta: test('cupid-meta'),
        headline: test('cupid-headline'),
        quote: test('cupid-quote-mark'),
      };
    });
    // cupid-meta: serif + uppercase
    expect(result.meta.ts).toBe('uppercase');
    expect(result.meta.font.toLowerCase()).toContain('georgia');
    // cupid-headline: serif
    expect(result.headline.font.toLowerCase()).toContain('georgia');
    // cupid-quote-mark: 적용 확인
    expect(result.quote.font.toLowerCase()).toContain('georgia');
  });
});
