import { configuration } from '@/constants'
import { Folder, TodoItem } from '@/tree'
import view from '@/view'

export function listFlatWithGroup(results: TodoItem[][]) {
  const parents: Folder[] = []
  const data = view.data as Map<
    string,
    {
      index: number
      tagName: string
    }[]
  >
  const configTags = configuration.tags.map((t) => t.tagName)
  if (data && Array.isArray(configTags) && configTags.length) {
    configTags.forEach((tName) => {
      const result = results.find((result) => result[0]?.tagName === tName)!
      if (result) {
        parents.push({
          level: 0,
          key: tName,
          tag: tName,
          sourcePath: tName,
          children: Array.from(data.keys())
            .reduce((total, sourcePath) => {
              const tags = data.get(sourcePath)
              const targets = tags!.filter((t) => t.tagName === tName)
              const next = {
                level: 1,
                sourcePath,
                key: `${tName}.${sourcePath}`,
                children: targets.map((target) => result[target.index]),
              }
              if (next.children.length) {
                total.push(next)
              }
              return total
            }, [] as Folder[])
            .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath)),
        })
      }
    })
  }
  return parents
}
