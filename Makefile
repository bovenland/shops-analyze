chains:
	@/chains.js > chains.json

analyze:
	@./analyze.js -q shops > ./data/shops.ndjson
	@./analyze.js -q boxes > ./data/boxes.ndjson
	@./analyze.js -q service-points > ./data/service-points.ndjson

geojson:
	@../ndjson-to-geojson/ndjson-to-geojson.js < ./data/shops.ndjson > ./data/shops.geojson
	@../ndjson-to-geojson/ndjson-to-geojson.js < ./data/boxes.ndjson > ./data/boxes.geojson
	@../ndjson-to-geojson/ndjson-to-geojson.js < ./data/service-points.ndjson > ./data/service-points.geojson

count:
	@wc -l ./data/shops.ndjson
	@wc -l ./data/boxes.ndjson
	@wc -l ./data/service-points.ndjson

jq:
	@jq < ./data/shops.ndjson
	@jq < ./data/boxes.ndjson
	@jq < ./data/service-points.ndjson
