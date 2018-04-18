#!.venv/bin/python

import argparse
import os
import subprocess
import sys
from git import Repo
from shutil import copyfile

FILES_TO_NOT_REMOVE = [
    'jar.mn',
    'moz.build',
    'README.txt'
]

FILES_TO_SKIP_COPY = [
    '.eslintrc',
    'chrome.manifest'
]


def runProcess(cmd, cwd, errorMessage):
    print "runProcess ", cmd
    p = subprocess.Popen(cmd, cwd=cwd)

    result = p.wait()

    if result:
        print >> sys.stderr, errorMessage % result
        sys.exit(1)


class RepoHandler():
    def __init__(self, mcRepoPath):
        try:
            self.repo = Repo(os.path.realpath(mcRepoPath))
            self.isGit = True
        except:
            self.isGit = False
            self.repoPath = mcRepoPath

    def checkoutDefault(self, baseCommit):
        print "Checking out default"
        if self.isGit:
            if self.repo.active_branch.name != "default":
                self.repo.heads.default.checkout()
        else:
            runProcess(["hg", "update", baseCommit], self.repoPath,
                       "Failed to check out default branch: %s")

    def createBranch(self, branch):
        print "Creating new branch %s" % branch

        if self.isGit:
            self.repo.create_head(branch)

            self.repo.heads[branch].checkout()
        else:
            runProcess(["hg", "bookmark", branch], self.repoPath,
                       "Failed to create branch: %s")

    def createCommit(self, subDir, commitMessage):
        print "Creating commit..."

        if self.isGit:
            # Can't find a way to do this via gitPython APIs.
            self.repo.git.execute(["git", "add", subDir])

            index = self.repo.index

            index.commit(commitMessage)
        else:
            runProcess(["hg", "add", subDir], self.repoPath,
                       "Failed to add files for commit: %s")

            runProcess(["hg", "commit", "-m %s" % commitMessage],
                       self.repoPath, "Failed to add files for commit: %s")


def exportFilesToMC(repoDir, mcRepoLoc):
    print "Exporting files"

    # Remove the existing files, except for ones we need to keep.
    for root, dirs, files in os.walk(mcRepoLoc):
        for file in files:
            if file not in FILES_TO_NOT_REMOVE:
                os.remove(os.path.join(root, file))

    addonDir = os.path.join(repoDir, "add-on")
    testDir = os.path.join(repoDir, "test", "mochitest")
    # enUSFile = os.path.join(addonDir, "webextension", "_locales", "en_US",
    #                        "messages.json")

    # Export the main add-on files.
    for root, dirs, files in os.walk(addonDir):
        relativePath = os.path.relpath(root, addonDir)

        for file in files:
            filePath = os.path.join(root, file)
            # if file == "messages.json" and os.path.getsize(filePath) == 2:
            #     print "Skipping empty locale file: %s" % filePath
            # elif (file == "messages.json" and 'en_US' not in root and
            #       filecmp.cmp(enUSFile, filePath)):
            #     print "Skipping same as en-US locale file: %s" % filePath
            if file not in FILES_TO_SKIP_COPY:
                copyfile(filePath,
                         os.path.join(mcRepoLoc, relativePath, file))

        for dir in dirs:
            dirPath = os.path.join(mcRepoLoc, relativePath, dir)
            if not os.path.exists(dirPath):
                os.mkdir(dirPath, 0755)

    # Copy the test files.
    mc_test_loc = os.path.join(mcRepoLoc, "test", "browser")
    if not os.path.exists(mc_test_loc):
        os.makedirs(mc_test_loc, 0755)

    for root, dirs, files in os.walk(testDir):
        for file in files:
            copyfile(os.path.join(root, file),
                     os.path.join(mc_test_loc, os.path.relpath(root, testDir),
                     file))

    # Finally, update the moz.build file.
    # runProcess([".venv/bin/python", "bin/update_mozbuild.py"], repoDir,
    #           "Failed to run update_mozbuild.py %s")


def exportToMozillaCentral(repoDir, mcRepoPath, mcSubDir, mcBranch,
                           noSwitchBranch, mcBaseCommit, commitMessage):
    print "Exporting to m-c"

    repo = RepoHandler(mcRepoPath)

    if not noSwitchBranch:
        repo.checkoutDefault(mcBaseCommit)

        repo.createBranch(mcBranch)

    print "Exporting this repository to mozilla-central..."

    # runProcess(['make', 'clean'], repoDir, "Failed to make clean: %s")

    # runProcess(['make', 'addon'], repoDir, "Failed to make addon: %s")

    exportFilesToMC(repoDir, os.path.join(mcRepoPath, "browser", "extensions",
                    "followonsearch"))

    repo.createCommit(mcSubDir, commitMessage)


def buildMozillaCentral(mcRepoPath):
    print "Building..."

    runProcess(['./mach', 'build'], mcRepoPath,
               "Failed to build in mc repo: %s")


def runTestsInMozillaCentral(mcRepoPath, mcSubDir):
    print "Testing..."

    runProcess(['./mach', 'test', mcSubDir], mcRepoPath,
               "Tests failed! %s \n"
               "mozilla-central directory may be in an unclean state.")


def main(mcRepoPath, mcSubDir, mcBranch, noSwitchBranch,
         mcBaseCommit, commitMessage,
         build=False, runTests=False):
    repoDir = os.path.dirname(os.path.realpath(os.path.join(__file__, "..")))

    exportToMozillaCentral(repoDir, mcRepoPath, mcSubDir, mcBranch,
                           noSwitchBranch, mcBaseCommit, commitMessage)

    if build:
        buildMozillaCentral(mcRepoPath)
        if runTests:
            runTestsInMozillaCentral(mcRepoPath, mcSubDir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Follow-on search Telemetry script for managing export to mozilla-central")
    parser.add_argument("--mozilla-central-repo",
                        default=(os.getenv("EXPORT_MC_LOCATION") or "../gecko-dev"),
                        metavar=(os.getenv("EXPORT_MC_LOCATION") or "../gecko-dev"),
                        help="A gecko directory reference to mozilla-central, can also "
                             "be specified via EXPORT_MC_LOCATION environment variable")
    parser.add_argument("--mozilla-central-subdir",
                        default="browser/extensions/followonsearch/",
                        help="Where the extension is located in mozilla-central.")
    parser.add_argument("-b", "--branch",
                        help="The branch/bookmark name to use for the export.")
    parser.add_argument("--no-switch-branch",
                        action="store_true",
                        help="Don't switch to the default branch, use the existing one.")
    parser.add_argument("--mozilla-central-base-commit",
                        default="central",
                        help="The base commit if using Mercurial, defaults to 'central' (tree label)")
    parser.add_argument("-m", "--commit-message",
                        required=True,
                        help="The commit message to use for the export.")
    parser.add_argument("--build",
                        action="store_true",
                        help="Specify to build locally after export.")
    parser.add_argument("--run-tests",
                        action="store_true",
                        help="Whether or not to run Follow-on search telemetry tests after the build.")
    args = parser.parse_args()

    main(mcRepoPath=args.mozilla_central_repo,
         mcSubDir=args.mozilla_central_subdir,
         mcBaseCommit=args.mozilla_central_base_commit, mcBranch=args.branch,
         noSwitchBranch=args.no_switch_branch,
         commitMessage=args.commit_message, build=args.build,
         runTests=args.run_tests)
