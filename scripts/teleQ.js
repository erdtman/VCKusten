// Ensure your HTML file includes: <script type="module" src="scripts/teleQ.js"></script>

console.log("mittPTJ starting");

function getText(mapping) {
    if (mapping.doctor) {
        return mapping.doctor;
    }

    if (mapping.message) {
        return mapping.message;
    }

    return "???";
}


function appendHeader() {
    console.log("appendHeader");

    const header = document.getElementById('header');
    if (header.getElementsByClassName("doctor").length === 0) {
        const th = document.createElement('th');
        th.innerHTML = "Läkare";
        th.className = "doctor";
        header.appendChild(th);
    }

    console.log("appendHeader - done");
}

function adjustStyle() {
    console.log("adjustStyle");
    // TODO do something with the style
    console.log(`adjustStyle - done`);
}

async function updatePatients() {
    console.log(`updatePatients - start`);

    const pnr_elements = document.getElementsByClassName('pnr');



    console.log(`updatePatients - found ${pnr_elements.length} elements`);

    for (const pnr_element of pnr_elements) {
        const row = pnr_element.parentElement;

        const pnr = pnr_element.innerHTML;

        console.log(`updatePatients - requesting mapping...`);

        const response = await chrome.runtime.sendMessage({ patient: pnr, prod: false });

        console.log("updatePatients - decorating...");
        // TODO get doctor from journal
        if (row.getElementsByClassName("doctor").length > 0) {
            const doctor = row.getElementsByClassName("doctor")[0];
            doctor.innerHTML = getText(response);
        } else {
            const doctor = document.createElement('td');
            doctor.className = "doctor";
            doctor.innerHTML = getText(response);
            row.appendChild(doctor);
        }
    };
}

async function  runLoop() {
    console.log("runLoop");

    console.log("runLoop - adjustStyle");
    adjustStyle()

    console.log("runLoop - appendHeader");
    appendHeader();

    console.log("runLoop - updatePatients");
    await updatePatients();

    console.log("runLoop - setTimeout");
    setTimeout(runLoop, 2000);
}

runLoop();
