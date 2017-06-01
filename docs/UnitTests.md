# Unit Tests

The unit tests are based around [Mocha](http://mochajs.org/) and
[Sinon](http://sinonjs.org/). This gives a very simple mocking and test interface.

They are run using [Karma](https://karma-runner.github.io), which also provides
for code coverage.

# Test Files

The test files live in the `test/unit` directory. `karma.conf.js` controls the
loading and running of tests.

# Running the Tests

```shell
$ npm run test:karma
```

# Viewing coverage output

You can view the code output in the `build/coverage/` directory.
