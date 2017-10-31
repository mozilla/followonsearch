const reporters = ["mocha", "coverage"];
if (process.env.COVERALLS_REPO_TOKEN) {
  reporters.push("coveralls");
}

function isDebug(argument) {
  return argument === "--debug";
}

let sourcePreprocessors = {"add-on/webextension/*.js": ["coverage"]};

if (process.argv.some(isDebug)) {
  sourcePreprocessors = {};
}

module.exports = function(config) {
  config.set({
    singleRun: true,
    browsers: ["Firefox"],
    frameworks: ["mocha"],
    reporters,
    coverageReporter: {
      dir: "build/coverage",
      reporters: [
        {
          type: "lcov",
          subdir: "lcov",
        },
        {
          type: "html",
          subdir(browser) {
            // normalization process to keep a consistent browser name
            // across different OS
            return browser.toLowerCase().split(/[ /-]/)[0];
          },
        }, {type: "text-summary"},
      ],
    },
    files: [
      "node_modules/sinon/pkg/sinon.js",
      "test/unit/head.js",
      "add-on/content/followonsearch-fs.js",
      "test/unit/*.test.js",
    ],
    preprocessors: sourcePreprocessors,
    plugins: [
      "karma-coveralls",
      "karma-coverage",
      "karma-firefox-launcher",
      "karma-mocha",
      "karma-mocha-reporter",
    ],
  });
};
