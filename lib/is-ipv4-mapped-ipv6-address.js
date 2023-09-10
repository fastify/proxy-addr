'use strict'

const { isIP } = require('node:net')

/**
 * Determine if `addr` is a IPv4-mapped IPv6 address.
 *
 * @param {string} addr
 * @returns {boolean}
 */
function isIPv4MappedIPv6Address (addr) {
  if (
    addr[0] === ':' &&
    addr[1] === ':'
  ) {
    if (
      addr[2] === 'f' &&
      addr[3] === 'f' &&
      addr[4] === 'f' &&
      addr[5] === 'f' &&
      addr[6] === ':'
    ) {
      return true
    } else if (isIP(addr.slice(2)) === 4) {
      return true
    }
  }

  let group = 0
  for (let i = 0; i < addr.length; ++i) {
    switch (addr[i]) {
      case ':':
        if (group === 5) {
          return true
        }
        ++group
        break
      case '0':
        if (group === 5) {
          return false
        }
        break
      case 'f':
        if (group !== 5) {
          return false
        }
        break
      default:
        return false
    }
  }

  return false
}

module.exports = {
  isIPv4MappedIPv6Address
}
