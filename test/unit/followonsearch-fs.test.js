"use strict";

/* import-globals-from head.js */
/* import-globals-from ../../add-on/content/followonsearch-fs.js */

describe("followonsearch-fs.js", function() {
  let sandbox;
  let location;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.stub(console, "log");
    sendAsyncMessage = sandbox.spy();

    // Set up a basic location object for use in tests.
    // eslint-disable-next-line new-cap
    location = new Components.interfaces.nsIStandardURL(
      "https://www.google.com?q=test&ie=utf-8&oe=utf-8&client=firefox-b");
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe("webProgressListener", function() {
    it("should log an error for unsupported cases", function() {
      sandbox.stub(console, "error");

      webProgressListener.onLocationChange(undefined, null, location,
        Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

      sinon.assert.calledOnce(console.error);
    });

    describe("General Location requests", function() {
      describe("Matches", function() {
        it("should log telemetry for first SAP searches with matching codes", function() {
          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.calledOnce(sendAsyncMessage);
          sinon.assert.calledWithExactly(sendAsyncMessage, kSaveTelemetryMsg, {
            code: "firefox-b",
            sap: "google",
            type: "sap",
          });
        });

        it("should log telemetry for follow-on SAP searches with matching codes", function() {
          location.ref = "#q=test+yay";

          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.calledOnce(sendAsyncMessage);
          sinon.assert.calledWithExactly(sendAsyncMessage, kSaveTelemetryMsg, {
            code: "firefox-b",
            sap: "google",
            type: "follow-on",
          });
        });

        it("should not send a telemetry for a first search reload", function() {
          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.calledOnce(sendAsyncMessage);
          sinon.assert.calledWithExactly(sendAsyncMessage, kSaveTelemetryMsg, {
            code: "firefox-b",
            sap: "google",
            type: "sap",
          });

          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          // Check that it has still only been called once.
          sinon.assert.calledOnce(sendAsyncMessage);
        });
      });

      describe("Non-matches", function() {
        it("should not log telemetry for a non-top-level request", function() {
          webProgressListener.onLocationChange({isTopLevel: false}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.notCalled(sendAsyncMessage);
        });

        it("should not log telemetry for an error page", function() {
          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_ERROR_PAGE);

          sinon.assert.notCalled(sendAsyncMessage);
        });

        it("should not log telemetry for non-google domains", function() {
          location.host = "www.yahoo.com";

          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.notCalled(sendAsyncMessage);
        });

        it("should not log telemetry for non-queries", function() {
          location.query = "";

          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.notCalled(sendAsyncMessage);
        });

        it("should not log telemetry for non-search queries", function() {
          location.query = "?fake=test&ie=utf-8&oe=utf-8";

          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.notCalled(sendAsyncMessage);
        });

        it("should not log telemetry for non-matching codes", function() {
          location.query = "?q=test&ie=utf-8&oe=utf-8&client=fake";

          webProgressListener.onLocationChange({isTopLevel: true}, null, location,
            Components.interfaces.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);

          sinon.assert.notCalled(sendAsyncMessage);
        });
      });
    });
  });
});
