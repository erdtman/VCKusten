
console.log("mittPTJ starting");

const getText = window.shared.getText;
const removeNonNumeric = window.shared.removeNonNumeric;;

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

async function updatePatients() {
    console.log(`updatePatients - start`);

    const prod = window.location.host === "e-caregiver.se";

    const pnr_elements = document.querySelectorAll('[class*=cells__patientIdentifier___]');
    console.log(`updatePatients - found ${pnr_elements.length} elements`);


    for (const pnr_element of pnr_elements) {
        const pnr = pnr_element.innerHTML.trim();



        if(pnr.length < 13) {
            console.log(`updatePatients - too short pnr "${pnr}", continuing with next`);
            continue
        }

        if(pnr.length > 20) {
            console.log(`updatePatients - too long pnr "${pnr.substring(0,20)}", continuing with next`);
            continue
        }

        const pnr_clean = removeNonNumeric(pnr);
        if(pnr_clean.length !== 12) {
            console.log(`updatePatients - too long pnr "${pnr_clean}", continuing with next`);
            continue
        }

        console.log(`updatePatients - requesting mapping...`);

        const response = await chrome.runtime.sendMessage({ patient: pnr, prod: prod });

        console.log("updatePatients - decorating...");

        // TODO this is error prone
        const name_and_pnr = pnr_element.parentElement.parentElement;
        const row = name_and_pnr.parentElement;

        if (row.getElementsByClassName("doctor").length > 0) {
            console.log("updatePatients - uppdating doctor");
            const p = row.getElementsByClassName("doctor")[0];
            p.innerHTML = getText(response);
        } else {
            console.log("updatePatients - creating new element for doctor");
            //<div class=""><span data-test-id="">Läkare</span></div>

            const span = document.createElement("span");
            span.className = "doctor";
            span.innerHTML = getText(response)

            const div = document.createElement("div");
            div.style["display"] = "flex";
            div.appendChild(span);

            name_and_pnr.after(div)
        }
    }
}

async function runLoop() {
    console.log("runLoop");

    if(document.location.href.includes("/patients/cases")) {
        console.log("runLoop - adjustStyle");
        adjustStyle()

        console.log("runLoop - appendHeader");
        appendHeader();

        console.log("runLoop - updatePatients");
        await updatePatients();
    } else {
        console.log("runLoop - wrong page, do nothing");
    }
    console.log("runLoop - setTimeout");
    setTimeout(runLoop, 2000);
}

runLoop();
