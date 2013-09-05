## MancJS September: Rock-paper-scissors

The server used to run the MancJS rock-paper-scissors tournament.


### How to run server

* Clone the repo
* `npm install`
* `node rps`


### URLs

`/debug`
Dumps the raw state of the entire game. Endpoint uses HTTP basic auth (username `user` password `pass`)

`/debug/drop`
Clears the database

`/debug/play`
Runs the game (every bot plays 50 hands with every other bot once)

`/results`
Public results page updated after each `/debug/play`

`/register`
Public registration page to create new accounts and access dashboard (where you upload bot scripts)


### Bots

Take a look inside the `bots` directory for examples.


### Rules


`dynamite`

* Can only be used 5 times
* Beats `rock`, `paper`, `scissors`
* Draws with another `dynamite`
* Loses against `water`


`water`

* Can be used an infinite amout of times
* Beats `dynamite`
* Draws with another `water`
* Loses against `rock`, `paper`, `scissors`


If a `draw` occurs, the point carries over.
