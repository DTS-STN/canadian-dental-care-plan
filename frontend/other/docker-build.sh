#!/bin/sh -eux
#
# A shell script to build the CDCP container image locally.
#
# BUILD_DATE -- the date and time that the image was built
# BUILD_ID -- the build ID (typically a CI/CD job ID)
# BUILD_REVISION -- the short commit hash of the commit that was used to build the image
# BUILD_VERSION -- the version of the image, built from the BUILD_REVISION and BUILD_ID
#

docker build ../ --file ../dockerfile --tag canadian-dental-care-plan \
    --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"       \
    --build-arg BUILD_ID="00000"                                  \
    --build-arg BUILD_REVISION="$(git rev-parse --short=8 HEAD)"  \
    --build-arg BUILD_VERSION="0.0.0-$(git rev-parse --short=8 HEAD)-00000"
