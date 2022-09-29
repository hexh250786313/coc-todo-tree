# coc-todo-tree

Todo tree integration of [coc.nvim](https://github.com/neoclide/coc.nvim)

Inspired by [vscode-todo-tree](https://github.com/Gruntfuggly/todo-tree)

## Install

You need to have coc.nvim installed for this extension to work

```
:CocInstall coc-todo-tree
```

## Feature

- Using coc-tree (for tree view) to list all tags like @todo / FIXME in your workspace
- Using [ripgrep](https://github.com/BurntSushi/ripgrep) by default
- Custom your tag name / icon / highlight / regex
- View control: Just like [vscode-todo-tree](https://github.com/Gruntfuggly/todo-tree), you can switch between three modes: `tags-only` / `flat` / `tree-view` by press uppercase `C`. And group the tags by press lower case letters `c`

## Config

see: https://github.com/hexh250786313/coc-todo-tree/blob/master/.vim/coc-settings.json

## Todo

- [ ] filter
- [ ] file change watcher
