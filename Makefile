chains:
	@/chains.js > chains.json

analyze:
	@./analyze.js -q shops > ./data/shops.ndjson
