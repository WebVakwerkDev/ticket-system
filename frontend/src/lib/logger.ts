const isDev = import.meta.env.DEV

export const logger = {
  info: (msg: string, data?: object) => {
    if (isDev) console.info(`[info] ${msg}`, ...(data ? [data] : []))
  },
  warn: (msg: string, data?: object) => {
    if (isDev) console.warn(`[warn] ${msg}`, ...(data ? [data] : []))
  },
  error: (msg: string, data?: object) => {
    console.error(`[error] ${msg}`, ...(data ? [data] : []))
  },
}
