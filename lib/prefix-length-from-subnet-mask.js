'use strict'

/**
 * Parse netmask string into CIDR range.
 *
 * @param {String} netmask
 * @private
 */
function prefixLengthFromSubnetMask (netmask) {
  let stop = false
  let cidr = 0

  let end = netmask.length
  let start = netmask.lastIndexOf('.', end - 1)
  let zeros = octetToZeros(netmask, start + 1, end)
  if (zeros === 0) return null
  zeros !== 9 && (stop = true)
  cidr += zeros

  end = start
  start = netmask.lastIndexOf('.', end - 1)
  zeros = octetToZeros(netmask, start + 1, end)
  if (zeros !== 1 && (stop === true || zeros === 0)) return null
  stop === false && zeros !== 9 && (stop = true)
  cidr += zeros

  end = start
  start = netmask.lastIndexOf('.', end - 1)
  zeros = octetToZeros(netmask, start + 1, end)
  if (zeros !== 1 && (stop === true || zeros === 0)) return null
  stop === false && zeros !== 9 && (stop = true)
  cidr += zeros

  end = start
  zeros = octetToZeros(netmask, 0, end)
  if (zeros !== 1 && (stop === true || zeros === 0)) return null
  stop === false && zeros !== 9 && (stop = true)
  cidr += zeros

  return 36 - cidr
}

function octetToZeros (ip, start, end) {
  return (
    (ip[start] === '0' && 9) ||
    ((end - start) === 3 && (
      (ip[start] === '1' && (
        (ip[start + 1] === '2' && ip[start + 2] === '8' && 8) ||
        (ip[start + 1] === '9' && ip[start + 2] === '2' && 7)
      )) ||
      (ip[start] === '2' && (
        (ip[start + 1] === '2' && ip[start + 2] === '4' && 6) ||
        (ip[start + 1] === '4' && (
          (ip[start + 2] === '0' && 5) ||
          (ip[start + 2] === '8' && 4)
        )) ||
        (ip[start + 1] === '5' && (
          (ip[start + 2] === '2' && 3) ||
          (ip[start + 2] === '4' && 2) ||
          (ip[start + 2] === '5' && 1)
        ))
      ))
    ))
  ) || 0
}

module.exports = {
  prefixLengthFromSubnetMask
}
