import { configuration, TodoTreeConfiguration, viewModes } from './constants'
import { GrepMatch } from './grep'

export interface TreeViewItem {
  index: number
  tagName: string
}
type Path = string
export type TreeView = Map<Path, TreeView | TreeViewItem[]>

class View {
  private _tagsOnlyView: Map<string, number[]> = new Map(
    configuration.tags.map((item) => [item.tagName, []])
  )
  private _flatView: Map<string, TreeViewItem[]> = new Map()
  private _treeView: TreeView = new Map()
  public mode: TodoTreeConfiguration['defaultView'] = configuration.defaultView
  public groupByTag: TodoTreeConfiguration['groupByTag'] =
    configuration.groupByTag

  private flatView(grepItem: GrepMatch) {
    const fsPath = grepItem.fsPath
    const tag = {
      index: grepItem.index!,
      tagName: grepItem.tagName,
    }
    if (this._flatView.has(fsPath)) {
      this._flatView.get(fsPath)!.push(tag)
    } else {
      this._flatView.set(fsPath, [tag])
    }

    return this._flatView
  }

  private tagsOnlyView(grepItem: GrepMatch) {
    const currentTagName = grepItem.tagName
    const currentIndex = grepItem.index!
    if (this._tagsOnlyView.has(currentTagName)) {
      this._tagsOnlyView.get(currentTagName)!.push(currentIndex)
    } else {
      this._tagsOnlyView.set(currentTagName, [currentIndex])
    }
    return this._tagsOnlyView
  }

  private treeView(grepItem: GrepMatch) {
    const { tagName, index, fsPath } = grepItem
    const pathArr = fsPath.split('/').filter((i: any) => i) // => ["home", "user", ".zshrc"]
    let target = this._treeView
    pathArr.forEach((path: any, order: any, self: any) => {
      const next = target.get(path)
      if (!self[order + 1]) {
        const item = { tagName, index: index! }
        const next = target.get(path)
        if (Array.isArray(next)) {
          next.push(item)
        } else {
          const newArr = [item]
          target.set(path, newArr)
          target = newArr as any
        }
      } else if (!next) {
        const newMap = new Map()
        target.set(path, newMap)
        target = newMap
      } else if (next) {
        target = next as any
      }
    })
    return this._treeView
  }

  public generateView(grepItem: GrepMatch) {
    this.treeView(grepItem)
    this.flatView(grepItem)
    this.tagsOnlyView(grepItem)
  }

  public clear() {
    this._treeView.clear()
    this._tagsOnlyView.clear()
    this._flatView.clear()
  }

  public get data() {
    // @ts-ignore
    const data = this[`_${this.mode}View`]
    const dataType = Object.prototype.toString.call(data)
    let valid = false
    switch (dataType) {
      case '[object Map]': {
        valid = (data as Map<any, any>).size !== 0
        break
      }
      default:
      case '[object Array]': {
        valid = (data as Array<any>).length !== 0
        break
      }
    }

    if (valid) {
      // @ts-ignore
      return this[`_${this.mode}View`]
    }
    return null
  }

  public switchToNextMode() {
    const index = viewModes.findIndex((mode) => mode === this.mode)
    if (index !== -1) {
      this.mode = viewModes[index + 1] ?? viewModes[0]
    } else {
      this.mode = viewModes[1]
    }
  }
}

const view = new View()

export default view
