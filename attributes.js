const simpleStatistics = require('simple-statistics')

const { DEFAULT_RADIUS, allRadii } = require('./radius')

async function runQuery (client, query, values) {
  const response = await client.query(query, values)
  return response.rows
}

async function shop (pool, row) {
  return row.shop
}

async function name (pool, row) {
  return row.name
}

async function address (pool, row) {
  const {
    house_number: houseNumber,
    street,
    postcode,
    city,
    address
  } = row

  return {
    houseNumber,
    street,
    postcode,
    city,
    address
  }
}

async function province (pool, row) {
  const query = `SELECT
    name
  FROM
    planet_osm_polygon
  WHERE
    ST_Intersects(way, $1) AND
    boundary = 'administrative' AND
    admin_level = '4'
  LIMIT 1`

  const rows = await runQuery(pool, query, [row.geometry])
  if (rows && rows.length) {
    const province = rows[0]
    return province.name
  }
}

// async function landuse (pool, row) {
//   const query = `SELECT landuse FROM osm_polygon
//     WHERE landuse <> '' AND
//     ST_DWithin(geometry, $1, 0)`

//   const rows = await runQuery(pool, query, [row.geometry])

//   return rows.map((row) => row.landuse)
// }

const MIN_CHAIN_COUNT = 25
const allChains = require('./chains.json')
const chains = allChains.filter((chain) => chain.count > MIN_CHAIN_COUNT)

const indexedChains = {}
chains.map(({ chain }) => {
  indexedChains[chain] = chain
})

function isChain (name) {
  if (!name) {
    return
  }

  return indexedChains[name.toLowerCase()]
}

function rowIsChain (row) {
  return isChain(row.name) || isChain(row.operator) || isChain(row.brand)
}

async function chain (pool, row) {
  return rowIsChain(row)
}

async function nearbyChains (pool, row, radius = DEFAULT_RADIUS) {
  const query = `(SELECT name, brand, "operator"
    FROM planet_osm_point
    WHERE shop <> '' AND ST_DWithin(way, $1, $2))
  UNION
  (SELECT name, brand, "operator"
    FROM planet_osm_point
    WHERE shop <> '' AND ST_DWithin(way, $1, $2))`

  const rows = await runQuery(pool, query, [row.geometry, radius])
  const chainRows = rows.map(rowIsChain)
    .filter((chain) => chain)

  return {
    chains: chainRows,
    count: chainRows.length
  }
}

// async function cityCenter (pool, row) {
//   const query = `SELECT
//       osm_id, name, ROUND(ST_Distance(geometry, $1)) AS distance FROM osm_point
//     WHERE place = 'town' OR place = 'city' OR place = 'village' OR place = 'hamlet'
//     ORDER BY geometry <-> $1
//     LIMIT 1`

//   const rows = await runQuery(pool, query, [row.geometry])
//   return rows[0]
// }

// // TODO: add https://wiki.openstreetmap.org/wiki/Key:parking?uselang=en to mapping
// async function nearbyParking (pool, row, radius = DEFAULT_RADIUS) {
//   const query = `
//     SELECT osm_id, ROUND(ST_Distance(geometry, $1)) AS distance FROM (
//       (SELECT osm_id, amenity, geometry FROM planet_osm_point
//         WHERE amenity = 'parking'
//         ORDER BY geometry <-> $1 LIMIT 5)
//       UNION
//       (SELECT osm_id, amenity, geometry FROM planet_osm_polygon
//         WHERE amenity = 'parking'
//         ORDER BY geometry <-> $1 LIMIT 5)
//     ) u
//     ORDER BY geometry <-> $1 LIMIT 5`

//   const rows = await runQuery(pool, query, [row.geometry])
//   return rows
// }

async function nearbyFoodAndDrink (pool, row, radius = DEFAULT_RADIUS) {
  const amenities = [
    'bar',
    'cafe',
    'pub',
    'restaurant',
    'fast_food'
  ]

  const query = `(SELECT osm_id, amenity
    FROM planet_osm_point
    WHERE amenity = ANY($3) AND ST_DWithin(way, $1, $2))
  UNION
  (SELECT osm_id, amenity
    FROM planet_osm_polygon
    WHERE amenity = ANY($3) AND ST_DWithin(way, $1, $2))`

  const rows = await runQuery(pool, query, [row.geometry, radius, amenities])

  return rows.length
}

