let alerts = document.querySelector("#alerts");
let back_btn = document.querySelector("#back_btn");
let continue_btn = document.querySelector("#continue_btn");

let session_data = window.sessionStorage.getItem("afs_session");
            
if (session_data != null) {
    session_data = JSON.parse(session_data);
} else {
    session_data = {};
}

continue_btn.addEventListener(
    'click',
    function(e) {
        e.preventDefault();
        let is_ok = true;

        let area = document.querySelector("#area").value;
        
        if (isNaN(parseFloat(area))) {
            show_error(alerts, "Entered area is not a number.");
            is_ok = false;
        } else if (parseFloat(area) <= 0) {
            show_error(alerts, "Area must be a positive number.");
            is_ok = false;
        }

        if (is_ok) {
            session_data.area = area;
            window.sessionStorage.setItem("afs_session", JSON.stringify(session_data));
            document.querySelector('form').submit();
        }
    }
);
