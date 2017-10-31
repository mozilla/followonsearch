"use strict";

/* eslint-disable no-unused-vars */

// XXX sinon-chrome doesn't seem to have what we need yet, so we'll have
// to mock the browser with our own for now.

var browser = {
  runtime: {
    sendMessage() {}
  },
  tabs: {
    onUpdated: {
      addListener() {}
    }
  },
}
