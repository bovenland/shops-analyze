const { DEFAULT_RADIUS, allRadii } = require('./radius')

function vacantPercentage (row, radius = DEFAULT_RADIUS) {
  const nearbyVacant = row[`nearbyVacant${radius}`]
  const nearbyShops = row[`nearbyShops${radius}`]

  const vacantPercentage = nearbyVacant / (nearbyVacant + nearbyShops) * 100
  return Math.round(vacantPercentage)
}

function chainPercentage (row, radius = DEFAULT_RADIUS) {
  const nearbyChains = row[`nearbyChains${radius}`].count
  const nearbyShops = row[`nearbyShops${radius}`]

  const chainsPercentage = nearbyChains / (nearbyChains + nearbyShops) * 100
  return Math.round(chainsPercentage)
}

function surroundingsRadius (row) {
  const SURROUNDINGS_RADIUS = 150
  return row.nearestBuilding.radius + SURROUNDINGS_RADIUS
}

async function address (row) {
  let {
    houseNumber,
    street,
    postcode,
    city,
    address
  } = row.address

  if (address) {
    const addressRegex = /^(?<street>.*) (?<houseNumber>[\w-]*), (?<postcode>\d{4}\w{2}) (?<city>.*)$/
    const match = address.match(addressRegex)
    if (match) {
      return match.groups
    }
  } else {
    return {
      houseNumber,
      street,
      postcode,
      city
    }
  }
}

const functions = {
  ...allRadii(vacantPercentage),
  ...allRadii(chainPercentage),
  address,
  surroundingsRadius
}

module.exports = async (row) => {
  const data = {}

  for (let name in functions) {
    data[name] = await functions[name](row)
  }

  return {
    ...row,
    ...data
  }
}
