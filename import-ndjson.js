// #!/usr/bin/env node

// const H = require('highland')
// const pg = require('pg')

// const BATCH_SIZE = 250

// const client = new pg.Client({
//   user: 'postgis',
//   host: 'localhost',
//   database: 'postgis',
//   password: 'postgis',
//   port: 5432
// })

// async function insert (client, batch) {
//   const value = (line) => `(
//     ${line.osmId},
//     '${JSON.stringify({...line, osmId: undefined, geometry: undefined}).replace(/\'/g, '\'\'')}'::json,
//     ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(line.geometry)}'), 4326)
//   )`

//   const query = `
//     INSERT INTO bovenland.shops (osm_id, data, geometry)
//     VALUES ${batch.map(value).join(',')}`

//   await client.query(query)
// }

// async function run () {
//   await client.connect()
//   await client.query('TRUNCATE bovenland.shops')

//   H(process.stdin)
//     .split()
//     .compact()
//     .map(JSON.parse)
//     .batch(BATCH_SIZE)
//     .flatMap((batch) => H(insert(client, batch)))
//     .done(async () => {
//       await client.end()
//     })
// }

// run()
