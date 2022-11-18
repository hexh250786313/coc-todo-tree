import { isFile } from '@/helpers'
import { Folder, isParent, TodoNode } from '@/tree'
import { workspace } from 'coc.nvim'
import { existsSync, lstatSync } from 'fs-extra'

type IFlattenRes = Folder & { parentPaths?: string[] | null }

export const getParentPath = (
  parentPaths: string[] | null | undefined,
  total: IFlattenRes[]
) => {
  const _parentPaths = parentPaths ? clone(parentPaths).reverse() : []
  const parent = clone(total)
    .reverse()
    .find((i) => _parentPaths.includes(i.sourcePath))
  if (parent) {
    return parent.sourcePath
  }
  return null
}

export function deleteEmpty(treeData: TodoNode[]) {
  function traversal(node: TodoNode[]) {
    for (let i = 0; i < node.length; i++) {
      const info = node[i]
      if (isParent(info)) {
        if (info.children.length > 0) {
          traversal(info.children)
        }
        if (info.children.length === 0) {
          const index = node.findIndex((i) => isParent(i) && info.key === i.key)
          node.splice(index, 1)
          i--
        }
      }
    }
  }
  traversal(treeData)
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export const buildTree = (data: IFlattenRes[]) =>
  data
    .map((t) =>
      t.sourcePath === workspace.cwd ? { ...t, parentPaths: null } : t
    )
    .sort((a, b) => a.level - b.level)
    .reduce(
      (m, { sourcePath, parentPaths, children, ...rest }) => (
        m.get(getParentPath(parentPaths, data))!.push({
          ...rest,
          sourcePath,
          name: sourcePath.replace(
            (getParentPath(parentPaths, data) ?? workspace.cwd) + '/',
            ''
          ),
          children: isFile(sourcePath)
            ? children
            : m.set(sourcePath, []).get(sourcePath)!,
        }),
        m
      ),
      new Map<string | null, IFlattenRes[]>([[null, []]])
    )
    .get(null)!
    .reduce((total, current, currentIndex) => {
      if (currentIndex === 0 && current.sourcePath === workspace.cwd) {
        total = current.children
      } else {
        total.push(current)
      }
      return total
    }, [] as TodoNode[])

export const handleSingleChidren = (arr: IFlattenRes[]) => {
  return arr.reduce((total, current) => {
    if (isParent(current)) {
      if (
        (existsSync(current.sourcePath) &&
          lstatSync(current.sourcePath).isFile()) ||
        current.children.length > 1
      ) {
        total.push(current)
      }
    }
    return total
  }, [] as IFlattenRes[])
  // .sort((a: Folder, b: Folder) => a.level - b.level)
}

export const flatten: (
  next: TodoNode[],
  parentPaths?: string[]
) => IFlattenRes[] = (next, parentPaths = []) => {
  return Array.prototype.concat.apply(
    next
      // .map((i) => RawTreeNode.of(i).handleObjNotIncludeCWD().val)
      .map((i) => i)
      .reduce((total, current) => {
        if (current) {
          total.push({ ...current, parentPaths })
        }
        return total
      }, [] as any[]),
    next.map((i) =>
      isParent(i) ? flatten(i.children, [...parentPaths, i.sourcePath]) : []
    )
  )
}
