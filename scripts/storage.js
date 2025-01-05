function removeNonNumeric(str) {
    return str.replace(/\D/g, '');
}

// Save data to chrome.storage.local
export async function saveToStorage(pnr, data) {
    const clean_pnr = removeNonNumeric(pnr);
    const obj = { [clean_pnr]: data };
    return await chrome.storage.session.set(obj);
}

// Retrieve data from chrome.storage.local
export async function getFromStorage(pnr) {
    const clean_pnr = removeNonNumeric(pnr);
    const tmp = await chrome.storage.session.get(clean_pnr);
    return tmp[clean_pnr];
}
