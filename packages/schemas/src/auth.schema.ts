import { z } from 'zod'

export const OperatorLoginSchema = z.object({
  badge: z.string().min(1).max(50),
  pin: z
    .string()
    .min(4)
    .max(6)
    .regex(/^\d+$/, 'PIN must be digits only'),
})

export type OperatorLoginDto = z.infer<typeof OperatorLoginSchema>
