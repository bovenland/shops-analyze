const R = require('ramda')

const DEFAULT_RADIUS = 1000

const RADII = [
  // 50,
  // 100,
  // 250,
  // 500,
  1000
  // 2500
]

function allRadii (fn) {
  const name = fn.name

  const fns = {}

  RADII.forEach((radius) => {
    fns[`${name}${radius}`] = R.curry(fn)(R.__, R.__, radius)
  })

  return fns
}

module.exports = {
  DEFAULT_RADIUS,
  RADII,
  allRadii
}
