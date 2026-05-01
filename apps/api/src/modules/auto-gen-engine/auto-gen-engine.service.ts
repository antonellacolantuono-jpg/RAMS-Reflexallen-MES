import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  AUTO_GEN_RESOLVERS,
  type IAutoGenResolver,
} from './interfaces/auto-gen-resolver.interface'

@Injectable()
export class AutoGenEngineService {
  private readonly registry = new Map<string, IAutoGenResolver>()

  constructor(
    @Inject(AUTO_GEN_RESOLVERS) resolvers: IAutoGenResolver[],
  ) {
    for (const resolver of resolvers) {
      if (this.registry.has(resolver.ruleId)) {
        throw new Error(
          `AutoGenEngine: duplicate resolver for rule ${resolver.ruleId}`,
        )
      }
      this.registry.set(resolver.ruleId, resolver)
    }
  }

  async resolve(ruleId: string, context: unknown): Promise<string> {
    const resolver = this.registry.get(ruleId)
    if (!resolver) {
      throw new NotFoundException(
        `AutoGenEngine: no resolver registered for rule ${ruleId}`,
      )
    }
    return resolver.resolve(context)
  }

  hasResolver(ruleId: string): boolean {
    return this.registry.has(ruleId)
  }

  getRegisteredRuleIds(): string[] {
    return Array.from(this.registry.keys()).sort()
  }
}
