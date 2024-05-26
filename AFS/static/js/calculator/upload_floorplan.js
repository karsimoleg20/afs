let alerts = document.querySelector("#alerts");
let back_btn = document.querySelector("#back_btn");
let continue_btn = document.querySelector("#continue_btn");

continue_btn.addEventListener(
    'click',
    function(e) {
        e.preventDefault();
        let is_ok = true;

        let image = document.querySelector("#image").value;
        let scale = document.querySelector("#scale").value;
        
        if (image === "") {
            show_error(alerts, "You haven't uploaded image yet.");
            is_ok = false;
        }
        
        if (isNaN(parseFloat(scale))) {
            show_error(alerts, "Entered scale is not a number.");
            is_ok = false;
        } else if (parseFloat(scale) <= 0) {
            show_error(alerts, "Scale must be a positive number.");
            is_ok = false;
        }

        if (is_ok) {
            modalLoading.init(true);
            document.querySelector('form').submit();
        }
    }
);
