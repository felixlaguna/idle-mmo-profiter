export default {
  plugins: {
    autoprefixer: {
      // Target browsers that need prefixes
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'Firefox ESR',
        'not dead',
        'not IE 11',
        'iOS >= 12',
        'Safari >= 12',
        'Chrome >= 90',
        'Firefox >= 88',
        'Edge >= 90'
      ],
      // Grid prefixes for IE/Edge
      grid: 'autoplace'
    }
  }
}
