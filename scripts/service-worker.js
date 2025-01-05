// Send tip to content script via messaging
//import DomParser from "dom-parser";
import { saveToStorage, getFromStorage } from './storage.js';

console.log('Service worker loaded');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO this function should have tests
function getIdFromURL(url_string) {
    if (url_string.indexOf("personsearch") != -1) {
        // Failed to find patient - could be because user is not logged in
        // TODO diffewrentiate between missing and not logged in
        return null;
    }

    const url = new URL(url_string);
    const id = url.searchParams.get("patient");
    return id;
}

// TODO this function should have tests
function getDoctorName(doctor_string) {
    const first_space = doctor_string.indexOf(": ");
    if (first_space == -1) {
        return doctor_string;
    }
    const second_space = doctor_string.indexOf(" ", first_space + 2);
    if (second_space == -1) {
        // This might be strange, we only have one space what does that mean?
        return doctor_string.substring(first_space + 2);
    }
    const third_space = doctor_string.indexOf(" ", second_space + 1);
    if (third_space == -1) {
        // we do not have a third space tae whatever is after the first space
        // this should be the common case
        return doctor_string.substring(first_space + 2);
    }

    // We have some extra text lets just take two words after the first space
    const doctor = doctor_string.substring(first_space + 2, third_space);
    return doctor;
}

async function getDoctorFor(pnr, host) {
    console.log(`getDoctorFor - get doctor form ${host}`);

    const search_url = `https://${host}/personsearch?civic_reg_nr=${pnr}&search=S%C3%B6k`;
    const search_response = await fetch(search_url);
    if (!search_response.ok) {
        return { message: `search error, code: ${search_response.status}`, patient: pnr };
    }

    console.log(`getDoctorFor - search done`);

    const patient_id = getIdFromURL(search_response.url);
    if (!patient_id) {
        console.log(`getDoctorFor - no patient found`);
        return { message: "Användare saknas i J4", patient: pnr };
    }

    console.log(`getDoctorFor - found patient, id: ${patient_id}`);

    const patient_url = `https://${host}/modules/getJournalHeader/${patient_id}?hideWarnings=false`;
    const patient_response = await fetch(patient_url);
    if (!patient_response.ok) {
        console.log(`getDoctorFor - failed to load patient ${patient_id}`);
        return { message: `load error, code: ${patient_response.status}`, patient: pnr };
    }

    const patient_json = await patient_response.json();
    if (!patient_json.subHeaderInfo) {
        console.log(`getDoctorFor - no doctor found for ${patient_id}`);
        return { message: "Ingen läkare angiven", patient: pnr };
    }

    const doctor = getDoctorName(patient_json.subHeaderInfo);

    console.log(`getDoctorFor - found doctor ${doctor} for ${patient_id}`);

    await delay(1000);
    return { doctor: doctor, patient: pnr };
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

