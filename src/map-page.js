const isCoordinateRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
const isAddressRegex = /^[\d]{1,5}([a-zA-Z0-9\s]){1,50}$/

export function onClickGo(inputText) {
    let isCoordinate = isCoordinateRegex.test(inputText)
    let isAddress = isAddressRegex.test(inputText)
    
    if (isCoordinate) {
        let [x, y] = inputText.split(',').map(parseFloat)
        console.log(x, y);
        return
    }
    if (isAddress) {
        console.log(inputText)
        return
    }
    console.log("onClickGo: ", inputText)
} 
