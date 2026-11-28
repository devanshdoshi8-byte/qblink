import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InstallAppPrompt from "@/components/InstallAppPrompt";

const renderPrompt = () =>
  render(
    <MemoryRouter>
      <InstallAppPrompt />
    </MemoryRouter>,
  );

describe("install prompt dismissal", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("keeps a dismissed install prompt hidden after remounting", () => {
    const firstRender = renderPrompt();
    expect(screen.queryByRole("button", { name: "Install Qblink app" })).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("beforeinstallprompt", { cancelable: true })));
    expect(screen.getByRole("button", { name: "Install Qblink app" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide install button" }));

    expect(screen.queryByRole("button", { name: "Install Qblink app" })).not.toBeInTheDocument();
    expect(localStorage.getItem("qb-install-dismissed")).toBe("true");

    firstRender.unmount();
    renderPrompt();
    expect(screen.queryByRole("button", { name: "Install Qblink app" })).not.toBeInTheDocument();
  });

  it("honors and migrates the previous seven-day dismissal so it cannot reappear", () => {
    localStorage.setItem("qb-install-dismissed-at", String(Date.now()));

    renderPrompt();

    expect(screen.queryByRole("button", { name: "Install Qblink app" })).not.toBeInTheDocument();
    expect(localStorage.getItem("qb-install-dismissed")).toBe("true");
    expect(localStorage.getItem("qb-install-dismissed-at")).toBeNull();
  });

  it("opens install instructions only after an explicit request", () => {
    renderPrompt();
    expect(screen.queryByRole("button", { name: "Install Qblink app" })).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("qb:open-install")));

    expect(screen.getByText("Add to your Home Screen")).toBeInTheDocument();
  });
});