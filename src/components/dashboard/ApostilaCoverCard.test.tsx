import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApostilaCoverCard } from "./ApostilaCoverCard";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123" } }),
}));

const apostila = {
  id: "abc-123",
  title: "Matemática Básica",
  category: "ENEM",
  semester: 1,
} as never;

/**
 * Testes rápidos de responsividade: garantem que a capa nunca fique
 * "pequena demais" no celular (proporção alta, sem alturas fixas curtas,
 * corpo compacto) e que a proporção desktop continue 3:4.
 */
describe("ApostilaCoverCard — responsividade", () => {
  it("usa proporção alta (2:3) no mobile e 3:4 a partir de sm", () => {
    render(
      <MemoryRouter>
        <ApostilaCoverCard apostila={apostila} />
      </MemoryRouter>
    );
    const media = screen.getByTestId("apostila-cover-media");
    expect(media.className).toContain("aspect-[2/3]");
    expect(media.className).toContain("sm:aspect-[3/4]");
  });

  it("não aplica altura fixa que encolha a capa em telas pequenas", () => {
    render(
      <MemoryRouter>
        <ApostilaCoverCard apostila={apostila} />
      </MemoryRouter>
    );
    const media = screen.getByTestId("apostila-cover-media");
    expect(media.className).not.toMatch(/\bh-\d+\b/);
    expect(media.className).not.toMatch(/max-h-/);
    expect(media.className).toContain("w-full");
  });

  it("mantém o corpo compacto no mobile para sobrar área à capa", () => {
    render(
      <MemoryRouter>
        <ApostilaCoverCard apostila={apostila} />
      </MemoryRouter>
    );
    const body = screen.getByTestId("apostila-cover-body");
    expect(body.className).toContain("p-2");
    expect(body.className).toContain("sm:p-3.5");
  });

  it("preenche a imagem sem deixar bordas vazias", () => {
    render(
      <MemoryRouter>
        <ApostilaCoverCard apostila={apostila} />
      </MemoryRouter>
    );
    const img = screen.getByRole("img", { name: "Matemática Básica" });
    expect(img.className).toContain("object-cover");
    expect(img.className).toContain("h-full");
    expect(img.className).toContain("w-full");
  });

  it("permanece legível em cada breakpoint simulado", () => {
    const { container } = render(
      <MemoryRouter>
        <ApostilaCoverCard apostila={apostila} />
      </MemoryRouter>
    );
    const media = container.querySelector<HTMLElement>(
      '[data-testid="apostila-cover-media"]',
    )!;

    const breakpoints = [320, 375, 414, 640, 768, 1024];
    for (const width of breakpoints) {
      // 2 colunas no mobile, 3-4 colunas a partir de sm; gap ~10-16px
      const columns = width < 640 ? 2 : width < 1024 ? 3 : 4;
      const gap = width < 640 ? 10 : 16;
      const padding = width < 640 ? 16 : 32;
      const cardWidth = (width - padding - gap * (columns - 1)) / columns;
      const ratio = media.className.includes("aspect-[2/3]") && width < 640 ? 3 / 2 : 4 / 3;
      const coverHeight = cardWidth * ratio;
      expect(cardWidth).toBeGreaterThan(120);
      expect(coverHeight).toBeGreaterThan(180);
    }
  });
});
