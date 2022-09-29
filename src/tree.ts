import {
  Autocmd,
  Disposable,
  disposeAll,
  Emitter,
  events,
  Neovim,
  Range,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  TreeViewOptions,
  window,
  workspace,
} from 'coc.nvim'
import { lstatSync } from 'fs-extra'
import path from 'path'
import { URI } from 'vscode-uri'
import { CommandsParameters } from '.'
import {
  configuration,
  defaultConfiguration,
  extensionName,
  IIcon,
} from './constants'
import Grep, { GrepMatch } from './grep'
import { showWarningMessage } from './helpers'
import { listIt } from './list'
import view from './view'

export interface TodoItem {
  tagName: string
  shortText: string
  detail?: string
  highlight?: string
  range: Range
  path: string
  extra?: string
}
export interface Folder {
  level: number
  sourcePath: string
  key: string
  tag?: string
  name?: string
  children: Array<TodoItem | Folder>
}
export type TodoNode = Folder | TodoItem
export type TodoEmitter = Emitter<TodoNode | undefined>
export type TodoTreeView = TreeView<TodoNode>

class TodoTree {
  private disposables: Disposable[] = []
  private prevBufnr: number | undefined
  private previewBufnr: number | undefined
  private rootItems: TodoNode[] = []
  private _treeView: TodoTreeView | null = null
  private opened: Partial<Folder>[] = []
  private nvim: Neovim = workspace.nvim
  private emitter: TodoEmitter = new Emitter()
  private timeout: NodeJS.Timeout | null = null
  private fetching = false
  private prevNode: TodoNode | undefined
  private autoPreview = configuration.autoPreview
  public commandsMap = new Map<string, CommandsParameters>()
  public autocmdsArr = Array<Autocmd>()

  constructor() {
    this.generateCommands()
    this.generateAutocmds()
  }

  get treeView() {
    if (!this._treeView) {
      this.generateTreeView()
    }
    return this._treeView
  }

  set treeView(_next: TodoTreeView | null) {
    // can not override treeView
  }

  private generateCommands() {
    this.commandsMap
      .set(`showTree`, {
        callback: async () => {
          if (this.treeView && !this.treeView.visible) {
            this.autocmdsArr.map((autocmd) => {
              return events.on(
                autocmd.event as any,
                autocmd.callback as any,
                null,
                this.disposables
              )
            })
            const doc = await workspace.document
            const bufnr = doc.bufnr
            this.prevBufnr = await this.nvim.call('bufwinnr', [bufnr])
            await this.treeView.show()
          }
          this.refreshTodoItems()
        },
        args: undefined,
      })
      .set(`goTo`, {
        callback: (node: TodoNode) => jumpTo(node, this.nvim, this.prevBufnr),
        args: undefined,
        internal: true,
      })
      .set(`open`, {
        callback: () => {
          // // nothint to do
        },
        args: undefined,
        internal: true,
      })
    return this.commandsMap
  }

  private generateAutocmds() {
    this.autocmdsArr.push({
      event: 'BufWritePost',
      callback: () => {
        if (this.treeView?.visible) {
          this.refreshTodoItems(500)
        }
      },
    })
    this.autocmdsArr.push({
      event: 'BufEnter',
      callback: (bufnr: number) => {
        if (
          this._treeView?.visible &&
          this.previewBufnr &&
          bufnr !== this.previewBufnr
        ) {
          this.prevNode = undefined
          this.closePreview()
        }
      },
    })

    return this.autocmdsArr
  }

  private refreshTodoItems(timeout = 0) {
    if (this.fetching) {
      return
    }
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = setTimeout(async () => {
      const updateText = 'Updating items...'
      await window.withProgress(
        {
          title: `[${extensionName}] ${updateText}`,
          cancellable: true,
        },
        async (_, cancellationToken) => {
          // let msgPrefix = updateText
          let msgPrefix = ''
          // see coc BasicTreeView: this.nodesMap.set(element, { item, resolved })
          // it use element as map key causing every time generate some new elements, it will not reuse the old element
          // it make memory leak
          // so I clear it manually till fixed
          // @ts-ignore
          this._treeView!.nodesMap.clear()
          view.clear()
          this._treeView!.message = msgPrefix
          let all = 0
          const gs = configuration.tags.map(
            (tag) => new Grep({ regex: tag.regex, tagName: tag.tagName })
          )
          cancellationToken.onCancellationRequested(() => {
            const cancelText = 'Grep canceled'
            msgPrefix = `${cancelText}: `
            showWarningMessage(cancelText)
            const results = gs.map((g) => {
              all += g.resArr.length
              return convertRawMatchesToTodoItem(g.handleGrepCancel())
            })
            this.rootItems = listIt(results)
          })
          return new Promise<void>((resolve) => {
            this.fetching = true
            this.rootItems = []
            msgPrefix = 'All '

            Promise.all(
              gs.map(async (g) => convertRawMatchesToTodoItem(await g.grep()))
            ).then((results) => {
              gs.forEach((g) => (all += g.resArr.length))
              this._treeView!.message = msgPrefix + `${all} items`
              this._treeView!.description = `${
                view.groupByTag ? 'group by tag;' : ''
              } ${view.mode} view`
              this.rootItems = listIt(results)
              resolve()
            })
          })
        }
      )

      this.emitter.fire(undefined)
      if (this.timeout) {
        clearTimeout(this.timeout)
        this.timeout = null
      }
      this.fetching = false
    }, timeout)
  }

