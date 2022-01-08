#!/usr/bin/env node

const H = require('highland')
const pg = require('pg')
const QueryStream = require('pg-query-stream')

const pool = new pg.Pool({
  user: 'postgis',
  host: 'localhost',
  database: 'postgis',
  password: 'postgis',
  port: 5432
})

async function run () {
  const query = `
    SELECT name, brand, "operator"
    FROM osm_point
    WHERE shop <> ''`

  const client = await pool.connect()
  const stream = client.query(new QueryStream(query))

  const data = H(stream)
    .map((row) => ([
      {
        chain: row.name,
        key: 'name'
      },
      {
        chain: row.brand,
        key: 'brand'
      },
      {
        chain: row.operator,
        key: 'operator'
      }
    ]))
    .flatten()
    .filter((row) => row.chain)
    .map((row) => ({
      ...row,
      chain: row.chain.toLowerCase()
    }))
    .flatten()
    .group('chain')
    .map((groups) => Object.values(groups).map((group) => ({
      chain: group[0].chain,
      count: group.length
    })))
    .flatten()
    .filter((row) => row.count > 1)
    .sortBy((a, b) => a.count - b.count)

  data
    .toArray((chains) => console.log(JSON.stringify(chains, null, 2)))

  data.observe()
    .done(() => client.release())
}

run()
