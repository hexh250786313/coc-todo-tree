import { Folder, TodoItem } from '@/tree'
import view from '@/view'

export function listFlatWithoutGroup(results: TodoItem[][]) {
  const parents: Folder[] = []
  const data = view.data as Map<
    string,
    {
      index: number
      tagName: string
    }[]
  >
  if (data) {
    data.forEach((tags, path) => {
      parents.push({
        level: 0,
        key: path,
        sourcePath: path,
        children: tags.reduce((total, tag) => {
          const result = results.find((result) => {
            return result[0]?.tagName === tag.tagName
          })
          if (result) {
            total.push(result![tag.index])
          }
          return total
        }, [] as TodoItem[]),
        // .sort(
        // (a, b) =>
        // a.range.start.line - b.range.start.line ||
        // a.range.start.character - b.range.start.character
        // ),
      })
    })
  }
  return parents.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))
}