  private generateTreeView() {
    const treeDataProvider: TreeViewOptions<TodoNode>['treeDataProvider'] = {
      resolveActions: async (_, node) => {
        return [
          {
            title: 'open it and close tree',
            handler: async () => {
              const doc = await workspace.document
              const bufnr = doc.bufnr
              const winnr = await this.nvim.call('bufwinnr', [bufnr])
              await jumpTo(node, this.nvim, this.prevBufnr)
              await this.nvim.command(`${winnr}wincmd c`)
            },
          },
        ]
      },
      onDidChangeTreeData: this.emitter.event,
      getChildren: (root) => {
        if (!root) {
          return this.rootItems
        }
        if (isParent(root)) {
          return root.children
        }
        return undefined
      },
      getTreeItem: (node: TodoNode) => {
        let item: TreeItem
        if (isParent(node)) {
          let icon: IIcon['text'] | undefined
          let iconHLGroup: IIcon['hlGroup'] | undefined
          let description = ''
          const state =
            this.opened.findIndex((t) => t.key === node.key) !== -1
              ? TreeItemCollapsibleState.Expanded
              : TreeItemCollapsibleState.Collapsed
          let text = ''
          if (typeof node.tag === 'string') {
            const target = configuration.tags.find(
              (t) => t.tagName === node.tag
            )
            if (target) {
              icon = target?.icon?.text
              text = node.tag
              iconHLGroup =
                configuration?.groupTagIconHighlight || target.icon?.hlGroup
            }
          } else {
            description = node.sourcePath.replace(workspace.cwd + '/', '')
            if (lstatSync(node.sourcePath).isFile()) {
              icon = configuration?.fileIcon?.text
              iconHLGroup = configuration?.fileIcon?.hlGroup
            } else {
              icon = configuration?.folderIcon?.text
              iconHLGroup = configuration?.folderIcon?.hlGroup
            }

            const p = node.name ?? path.basename(URI.file(node.sourcePath).path)
            text = p
          }
          item = new TreeItem(text, state)
          item.command = {
            command: `${extensionName}.open`,
            title: 'open it',
            arguments: [node],
          }
          item.description = description
          if (configuration.parentNodeHighlightEnabled) {
            item.label = {
              highlights: [[0, text.length]],
              label: text,
            }
          }
          if (icon) {
            item.icon = {
              hlGroup: iconHLGroup || defaultConfiguration.fileIcon!.hlGroup,
              text: icon,
            }
          }
        } else {
          const { shortText } = node
          const icon = configuration.tags.find(
            (t) => t.tagName === node.tagName
          )?.icon
          item = new TreeItem(`${shortText}`, TreeItemCollapsibleState.None)
          const position =
            node.extra ??
            `[${node.range.start.line}, ${node.range.start.character}]`
          if (icon) {
            item.icon = {
              hlGroup: icon?.hlGroup,
              text: icon?.text,
            }
          }
          item.command = {
            command: `${extensionName}.goTo`,
            title: 'go to it',
            arguments: [node],
          }
          item.description = position
        }
        return item
      },
    }
    this._treeView = window.createTreeView('Todo', {
      treeDataProvider,
      bufhidden: 'hide',
      // @ts-ignore
      autoWidth: true,
    })
    this._treeView.onDidExpandElement(({ element }) => {
      if (isParent(element)) {
        const { key } = element
        if (this.opened.find((t) => t.key === key)) {
          return
        }
        this.opened.push({ key })
      }
    })
    this._treeView.onDidCollapseElement(({ element }) => {
      if (isParent(element)) {
        const { key } = element
        const exist = this.opened.findIndex((t) => t.key === key)
        if (exist !== -1) {
          this.opened.splice(exist, 1)
        }
      }
    })
    // @ts-ignore
    this._treeView._collapseAll = this._treeView.collapseAll
    // @ts-ignore
    this._treeView.collapseAll = (...args: any[]) => {
      // @ts-ignore
      this._treeView._collapseAll(...args)
      this.opened = []
    }
    // override dispose if bufhidden set to wipe
    // this._treeView.dispose = () => {
    // // nothing to do
    // }

    this._treeView.onDidChangeVisibility(({ visible }) => {
      if (!visible) {
        this.closePreview()
        disposeAll(this.disposables)
      }
    })

    // @ts-ignore
    this._treeView.registerLocalKeymap(
      'n',
      configuration.toggleGroupByTagKey,
      async () => {
        this.closePreview()
        view.groupByTag = !view.groupByTag
        this.refreshTodoItems()
      },
      true
    )
    // @ts-ignore
    this._treeView.registerLocalKeymap(
      'n',
      configuration.refreshItemsKey,
      async () => {
        this.closePreview()
        this.refreshTodoItems()
      },
      true
    )

    // @ts-ignore
    this._treeView.registerLocalKeymap(
      'n',
      configuration.togglePreviewKey,
      async (node: TodoNode) => {
        this.autoPreview = !this.autoPreview
        this.doPreview(node)
      },
      true
    )

    // @ts-ignore
    this._treeView.registerLocalKeymap(
      'n',
      configuration.switchViewKey,
      async () => {
        this.opened = []
        view.switchToNextMode()
        this.closePreview()
        this.refreshTodoItems()
      },
      true
    )

    // @ts-ignore
    this._treeView.onDidCursorMoved(async (node) => {
      if (this.prevNode !== node) {
        this.prevNode = node
        this.previewBufnr = await this.doPreview(node)
      }
    })

    return this._treeView
  }

