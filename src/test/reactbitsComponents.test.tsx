import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import {
  BellToggle,
  SpecularButton,
  BorderGlow,
  PillNav,
  GradientASCII,
  Counter,
  SplitFlapText,
  TearTicket,
  SpotlightCard,
  SlideCommit,
  GlideSelect,
  JellyRadio,
  GlassSurface,
  MagicBento,
  WakeSlider,
} from "@/components/reactbits";
import { TopNav } from "@/components/qb/TopNav";
import { Hero } from "@/components/qb/Hero";
import { ReliefBento } from "@/components/qb/ReliefBento";
import { LiveQueueDemo } from "@/components/qb/LiveQueueDemo";
import { Pricing } from "@/components/qb/Pricing";
import { DashboardPreview } from "@/components/qb/DashboardPreview";
import { Signature } from "@/components/qb/Signature";
import { NowServingHero } from "@/features/publicDisplay/components/NowServingHero";

describe("React Bits components integration & WebGL/jsdom safety", () => {
  it("renders BellToggle and toggles state on click", () => {
    const onChange = vi.fn();
    render(
      <BellToggle
        offLabel="Notify me"
        onLabel="You'll be notified"
        count={2}
        badge
        waves
        clapper={false}
        onChange={onChange}
      />
    );
    const btn = screen.getByRole("button", { name: "Notify me" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders SpecularButton safely without WebGL2 and handles clicks", () => {
    const onClick = vi.fn();
    render(
      <SpecularButton size="lg" radius={18} onClick={onClick}>
        Try Pitch Demo
      </SpecularButton>
    );
    const btn = screen.getByRole("button", { name: "Try Pitch Demo" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders BorderGlow with children", () => {
    render(
      <BorderGlow backgroundColor="#0e1e34" colors={["#51c2c2", "#10637f", "#f4f2eb"]}>
        <h2>Live Queue</h2>
      </BorderGlow>
    );
    expect(screen.getByText("Live Queue")).toBeInTheDocument();
  });

  it("renders PillNav with items and active state", () => {
    const onItemClick = vi.fn();
    render(
      <PillNav
        items={[
          { label: "Product", href: "#product" },
          { label: "Pricing", href: "#pricing" },
        ]}
        activeHref="#product"
        onItemClick={onItemClick}
        collapse="never"
      />
    );
    const pricing = screen.getByRole("link", { name: "Pricing" });
    fireEvent.click(pricing);
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it("renders GradientASCII safely without WebGL2", () => {
    const { container } = render(
      <GradientASCII
        colors={["#0e1e34", "#10637f", "#51c2c2", "#f4f2eb"]}
        shape="horizon"
        cellSize={18}
        density={0.8}
      />
    );
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("renders Counter, SplitFlapText, TearTicket, SpotlightCard, and SlideCommit cleanly", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Counter value={42} prefix="#" />
          <SplitFlapText text="A-42" intro={false} loop={false} />
          <TearTicket stub={<span>#A-42</span>} ariaLabel="Tear ticket A-42">
            <span>Qblink Ticket</span>
          </TearTicket>
          <SpotlightCard>
            <span>Spotlight Content</span>
          </SpotlightCard>
          <SlideCommit label="Slide to confirm" doneLabel="Confirmed" />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText("A-42")).toBeInTheDocument();
    expect(screen.getByText("Qblink Ticket")).toBeInTheDocument();
    expect(screen.getByText("Spotlight Content")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Slide to confirm" })).toBeInTheDocument();
  });

  it("commits SlideCommit on pointer drag and keyboard End", () => {
    const onConfirm = vi.fn();
    const onDone = vi.fn();
    render(
      <SlideCommit
        label="Slide to confirm arrival"
        doneLabel="Checked in"
        width={236}
        height={44}
        onConfirm={onConfirm}
        onDone={onDone}
      />
    );

    const slider = screen.getByRole("slider", { name: "Slide to confirm arrival" });
    const track = slider.parentElement!;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 236,
      height: 44,
      right: 236,
      bottom: 44,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const mkPointer = (type: string, clientX: number) =>
      Object.assign(new MouseEvent(type, { bubbles: true, clientX, button: 0 }), { pointerId: 1 });

    fireEvent(track, mkPointer("pointerdown", 16));
    fireEvent(track, mkPointer("pointermove", 215));
    fireEvent(track, mkPointer("pointerup", 215));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);

    const onKeyConfirm = vi.fn();
    render(
      <SlideCommit
        label="Slide with key"
        doneLabel="Done"
        onConfirm={onKeyConfirm}
      />
    );
    fireEvent.keyDown(screen.getByRole("slider", { name: "Slide with key" }), { key: "End" });
    expect(onKeyConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders all integrated Qblink sections without crashing", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <TopNav />
          <Hero />
          <LiveQueueDemo />
          <ReliefBento />
          <DashboardPreview />
          <Pricing />
          <Signature />
          <NowServingHero
            displayData={{
              queueId: "demo",
              queueName: "Main Counter",
              businessName: "City Clinic",
              status: "active",
              currentToken: 42,
              counterLabel: "Counter 2",
              waitingCount: 3,
              nextTokens: [],
              estimatedWaitMinutes: 9,
              queueType: "general",
              lastUpdated: new Date().toISOString(),
            }}
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByText(/The line still exists/i)).toBeInTheDocument();
    expect(screen.getByText(/Watch the wait/i)).toBeInTheDocument();
    expect(screen.getByText(/What replaces the anxiety/i)).toBeInTheDocument();
    expect(screen.getByText(/Everything at the counter/i)).toBeInTheDocument();
    expect(screen.getByText(/Priced against the hour/i)).toBeInTheDocument();
    expect(screen.getByText(/Give an hour/i)).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("renders GlideSelect with tags and fires onChange on selection", () => {
    const onChange = vi.fn();
    const formats = [
      { value: "png", label: "PNG", tag: "Lossless" },
      { value: "jpg", label: "JPG", tag: "Smallest" },
      { value: "webp", label: "WebP", tag: "Modern" },
    ];
    render(
      <GlideSelect
        options={formats}
        defaultValue="png"
        onChange={onChange}
        ariaLabel="Export format"
        showTags
      />
    );

    const trigger = screen.getByRole("combobox", { name: "Export format" });
    expect(trigger).toHaveTextContent("PNG");
    fireEvent.click(trigger);

    expect(screen.getByText("Smallest")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /JPG/i }));

    expect(onChange).toHaveBeenCalledWith("jpg", formats[1]);
    expect(trigger).toHaveTextContent("JPG");
  });

  it("renders JellyRadio with string and disabled object items", () => {
    const onStringChange = vi.fn();
    render(
      <JellyRadio
        items={["Off", "Low", "Medium", "High", "Max"]}
        defaultValue="Medium"
        onChange={onStringChange}
      />
    );

    expect(screen.getByRole("radio", { name: "Medium" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    fireEvent.click(screen.getByRole("radio", { name: "High" }));
    expect(onStringChange).toHaveBeenCalledWith("High", 3);

    const onObjectChange = vi.fn();
    render(
      <JellyRadio
        items={[
          { value: "list", label: "List" },
          { value: "grid", label: "Grid" },
          { value: "map", label: "Map", disabled: true },
        ]}
        defaultValue="grid"
        onChange={onObjectChange}
      />
    );

    const disabledChip = screen.getByRole("radio", { name: "Map" });
    expect(disabledChip).toBeDisabled();
    fireEvent.click(disabledChip);
    expect(onObjectChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    expect(onObjectChange).toHaveBeenCalledWith("list", 0);
  });

  it("renders GlassSurface with children, shape mask, and backdrop ref", () => {
    const { container } = render(
      <>
        <GlassSurface
          width={320}
          height={76}
          borderRadius={38}
          distortionScale={-180}
          displace={0.5}
          backgroundOpacity={0.1}
        >
          <span>Your content</span>
        </GlassSurface>
        <GlassSurface shape="/logo.svg" width={280} height={280} />
      </>
    );

    expect(screen.getByText("Your content")).toBeInTheDocument();
    expect(container.querySelectorAll("filter").length).toBeGreaterThanOrEqual(2);
  });

  it("renders MagicBento with custom cards and click handling", () => {
    const onCardClick = vi.fn();
    render(
      <ThemeProvider>
        <MagicBento
          columns={4}
          rowHeight={200}
          gap={12}
          radius={20}
          enableBorderGlow={true}
          enableSpotlight={true}
          spotlightRadius={300}
          clickEffect={true}
          cards={[
            { label: "Waiting", title: "Queue", value: 14, onClick: onCardClick },
            { label: "Served", title: "Today", value: 82 },
          ]}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Waiting/i }));
    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  it("renders WakeSlider and updates value via keyboard", () => {
    const onChange = vi.fn();
    render(
      <WakeSlider
        defaultValue={50}
        min={0}
        max={100}
        step={5}
        showValue
        ariaLabel="Test slider"
        onChange={onChange}
      />
    );

    const slider = screen.getByRole("slider", { name: "Test slider" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(55);
    expect(slider).toHaveAttribute("aria-valuenow", "55");
  });
});
