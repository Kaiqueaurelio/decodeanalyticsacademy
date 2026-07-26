import { test, expect } from "../playwright-fixture";

/**
 * Testes visuais (screenshot) do ApostilaCoverCard por breakpoint.
 * Garantem que a capa nunca fique pequena demais nem recortada.
 */
const BREAKPOINTS = [
  { name: "mobile-320", width: 320, height: 720, minCoverWidth: 130, minCoverHeight: 190 },
  { name: "mobile-375", width: 375, height: 780, minCoverWidth: 155, minCoverHeight: 230 },
  { name: "mobile-414", width: 414, height: 820, minCoverWidth: 175, minCoverHeight: 260 },
  { name: "tablet-768", width: 768, height: 900, minCoverWidth: 200, minCoverHeight: 260 },
  { name: "desktop-1024", width: 1024, height: 900, minCoverWidth: 200, minCoverHeight: 260 },
  { name: "desktop-1440", width: 1440, height: 900, minCoverWidth: 280, minCoverHeight: 360 },
];

for (const bp of BREAKPOINTS) {
  test(`capa legível e completa em ${bp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/__visual/cover-card");

    const card = page.getByTestId("apostila-cover-card").first();
    const media = page.getByTestId("apostila-cover-media").first();
    await expect(media).toBeVisible();
    await media.locator("img").first().evaluate((img: HTMLImageElement) =>
      img.complete ? Promise.resolve() : new Promise((r) => img.addEventListener("load", () => r(null))),
    );

    const box = (await media.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(bp.minCoverWidth);
    expect(box.height).toBeGreaterThanOrEqual(bp.minCoverHeight);

    // Proporção esperada: 2:3 no mobile, 3:4 a partir de sm (640px)
    const expectedRatio = bp.width < 640 ? 3 / 2 : 4 / 3;
    expect(Math.abs(box.height / box.width - expectedRatio)).toBeLessThan(0.06);

    // A capa deve ocupar a maior parte do card (nunca "pequena demais")
    const cardBox = (await card.boundingBox())!;
    expect(box.height / cardBox.height).toBeGreaterThan(0.55);
    expect(box.width).toBeGreaterThanOrEqual(cardBox.width - 3);

    // Sem recorte horizontal / overflow da grade
    expect(cardBox.x).toBeGreaterThanOrEqual(0);
    expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(bp.width + 1);

    // Imagem preenche a área sem faixas vazias
    const fits = await media.locator("img").first().evaluate((img: HTMLImageElement) => {
      const cs = getComputedStyle(img);
      return cs.objectFit === "cover" && img.clientWidth > 0 && img.clientHeight > 0;
    });
    expect(fits).toBe(true);

    await expect(card).toHaveScreenshot(`cover-card-${bp.name}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}
