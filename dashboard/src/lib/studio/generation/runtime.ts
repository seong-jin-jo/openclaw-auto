import { EditorDerivationSink } from "./derivation-sink";
import { PostgresGenerationRepository } from "./repository";
import { GenerationService } from "./service";
import { LlmStudioContentGenerator } from "./llm";

const studioGlobal = globalThis as typeof globalThis & {
  __studioGenerationRuntime?: { version: 4; service: GenerationService };
};

function runtimeInstance(): GenerationService {
  if (studioGlobal.__studioGenerationRuntime?.version !== 4) {
    studioGlobal.__studioGenerationRuntime = {
      version: 4,
      service: new GenerationService(new PostgresGenerationRepository(), new EditorDerivationSink(), new LlmStudioContentGenerator()),
    };
  }
  return studioGlobal.__studioGenerationRuntime.service;
}

export function generationRuntime(): GenerationService {
  return runtimeInstance();
}

export function setGenerationRuntimeForTests(service: GenerationService): void {
  studioGlobal.__studioGenerationRuntime = { version: 4, service };
}
