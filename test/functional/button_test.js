"use strict";

let assert = require("assert");
let utils = require("./utils");
// let firefox = require("selenium-webdriver/firefox");
// let Context = firefox.Context;

// Mocha can't use arrow functions as sometimes we need to call `this` and
// using an arrow function alters the binding of `this`.
// Hence we disable prefer-arrow-callback here so that mocha/no-mocha-arrows can
// be applied nicely.

describe("Example Add-on Functional Tests", function() {
  // This gives Firefox time to start, and us a bit longer during some of the tests.
  this.timeout(10000);

  let driver;

  before(function() {
    let promise = utils.promiseSetupDriver();

    return promise.then(newDriver => {
      driver = newDriver;
      return Promise.resolve();
    });
  });

  after(function() {
    return driver.quit();
  });

  // XXX Add tests!
  it("should start and quit Firefox", function() {
    assert.ok(true);
  });
});
