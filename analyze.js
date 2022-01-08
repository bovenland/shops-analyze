#!/usr/bin/env node

const fs = require('fs')
const H = require('highland')
const pg = require('pg')
const QueryStream = require('pg-query-stream')

const argv = require('yargs')
  .options({
    intersects: {
      alias: 'i',
      describe: 'GeoJSON polygon all road segments should intersect with'
    },
    query: {
      alias: 'q',
      describe: 'OSM query to run',
      choices: ['shops'],
      default: 'shops'
    }
  })
  .help('help')
  .argv

const computeAttributes = require('./attributes')
const postprocess = require('./postprocess')

const pool = new pg.Pool({
  user: 'postgis',
  host: 'localhost',
  database: 'postgis',
  password: 'postgis',
  port: 5432
})

const queries = {
  shops: (intersects) => `SELECT
    osm_id,
    name,
    shop,
    tags->'addr:street' AS street,
    "addr:housenumber" AS house_number,
    tags->'addr:postcode' AS postcode,
    tags->'addr:city' AS city,
    way AS geometry,
    'shop' AS type,
    'point' AS osm_type,
    ST_asGeoJSON(ST_Transform(way, 4326), 6) AS geojson
  FROM planet_osm_point
  WHERE
    ${intersects} AND
    shop <> ''`
}

async function analyze (argv, pool, row) {
  const data = {}

  for (let name in computeAttributes) {
    data[name] = await computeAttributes[name](pool, row)
  }

  return {
    query: argv.query,
    osmId: row.osm_id,
    osmType: row.osm_type,
    ...data,
    geometry: JSON.parse(row.geojson)
  }
}

async function run (argv, query) {
  const client = await pool.connect()
  const stream = client.query(new QueryStream(query))

  const output = H(stream)
    .flatMap((row) => H(analyze(argv, pool, row)))
    .flatMap((row) => H(postprocess(row)))
    .map(JSON.stringify)
    .intersperse('\n')

  output
    .pipe(process.stdout)

  output.observe()
    .done(() => client.release())
}

let polygon
if (argv.intersects) {
  const filename = argv.intersects
  polygon = JSON.parse(fs.readFileSync(filename))
}

const intersects = polygon ? `ST_Intersects(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(polygon)}'), 4326), 3857), geometry)` : 'TRUE'
const query = queries[argv.query](intersects)

run(argv, query)
