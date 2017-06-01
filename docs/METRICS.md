## Follow-on Search Telemetry Metrics

*Last Update: 2017-06-1*

This document is a summary of the metrics the follow-on search telemetry add-on will record and how we're recording them, and what we're looking for in those metrics.

## Search counts

For Yahoo, the add-on listens to page loads and when those loads contain our tracking IDs, they are recorded as a search.
To determine the difference between a first search and a follow-on search, we look for additional parameters that Yahoo
adds on subsequent searches.

For Bing, the add-on listens to page loads and when those loads contain our tracking IDs, they are recorded as a search.
With Bing, we can only detect the first search via a tracking IDs. For subsequent Bing searches, we check to see if there
is a cookie set (SEARCHS) which lets us know that follow-on searches should be counted. Note that this method is not 100%
foolproof so it will count additional searches that do not belong to us.

For Google, the add-on listens to page loads and location changes. If the URLs contains our codes, they are recorded
as a search. To determine the difference between a first search and a follow-on search, we look for the presence
of a # which indicates that it was a follow on search. This works because the first search from Firefox never
contains the #.
