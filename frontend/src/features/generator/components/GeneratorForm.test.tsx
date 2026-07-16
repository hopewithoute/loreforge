import React, { useEffect } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GeneratorForm } from "./GeneratorForm";
import type { GeneratorFormValues } from "@/features/generator/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API hook
const mockMutate = vi.fn();
vi.mock("@/features/generator/api/useCreateAsset", () => ({
  useCreateAsset: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

import { useForm, FormProvider } from "react-hook-form";

// Helper component to provide react-hook-form context
function FormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: {
      prompt: "",
      category: "character",
      style: "concept_art",
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

const queryClient = new QueryClient();

describe("GeneratorForm", () => {
  it("should show validation error if submitted with empty prompt", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FormWrapper>
          <GeneratorForm onSubmit={mockMutate} isPending={false} />
        </FormWrapper>
      </QueryClientProvider>,
    );

    // Click submit without entering a prompt
    fireEvent.submit(screen.getByRole("button", { name: /INITIALIZE RENDER/i }));

    // Expect validation error
    await waitFor(() => {
      expect(
        screen.getByText(/Please provide either a Director's Notes/i),
      ).toBeInTheDocument();
    });

    // Ensure API was not called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should call useCreateAsset with correct data on valid submission", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <FormWrapper>
          <GeneratorForm onSubmit={mockMutate} isPending={false} />
        </FormWrapper>
      </QueryClientProvider>,
    );

    // Type a prompt
    const promptInput = screen.getByPlaceholderText(/Describe the concept/i);
    await user.type(promptInput, "A brave knight");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /INITIALIZE RENDER/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: "A brave knight",
          category: "character",
          style: "concept_art",
        }),
      );
    });
  });

  it("should change Category and Style when buttons are clicked", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <FormWrapper>
          <GeneratorForm onSubmit={mockMutate} isPending={false} />
        </FormWrapper>
      </QueryClientProvider>,
    );

    // Initial styles
    const envButton = screen.getByRole("button", { name: /Environment/i });
    const darkFantasyButton = screen.getByRole("button", { name: /Dark Fantasy/i });

    await user.click(envButton);
    await user.click(darkFantasyButton);

    // Button should now be active (have specific background classes)
    expect(envButton.className).toContain("bg-(--graphite)!");
    expect(darkFantasyButton.className).toContain("bg-(--blueprint)!");
  });

  it("should handle Evolve Mode cancellation", async () => {
    const user = userEvent.setup();

    function EvolveWrapper({ children }: { children: React.ReactNode }) {
      const methods = useForm<GeneratorFormValues>({
        defaultValues: {
          prompt: "",
          category: "character",
          style: "concept_art",
          evolveTarget: null,
        },
      });

      // Force it into evolve mode
      useEffect(() => {
        methods.setValue("evolveTarget", {
          id: "parent-123",
          prompt: "Parent prompt",
          category: "character",
          style: "concept_art",
          generated_image_path: null,
          reference_image_path: null,
        });
      }, [methods]);

      return <FormProvider {...methods}>{children}</FormProvider>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <EvolveWrapper>
          <GeneratorForm onSubmit={mockMutate} isPending={false} />
        </EvolveWrapper>
      </QueryClientProvider>,
    );

    // Wait for the button to appear since it's set in useEffect
    const cancelButton = await screen.findByRole("button", { name: /CANCEL EVOLVE/i });
    expect(cancelButton).toBeInTheDocument();

    // Click cancel
    await user.click(cancelButton);

    // The cancel button should disappear because evolveTarget is reset to null
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /CANCEL EVOLVE/i }),
      ).not.toBeInTheDocument();
    });
  });
});
