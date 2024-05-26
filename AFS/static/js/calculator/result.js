window.sessionStorage.removeItem('afs_session');

let coll = document.querySelector(".collapsible");

coll.addEventListener(
    "click",
    function(e) {
        let plus_minus = document.querySelector("#plus-minus");
        if (plus_minus.classList.contains('plus')) {
            plus_minus.innerHTML = `<i class="fas fa-minus" aria-hidden="true"></i>`;
            plus_minus.classList.replace('plus', 'minus');
        } else {
            plus_minus.innerHTML = `<i class="fas fa-plus" aria-hidden="true"></i>`;
            plus_minus.classList.replace('minus', 'plus');
        }

        let content = document.querySelector(".content");
        if (content.style.maxHeight){
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
});

 let contact_btn = document.querySelector('#contact');

 contact_btn.addEventListener(
     'click',
     function(e) {
        e.preventDefault();
        let calc_input = document.querySelector('#calculations');
        let calculations = JSON.parse(calc_input.value);
        let subject = calculations.selection_chain;
        let report = generate_report(calculations);
        let url = `https://www.accessflooring-systems.com/contact?subject=${subject}&report=${encodeURIComponent(report)}`;
        window.location.href = url;
     }
 );

function generate_report(calculations) {
    let report = `

===================================================
Price Estimate, USD
===================================================
                    
                    Supply & Install          Supply only

    Materials       ${calculations.supply_only}             ${calculations.supply_only}
    --------------------------------------------------------------
      Panels        ${calculations.panel_price}             ${calculations.panel_price}
      Pedestals     ${calculations.pedestal_price}          ${calculations.pedestal_price}
      Adhesive      ${calculations.adhesive_price}          ${calculations.adhesive_price}
      Neoprene      ${calculations.neoprene_price}          ${calculations.neoprene_price}
      Silver tape   ${calculations.silver_tape_price}       ${calculations.silver_tape_price}
      Caps          ${calculations.caps_price}              ${calculations.caps_price}
      Delivery      ${calculations.delivery_price}          ${calculations.delivery_price}
    --------------------------------------------------------------
    Labor           ${calculations.labor_price}             0
------------------------------------------------------------------
    Total           ${calculations.supply_install}          ${calculations.supply_only}
    Price per m2    ${calculations.price_per_m2_supp_inst}  ${calculations.price_per_m2_supp_only}

===================================================
    Floor finished height    ${calculations.height} mm
    Total area               ${calculations.area} m2
===================================================
    `;
    return report;
}
