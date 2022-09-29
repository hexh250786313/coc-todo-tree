import { configuration } from '@/constants'
import { Folder, isParent, TodoItem, TodoNode } from '@/tree'
import view, { TreeView, TreeViewItem } from '@/view'
import { buildTree, deleteEmpty, flatten, handleSingleChidren } from './helpers'

export function listTreeWithGroup(results: TodoItem[][]) {
  const parents: Folder[] = []

  const configTags = configuration.tags.map((t) => t.tagName)

  function _loopToArray(
    tag: string,
    t: TreeView | TreeViewItem[],
    level = 0,
    path = ''
  ) {
    let arr: TodoNode[] = []
    if (Array.isArray(t)) {
      const targetIndex = results.findIndex((item) => item[0]?.tagName === tag)
      if (targetIndex !== -1) {
        arr = results[targetIndex].filter((i) => i.path === `${path}`)
      }
    } else {
      const nextLevel = level + 1
      arr = Array.from(t.keys()).map((key) => {
        const nextTarget = t.get(key)!
        const nextPath = `${path}/${key}`
        return {
          level: nextLevel,
          sourcePath: nextPath,
          key: `[${tag}] [${nextLevel}] ${nextPath}`,
          children: _loopToArray(tag, nextTarget, nextLevel, nextPath),
        }
      })
    }
    const res = arr.sort((a, b) => {
      if (isParent(a) && isParent(b)) {
        return a.sourcePath.localeCompare(b.sourcePath)
      }
      return 0
    })
    deleteEmpty(res)
    return res
  }

  configTags.forEach((configTag) => {
    const target = results.find((item) => item[0]?.tagName === configTag)
    if (target) {
      const children = buildTree(
        handleSingleChidren(flatten(_loopToArray(configTag, view.data)))
      )
      parents.push({
        level: 0,
        sourcePath: configTag,
        key: configTag,
        tag: configTag,
        children,
      })
    }
  })
  return parents
}
