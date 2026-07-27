// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImagePickerModal } from "@/components/queue/ImagePickerModal";
import { useUIStore } from "@/store/ui-store";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

vi.mock("@/components/layout/Toast", () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

describe("ImagePickerModal protected data fetching", () => {
  beforeEach(() => {
    mocks.swr.mockReset();
    mocks.showToast.mockReset();
    mocks.swr.mockReturnValue({ data: undefined, mutate: vi.fn() });
    useUIStore.setState({ imagePickerPostId: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("uses null SWR keys while the modal is closed", () => {
    render(<ImagePickerModal />);

    expect(mocks.swr).toHaveBeenNthCalledWith(1, null, expect.any(Function));
    expect(mocks.swr).toHaveBeenNthCalledWith(2, null, expect.any(Function));
  });

  it("starts images and queue requests only after the modal opens", async () => {
    render(<ImagePickerModal />);
    mocks.swr.mockClear();

    act(() => {
      useUIStore.getState().setImagePickerPostId("post-1");
    });

    await waitFor(() => {
      expect(mocks.swr).toHaveBeenCalledWith("/api/images", expect.any(Function));
      expect(mocks.swr).toHaveBeenCalledWith("/api/queue", expect.any(Function));
    });
  });
});
