vim.cmd(
  [[
if match(&runtimepath, 'Defx') != -1
  call defx#custom#option('_', {
    \   'show_ignored_files': 0,
    \   'ignored_files': '.*,node_modules,Dockerfile*,yarn.lock,lib,build,dist,esbuild.js,package.json,tsconfig.json,yarn.lock,LICENSE,jest.config.js',
    \ })
endif
]]
)
