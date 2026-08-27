import { InMemoryGenerationService } from "./service";

const studioGlobal = globalThis as typeof globalThis & {
  __studioGenerationRuntime?: InMemoryGenerationService;
};

function runtimeInstance(): InMemoryGenerationService {
  studioGlobal.__studioGenerationRuntime ??= new InMemoryGenerationService();
  return studioGlobal.__studioGenerationRuntime;
}

export function generationRuntime(): InMemoryGenerationService {
  return runtimeInstance();
}

export function resetGenerationRuntimeForTests(): void {
  studioGlobal.__studioGenerationRuntime = new InMemoryGenerationService();
}
