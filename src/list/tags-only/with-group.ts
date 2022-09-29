import { removeCWD } from '@/helpers'
import { Folder, isParent, TodoItem } from '@/tree'

export function listTagsOnlyWithGroup(results: TodoItem[][]) {
  const parents: Folder[] = results.reduce((total, current) => {
    if (Array.isArray(current) && current.length > 0) {
      const tagName = current[0].tagName
      total.push({
        level: 0,
        tag: tagName,
        key: tagName,
        sourcePath: tagName,
        children: current.map((i) => {
          if (!isParent(i)) {
            return {
              ...i,
              extra: `${removeCWD(i.path)}: ${i.range.start.line}, ${
                i.range.start.character
              }`,
            }
          }
          return i
        }),
      })
    }
    return total
  }, [] as Folder[])
  return parents
}
