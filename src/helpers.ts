import { window, workspace } from 'coc.nvim'
import { existsSync, lstatSync } from 'fs-extra'
import { log } from '.'
import { extensionName } from './constants'

export type TupleToObject<
  T extends any[],
  K extends { [I in keyof T]: PropertyKey }
> = {
  [I in keyof T as I extends keyof any[] ? never : K[I]]: T[I]
}

export type ValueType<T extends Record<any, any>> = T[keyof T]

export const logger = {
  warn: log('warn'),
  info: log('info'),
  error: log('info'),
}

export function showErrorMessage(
  message: string,
  showFloatingWin = false
): void {
  window.showErrorMessage(message)
  if (showFloatingWin) {
    window.showNotification({
      kind: 'error',
      title: extensionName,
      content: message,
    })
  }
  logger.error(message)
}

export function showWarningMessage(
  message: string,
  showFloatingWin = false
): void {
  window.showWarningMessage(message)
  if (showFloatingWin) {
    window.showNotification({
      kind: 'warning',
      title: extensionName,
      content: message,
    })
  }
  logger.warn(message)
}

// coc.nvim/coc.nvim/src/list/basic.ts
export function toVimFiletype(filetype: string): string {
  switch (filetype) {
    case 'latex':
      // LaTeX (LSP language ID 'latex') has Vim filetype 'tex'
      return 'tex'
    default:
      return filetype
  }
}

export const isFile = (path: string) =>
  existsSync(path) && lstatSync(path).isFile()

export const removeCWD = (path: string) => path.replace(workspace.cwd + '/', '')

export async function registerRuntimepath(extensionPath: string) {
  const { nvim } = workspace
  const rtp = (await nvim.getOption('runtimepath')) as string
  const paths = rtp.split(',')
  if (!paths.includes(extensionPath)) {
    await nvim.command(
      `execute 'noa set rtp+='.fnameescape('${extensionPath.replace(
        /'/g,
        "''"
      )}')`
    )
  }
}
