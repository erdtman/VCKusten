console.log("chat");
const pnr_mappings = {};

function appendHeader(pnr_element) {

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

        list.childNodes[1].after(new_header);
    });
}


function getText(pnr) {
    if (pnr_mappings[pnr].doctor) {
        return pnr_mappings[pnr].doctor;
    }
    return pnr_mappings[pnr].message ? pnr_mappings[pnr].message : "";
}

async function waitForPatiens() {
    console.log("waitForPatiens");

    console.log("waitForPatiens - fixing style of tables");
    const lists = document.querySelectorAll('[class^=styles__list___]')
    Array.from(lists).forEach(list => {
        const current_style = list.style["grid-template-columns"]
        if(current_style.indexOf("doctor")!= -1) {
            return;
        }
        const stripped_style = current_style.substring(44);
        const new_style = "[statusIcon] 2rem [name] minmax(3rem, 2.2fr) [doctor] minmax(3rem, 2.2fr) " + stripped_style
        list.style["grid-template-columns"] = new_style;
    });

    console.log("waitForPatiens - reading all pnr fields");
    const pnr_elements = document.querySelectorAll('[class^=cells__smallText___]');
    const pnrs = Array.from(pnr_elements).map(pnr_element => {
        return pnr_element.innerHTML.trim();
        // TODO remove everything that is not a number
    });

    console.log("waitForPatiens - filtering out already fetched pnrs");
    const missing_mappings = pnrs.filter((pnr) => {
        if (!pnr_mappings[pnr]) {
            return true;
        }
        return !pnr_mappings[pnr].doctor; // we might have a message object only
    })

    console.log("waitForPatiens - requesting mappings from J4");
    const response = await chrome.runtime.sendMessage({ patients: missing_mappings });
    console.log(response);

    console.log("waitForPatiens - saving responses");
    for (mapping in response) {
        pnr_mappings[mapping] = response[mapping];
    }

    console.log("waitForPatiens - decorating");
    Array.from(pnr_elements).forEach(pnr_element => {
        appendHeader(pnr_element); // TODO split out check if exists
        const name_and_pnr = pnr_element.parentElement.parentElement;
        const row = name_and_pnr.parentElement;
        const pnr = pnr_element.innerHTML.trim();

        if (row.getElementsByClassName("doctor").length > 0) {
            console.log("waitForPatiens - uppdating doctor");
            const p = row.getElementsByClassName("doctor")[0]
            p.innerHTML = getText(pnr);
            return;
        } else {
            console.log("waitForPatiens - creqting new element for doctor");
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

    setTimeout(waitForPatiens, 2000);
}

waitForPatiens();


