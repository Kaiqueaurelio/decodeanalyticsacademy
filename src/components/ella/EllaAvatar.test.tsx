import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { EllaAvatar } from "@/components/ella/EllaAvatar";

describe("EllaAvatar", () => {
  it("renderiza quadrado com object-cover em tamanho padrão", () => {
    const { container } = render(<EllaAvatar />);
    const img = container.querySelector("img")!;
    expect(img).toBeTruthy();
    expect(img.style.width).toBe("40px");
    expect(img.style.height).toBe("40px");
    expect(img.style.minWidth).toBe("40px");
    expect(img.style.minHeight).toBe("40px");
    expect(img.className).toMatch(/object-cover/);
    expect(img.className).toMatch(/object-center/);
    expect(img.className).toMatch(/rounded-full/);
    expect(img.getAttribute("alt")).toMatch(/Ella/i);
    expect(img.getAttribute("src")).toBeTruthy();
  });

  it.each([
    ["mobile-sm", 28],
    ["sidebar", 40],
    ["header", 56],
    ["card", 96],
    ["desktop-lg", 128],
  ])("mantém proporção 1:1 em %s (%ipx)", (_label, size) => {
    const { container } = render(<EllaAvatar size={size} />);
    const img = container.querySelector("img")!;
    expect(img.style.width).toBe(`${size}px`);
    expect(img.style.height).toBe(`${size}px`);
    expect(img.style.minWidth).toBe(`${size}px`);
    expect(img.style.minHeight).toBe(`${size}px`);
  });

  it.each(["full", "2xl", "xl", "lg"] as const)("aplica raio %s corretamente", (rounded) => {
    const { container } = render(<EllaAvatar rounded={rounded} />);
    const img = container.querySelector("img")!;
    expect(img.className).toMatch(new RegExp(`rounded-${rounded}`));
  });

  it("cai no fallback textual 'ER' se a imagem falhar (sem ícone quebrado)", () => {
    const { container } = render(<EllaAvatar size={64} alt="Ella Ribeiro" />);
    const img = container.querySelector("img")!;
    // primeira falha → troca para DEFAULT
    fireEvent.error(img);
    // segunda falha (default também quebrado) → fallback textual
    const img2 = container.querySelector("img");
    if (img2) fireEvent.error(img2);
    const fb = screen.getByRole("img", { name: /Ella Ribeiro/i });
    expect(fb.textContent).toBe("ER");
    // continua quadrado no fallback
    expect((fb as HTMLElement).style.width).toBe("64px");
    expect((fb as HTMLElement).style.height).toBe("64px");
  });

  it("aplica ring quando solicitado", () => {
    const { container } = render(<EllaAvatar ring />);
    expect(container.querySelector("img")!.className).toMatch(/ring-2/);
  });
});
