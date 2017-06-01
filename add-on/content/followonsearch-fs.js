/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env mozilla/frame-script */

"use strict";

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const kExtensionID = "followonsearch@mozilla.com";
const kSaveTelemetryMsg = `${kExtensionID}:save-telemetry`;

/**
 * A map of search domains with their expected codes.
 */
let searchDomains = {
  "search.yahoo.co.jp": {
    "search": "p",
    "followOnSearch": "ai",
    "prefix": "fr",
    "codes": ["mozff"],
    "sap": "yahoo",
  },
  "www.bing.com": {
    "search": "q",
    "prefix": "pc",
    "reportPrefix": "form",
    "codes": ["MOZI"],
    "sap": "bing",
  },
};

// The yahoo domains to watch for.
const yahooDomains = new Set([
  "search.yahoo.com", "ca.search.yahoo.com", "hk.search.yahoo.com",
  "tw.search.yahoo.com",
]);

// Add Yahoo domains to search domains
for (let domain of yahooDomains) {
  searchDomains[domain] = {
    "search": "p",
    "followOnSearch": "fr2",
    "prefix": "hspart",
    "reportPrefix": "hsimp",
    "codes": ["mozilla"],
    "sap": "yahoo",
  };
}

const yahooLegacyDomains = new Set([
  "no.search.yahoo.com", "ar.search.yahoo.com", "br.search.yahoo.com",
  "ch.search.yahoo.com", "cl.search.yahoo.com", "de.search.yahoo.com",
  "uk.search.yahoo.com", "es.search.yahoo.com", "espanol.search.yahoo.com",
  "fi.search.yahoo.com", "fr.search.yahoo.com", "nl.search.yahoo.com",
  "id.search.yahoo.com", "in.search.yahoo.com", "it.search.yahoo.com",
  "mx.search.yahoo.com", "se.search.yahoo.com", "sg.search.yahoo.com",
]);

// Add Yahoo legacy domains to search domains
for (let domain of yahooLegacyDomains) {
  searchDomains[domain] = {
    "search": "p",
    "followOnSearch": "fr2",
    "prefix": "fr",
    "codes": ["moz35"],
    "sap": "yahoo",
  };
}

