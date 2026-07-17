import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LightboxProvider } from "./LightboxProvider";
import { useLightbox } from "./LightboxContext";

function TestComponent() {
  const { openLightbox } = useLightbox();

  return (
    <button
      onClick={() => openLightbox("http://example.com/image.png", "Test Prompt")}
      type="button"
    >
      Open Lightbox
    </button>
  );
}

describe("LightboxProvider", () => {
  it("opens the lightbox and renders the image when openLightbox is called", () => {
    render(
      <LightboxProvider>
        <TestComponent />
      </LightboxProvider>,
    );

    // Lightbox should be hidden initially
    expect(screen.queryByAltText("Test Prompt")).not.toBeInTheDocument();

    // Open lightbox
    fireEvent.click(screen.getByText("Open Lightbox"));

    // Verify image and prompt are rendered
    const img = screen.getByAltText("Test Prompt");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://example.com/image.png");
    expect(screen.getByText("Test Prompt")).toBeInTheDocument();
  });

  it("closes the lightbox when the close button is clicked", async () => {
    render(
      <LightboxProvider>
        <TestComponent />
      </LightboxProvider>,
    );

    fireEvent.click(screen.getByText("Open Lightbox"));
    expect(screen.getByAltText("Test Prompt")).toBeInTheDocument();

    // Click close button
    fireEvent.click(screen.getByTitle(/Close/i));

    await waitFor(() => {
      expect(screen.queryByAltText("Test Prompt")).not.toBeInTheDocument();
    });
  });
});
