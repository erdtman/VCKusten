
// This file is injected into TeleQ to capthure SSNs for
// patients so that birth dates can later be connected
// to doctors
(function (send) {
    XMLHttpRequest.prototype.send = function () {
        var callback = this.onreadystatechange
        this.onreadystatechange = function () {
            if (this.readyState == 4 && this.responseText) {
                const page = this.responseText;
                const ssnPattern = /\b(\d{8}-\d{4})|(\d{12})|(\d{10})/g; // Adjust the pattern based on your SSN format
                const new_pnrs = page.match(ssnPattern);

                const unique_pnrs = [...new Set(new_pnrs)];

                window.postMessage({ type: 'new_pnrs', "pnrs": unique_pnrs }, '*');
            }
            if (callback) {
                callback.apply(this, arguments)
            }
        }
        send.apply(this, arguments)
    }
}(XMLHttpRequest.prototype.send))