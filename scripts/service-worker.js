// Send tip to content script via messaging
//import DomParser from "dom-parser";

function getIdFromURL(url_string) {
    const url = new URL(url_string);
    const id = url.searchParams.get("patient");
    if (!id) {
        throw new Error(`Failed to get id from ${url_string}`);
    }
    return id;
}

async function getDoctorFor(p_nr) {
    console.log(`serivce worker - get doctor for ${p_nr}`);

    const search_url = `https://referensgrupp.cgmj4.se/personsearch?civic_reg_nr=${p_nr}&search=S%C3%B6k`;
    const search_response = await fetch(search_url);
    if (!search_response.ok) {
        throw new Error(`Response status: ${search_response.status}`);
    }

    if (search_response.url.indexOf("personsearch") != -1) {
        // Failed to find patient - could be becuse user is not logged in
        // TODO dirrerentiate between missing and not logged in
        return { message: "Användare saknas i J4", patient: p_nr };
    }
    const patient_id = getIdFromURL(search_response.url);

    console.log(`serivce worker - found patient id ${patient_id}`);

    const patient_url = `https://referensgrupp.cgmj4.se/modules/getJournalHeader/${patient_id}?hideWarnings=false`;
    const patient_response = await fetch(patient_url);
    const patient_json = await patient_response.json();
    if (!patient_response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    if (!patient_json.subHeaderInfo) {
        return { message: "Ingen läkare angiven", patient: p_nr };
    }
    const doctor = patient_json.subHeaderInfo.substring(17);
    console.log(`serivce worker - doctor ${doctor} for ${patient_id}`);

    return { doctor: doctor, patient: p_nr };
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("serivce worker  - incomming message");

    const patients_promises = message.patients.map(async patient => {
        try {
            return getDoctorFor(patient);
        } catch (error) {
            // TODO think about handling error
            console.log(error);
        }
    });
    Promise.allSettled(patients_promises).then(results => {
        const doctor_map = {}
        for (const result of results) {
            if (result.status === "rejected") {
                continue;
            }
            // set message of doctor depending on what we have
            doctor_map[result.value.patient] = {
                doctor: result.value.doctor,
                message: result.value.message
            }
        }

        sendResponse(doctor_map);
    });

    return true;
});