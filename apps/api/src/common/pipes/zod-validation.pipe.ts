import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'

interface ParseResult<T> {
  success: boolean
  data?: T
  error?: { issues: unknown[] }
}

interface Schema<T = unknown> {
  safeParse(value: unknown): ParseResult<T>
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: Schema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error?.issues ?? [],
      })
    }
    return result.data
  }
}
