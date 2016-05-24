# gulp-fastly

Helps with invalidating Fastly caches especially if you've set up a static site.

## Usage

```
npm install gulp-fastly --save
```

```
var fastly = require('fastly')
gulp.task('deploy', function () {
  fastlyOpts = {
    apiKey: '',
    serviceId: ''
  }

  gulp.src('*')
    .pipe(fastly(fastlyOpts))
})
```

## License

MIT
