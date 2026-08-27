import type { StudioRoom } from "@/store/ui-store";

const STUDIO_ROOMS = new Set<StudioRoom>(["create", "edit", "publish"]);

export function resolveStudioRoomFromSearch(search: string, fallback: StudioRoom): StudioRoom {
  const requested = new URLSearchParams(search).get("room") as StudioRoom | null;
  return requested && STUDIO_ROOMS.has(requested) ? requested : fallback;
}

export function shouldLoadPublishResources(room: StudioRoom): boolean {
  return room === "publish";
}
