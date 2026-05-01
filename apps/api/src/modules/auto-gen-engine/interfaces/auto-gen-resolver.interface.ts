export const AUTO_GEN_RESOLVERS = 'AUTO_GEN_RESOLVERS'

export interface IAutoGenResolver<C = unknown> {
  readonly ruleId: string
  resolve(ctx: C): Promise<string>
}
