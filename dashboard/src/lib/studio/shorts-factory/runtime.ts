import { generationRuntime } from "@/lib/studio/generation/runtime";
import { PostgresShortsFactoryRepository } from "./repository";
import { ShortsFactoryService } from "./service";

const factoryGlobal = globalThis as typeof globalThis & {
  __shortsFactoryRuntime?: { version: 1; service: ShortsFactoryService };
};

function runtimeInstance(): ShortsFactoryService {
  if (factoryGlobal.__shortsFactoryRuntime?.version !== 1) {
    factoryGlobal.__shortsFactoryRuntime = {
      version: 1,
      service: new ShortsFactoryService(
        new PostgresShortsFactoryRepository(),
        async ({ memberId, idempotencyKey, request }) => generationRuntime().create(memberId, idempotencyKey, request),
      ),
    };
  }
  return factoryGlobal.__shortsFactoryRuntime.service;
}

export function shortsFactoryRuntime(): ShortsFactoryService {
  return runtimeInstance();
}

export function setShortsFactoryRuntimeForTests(service: ShortsFactoryService): void {
  factoryGlobal.__shortsFactoryRuntime = { version: 1, service };
}
