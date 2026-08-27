import { PostgresGenerationRepository } from "./repository";
import { GenerationService } from "./service";

const studioGlobal = globalThis as typeof globalThis & {
  __studioGenerationRuntime?: GenerationService;
};

function runtimeInstance(): GenerationService {
  studioGlobal.__studioGenerationRuntime ??= new GenerationService(new PostgresGenerationRepository());
  return studioGlobal.__studioGenerationRuntime;
}

export function generationRuntime(): GenerationService {
  return runtimeInstance();
}

export function setGenerationRuntimeForTests(service: GenerationService): void {
  studioGlobal.__studioGenerationRuntime = service;
}
