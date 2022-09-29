import { removeCWD } from '@/helpers'
import { isParent, TodoItem } from '@/tree'

export function listTagsOnlyWithoutGroup(results: TodoItem[][]) {
  const items: TodoItem[] = results.reduce((total, current) => {
    total.push(
      ...current.map((i) => {
        if (!isParent(i)) {
          return {
            ...i,
            extra: `${removeCWD(i.path)}: ${i.range.start.line}, ${
              i.range.start.character
            }`,
          }
        }
        return i
      })
    )
    return total
  }, [] as TodoItem[])
  return items
}
