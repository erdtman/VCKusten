function removeNonNumeric(str) {
    return str.replace(/\D/g, '');
}

// Save data to chrome.storage.local
export async function saveToStorage(pnr, data) {
    const clean_pnr = removeNonNumeric(pnr);
    return chrome.storage.session.set({ [clean_pnr]: data })
}

// Retrieve data from chrome.storage.local
export async function getFromStorage(pnr) {
    const clean_pnr = removeNonNumeric(pnr);
    return chrome.storage.session.get([clean_pnr])[[clean_pnr]];
}
