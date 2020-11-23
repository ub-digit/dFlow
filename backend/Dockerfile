FROM ruby:2.3

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    locales \
  && rm -rf /var/lib/apt/lists/* \
  && echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
  && locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV RAILS_LOG_TO_STDOUT=true
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN bundle install

# Add a script to be executed every time the container starts.
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE 3000

# start the main process
CMD ["sh", "-c", "rails server -b 0.0.0.0 -e $RAILS_ENVIRONMENT"]