import { ExtensionContext, Logger } from 'coc.nvim'
import { extensionName, configuration } from './constants'
import TodoTree from './tree'
import { commands } from 'coc.nvim'
import { TupleToObject } from './helpers'

export type CommandsParameters = TupleToObject<
  Parameters<typeof commands.registerCommand>,
  [never, 'callback', 'args', 'internal']
>

let _logger: Logger

export function log(msgType: 'info' | 'error' | 'warn') {
  return (msg: string) => _logger[msgType](msg)
}

// TODO: watchman: coc-volar; filetype; filter

export async function activate(context: ExtensionContext): Promise<void> {
  if (configuration.enabled === false) {
    return
  }
  const { subscriptions, logger } = context
  _logger = logger
  const todoTree = new TodoTree()

  subscriptions.push(...generateCommands(extensionName, todoTree.commandsMap))

  // don't use global autocmd register, should only work for coc-todo-tree
  // todoTree.autocmdsArr.forEach((v) => workspace.registerAutocmd(v))
}

function generateCommands<V extends CommandsParameters>(
  extensionName: string,
  commandsMap: Map<string, V>
) {
  return Array.from(commandsMap.keys()).map((commandName) => {
    const { callback, args, internal } = commandsMap.get(commandName)!
    return commands.registerCommand(
      `${extensionName}.${commandName}`,
      callback,
      args,
      internal
    )
  })
}
