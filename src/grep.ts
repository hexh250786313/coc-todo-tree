import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import readline from 'readline'
import { workspace } from 'coc.nvim'
import { showErrorMessage } from './helpers'
import view from './view'
import { configuration } from './constants'

export interface GrepMatch {
  fsPath: string
  line: number
  column: number
  detail: string
  shortText: string
  tagName: string
  index?: number
}

const maxGrepColumns = configuration.maxGrepColumns
const maxPreviewWidth = configuration.maxPreviewWidth || maxGrepColumns
const customCommand = configuration.customCommand

interface GrepOptions {
  tagName: string
  regex: string
  maxBuffer?: number
}

class Grep {
  private cwd = workspace.cwd
  private options: GrepOptions
  private currentProcess: ChildProcessWithoutNullStreams | null = null
  public grepString: string
  public resArr: ReturnType<typeof getRes>[] = []

  constructor(options: GrepOptions) {
    this.options = options
    this.grepString = this.genGrepString()
  }

  private genGrepString() {
    if (this.options.regex) {
      return (
        (customCommand ||
          `rg --no-messages --vimgrep -H --column --max-columns ${maxGrepColumns} --max-columns-preview --line-number --color never -e`) +
        ` ${this.options.regex}` +
        ` -- ${workspace.cwd}`
      )
    }
    return 'echo ""'
  }

  public handleGrepCancel() {
    if (this.currentProcess && !this.currentProcess.killed) {
      this.currentProcess.kill()
      return this.resArr
    }
    return []
  }

  public grep: () => Promise<Array<ReturnType<typeof getRes>>> = () => {
    return new Promise((resolve) => {
      const cmds = this.grepString.split(' ')
      this.currentProcess = spawn(cmds[0], cmds.slice(1), {
        cwd: this.cwd,
      })

      this.currentProcess.on('error', (e) => {
        showErrorMessage(e.message)
      })

      this.currentProcess.stderr.on('data', (chunk) => {
        showErrorMessage(chunk.toString('utf8'))
      })

      const rl = readline.createInterface(this.currentProcess.stdout)

      rl.on('line', (line: string) => {
        if (line) {
          const res = getRes(line)
          if (res.shortText && testFilePath(res.fsPath)) {
            res.tagName = this.options.tagName
            res.index = this.resArr.length
            view.generateView(res)
            this.resArr.push(res)
          }
        }
      })

      rl.on('close', () => {
        resolve(this.resArr)
        if (this.currentProcess && !this.currentProcess.killed) {
          this.currentProcess.kill()
        }
      })
    })
  }
}

export default Grep

function testFilePath(filePath: string): boolean {
  const rs = configuration.filterFilesRegex
  if (Array.isArray(rs)) {
    return !rs.some((r) => {
      const reg = new RegExp(r)
      return reg.test(filePath)
    })
  }
  return true
}

function getRes(matchText: string): GrepMatch {
  const regex = RegExp(/^(?<file>.*):(?<line>\d+):(?<column>\d+):(?<tag>.*)/)
  let fsPath: string
  let line: number
  let column: number
  let detail: string

  const regMatch = regex.exec(matchText)
  if (regMatch && regMatch.groups) {
    fsPath = regMatch.groups.file
    line = parseInt(regMatch.groups.line)
    column = parseInt(regMatch.groups.column)
    detail = regMatch.groups.tag
  } else {
    fsPath = ''

    if (matchText.length > 1 && matchText[1] === ':') {
      fsPath = matchText.substring(0, 2)
      matchText = matchText.substring(2)
    }
    const parts = matchText.split(':')
    const hasColumn = parts.length === 4
    fsPath += parts.shift()
    line = parseInt(parts.shift() ?? '')
    if (hasColumn === true) {
      column = parseInt(parts.shift() ?? '')
    } else {
      column = 1
    }
    detail = parts.join(':')
  }
  // line = line - 1
  // column = column - 1
  const shortTextArr: string[] = []
  // logger.warn(detail.length.toString())
  // String function causes memory leak
  detail = Array.from(
    { length: Math.min(maxPreviewWidth, detail.length, maxGrepColumns) },
    // (_, i) => i + column
    (_, i) => i + (column - 1)
  )
    .map((i, index) => {
      if (index < 40) shortTextArr.push(detail[i])
      return detail[i]
    })
    .join('')
  const shortText = shortTextArr.join('')
  return {
    tagName: '',
    detail,
    shortText: /\[\.\.\.\u0020\d+\u0020more\u0020matches\]/.test(detail)
      ? ''
      : shortText,
    line,
    fsPath,
    column,
  }
}
