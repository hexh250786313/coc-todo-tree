import { viewModes } from '@/constants'
import { TodoItem } from '@/tree'
import view from '@/view'
import { listFlatWithGroup, listFlatWithoutGroup } from './flat'
import { listTagsOnlyWithGroup, listTagsOnlyWithoutGroup } from './tags-only'
import { listTreeWithGroup, listTreeWithoutGroup } from './tree'

export function listIt(pending: TodoItem[][]) {
  if (view.groupByTag) {
    switch (view.mode) {
      case viewModes[0]:
        return listTagsOnlyWithGroup(pending)
      case viewModes[2]:
        return listTreeWithGroup(pending)
      default:
      case viewModes[1]:
        return listFlatWithGroup(pending)
    }
  } else {
    switch (view.mode) {
      case viewModes[0]:
        return listTagsOnlyWithoutGroup(pending)
      case viewModes[2]:
        return listTreeWithoutGroup(pending)
      default:
      case viewModes[1]:
        return listFlatWithoutGroup(pending)
    }
  }
}
