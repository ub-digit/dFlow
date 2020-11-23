Requires docker and docker-compose

Do this:

* Put your .sql file in the folder docker-entrypoint-initdb.d
* cd backend
* docker build . -t dflow-ruby-2.3 (name/tag can be anything. If changed update docker-compose.yml)
* cd ..
* docker-compose up (starts db, backend and frontend)

Visit your application on localhost:4200
