import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { InfoButton } from "./InfoButton";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

function renderInfoButton(text = "Explanation text") {
  return render(
    <I18nextProvider i18n={i18n}>
      <InfoButton text={text} />
    </I18nextProvider>
  );
}

describe("InfoButton", () => {
  it("renders a button with aria-expanded=false initially", () => {
    renderInfoButton();
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("has an aria-label from i18n", () => {
    renderInfoButton();
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe(i18n.t("stats.info.button"));
  });

  it("opens the popover when clicked and sets aria-expanded=true", () => {
    renderInfoButton("My explanation");
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("My explanation")).toBeTruthy();
  });

  it("adds aria-controls pointing to the popover id when open", () => {
    renderInfoButton("My explanation");
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    const popoverId = btn.getAttribute("aria-controls");
    expect(popoverId).toBeTruthy();
    expect(document.getElementById(popoverId!)).toBeTruthy();
  });

  it("closes the popover when clicked again", () => {
    renderInfoButton("My explanation");
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("My explanation")).toBeNull();
  });

  it("closes the popover on Escape key", () => {
    renderInfoButton("My explanation");
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("My explanation")).toBeNull();
  });

  it("closes the popover on mousedown outside", () => {
    renderInfoButton("My explanation");
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.mouseDown(document.body);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("popover has role=tooltip and button has aria-describedby pointing to it", () => {
    renderInfoButton("My explanation");
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeTruthy();
    expect(btn.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("clamps popover left to viewport on a narrow screen", () => {
    Object.defineProperty(window, "innerWidth", { value: 360, writable: true, configurable: true });

    renderInfoButton("My explanation");
    const renderedBtn = screen.getByRole("button");
    // Simulate button near right edge (left=330, width=20 → center at 340)
    renderedBtn.getBoundingClientRect = () => ({
      bottom: 100,
      left: 330,
      width: 20,
      right: 350,
      top: 80,
      height: 20,
      x: 330,
      y: 80,
      toJSON: () => ({}),
    });
    fireEvent.click(renderedBtn);

    // halfPopover=130, margin=8 → max left = 360-130-8 = 222; ideal = 330+10 = 340 → clamped to 222
    const popover = screen.getByRole("tooltip");
    const left = parseFloat(popover.style.left);
    expect(left).toBeLessThanOrEqual(360 - 130 - 8); // clamped from right edge
    expect(left).toBeGreaterThanOrEqual(130 + 8); // clamped from left edge
  });
});
