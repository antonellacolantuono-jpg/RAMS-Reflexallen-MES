import * as argon2 from 'argon2'

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
}

export async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, ARGON2_OPTIONS)
}

export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, pin)
  } catch {
    return false
  }
}