async function nearbyPeople (pool, row, radius = DEFAULT_RADIUS) {
  const query = `
    SELECT
      round(SUM(total_people * overlap)) AS people
    FROM (
      SELECT
        ("data"->>'AANT_INW')::int AS total_people,
        ST_Area(ST_Intersection(geometry, ST_Buffer(ST_Centroid($1), $2))) / ST_Area(geometry)
          AS overlap
      FROM
        bovenland.cbs
      WHERE
        ("data"->>'AANT_INW')::int > 0 AND
        ST_DWithin(geometry, ST_Centroid($1), $2)
    ) n
    LIMIT 1`

  const rows = await runQuery(pool, query, [row.geometry, radius])

  return rows[0].people
}

async function nearbyShops (pool, row, radius = DEFAULT_RADIUS) {
  const query = `(SELECT osm_id, shop
      FROM planet_osm_point
      WHERE shop <> '' AND ST_DWithin(way, $1, $2))
    UNION
    (SELECT osm_id, shop
      FROM planet_osm_polygon
      WHERE shop <> '' AND ST_DWithin(way, $1, $2))`

  const rows = await runQuery(pool, query, [row.geometry, radius])
  // console.error(query, [row.geometry, radius])
  return rows.length
}

async function nearbyVacant (pool, row, radius = DEFAULT_RADIUS) {
  const query = `SELECT COUNT(*)::int AS count
    FROM bovenland.funda
    WHERE ST_DWithin(geometry, $1, $2)`

  const rows = await runQuery(pool, query, [row.geometry, radius])

  return rows[0].count
}

async function nearestBuilding (pool, row) {
  const query = `SELECT
    osm_id,
    area, geojson,
    ST_AsGeoJSON(ST_Transform(center, 4326), 6)::json AS center,
    ROUND(radius) AS radius
  FROM (
    SELECT osm_id,
      ROUND(ST_Area(geography(ST_Transform(way, 4326)))) AS area,
      ST_AsGeoJSON(ST_Transform(way, 4326), 6)::json AS geojson,
      (ST_MinimumBoundingRadius(way)).*
    FROM planet_osm_polygon
    WHERE building <> ''
    ORDER BY way <-> $1
    LIMIT 1
  ) b`

  const rows = await runQuery(pool, query, [row.geometry])
  const nearestBuilding = rows[0]

  return {
    osmId: nearestBuilding.osm_id,
    area: nearestBuilding.area,
    center: nearestBuilding.center,
    radius: nearestBuilding.radius
  }
}

async function nearbyBuildings (pool, row, radius = DEFAULT_RADIUS) {
  const query = `SELECT
      ROUND(ST_Area(geography(ST_Transform(way, 4326)))) AS area,
      tags->'start_date' AS start_date
    FROM planet_osm_polygon
    WHERE building <> '' AND ST_DWithin(way, $1, $2)`

  const rows = await runQuery(pool, query, [row.geometry, radius])

  const years = rows
    .map((row) => row.start_date ? parseInt(row.start_date.slice(0, 4)) : null)
    .filter((year) => year && year > 1500)

  let medianYear
  let meanYear
  if (years.length) {
    meanYear = simpleStatistics.median(years)
    medianYear = Math.round(simpleStatistics.mean(years))
  }

  let medianArea
  let meanArea
  if (rows.length) {
    medianArea = simpleStatistics.median(rows.map((row) => row.area))
    meanArea = Math.round(simpleStatistics.mean(rows.map((row) => row.area)))
  }

  return {
    count: rows.length,
    medianYear,
    meanYear,
    medianArea,
    meanArea
  }
}

module.exports = {
  name,
  address,
  province,
  shop,
  chain,
  ...allRadii(nearbyChains),
  ...allRadii(nearbyPeople),
  ...allRadii(nearbyShops),
  ...allRadii(nearbyFoodAndDrink),
  ...allRadii(nearbyBuildings),
  ...allRadii(nearbyVacant),
  nearestBuilding
}
