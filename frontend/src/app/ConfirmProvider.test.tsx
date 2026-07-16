import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmProvider } from "./ConfirmProvider";
import { useConfirm } from "./ConfirmContext";

function TestComponent() {
  const confirm = useConfirm();

  const handleAction = async () => {
    const isConfirmed = await confirm(
      "Are you sure you want to delete this?",
      "Delete Item",
    );
    if (isConfirmed) {
      document.body.dataset.result = "confirmed";
    } else {
      document.body.dataset.result = "cancelled";
    }
  };

  return (
    <button onClick={handleAction} type="button">
      Trigger Action
    </button>
  );
}

describe("ConfirmProvider", () => {
  it("resolves to true when the user clicks Confirm", async () => {
    render(
      <ConfirmProvider>
        <TestComponent />
      </ConfirmProvider>,
    );

    // Initial state
    expect(
      screen.queryByText("Are you sure you want to delete this?"),
    ).not.toBeInTheDocument();

    // Trigger confirmation
    fireEvent.click(screen.getByText("Trigger Action"));

    // Verify dialog appears
    expect(screen.getByText("Are you sure you want to delete this?")).toBeInTheDocument();
    expect(screen.getByText("Delete Item")).toBeInTheDocument();

    // Click Confirm
    fireEvent.click(screen.getByText("Confirm"));

    // Verify dialog closes and promise resolves true
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to delete this?"),
      ).not.toBeInTheDocument();
      expect(document.body.dataset.result).toBe("confirmed");
    });
  });

  it("resolves to false when the user clicks Cancel", async () => {
    render(
      <ConfirmProvider>
        <TestComponent />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByText("Trigger Action"));
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(document.body.dataset.result).toBe("cancelled");
    });
  });
});
