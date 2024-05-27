let scale = parseFloat(document.getElementById('scale').textContent);
let rooms = JSON.parse(document.getElementById('rooms').textContent);
let errs = JSON.parse(document.getElementById('errs').textContent);
let img_src = JSON.parse(document.getElementById('img_src').textContent);

if (img_src != null) {
    img_src = img_src['img'];
}

let main_content = document.querySelector('#main_content');
let total_area = document.querySelector('#total_area');
let selected_area = document.querySelector('#selected_area');
let scale_label = document.getElementById('scale_label');
let adjusted_scale = document.getElementById('adjusted_scale');
let canvas = document.getElementById('canvas');

let alerts = document.querySelector('#alerts');
let back_btn = document.querySelector('#back_btn');
let floor_area_btn = document.querySelector('#floor_area_btn');
let continue_btn = document.querySelector('#continue_btn');

let session_data = window.sessionStorage.getItem("afs_session");

// show errors if any
errs.forEach(
    function(err, idx) {
        show_error(alerts, err);
    }
);

if (session_data != null) {
    session_data = JSON.parse(session_data);
} else {
    session_data = {};
}

/* Rooms */
// draw background image
let img = new Image();
let ctx = canvas.getContext('2d');

// clicked rooms
let clicked_rooms = [];

img.onload = function() {
    let canvas_bound_rect = canvas.getBoundingClientRect();
    let height = Math.floor(img.height * (canvas_bound_rect.width / img.width));

    canvas.width = canvas_bound_rect.width;
    canvas.height = height;

    // form contours
    for (let c_i = 0; c_i < rooms.length; c_i++) {
        clicked_rooms.push(false);
    }

    // draw polygons
    draw_polygons();

    // display total and selected areas
    display_total_area();
    display_selected_area();
    scale_label.innerHTML = `Scale: ${scale}`;
}

// load image
img.src = img_src;

// set 'click' event
canvas.addEventListener(
    'click',
    function(e) {
        canvas_click(e);
        draw_polygons();
    }
);

continue_btn.addEventListener(
    'click',
    function(e) {
        e.preventDefault();
        
        let is_ok = true;

        if (!any(clicked_rooms)) {
            show_error(alerts, "Select at leasat one room.");
            is_ok = false;
        }
        
        let area = 0;
        for (let c_i = 0; c_i < rooms.length; c_i++) {
            if (clicked_rooms[c_i]) {
                area += calcPolygonArea(rooms[c_i]);
            }
        }
        area *= img.height * img.width / (scale * scale);

        if (is_ok) {
            session_data.area = area;
            window.sessionStorage.setItem("afs_session", JSON.stringify(session_data));

            let form = document.createElement('form');
            form.setAttribute('method', 'POST');
            form.setAttribute('action', '/flooring_type');
            main_content.append(form);
            main_content.querySelector('form').submit();
        }
    }
);

function adjust_scale() {
    scale = parseFloat(adjusted_scale.value);
    scale_label.innerHTML = `Scale: ${scale}`;
    display_total_area();
    display_selected_area();
}

function display_total_area() {
    let area_tot = 0;
    for (let c_i = 0; c_i < rooms.length; c_i++) {
        area_tot += calcPolygonArea(rooms[c_i]);
    }
    area_tot *= img.height * img.width / (scale * scale);
    total_area.innerHTML = `Total area found: ${area_tot.toFixed(2)} m<sup>2</sup>`;
}

function display_selected_area() {
    let area_tot = 0;
    for (let c_i = 0; c_i < rooms.length; c_i++) {
        if (clicked_rooms[c_i]) {
            area_tot += calcPolygonArea(rooms[c_i]);
        }
    }
    area_tot *= img.height * img.width / (scale * scale);
    selected_area.innerHTML = `Selected area: ${area_tot.toFixed(2)} m<sup>2</sup>`;
}

function canvas_click(e) {
    let x, y;

    // Only try to hit detect if there was a click
    if (e) {
        // Localize the click to within the canvas
        const {clientX, clientY, currentTarget} = e;
        const {left, top} = currentTarget.getBoundingClientRect();
        x = clientX - left;
        y = clientY - top;
    }

    let canvas_bound_rect = canvas.getBoundingClientRect();
    let c_width = canvas_bound_rect.width;
    let c_height = canvas_bound_rect.height;

    for (let c_i = 0; c_i < rooms.length; c_i++) {
        ctx.beginPath();
        for (let p_i = 0; p_i < rooms[c_i].length; p_i++) {
            ctx.lineTo(rooms[c_i][p_i][0] * c_width, rooms[c_i][p_i][1] * c_height);

            if (p_i == rooms[c_i].length - 1) {
                ctx.lineTo(rooms[c_i][0][0] * c_width, rooms[c_i][0][1] * c_height);
            }
        }
        ctx.closePath();

        if (ctx.isPointInPath(x, y)) {
            clicked_rooms[c_i] = !clicked_rooms[c_i];
        }
    }
}

function draw_polygons() {
    let canvas_bound_rect = canvas.getBoundingClientRect();
    let c_width = canvas_bound_rect.width;
    let c_height = canvas_bound_rect.height;
    let height = Math.floor(img.height * (canvas_bound_rect.width / img.width));
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas_bound_rect.width, height);

    for (let c_i = 0; c_i < rooms.length; c_i++) {
        ctx.beginPath();
        for (let p_i = 0; p_i < rooms[c_i].length; p_i++) {
            ctx.lineTo(rooms[c_i][p_i][0] * c_width, rooms[c_i][p_i][1] * c_height);

            if (p_i == rooms[c_i].length - 1) {
                ctx.lineTo(rooms[c_i][0][0] * c_width, rooms[c_i][0][1] * c_height);
            }
        }
        ctx.closePath();

        if (clicked_rooms[c_i]) {
            ctx.strokeStyle = "rgba(0, 255, 0, 1.0)";
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
        } else {
            ctx.strokeStyle = "rgba(150, 16, 86, 1.0)";
            ctx.fillStyle = "rgba(150, 16, 86, 0.5)";
        }
        ctx.lineWidth = "1.5";
        ctx.stroke();
        ctx.fill();
    }

    display_total_area();
    display_selected_area();
}

function calcPolygonArea(vertices) {
    var total = 0;

    for (var i = 0, l = vertices.length; i < l; i++) {
      var addX = vertices[i][0];
      var addY = vertices[i == vertices.length - 1 ? 0 : i + 1][1];
      var subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
      var subY = vertices[i][1];

      total += (addX * addY * 0.5);
      total -= (subX * subY * 0.5);
    }

    return Math.abs(total);
}
