// const H = require('highland')
// const pg = require('pg')
// const QueryStream = require('pg-query-stream')

// const kdbush = require('kdbush')
// const geokdbush = require('geokdbush')

// const pool = new pg.Pool({
//   user: 'postgis',
//   host: 'localhost',
//   database: 'postgis',
//   password: 'postgis',
//   port: 5432
// })

// const amenities = [
//   'bar',
//   'cafe',
//   'pub',
//   'restaurant',
//   'fast_food'
// ]

// async function run () {
//   const client = await pool.connect()

//   // const query = `
//   // SELECT osm_id, amenity, ST_AsGeoJSON(ST_Transform(ST_Centroid(way), 4326))::json AS geometry
//   // FROM (
//   //   (SELECT osm_id, amenity, way
//   //     FROM planet_osm_point
//   //     WHERE amenity = ANY($1))
//   //   UNION
//   //   (SELECT osm_id, amenity, way
//   //     FROM planet_osm_polygon
//   //     WHERE amenity = ANY($1))
//   // ) u`
//   // const stream = client.query(new QueryStream(query, [amenities]))

//   const query = `SELECT
//     osm_id,
//     ST_AsGeoJSON(ST_Transform(ST_Centroid(way), 4326))::json AS geometry,
//     ROUND(ST_Area(geography(ST_Transform(way, 4326)))) AS area,
//     tags->'start_date' AS start_date
//   FROM planet_osm_polygon
//   WHERE building <> ''`

//   const stream = client.query(new QueryStream(query))
//   console.log('Start!')

//   H(stream)
//     .each((row) => {
//       console.log(1)
//     })


//   // H(stream)
//   //   .toArray((rows) => {
//   //     console.log('Query done')
//   //     const index = new kdbush(rows, (row) => row.geometry.coordinates[0], (row) => row.geometry.coordinates[1])
//   //     console.log('Index done')
//   //     let nearest = geokdbush.around(index, 4.922, 52.362, Infinity, 0.5)

//   //     console.log(nearest)

//   //     nearest = geokdbush.around(index, 4.922, 52.362, Infinity, 0.9)

//   //     console.log(nearest)

//   //     nearest = geokdbush.around(index, 4.922, 52.362, Infinity, 0.1)

//   //     console.log(nearest)
//   //   })
// }

// run()
