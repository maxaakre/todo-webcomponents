// Config for `cem analyze`, which writes custom-elements.json.
export default {
  litelement: true,
  globs: ['src/**/ui-*.ts', 'src/internal/form-control.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts'],
  plugins: [
    {
      // The analyzer lists modules in file-system order, which varies
      // between runs. CI fails on any diff to the committed manifest, so
      // sort to make the output deterministic.
      name: 'sort-modules',
      packageLinkPhase({ customElementsManifest }) {
        customElementsManifest.modules.sort((a, b) => a.path.localeCompare(b.path));
      },
    },
  ],
};
