Releases are generally done on an as-needed basis.

To create a release:

- Make sure everything is committed and on master.
- Check out the version you want to release.
- Then run:

```shell
$ npm install
$ npm version v1.0.0
```

The `npm install` ensures the npm modules are up to date. `v1.0.0` should be
replaced by the version of the release.

`npm version` will run the tests, bump the version numbers for the add-on files,
and create a new tag.

Once that has completed, you need to push the results:

```shell
$ git push origin master
$ git push origin v1.0.0
```

Lastly document the release:

* Visit https://github.com/mozilla/followonsearch/releases
* Select the newly created tag
* Select Edit, and add some release notes for the changes in the release.
