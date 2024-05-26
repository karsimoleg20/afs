function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
}


function show_error(alerts_block, msg) {
    let err_div = document.createElement('div');
    err_div.className = 'alert alert-danger';
    err_div.appendChild(document.createTextNode(msg));
    alerts_block.appendChild(err_div);
    setTimeout(
        () => {
            err_div.remove();
        },
        3000
    );
}

function any(iterable) {
    for (var index = 0; index < iterable.length; index++) {
        if (iterable[index]) return true;
    }
    return false;
}
