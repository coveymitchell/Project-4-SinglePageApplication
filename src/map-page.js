const isCoordinateRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
const isAddressRegex = /^[\d]{1,5}([a-zA-Z0-9\s]){1,50}$/

export function isCoordinate(text) {
    return isCoordinateRegex.test(text)
}

export function isAddress(text) {
    return isAddressRegex.test(text)
}

export function parseCoordinates(text) {
    if (!isCoordinate(text)) return null
    return text.split(',').map(parseFloat)
}

export function isInBounds(center, bounds) {
    return L
        .latLngBounds(bounds.nw, bounds.se)
        .contains(center)
}