window.shared = window.shared || {};
window.shared.getText = function (mapping) {
    if (mapping.doctor) {
        return mapping.doctor;
    }
    if (mapping.message) {
        return mapping.message;
    }
    return "???";
}

window.shared.removeNonNumeric = function (str) {
    return str.replace(/\D/g, '');
}

function getCurrentYearTwoDigits() {
    const currentYear = new Date().getFullYear();
    return currentYear.toString().slice(-2);
}

window.shared.normalizePnr = function (pnr) {
    pnr = window.shared.removeNonNumeric(pnr);
    if (pnr.length === 10) {
        const pnr_year = new Number(pnr.substring(0, 2));
        const this_year = new Number(getCurrentYearTwoDigits());
        if (pnr_year > this_year) {
            pnr = '19' + pnr;
        } else {
            pnr = '20' + pnr;
        }
    }
    pnr = pnr.substring(0, 8) + '-' + pnr.substring(8);
    return pnr;
}

window.shared.containsPnr = function (string) {
    const ssnPattern = /\b(\d{8}-\d{4})|(\d{12})|(\d{10})/g; // Adjust the pattern based on your SSN format
    const pnrs = string.match(ssnPattern);
    return pnrs != null;
}