const googleDomains = new Set([
  "www.google.com", "www.google.ac", "www.google.ad", "www.google.ae",
  "www.google.com.af", "www.google.com.ag", "www.google.com.ai",
  "www.google.al", "www.google.am", "www.google.co.ao", "www.google.com.ar",
  "www.google.as", "www.google.at", "www.google.com.au", "www.google.az",
  "www.google.ba", "www.google.com.bd", "www.google.be", "www.google.bf",
  "www.google.bg", "www.google.com.bh", "www.google.bi", "www.google.bj",
  "www.google.com.bn", "www.google.com.bo", "www.google.com.br",
  "www.google.bs", "www.google.bt", "www.google.co.bw", "www.google.by",
  "www.google.com.bz", "www.google.ca", "www.google.com.kh", "www.google.cc",
  "www.google.cd", "www.google.cf", "www.google.cat", "www.google.cg",
  "www.google.ch", "www.google.ci", "www.google.co.ck", "www.google.cl",
  "www.google.cm", "www.google.cn", "www.google.com.co", "www.google.co.cr",
  "www.google.com.cu", "www.google.cv", "www.google.cx", "www.google.com.cy",
  "www.google.cz", "www.google.de", "www.google.dj", "www.google.dk",
  "www.google.dm", "www.google.com.do", "www.google.dz", "www.google.com.ec",
  "www.google.ee", "www.google.com.eg", "www.google.es", "www.google.com.et",
  "www.google.eu", "www.google.fi", "www.google.com.fj", "www.google.fm",
  "www.google.fr", "www.google.ga", "www.google.ge", "www.google.gf",
  "www.google.gg", "www.google.com.gh", "www.google.com.gi", "www.google.gl",
  "www.google.gm", "www.google.gp", "www.google.gr", "www.google.com.gt",
  "www.google.gy", "www.google.com.hk", "www.google.hn", "www.google.hr",
  "www.google.ht", "www.google.hu", "www.google.co.id", "www.google.iq",
  "www.google.ie", "www.google.co.il", "www.google.im", "www.google.co.in",
  "www.google.io", "www.google.is", "www.google.it", "www.google.je",
  "www.google.com.jm", "www.google.jo", "www.google.co.jp", "www.google.co.ke",
  "www.google.ki", "www.google.kg", "www.google.co.kr", "www.google.com.kw",
  "www.google.kz", "www.google.la", "www.google.com.lb", "www.google.com.lc",
  "www.google.li", "www.google.lk", "www.google.co.ls", "www.google.lt",
  "www.google.lu", "www.google.lv", "www.google.com.ly", "www.google.co.ma",
  "www.google.md", "www.google.me", "www.google.mg", "www.google.mk",
  "www.google.ml", "www.google.com.mm", "www.google.mn", "www.google.ms",
  "www.google.com.mt", "www.google.mu", "www.google.mv", "www.google.mw",
  "www.google.com.mx", "www.google.com.my", "www.google.co.mz",
  "www.google.com.na", "www.google.ne", "www.google.nf", "www.google.com.ng",
  "www.google.com.ni", "www.google.nl", "www.google.no", "www.google.com.np",
  "www.google.nr", "www.google.nu", "www.google.co.nz", "www.google.com.om",
  "www.google.com.pk", "www.google.com.pa", "www.google.com.pe",
  "www.google.com.ph", "www.google.pl", "www.google.com.pg", "www.google.pn",
  "www.google.com.pr", "www.google.ps", "www.google.pt", "www.google.com.py",
  "www.google.com.qa", "www.google.ro", "www.google.rs", "www.google.ru",
  "www.google.rw", "www.google.com.sa", "www.google.com.sb", "www.google.sc",
  "www.google.se", "www.google.com.sg", "www.google.sh", "www.google.si",
  "www.google.sk", "www.google.com.sl", "www.google.sn", "www.google.sm",
  "www.google.so", "www.google.st", "www.google.sr", "www.google.com.sv",
  "www.google.td", "www.google.tg", "www.google.co.th", "www.google.com.tj",
  "www.google.tk", "www.google.tl", "www.google.tm", "www.google.to",
  "www.google.tn", "www.google.com.tr", "www.google.tt", "www.google.com.tw",
  "www.google.co.tz", "www.google.com.ua", "www.google.co.ug",
  "www.google.co.uk", "www.google.us", "www.google.com.uy", "www.google.co.uz",
  "www.google.com.vc", "www.google.co.ve", "www.google.vg", "www.google.co.vi",
  "www.google.com.vn", "www.google.vu", "www.google.ws", "www.google.co.za",
  "www.google.co.zm", "www.google.co.zw",
]);

// Add Google domains to search domains
for (let domain of googleDomains) {
  searchDomains[domain] = {
    "search": "q",
    "prefix": "client",
    "codes": ["firefox-b-ab", "firefox-b"],
    "sap": "google",
  };
}

/**
 * Used for debugging to log messages.
 *
 * @param {String} message The message to log.
 */
function log(message) {
  // console.log(message);
}

/**
 * A web progress listener to monitor for when googleDomains are loaded.
 */
var webProgressListener = {
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference]),
  onLocationChange(aWebProgress, aRequest, aLocation, aFlags)
  {
    try {
      if (!aWebProgress.isTopLevel ||
          !(aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT) ||
          !(aLocation instanceof Ci.nsIStandardURL) ||
          !(googleDomains.has(aLocation.host)) ||
          (!aLocation.query && !aLocation.ref) ||
          aLocation.spec == gLastSearch) {
        return;
      }
      let domainInfo = searchDomains[aLocation.host];

      let queries = parseUrlQueryString(aLocation.query);
      if (aLocation.ref) {
        // Google puts queries after the # sign, and
        // that indicates a followon search
        queries = parseUrlQueryString(aLocation.ref, queries);
      }
      let code = queries[domainInfo.prefix];
      if (queries[domainInfo.search]) {
        if (domainInfo.codes.includes(code)) {
          if (aLocation.ref) {
            log(`${aLocation.host} search with code ${code} - Follow on`);
            sendSaveTelemetryMsg(code, domainInfo.sap, "follow-on");
          } else {
            log(`${aLocation.host} search with code ${code} - First search via Firefox`);
            sendSaveTelemetryMsg(code, domainInfo.sap, "sap");
          }
        }
        gLastSearch = aLocation.spec;
      }
    } catch (e) {
      console.error(e);
    }
  },
};