  private async doPreview(
    node: TodoNode | undefined
  ): Promise<undefined | number> {
    if (node && this.autoPreview) {
      // const doc = workspace.getDocument(node.)
      const config = {
        lines: [] as string[],
        border:
          configuration.previewWinConfig?.border ??
          defaultConfiguration.previewWinConfig?.border,
        rounded:
          configuration.previewWinConfig?.rounded ??
          defaultConfiguration.previewWinConfig?.rounded,
        maxWidth: configuration.maxPreviewWidth,
        highlight:
          configuration.previewWinConfig?.highlight ??
          defaultConfiguration.previewWinConfig?.highlight,
        borderhighlight:
          configuration.previewWinConfig?.borderhighlight ??
          defaultConfiguration.previewWinConfig?.borderhighlight,
        winblend:
          configuration.previewWinConfig?.winblend ??
          defaultConfiguration.previewWinConfig?.winblend,
        filetype: 'text',
      }
      if (isParent(node)) {
        if (node.tag) {
          this.closePreview()
          return
        } else {
          config.lines.push(node.sourcePath.replace(workspace.cwd + '/', ''))
        }
        config.maxWidth = 1000
      } else if (!isParent(node)) {
        // const filetype = toVimFiletype(
        // // @ts-ignore: getLanguageId: check filetype by same extension name
        // workspace.documentsManager.getLanguageId(node.path)
        // )
        // if (filetype) {
        // config.filetype = filetype
        // }
        const position =
          node.extra ??
          `[Line ${node.range.start.line}, Col ${node.range.start.character}]`
        const text = `${node.detail}\n\n${position}`
        config.lines = text?.split('\n') || []
      }
      return (await this.nvim.call('coc_todo_tree#preview', config)) as number
    } else {
      this.closePreview()
    }
  }

  private closePreview(): void {
    this.nvim.call('coc_todo_tree#close_preview', [], true)
  }
}

export default TodoTree

export function isParent(node: TodoNode): node is Folder {
  if (Object.prototype.hasOwnProperty.call(node, 'sourcePath')) {
    return true
  }
  return false
}

async function jumpTo(
  node: TodoNode,
  nvim: Neovim,
  prevBufnr?: number
): Promise<void> {
  if (!isParent(node)) {
    const filePath = URI.file(node.path).toString()
    await nvim.command(`${prevBufnr ?? ''}wincmd w`)
    await workspace.jumpTo(filePath, {
      line: node.range.start.line - 1,
      character: node.range.start.character - 1,
    })
  }
}

function convertRawMatchesToTodoItem(rawMatches: GrepMatch[]) {
  return rawMatches.map((res) => {
    return {
      tagName: res.tagName,
      detail: res.detail,
      shortText: res.shortText,
      path: res.fsPath,
      range: {
        start: {
          character: res.column,
          line: res.line,
        },
        end: {
          character: res.column,
          line: res.line,
        },
      },
    }
  })
}
