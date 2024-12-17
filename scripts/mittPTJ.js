console.log("chat");
const pnr_mappings = {};

function appendHeader() {

    console.log("appendHeader");
    const lists = document.querySelectorAll('[class^=styles__columns___]')
    if (lists.length < 1) {
        console.log("appendHeader - found no lists");
        return;
    }

    lists.forEach(list => {
        if (list.id === "doctor_added") {
            console.log("appendHeader - list already has doctor element");
            return
        }
        list.id = "doctor_added";

        if (list.childNodes.length < 2) {
            console.log("appendHeader - too few child nodes");
            return;
        }

        const new_header = list.childNodes[1].cloneNode(true);
        const spans = new_header.getElementsByTagName("span");
        if (spans.length < 1) {
            console.log("appendHeader - missing expected span");
            return
        }
        spans[0].innerHTML = "Läkare";
        let sort_order = false;
        new_header.onclick = (event) => {
            sort_order = !sort_order;
            console.log("appendHeader - sort click");
            const rows = list.parentElement.childNodes;
            const row_list = []
            while (rows.length > 1) {
                const row = rows[1];
                row_list.push(row);
                list.parentElement.removeChild(row);
            }

            const row_list_sorted = row_list.map(row => {
                // TODO this is error prone
                return {
                    id: row.childNodes[2].firstChild.innerHTML,
                    row: row
                }
            }).sort((a, b) => {
                console.log("sorting");

                if (sort_order) {
                    return b.id.localeCompare(a.id);
                }
                return a.id.localeCompare(b.id);

            })

            row_list_sorted.forEach(row => {
                list.parentElement.appendChild(row.row);
            });
        }
        list.childNodes[1].after(new_header);
    });
}

function adjustStyle() {
    console.log("adjustStyle");
    const lists = document.querySelectorAll('[class^=styles__list___]')
    console.log(`adjustStyle - found ${lists.length} to adjust`);

    Array.from(lists).forEach(list => {
        const current_style = list.style["grid-template-columns"]
        if (current_style.indexOf("doctor") != -1) {
            console.log(`adjustStyle - style already adjusted`);
            // style already updated
            return;
        }
        console.log(`adjustStyle - adjusting style`);
        const stripped_style = current_style.substring(44);
        const new_style = "[statusIcon] 2rem [name] minmax(3rem, 2.2fr) [doctor] minmax(3rem, 2.2fr)" + stripped_style
        list.style["grid-template-columns"] = new_style;
    });

    console.log(`adjustStyle - done`);
}

function getText(pnr) {
    if (!pnr_mappings[pnr]) {
        return ""
    }
    if (pnr_mappings[pnr].doctor) {
        return pnr_mappings[pnr].doctor;
    }
    return pnr_mappings[pnr].message ? pnr_mappings[pnr].message : "";
}

async function updatePatients() {

    console.log("updatePatients - reading all pnr fields");
    const pnr_elements = document.querySelectorAll('[class^=cells__smallText___]');
    const pnrs = Array.from(pnr_elements).map(pnr_element => {
        return pnr_element.innerHTML.trim();
    });

    console.log("updatePatients - filtering out already fetched pnrs");
    const missing_mappings = pnrs.filter((pnr) => {
        if (!pnr_mappings[pnr]) {
            // missing completely
            return true;
        }

        // we might have a message object only
        return !pnr_mappings[pnr].doctor;
    })

    console.log("updatePatients - requesting mappings from J4");
    const prod = window.location.host === "e-caregiver.se";
    const slised = missing_mappings.slice(0, 2);
    const response = await chrome.runtime.sendMessage({ patients: slised, prod: prod });

    console.log("updatePatients - saving responses");
    for (mapping in response) {
        pnr_mappings[mapping] = response[mapping];
    }

    console.log("updatePatients - decorating");
    Array.from(pnr_elements).forEach(pnr_element => {
        const name_and_pnr = pnr_element.parentElement.parentElement;
        const row = name_and_pnr.parentElement;
        const pnr = pnr_element.innerHTML.trim();

        if (row.getElementsByClassName("doctor").length > 0) {
            console.log("updatePatients - uppdating doctor");
            const p = row.getElementsByClassName("doctor")[0]
            p.innerHTML = getText(pnr);
            return;
        } else {
            console.log("updatePatients - creqting new element for doctor");
            //<div class=""><span data-test-id="">Läkare</span></div>

            const span = document.createElement("span");
            span.className = "doctor";
            span.innerHTML = getText(pnr)

            const div = document.createElement("div");
            div.style["display"] = "flex";
            div.appendChild(span);

            name_and_pnr.after(div)
        }
    });
}

function runLoop() {
    console.log("runLoop");

    console.log("runLoop - adjustStyle");
    adjustStyle()

    console.log("runLoop - appendHeader");
    appendHeader();

    console.log("runLoop - updatePatients");
    updatePatients();

    console.log("runLoop - setTimeout");
    setTimeout(runLoop, 2000);
}

runLoop();
