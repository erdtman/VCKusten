// Send tip to content script via messaging
//import DomParser from "dom-parser";
import { saveToStorage, getFromStorage } from './storage.js';


console.log('Service worker loaded');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function removeNonMatching(str) {
    return str.replace(new RegExp(`[^/\b\d{8}-\d{4}/`, 'g'), '');
}


async function getDoctorFor(pnr, host) {
    console.log(`getDoctorFor - get doctor form ${host}`);

    // Split out birth date
    const birth_date = pnr.substring(0, 8);
    console.log(`getDoctorFor - searching for ${birth_date}`);
    const search_url = `https://${host}/personsearch?civic_reg_nr=${birth_date}&search=S%C3%B6k`;

    const search_response = await fetch(search_url);
    if (!search_response.ok) {
        return { message: `search error, code: ${search_response.status}`, patient: pnr };
    }

    console.log(`getDoctorFor - search done`);

    const search_text = await search_response.text();

    const table_index = search_text.indexOf('id="patient_result_table"');
    const table_body_start = search_text.indexOf("tbody", table_index) + 6;
    const table_body_end = search_text.indexOf("tbody", table_body_start);
    const table_text = search_text.substring(table_body_start, table_body_end);
    const rows = table_text.split('<tr class="resultRow ">');
    console.log(pnr);

    const mappings = rows.map(row => {
        const cells = row.split('td');
        const pnr_cell = cells.find(cell => /\b\d{8}-\d{4}/.test(cell));

        if (!pnr_cell) {
            return null;
        }

        const pnr_clean = pnr_cell.replace(/[^\b\d{8}-\d{4}]/g, '');

        console.log(cells[11]);

        const doctor = cells[11].substring(8, cells[11].length - 2);
        // nowrap>Anders Holgersson</
        // nowrap>Adam Berg</
        if (doctor === "") {
            return {
                patient: pnr_clean,
                message: "Patienten har ingen angiven läkare"
            };
        }

        return {
            patient: pnr_clean,
            doctor: doctor
        };
    }).filter(row => row !== null);

    const mapping = mappings.find(row_data => {
        return row_data.patient === pnr;
    });

    if (!mapping) {
        console.log(`getDoctorFor - patient not found`);
        return { message: "Användare saknas i J4", patient: pnr };
    }

    await delay(1000);
    return mapping;
};

const PROD = "itoh-web01.itohosted.com:9096";
const TEST = "referensgrupp.cgmj4.se";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Service worker - incoming message from ${sender.origin}`);

    const host = message.prod ? PROD : TEST;

    getFromStorage(message.patient).then(result => {
        console.log(`Service worker - found in storage`);
        if (result) {
            console.log(`Service worker - found mapping in storage`);
            return sendResponse(result);
        }

        console.log(`Service worker - not found in storage fetching from journal`);

        getDoctorFor(message.patient, host).then(async result => {
            if (result.doctor) {
                console.log(`Service worker - saving mapping`);
                await saveToStorage(message.patient, result);
            }
            console.log(`Service worker - returning response`);
            sendResponse(result);
        }).catch(error => {
            console.log(`Service worker - load error: ${error}`);
            sendResponse({ message: `internal load error, ${error}`, patient: message.patient });
        });
    }).catch(error => {
        console.log(`Service worker - not found in storage ${error}`);
        sendResponse({ message: `internal storage error, ${error}`, patient: message.patient });
    });


    // Keep the service worker alive until sendResponse is called
    return true;
});

