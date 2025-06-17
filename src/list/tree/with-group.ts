import { configuration } from '@/constants'
import { Folder, isParent, TodoItem, TodoNode } from '@/tree'
import { workspace } from 'coc.nvim'
import { existsSync, lstatSync } from 'fs-extra'
import path from 'path'

export function listTreeWithGroup(results: TodoItem[][]) {
  const configTags = configuration.tags.map((t) => t.tagName)
  const parents: Folder[] = []

  configTags.forEach((tagName) => {
    const tagResults = results.find((r) => r[0]?.tagName === tagName)
    if (!tagResults || tagResults.length === 0) return

    const tagRoot: Folder = {
      level: 0,
      sourcePath: tagName,
      key: tagName,
      tag: tagName,
      children: [],
    }

    const pathToTodosMap = new Map<string, TodoItem[]>()
    tagResults.forEach((todoItem) => {
      const filePath = todoItem.path
      if (!pathToTodosMap.has(filePath)) {
        pathToTodosMap.set(filePath, [])
      }
      pathToTodosMap.get(filePath)!.push(todoItem)
    })

    for (const [filePath, todos] of pathToTodosMap.entries()) {
      const relativePath = filePath.startsWith(workspace.cwd)
        ? filePath.slice(workspace.cwd.length + 1)
        : filePath

      const pathParts = relativePath.split('/')
      let currentNode = tagRoot
      let currentPath = workspace.cwd

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        currentPath = path.join(currentPath, part)

        let found = false
        for (const child of currentNode.children) {
          if (isParent(child) && child.sourcePath === currentPath) {
            currentNode = child as Folder
            found = true
            break
          }
        }

        if (!found) {
          const newNode: Folder = {
            level: currentNode.level + 1,
            sourcePath: currentPath,
            key: `[${tagName}] [${currentNode.level + 1}] ${currentPath}`,
            children: [],
          }
          currentNode.children.push(newNode)
          currentNode = newNode
        }
      }

      const fileNode: Folder = {
        level: currentNode.level + 1,
        sourcePath: filePath,
        key: `[${tagName}] [${currentNode.level + 1}] ${filePath}`,
        children: todos,
      }
      currentNode.children.push(fileNode)
    }

    function removeEmptyDirs(node: TodoNode): boolean {
      if (!isParent(node)) return true

      node.children = node.children.filter((child) => {
        if (isParent(child)) {
          return removeEmptyDirs(child)
        }
        return true
      })

      return node.children.length > 0
    }

    removeEmptyDirs(tagRoot)

    function compressSinglePathDirs(node: TodoNode): TodoNode {
      if (!isParent(node)) return node

      node.children = node.children.map((child) => {
        if (isParent(child)) {
          return compressSinglePathDirs(child)
        }
        return child
      })

      if (node.children.length === 1 && isParent(node.children[0])) {
        const child = node.children[0] as Folder

        const isIntermediateDir =
          (child.children.some((c) => isParent(c)) &&
            !existsSync(child.sourcePath)) ||
          (existsSync(child.sourcePath) &&
            !lstatSync(child.sourcePath).isFile())

        if (isIntermediateDir) {
          return {
            ...node,
            children: child.children,
          }
        }
      }

      return node
    }

    compressSinglePathDirs(tagRoot)

    function sortNodes(node: TodoNode) {
      if (isParent(node) && Array.isArray(node.children)) {
        node.children.sort((a, b) => {
          if (!a || !b) return 0

          const aIsFile = isParent(a) ? isNodeFile(a) : true
          const bIsFile = isParent(b) ? isNodeFile(b) : true

          if (!aIsFile && bIsFile) return -1
          if (aIsFile && !bIsFile) return 1

          const aPath = isParent(a) ? a.sourcePath || '' : ''
          const bPath = isParent(b) ? b.sourcePath || '' : ''

          return aPath.localeCompare(bPath)
        })

        node.children.forEach((child) => {
          if (child && isParent(child)) {
            sortNodes(child)
          }
        })
      }
    }

    function isNodeFile(node: Folder): boolean {
      if (node.children.some((child) => isParent(child))) {
        return false
      }

      if (existsSync(node.sourcePath)) {
        return lstatSync(node.sourcePath).isFile()
      }

      return true
    }

    sortNodes(tagRoot)

    if (tagRoot.children.length > 0) {
      parents.push(tagRoot)
    }
  })

  return parents
}
