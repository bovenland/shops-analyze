# Topology of Commerce

## Start OSM PostGIS

    cd ..
    cd osm-data
    docker-compose up db

## Analyze

Only run for Overijssel:

    ./analyze.js -i ../netherlands-geojson/provinces/overijssel.geojson -q shops > data/shops.ndjson
    ./analyze.js -i ../netherlands-geojson/provinces/overijssel.geojson -q boxes > data/boxes.ndjson

## Workflow

Shops:

- Get all [`shop=*`](https://wiki.openstreetmap.org/wiki/Key:shop) elements.

Warehouses:

  - Get all buildings with area > 25.0000 square meters

Compuse attributes:

  - Building age histogram, in cirkel van 500 meter
  - Amount of shops nearby
    - 10 nearest
    - all shops in 500 m.
  - Parking nearby?
  - Part of chain?
  - Meer data van CBS
    - https://www.cbs.nl/nl-nl/nieuws/2019/51/in-tien-jaar-tijd-ruim-11-procent-minder-winkels
  - Amount of people living in 1 km distance?
  - Inkomen van mensen
  - Clustering op branche: levensmiddelen, mode,
	- Aantal cafétjes/restaurants in de buurt
  - Types of roads nearby, and their lengths
  - Distance to highway, provincial road
  - Distance to train station, bus stop
  - Distance to city center?
    - https://wiki.openstreetmap.org/wiki/Tag:place%3Dcity
  - Curvedness of streets
  - Type of neighborhood
    - `landuse:industrial`
    - `landuse:retail`

  - Aantal pakketophaalpunten! nearby?
  - en radius! van cirkel waarin gebouw past! gebouw nearby!
  - array met alle chains
  - toch de dozen


## Stories in data

- Overgebleven buurtsupermarkt in klein dorpje, geen andere winkels in de buurt
- Nederlands winkelcentrum: paar grote winkels van keten, parkeerplek, goed bereikbaar

## Data size

70.000 shops
2.993 large buildings

300 * 300 square


100 x 100 images x 70.000

700 megapixel

256 x 256 images x 70.000

4.587.520.000 pixel

4.587.520.000 * 3



20mb / 70000 shops, 280 byte per shop

6 byte for 1 2D coordinate

280/6 = 93 points

GPU mem 1500 mb



maak 2d grid:

in elk hoekpunt 1 variable:

nearbyShops
aantal ketens
leegstand
oppervlakte


## Scripts

    cat ./data/shops.ndjson | jq '{place: .cityCenter.name, geometry: .geometry, vacantPercentage: (.nearbyVacant1000 / (.nearbyVacant1000 + .nearbyShops1000) * 100 | round), shops: .nearbyShops1000, url: ("https://www.openstreetmap.org/node/" + .osmId)} | select(.vacantPercentage > 20 and .shops > 20)' | jq  -s 'sort_by(.vacantPercentage)' | jq -c '.[]' | ../ndjson-to-geojson/ndjson-to-geojson.js | pbcopy
