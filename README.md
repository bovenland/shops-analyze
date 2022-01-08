# @bovenland/shops-analyze

Analyzes OpenStreetMap [shops](https://wiki.openstreetmap.org/wiki/Key:shop). Used by https://github.com/bovenland/waar-we-winkelen.

See [`analyze.js`](analyze.js) and [`postprocess.js`](postprocess.js) for details about the analysis process.

Prerequisites:

- Running PostgreSQL database on postgis:postgis@localhost:5432/postgis, with OpenStreetMap data. See https://github.com/bovenland.
- CBS and Funda tables in database:
  - https://github.com/bovenland/funda
  - https://github.com/bovenland/cbs

Usage:

    make analyze
