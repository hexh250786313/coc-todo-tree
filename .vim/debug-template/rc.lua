vim.cmd([[
function! DebugCocTodoTree()
  :CocCommand coc-todo-tree.showTree
endfunction

set runtimepath^=~/workspace/coc-todo-tree
let g:coc_node_args = ["--nolazy", "--inspect=6989"]
]])
