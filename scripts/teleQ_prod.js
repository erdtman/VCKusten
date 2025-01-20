// Ensure your HTML file includes: <script type="module" src="scripts/teleQ.js"></script>

normalizePnr = window.shared.normalizePnr;
getText = window.shared.getText;

console.log("TeleQ starting");

let pnrs = [];
async function updatePatients(storage_only = true) {
    console.log(`updatePatients - start storage only: ${storage_only}`);

    const pnr_elements = document.getElementsByClassName('personal-code');

    const prod = window.location.host === "www4.teleqone.com";

    console.log(`updatePatients - found ${pnr_elements.length} elements`);

    for (const pnr_element of pnr_elements) {
        const row = pnr_element.parentElement;
        const inner = pnr_element.getElementsByTagName('span')[0];
        const birth_date = inner.innerHTML;

        const pnr = pnrs.find(pnr => pnr.startsWith(birth_date)) || "";

        console.log(`updatePatients - requesting mapping...`);

        const normalize_pnr = normalizePnr(pnr);
        // TODO set real value for prod
        const response = await chrome.runtime.sendMessage({ patient: normalize_pnr, prod: true, storage_only: storage_only });

        console.log("updatePatients - decorating...");

        const customer_nummber = row.getElementsByClassName("customer-number")[0];
        customer_nummber.innerHTML = getText(response);
        customer_nummber.className = "customer-number";

    };
}

async function runLoop() {
    console.log("runLoop");

    console.log("runLoop - updatePatients");
    await updatePatients(true);

    console.log("runLoop - setTimeout");
    setTimeout(runLoop, 2000);
}



setTimeout(async () => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('scripts/capture.js');

    // Listen for messages from the capture script
    window.addEventListener('message', function (event) {
        if (event.source !== window) {
            return;
        }

        if (event.data.type && event.data.type === 'new_pnrs') {
            const new_pnrs = event.data.pnrs;
            const unique_pnrs = [...new Set(pnrs.concat(new_pnrs))];

            pnrs = unique_pnrs;
        }
    }, false);

    // see also "Dynamic values in the injected code" section in this answer
    (document.head || document.documentElement).appendChild(script);

    document.addEventListener('DOMContentLoaded', async () => {
        const page = document.body.innerHTML;
        const ssnPattern = /\b(\d{8}-\d{4})|(\d{12})|(\d{10})/g; // Adjust the pattern based on your SSN format
        pnrs = page.match(ssnPattern) || [];
        pnrs = [...new Set(pnrs)];
        runLoop();
    });
}, 0);


// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "iconClicked") {
        console.log("Extension icon clicked in the content script");

        updatePatients(false);

        // Perform any action needed when the icon is clicked
    }
});

