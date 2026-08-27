import { InMemoryGenerationService } from "./service";

let runtime = new InMemoryGenerationService();

export function generationRuntime(): InMemoryGenerationService {
  return runtime;
}

export function resetGenerationRuntimeForTests(): void {
  runtime = new InMemoryGenerationService();
}
