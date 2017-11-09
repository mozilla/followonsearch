- Pull & check out the release target tag

```shell
$ git pull
$ git checkout v0.9.3
```

- Checkout the latest mozilla-central, this can be either via Mercurial or
git-cinnbar

```shell
$ cd ../gecko
$ git checkout master
$ git pull
```

- Create a bug in bugzilla, use this [link as a template](https://bugzilla.mozilla.org/enter_bug.cgi?assigned_to=nobody%40mozilla.org&comment=We%20want%20to%20push%20the%20latest%20version%20of%20the%20follow-on%20search%20add-on%20to%20nightly.%0D%0A%0D%0Ahttps%3A%2F%2Fgithub.com%2Fmozilla%2Ffollowonsearch%2Freleases%2Ftag%2Fv0.9.3%0D%0A%0D%0AThis%20includes%3A%0D%0A%0D%0A-%20&component=Search&product=Firefox&short_desc=Update%20follow-on%20search%20add-on%20to%200.9.3). Don't forget to fill in the details of the release itself.

- Export to the repository

```shell
$ cd ../followonsearch
$ python scripts/export_mc.py --mozilla-central-repo ../gecko -b fos-release -m "Bug 1393883 - Update follow-on search add-on to 0.9.3. r?past"
```

- Push the result to mozreview

- Wait for review & then push it to autoland.
