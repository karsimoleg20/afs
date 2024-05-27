let scale = parseFloat(document.getElementById('scale').textContent);
let errs = JSON.parse(document.getElementById('errs').textContent);
let img_src = JSON.parse(document.getElementById('img_src').textContent);

if (img_src != null) {
    img_src = img_src['img'];
}

let main_content = document.querySelector('#main_content');
let selected_area = document.querySelector('#selected_area');
let scale_label = document.getElementById('scale_label');
let adjusted_scale = document.getElementById('adjusted_scale');
let canvas = document.getElementById('canvas');
let undo_btn = document.querySelector('#undo_btn');

let alerts = document.querySelector('#alerts');
let back_btn = document.querySelector('#back_btn');
let floor_area_btn = document.querySelector('#floor_area_btn');
let continue_btn = document.querySelector('#continue_btn');

let session_data = window.sessionStorage.getItem("afs_session");

let rooms = [];
let perimeter = [];

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

img.onload = function() {
    let canvas_bound_rect = canvas.getBoundingClientRect();
    let height = Math.floor(img.height * (canvas_bound_rect.width / img.width));

    canvas.width = canvas_bound_rect.width;
    canvas.height = height;

    // draw polygons
    draw_polygons();

    // display total area
    display_selected_area();
    scale_label.innerHTML = `Scale: ${scale}`;
}

// load image
img.src = img_src;

undo_btn.addEventListener(
    'click',
    function(e) {
        if (perimeter.length != 0) {
            perimeter = [];
        } else if (rooms.length != 0) {
            rooms.pop();
        }
        draw_polygons();
    }
);

continue_btn.addEventListener(
    'click',
    function(e) {
        e.preventDefault();
        
        let is_ok = true;

        if (rooms.length == 0) {
            show_error(alerts, "Select at leasat one room.");
            is_ok = false;
        }
        
        let area = 0;
        for (let c_i = 0; c_i < rooms.length; c_i++) {
            area += calcPolygonArea(rooms[c_i]);
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
    display_selected_area();
}

function display_selected_area() {
    let area_tot = 0;
    for (let c_i = 0; c_i < rooms.length; c_i++) {
        area_tot += calcPolygonArea(rooms[c_i]);
    }
    area_tot *= img.height * img.width / (scale * scale);
    selected_area.innerHTML = `Selected area: ${area_tot.toFixed(2)} m<sup>2</sup>`;
}

function canvas_click(e) {
    e.preventDefault();

    var rect, x, y;

    if (e.button === 2) {

        if (perimeter.length == 2) {
            alert('You need at least three points for a polygon');
            return false;
        }

        x = perimeter[0][0];
        y = perimeter[0][1];

        if (check_intersect(x, y)) {
            alert('The line you are drowing intersect another line');
            return false;
        }

        rooms.push(perimeter);
        perimeter = [];
    } else {
        rect = canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        
        let c_width = rect.width;
        let c_height = rect.height;
        
        if (perimeter.length > 0 && x == perimeter[perimeter.length-1][0] * c_width && y == perimeter[perimeter.length-1][1] * c_height) {
            // same point - double click
            return false;
        }

        if( check_intersect(x / c_width, y / c_height) ){
            alert('The line you are drowing intersect another line');
            return false;
        }

        perimeter.push([x / c_width, y / c_height]);
    }
    draw_polygons();
    draw_contour();
    return false;
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
        ctx.strokeStyle = "rgba(0, 255, 0, 1.0)";
        ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
        ctx.lineWidth = "1.5";
        ctx.stroke();
        ctx.fill();
    }

    display_selected_area();
}

function draw_contour() {
    let canvas_bound_rect = canvas.getBoundingClientRect();
    let c_width = canvas_bound_rect.width;
    let c_height = canvas_bound_rect.height;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0, 255, 0, 1.0)";
    ctx.lineCap = "square";
    ctx.beginPath();

    for (let i = 0; i < perimeter.length; i++) {
        if (i == 0) {
            ctx.moveTo(perimeter[i][0] * c_width, perimeter[i][1] * c_height);
        } else {
            ctx.lineTo(perimeter[i][0] * c_width, perimeter[i][1] * c_height);
        }
        draw_point(perimeter[i][0] * c_width, perimeter[i][1] * c_height);
    }

    ctx.stroke();
}

function draw_point(x,  y) {
    ctx.fillStyle="rgba(0, 255, 0, 1.0)";
    ctx.strokeStyle = "rgba(0, 255, 0, 1.0)";
    ctx.fillRect(x-2, y-2, 4, 4);
    ctx.moveTo(x, y);
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

function line_intersects(p0, p1, p2, p3) {
    let s1_x = p1[0] - p0[0];
    let s1_y = p1[1] - p0[1];
    let s2_x = p3[0] - p2[0];
    let s2_y = p3[1] - p2[1];

    let s = (-s1_y * (p0[0] - p2[0]) + s1_x * (p0[1] - p2[1])) / (-s2_x * s1_y + s1_x * s2_y);
    let t = ( s2_x * (p0[1] - p2[1]) - s2_y * (p0[0] - p2[0])) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        return true;
    }

    return false;
}

function check_intersect(x, y){
    if(perimeter.length < 4){
        return false;
    }

    let p2 = [perimeter[perimeter.length-1][0], perimeter[perimeter.length-1][1]];
    let p3 = [x, y];

    for (let i = 0; i < perimeter.length-1; i++) {
        let p0 = [perimeter[i][0], perimeter[i][1]];
        let p1 = [perimeter[i+1][0], perimeter[i+1][1]];

        if (p1[0] == p2[0] && p1[1] == p2[1]) { continue; }
        if (p0[0] == p3[0] && p0[1] == p3[1]) { continue; }

        if( line_intersects(p0, p1, p2, p3) ){
            return true;
        }
    }

    return false;
}
