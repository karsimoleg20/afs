let tree = JSON.parse(document.getElementById('tree').textContent);
let price = JSON.parse(document.getElementById('price').textContent);

let ui = new UI(tree, price);

ui.draw();
ui.set_interactions();
