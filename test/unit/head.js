"use strict";

/* eslint-disable no-unused-vars */

var XPCOMUtils = {generateQI() {}};

Components.interfaces.nsIWebProgress = {};
Components.interfaces.nsIWebProgressListener = {LOCATION_CHANGE_SAME_DOCUMENT: 1};
Components.interfaces.nsIStandardURL = function(spec) {
  this._url = new URL(spec);
};
Components.interfaces.nsIStandardURL.prototype = {
  get host() { return this._url.host; },
  set host(hostname) { this._url.host = hostname; },
  get query() { return this._url.search; },
  set query(hostname) { this._url.search = hostname; },
  get spec() { return this._url.href; },
  set spec(hostname) { this._url.href = hostname; },
  get ref() { return this._url.hash; },
  set ref(hostname) { this._url.hash = hostname; },
  schemeIs(scheme) { return `${scheme}:` == this._url.protocol; },
};
Components.utils = {
  import() {},
  importGlobalProperties() {}
};

var sendAsyncMessage = () => {};
var addMessageListener = () => {};
var webProgressListener;

var docShell = {
  QueryInterface() {
    return {
      getInterface() {
        return {addProgressListener(listener) { webProgressListener = listener; }};
      },
    };
  },
};
