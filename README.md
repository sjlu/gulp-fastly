# gulp-fastly

Helps with common deploy tasks with Fastly.

## Usage

```
npm install gulp-fastly --save
```

### Purging

Especially useful for if you have a static site or need to purge things
per deploy. Currently only allows full purges and not specific ones.

```
var Fastly = require('fastly')
gulp.task('deploy', function () {
  var fastly = new Fastly({
    apiKey: '',
    serviceId: ''
  })

  gulp.src('*')
    .pipe(fastly.purge())
})
```

### Upload VCLs

This allows you to upload a new Fastly version with a current VCL file.
Note that this will only upload the VCL if the md5 hash of the given
VCL file is different than what is already activated.

```
var Fastly = require('fastly')
gulp.task('deploy', function () {
  var fastly = new Fastly({
    apiKey: '',
    serviceId: ''
  })

  return gulp.src('./fastly.vcl')
    .pipe(fastly.deployVcl())
```

## License

MIT