/**
 * Parses a URL query string into separate parts.
 *
 * @param {String} queryString The string to parse.
 * @param {Object} [params] An optional object to append the parameters to.
 * @return {Object} An object containing the query keys and values.
 */
function parseUrlQueryString(queryString, params = {}) {
  var queries = queryString.replace(/^\?/, "").split("&");

  for (var i in queries) {
    var kvp = queries[i].split("=");
    params[kvp[0]] = kvp[1];
  }

  return params;
}

/**
 * Parses a cookie string into separate parts.
 *
 * @param {String} cookieString The string to parse.
 * @param {Object} [params] An optional object to append the parameters to.
 * @return {Object} An object containing the query keys and values.
 */
function parseCookies(cookieString, params = {}) {
  var cookies = cookieString.split(/;\s*/);

  for (var i in cookies) {
    var kvp = cookies[i].split(/=(.+)/);
    params[kvp[0]] = kvp[1];
  }

  return params;
}

// Hack to handle the most common reload case.
// If lastSearch is the same as the current URL, ignore the search.
// This also prevents us from handling reloads with hashes twice
let gLastSearch = null;

/**
 * Page load listener to handle loads for search domains.
 *
 * @param {Object} event The page load event.
 */
function onPageLoad(event) {
  var doc = event.target;
  var win = doc.defaultView;
  if (win != win.top) {
    return;
  }
  var uri = doc.documentURIObject;
  if (!(uri instanceof Ci.nsIStandardURL) ||
      (!uri.schemeIs("http") && !uri.schemeIs("https")) ||
      !(uri.host in searchDomains) ||
      (!doc.location.search && !doc.location.hasRef) ||
      uri.spec == gLastSearch) {
    return;
  }
  let domainInfo = searchDomains[uri.host];

  var queries = parseUrlQueryString(doc.location.search);
  let code = queries[domainInfo.prefix];
  if (queries[domainInfo.search]) {
    if (domainInfo.codes.includes(code)) {
      if (domainInfo.reportPrefix &&
          queries[domainInfo.reportPrefix]) {
        code = queries[domainInfo.reportPrefix];
      }
      if (queries[domainInfo.followOnSearch]) {
        log(`${uri.host} search with code ${code} - Follow on`);
        sendSaveTelemetryMsg(code, domainInfo.sap, "follow-on");
      } else {
        log(`${uri.host} search with code ${code} - First search via Firefox`);
        sendSaveTelemetryMsg(code, domainInfo.sap, "sap");
      }
      /**
       * We have to special case bing.com because follow on
       * searches are marked with a cookies, not a URL param.
       * This means we will overcount bing.
       * They also mark all follow-on searches with form=QBRE
       */
    } else if (uri.host == "www.bing.com") {
      if (queries.form == "QBRE") {
        if (parseCookies(doc.cookie).SRCHS == "PC=MOZI") {
          log(`${uri.host} search with code MOZI - Follow on`);
          sendSaveTelemetryMsg("MOZI", domainInfo.sap, "follow-on");
        }
      } else if (parseCookies(doc.cookie).SRCHS == "PC=MOZI") {
        // We know this isn't a true first search because it doesn't
        // have one of the codes from the Firefox UI.
        log(`${uri.host} search with code MOZI - Follow on`);
        sendSaveTelemetryMsg("MOZI", domainInfo.sap, "follow-on");
      }
    }
    gLastSearch = uri.spec;
  }
}

/**
 * Sends a message to the process that added this script to tell it to save
 * telemetry.
 *
 * @param {String} code The codes used for the search engine.
 * @param {String} sap The SAP code.
 * @param {String} type The type of search (sap/follow-on).
 */
function sendSaveTelemetryMsg(code, sap, type) {
  sendAsyncMessage(kSaveTelemetryMsg, {
    code,
    sap,
    type,
  });
}

addEventListener("DOMContentLoaded", onPageLoad, false);
docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebProgress)
        .addProgressListener(webProgressListener, Ci.nsIWebProgress.NOTIFY_LOCATION);

addEventListener("unload", event => {
  if (event.target instanceof Ci.nsIContentFrameMessageManager) {
    removeEventListener("DOMContentLoaded", onPageLoad, false);
  }
}, false);
