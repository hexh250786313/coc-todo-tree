let s:key = 'todo-tree-preview'
let s:todo_tree_preview_bufnr = 0

function! coc_todo_tree#preview(config) abort
  let view_id = get(w:, 'cocViewId', '')
  if view_id !=# 'Todo'
    return
  endif
  let wininfo = get(getwininfo(win_getid()), 0, v:null)
  if empty(wininfo)
    return
  endif
  let border = get(a:config, 'border', v:true)
  let th = &lines - &cmdheight - 2
  let height = len(a:config['lines'])
  let to_left = &columns - wininfo['wincol'] - wininfo['width'] < wininfo['wincol']
  let lines = a:config['lines']
  let content_width = max(map(copy(lines), 'strdisplaywidth(v:val)'))
  let width = min([content_width, a:config['maxWidth'], to_left ? wininfo['wincol'] - 3 : &columns - wininfo['wincol'] - wininfo['width']])
  let filetype = a:config['filetype']
  let cursor_row = coc#cursor#screen_pos()[0]
  let config = {
      \ 'relative': 'editor',
      \ 'row': cursor_row - 1 + height < th ? cursor_row - (border ? 1 : 0) : th - height - (border ? 1 : -1),
      \ 'col': to_left ? wininfo['wincol'] - 4 - width : wininfo['wincol'] + wininfo['width'],
      \ 'width': width,
      \ 'height': height,
      \ 'lines': lines,
      \ 'border': border ? [1,1,1,1] : v:null,
      \ 'rounded': get(a:config, 'rounded', 1) ? 1 : 0,
      \ 'winblend': a:config['winblend'],
      \ 'highlight': a:config['highlight'],
      \ 'borderhighlight': a:config['borderhighlight'],
      \ }
  let winid = coc#float#get_float_by_kind(s:key)
  let result = coc#float#create_float_win(winid, s:todo_tree_preview_bufnr, config)
  if empty(result)
    return v:null
  endif
  call setwinvar(result[0], 'kind', s:key)
  let s:todo_tree_preview_bufnr = result[1]
  if !empty(filetype)
    call win_execute(result[0], 'setfiletype '.filetype)
  endif
  return result[1]
endfunction

function! coc_todo_tree#close_preview() abort
  let winid = coc#float#get_float_by_kind(s:key)
  if winid
    call coc#float#close(winid)
  endif
endfunction
