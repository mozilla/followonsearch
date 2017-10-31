/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global browser */

"use strict";

const kExtensionID = "followonsearch@mozilla.com";
const kSaveTelemetryMsg = `${kExtensionID}:save-telemetry`;

const kLastSearchQueueDepth = 10;

// Hack to handle the most common reload/back/forward case.
// If gLastSearchQueue includes the current URL, ignore the search.
// This also prevents us from handling reloads with hashes twice
let gLastSearchQueue = [];
gLastSearchQueue.push = function(...args) {
  if (this.length >= kLastSearchQueueDepth) {
    this.shift();
  }
  return Array.prototype.push.apply(this, args);
};

let gSearchingGoogle = false;

/**
 * A map of search domains with their expected codes.
 */
let searchDomains = [{
  "domains": [ "search.yahoo.co.jp" ],
  "search": "p",
  "followOnSearch": "ai",
  "prefix": ["fr"],
  "codes": ["mozff"],
  "sap": "yahoo",
}, {
  "domains": [ "www.bing.com" ],
  "search": "q",
  "prefix": ["pc"],
  "reportPrefix": "form",
  "codes": ["MOZI", "MOZD", "MZSL01", "MZSL02", "MZSL03", "MOZ2"],
  "sap": "bing",
}, {
  // The Yahoo domains to watch for.
  "domains": [
    "search.yahoo.com", "ca.search.yahoo.com", "hk.search.yahoo.com",
    "tw.search.yahoo.com", "mozilla.search.yahoo.com", "us.search.yahoo.com",
    "no.search.yahoo.com", "ar.search.yahoo.com", "br.search.yahoo.com",
    "ch.search.yahoo.com", "cl.search.yahoo.com", "de.search.yahoo.com",
    "uk.search.yahoo.com", "es.search.yahoo.com", "espanol.search.yahoo.com",
    "fi.search.yahoo.com", "fr.search.yahoo.com", "nl.search.yahoo.com",
    "id.search.yahoo.com", "in.search.yahoo.com", "it.search.yahoo.com",
    "mx.search.yahoo.com", "se.search.yahoo.com", "sg.search.yahoo.com",
  ],
  "search": "p",
  "followOnSearch": "fr2",
  "prefix": ["hspart", "fr"],
  "reportPrefix": "hsimp",
  "codes": ["mozilla", "moz35"],
  "sap": "yahoo",
}, {
  // The Google domains.
  "domains": [
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
  ],
  "search": "q",
  "prefix": ["client"],
  "followOnSearch": "oq",
  "codes": ["firefox-b-ab", "firefox-b"],
  "sap": "google",
}];

function getSearchDomainCodes(host) {
  for (let domainInfo of searchDomains) {
    if (domainInfo.domains.includes(host)) {
      return domainInfo;
    }
  }
  return null;
}

/**
 * Sends a message to the process that added this script to tell it to save
 * telemetry.
 *
 * @param {String} code The codes used for the search engine.
 * @param {String} sap The SAP code.
 * @param {String} type The type of search (sap/follow-on).
 * @param {String} extra Any additional parameters (Optional)
 */
function sendSaveTelemetryMsg(code, sap, type, extra) {
  browser.runtime.sendMessage({
    name: kSaveTelemetryMsg,
    data: {
      code,
      sap,
      type,
      extra
    }
  });
}

function processURL(location) {
  if (!location.search) {
    gSearchingGoogle = false;
    return;
  }
  if (gLastSearchQueue.includes(location.href)) {
    // If it's a recent search, just return. We
    // don't reset searchingGoogle though because
    // we might still be doing that.
    return;
  }
  let domainInfo = getSearchDomainCodes(location.hostname);
  if (!domainInfo) {
    gLastSearchQueue.push(location.href);
    return;
  }

  let queries = new URLSearchParams(location.search);
  // Yahoo has switched to Unified search so we can get
  // different codes on the same domain. Hack for now
  // to allow two different prefixes for codes
  let code = queries.get(domainInfo.prefix[0]);
  if (!code && domainInfo.prefix.length > 1) {
    code = queries.get(domainInfo.prefix[1]);
  }
  // Special case Google so we can track searches
  // without codes from the browser.
  if (domainInfo.sap == "google") {
    if (location.pathname.startsWith("/search")) {
      gLastSearchQueue.push(location.href);
      // Our engine currently sends oe and ie - no one else does
      if (queries.get("oe") && queries.get("ie")) {
        sendSaveTelemetryMsg(code ? code : "none", code ? domainInfo.sap : "google-nocodes", "sap");
        gSearchingGoogle = true;
      } else {
        // The tbm value is the specific type of search (Books, Images, News, etc).
        // These are referred to as vertical searches.
        let tbm = queries.get("tbm");
        if (gSearchingGoogle) {
          sendSaveTelemetryMsg(code ? code : "none", code ? domainInfo.sap : "google-nocodes", "follow-on", tbm ? `vertical-${tbm}` : null);
        } else if (code) {
          // Trying to do the right thing for back button to existing entries
          sendSaveTelemetryMsg(code, domainInfo.sap, "follow-on", tbm ? `vertical-${tbm}` : null);
        }
      }
    }
    // Special case all Google. Otherwise our code can
    // show up in maps
    return;
  }
  if (queries.get(domainInfo.search)) {
    if (domainInfo.codes.includes(code)) {
      if (domainInfo.reportPrefix &&
          queries.get(domainInfo.reportPrefix)) {
        code = queries.get(domainInfo.reportPrefix);
      }
      if (queries.get(domainInfo.followOnSearch)) {
        sendSaveTelemetryMsg(code, domainInfo.sap, "follow-on");
      } else {
        sendSaveTelemetryMsg(code, domainInfo.sap, "sap");
      }
      gLastSearchQueue.push(location.href);
    } else if (domainInfo.sap == "bing") {
      // Handle Bing followon in cookies
      if (queries.get("form").toLowerCase() != "qbre") {
        return;
      }
      (async () => {
        let cookie = await browser.cookies.get({
          url: location.href,
          name: "SRCHS"
        });

        let code = cookie.value.split("=")[1];
        if (domainInfo.codes.includes(code)) {
          sendSaveTelemetryMsg(code, "bing", "follow-on");
        }
      })();
    }
  }
  gSearchingGoogle = false;
}

function handleUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.url && changeInfo.url.startsWith("https:")) {
    processURL(new URL(changeInfo.url));
  }
}

browser.tabs.onUpdated.addListener(handleUpdated);
