CREATE DATABASE mydatabase;

CREATE USER 'root'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON mydatabase.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
