FROM alpine:latest AS release
RUN apk add --no-cache git

ARG GIT_REVISION
ARG GIT_REPO_URL

WORKDIR /root/

RUN set -ex \
  && git clone $GIT_REPO_URL release -b $GIT_REVISION --depth 1

FROM docker.ub.gu.se/rails:ruby-2.3.1-002

COPY --from=release /root/release/backend /usr/src/app

RUN bundle install

CMD ["sh", "-c", "rm -f /usr/src/app/tmp/pids/server.pid && rails server -b 0.0.0.0 -e $ENVIRONMENT"]
