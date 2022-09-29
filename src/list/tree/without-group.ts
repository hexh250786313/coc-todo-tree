import { configuration } from '@/constants'
import { isParent, TodoItem, TodoNode } from '@/tree'
import view, { TreeView, TreeViewItem } from '@/view'
import { buildTree, flatten, handleSingleChidren } from './helpers'

export function listTreeWithoutGroup(results: TodoItem[][]) {
  function _recursive(obj: TreeView | TreeViewItem[], level = 0, path = '') {
    let res: TodoNode[] = []
    if (Array.isArray(obj)) {
      configuration.tags.forEach(({ tagName: tag }) => {
        const indexArr = obj.filter((o) => o.tagName === tag)
        const targetResult = results.find((i) => i[0]?.tagName === tag)
        if (indexArr.length && !!targetResult) {
          const r = indexArr
            .map((i) => targetResult[i.index])
            .filter((i) => i.path === path)
          res.push(...r)
        }
      })
    } else {
      res = Array.from(obj.keys()).map((key: string) => {
        const nextPath = `${path}/${key}`
        const nextTarget = obj.get(key)!
        const children = _recursive(nextTarget, level + 1, nextPath).sort(
          (a, b) => {
            if (isParent(a) && isParent(b)) {
              return a.sourcePath.localeCompare(b.sourcePath)
            }
            return 0
          }
        )
        return {
          level,
          sourcePath: nextPath,
          key: `[${level}] ${nextPath}`,
          children,
        }
      })
    }
    return res
  }
  const parents = buildTree(
    handleSingleChidren(flatten(view.data ? _recursive(view.data) : []))
  )

  return parents
}
