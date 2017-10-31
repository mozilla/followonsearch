"use strict";

/* import-globals-from head.js */
/* import-globals-from ../../add-on/webextension/background.js */

const TABID = 0;
const TABINFO = {};

describe("background.js", function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.stub(console, "log");
    sandbox.stub(browser.runtime, "sendMessage");
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe("handleUpdated", function() {
    describe("Non location changes", function() {
      it("should ignore non-location changes", function() {
        sandbox.stub(window, "processURL");

        handleUpdated(TABID, {audible: false}, TABINFO);

        sinon.assert.notCalled(window.processURL)
      });
    });

    describe("General Location requests", function() {
      describe("Matches", function() {
        it("should log telemetry for first SAP searches with matching codes", function() {
          let url = "https://www.google.com/search?q=test&ie=utf-8&oe=utf-8&client=firefox-b";
          handleUpdated(TABID, {url}, TABINFO);

          sinon.assert.calledOnce(browser.runtime.sendMessage);
          sinon.assert.calledWithExactly(browser.runtime.sendMessage, {
            name: kSaveTelemetryMsg,
            data: {
              code: "firefox-b",
              extra: null,
              sap: "google",
              type: "sap",
            }
          });
        });

        it("should log telemetry for follow-on SAP searches with matching codes", function() {
          let url = "https://www.google.com/search?q=test+yay&client=firefox-b";
          handleUpdated(TABID, {url}, TABINFO);

          sinon.assert.calledOnce(browser.runtime.sendMessage);
          sinon.assert.calledWithExactly(browser.runtime.sendMessage, {
            name: kSaveTelemetryMsg,
            data: {
              code: "firefox-b",
              extra: null,
              sap: "google",
              type: "follow-on",
            }
          });
        });

        it("should not send a telemetry for a first search reload", function() {
          let url = "https://www.google.com/search?q=test123&ie=utf-8&oe=utf-8&client=firefox-b";
          handleUpdated(TABID, {url}, TABINFO);

          sinon.assert.calledOnce(browser.runtime.sendMessage);
          sinon.assert.calledWithExactly(browser.runtime.sendMessage, {
            name: kSaveTelemetryMsg,
            data: {
              code: "firefox-b",
              extra: null,
              sap: "google",
              type: "sap",
            }
          });

          handleUpdated(TABID, {url}, TABINFO);

          // Check that it has still only been called once.
          sinon.assert.calledOnce(browser.runtime.sendMessage);
        });

        it("should log telemetry for non-core codes", function() {
          let url = "https://www.google.com/search?q=test&ie=utf-8&oe=utf-8&client=fake";
          handleUpdated(TABID, {url}, TABINFO);

          sinon.assert.calledOnce(browser.runtime.sendMessage);
          sinon.assert.calledWithExactly(browser.runtime.sendMessage, {
            name: kSaveTelemetryMsg,
            data: {
              code: "fake",
              extra: null,
              sap: "google",
              type: "sap",
            }
          });
        });
      });

      describe("Non-matches", function() {
        it("should not log telemetry for non-google domains", function() {
          let url = "https://www.randomsearch.com/search?q=test123&ie=utf-8&oe=utf-8&client=firefox-b";
          handleUpdated(TABID, {url}, TABINFO);

          sinon.assert.notCalled(browser.runtime.sendMessage);
        });

        it("should not log telemetry for non-queries", function() {
          let url = "https://www.google.com/search";
          handleUpdated(TABID, {url}, TABINFO);

          sinon.assert.notCalled(browser.runtime.sendMessage);
        });
      });
    });
  });
});
