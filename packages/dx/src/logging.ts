import { IS_DEV } from './env'

export const warnDev = (message: string) => {
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.warn(message)
  }
}
