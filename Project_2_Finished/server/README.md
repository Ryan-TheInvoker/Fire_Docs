

building docker:
sudo docker-compose up --build

once you've built it's just:
sudo docker-compose up


api

users
POST /api/users/login
GET /api/users/profile
PUT /api/users/profile
DELETE /api/users/profile

categories
POST /api/categories/
GET /api/categories/
GET /api/categories/:categoryId
PUT /api/categories/:categoryId
DELETE /api/categories/:categoryId

notes
GET /api/notes/
GET /api/notes/:noteId
PUT /api/notes/:noteId
DELETE /api/notes/:noteId



