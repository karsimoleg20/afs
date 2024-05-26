let alerts = document.querySelector("#alerts");
let back_btn = document.querySelector("#back_btn");
let continue_btn = document.querySelector("#continue_btn");


let session_data = window.sessionStorage.getItem("afs_session");
session_data = JSON.parse(session_data);
console.log(session_data);

let lower_bound = session_data.lower_bound;
let upper_bound = session_data.upper_bound;

// fill form values
document.getElementById('area').value = session_data.area;
document.getElementById('selection_list').value = JSON.stringify(session_data.selection_list);

document.getElementById('height').setAttribute('min', lower_bound);
document.getElementById('height').setAttribute('max', upper_bound);

// set interactions
back_btn.addEventListener(
    'click',
    function(e) {
        if( session_data != null ){
            session_data.state -= 1;
            window.sessionStorage.setItem("afs_session", JSON.stringify(session_data));
        }
    }
);

continue_btn.addEventListener(
    'click',
    function(e) {
        e.preventDefault();
        let is_ok = true;

        let height = document.querySelector("#height").value;
        
        if (isNaN(parseFloat(height))) {
            show_error(alerts, "Entered height is not a number.");
            is_ok = false;
        } else if (!(lower_bound <= parseFloat(height) && parseFloat(height) <= upper_bound)) {
            show_error(alerts, `The height for the selected specification should be in range ${lower_bound} - ${upper_bound} mm.`);
            is_ok = false;
        }

        if (is_ok) {
            window.sessionStorage.removeItem('afs_session');
            document.querySelector('form').submit();
        }
    }
);
