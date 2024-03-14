import { workspace } from 'coc.nvim'
import { readJsonSync } from 'fs-extra'
import { resolve } from 'path'
import { ValueType } from './helpers'

export interface IIcon {
  text: string
  hlGroup: string
}

export interface TodoTreeConfigurationTagsItem {
  regex: string
  tagName: string
  icon?: IIcon
}

const _pkg = readJsonSync(resolve(__dirname, '../package.json'))
const _viewModes = _pkg.contributes.configuration.properties[
  'todo-tree.defaultView'
].enum as ['tagsOnly', 'flat', 'tree']
const _extensionName = _pkg.name
const _configuration = workspace
  .getConfiguration()
  .get<TodoTreeConfiguration>('todo-tree')
const _configurationProperties = _pkg.contributes.configuration.properties
const _defaultConfiguration: TodoTreeConfiguration = Object.keys(
  _configurationProperties
).reduce((obj: any, key) => {
  obj[key.replace(new RegExp(`${_extensionName.replace('coc-', '')}\\.`), '')] =
    _configurationProperties[key].default
  return obj
}, {} as TodoTreeConfiguration)

const nextConfig = {} as TodoTreeConfiguration

if (_configuration && _configuration.tags) {
  nextConfig.tags = _configuration.tags.filter(
    (item, index, self) =>
      self.findIndex((t) => t.tagName === item.tagName) === index
  )
}

export interface TodoTreeConfiguration {
  enabled: boolean
  tags: Array<TodoTreeConfigurationTagsItem>
  defaultView: ValueType<typeof _viewModes>
  groupByTag: boolean
  maxGrepColumns: number
  maxPreviewWidth: number
  customCommand?: string
  folderIcon?: IIcon
  fileIcon?: IIcon
  parentNodeHighlightEnabled: boolean
  groupTagIconHighlight: string
  invokeKey: string
  toggleGroupByTagKey: string
  togglePreviewKey: string
  refreshItemsKey: string
  switchViewKey: string
  autoPreview: boolean
  previewWinConfig: {
    border: boolean
    rounded: boolean
    highlight: string
    borderhighlight: string
    winblend: number
  }
  filterFilesRegex: Array<string>
}

export const viewModes = _viewModes
export const extensionName = _extensionName as string
export const defaultConfiguration = _defaultConfiguration
export const configuration = { ..._configuration!, ...nextConfig }
