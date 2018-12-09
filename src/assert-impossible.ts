/**
 * Assert that a value was never supposed to happen in a well-typed usage.
 * 
 * @param impossible - The value that was supposed to be impossible.
 * @throws {TypeError} - On any input.
 */
export function assertImpossible(impossible: never): never {
  throw new TypeError(`The value ${JSON.stringify(impossible)} should never occur here if everything is type-safe.`)
}