# Mochitests

[Mochitest](https://developer.mozilla.org/en-US/docs/Mozilla/Browser_chrome_tests)
is a special kind of framework designed to run in the browser window.

# Test Files

The test files live in the `test/mochitest/` directory.

# Running the Tests

You have to first export repository to a mozilla-central based repository, and
then run the tests from there.

See [exporting to mozilla-central](Exporting.md) for how to export.

```shell
$ ./mach build
$ ./mach mochitest browser/extensions/followonsearch/
```
