String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}
  

class UI {
    constructor(tree, price) {
        // set default state
        this.state = -1;
        this.selection_list = [];
        // try to load state
        this.get_state();
        // selection tree 
        this.tree = tree;
        // price tree
        this.price = price;
        // panel height
        this.panel_height = 30;
        // current tree branch
        this.base_path = '/filters';
        this.current_path = '' + this.base_path;
        this.current_branch = tree;
        for (let i = 0; i < this.state+1; i++) {
            this.current_branch = this.current_branch["values"][this.selection_list[i]];
            this.current_path += `/${this.selection_list[i]}`;
        }
        console.log("Selection list:", this.selection_list);
        console.log("Current branch", this.current_branch);
        // buttons
        this.back_btn = document.querySelector("#back_btn");
        this.continue_btn = document.querySelector("#continue_btn");
        // selection cards
        this.selection_cards = document.querySelector("#selection_cards");
        // help content
        this.help_content = document.querySelector("#help_content");
        // filters
        this.filters = document.querySelector("#filters");
        // alerts
        this.alerts = document.querySelector("#alerts");
    }

    show_error(msg) {
        let err_div = document.createElement('div');
        err_div.className = 'alert alert-danger';
        err_div.appendChild(document.createTextNode(msg));
        this.alerts.appendChild(err_div);
        setTimeout(
            () => {
                err_div.remove();
            },
            3000
        );
    }

    get_height_range() {
        let tree = this.tree;
        let filters = {};
        for (let i = 0; i < this.selection_list.length && tree["values"]; i++) {
            filters[tree["filter_name"]] = this.selection_list[i];
            tree = tree["values"][this.selection_list[i]];
        }
        
        let specification = filters['specification'];

        let heights = [];
        for (let k in this.price['specification'][specification]['price']) {
            let h = k.split('-');
            heights.push(parseFloat(h[0]));
            heights.push(parseFloat(h[1]));
        }
        let max_h = Math.max(...heights);
        let min_h = Math.min(...heights);
        
        return [min_h, max_h];
    }

    get_state() {
        let session_data = window.sessionStorage.getItem("afs_session");

        if( session_data != null ){
            session_data = JSON.parse(session_data);
            if ('state' in session_data) {
                this.state = session_data.state;
            }
            if ('selection_list' in session_data) {
                this.selection_list.push(...session_data.selection_list);
            }
        }
    }

    save_state() {
        let session_data = window.sessionStorage.getItem("afs_session");
        
        if (session_data != null) {
            session_data = JSON.parse(session_data);
        } else {
            session_data = {};
        }

        session_data.state = this.state;
        session_data.selection_list = this.selection_list;
        
        window.sessionStorage.setItem("afs_session", JSON.stringify(session_data));
    }

    clear_state() {
        window.sessionStorage.removeItem('afs_session');
    }

    set_interactions() {
        // button hrefs
        //// back btn
        if (this.state >= 0) {
            this.back_btn.setAttribute("href", this.base_path + '/' + this.selection_list.slice(0, this.state+1).join('/'));
        }

        // cards
        let cards = document.querySelectorAll('.selection-card');
        let curr_path = this.current_path;
        let curr_branch = this.current_branch;
        cards.forEach(function(card){
            card.addEventListener(
                'click',
                function(e){
                    if (!e.target.classList.contains('selection-card-muted')) {
                        // update clicked card
                        e.target.classList.add('selection-card-selected');
                        // update other cards
                        cards.forEach(function(c){
                            if( c !== e.target ){
                                c.classList.remove('selection-card-selected');
                            }
                        });
                        let continue_btn =  document.querySelector("#continue_btn");
                        // make continue btn visible
                        continue_btn.parentElement.parentElement.removeAttribute("style");
                        // continue btn href
                        continue_btn.setAttribute("href", curr_path + `/${e.target.id}`);
                        // update filter
                        document.querySelector(`#${curr_branch["filter_name"]}`).querySelector('.filter-value').innerHTML = e.target.id.replace('_', ' ').capitalize();
                    }
                }
            );
        });

        // buttons on click events
        let _this = this;
        //// back btn
        this.back_btn.addEventListener(
            'click',
            function(e) {
                if (_this.state >= 0) {
                    _this.state -= 1;
                }
                _this.save_state();
            }
        );
        //// continue btn
        this.continue_btn.addEventListener(
            'click',
            function(e) {
                let selected_card = document.querySelector('.selection-card-selected');
                console.log('Selected card id:', selected_card.id);

                if (_this.selection_list.length == _this.state+1) {
                    _this.selection_list.push(selected_card.id);
                } else if (_this.selection_list[_this.state+1] != selected_card.id) {
                    let slice = _this.selection_list.slice(0, _this.state+1);
                    slice.push(selected_card.id);
                    _this.selection_list = slice;
                }
                _this.state += 1;
                _this.save_state();

                if (_this.current_branch["values"][selected_card.id]["values"] === null){
                    e.preventDefault();

                    _this.continue_btn.setAttribute("href", "/height");
                    
                    let h_range = _this.get_height_range();
                    let lower_bound = h_range[0] + _this.panel_height;
                    let upper_bound = h_range[1] + _this.panel_height;

                    let session_data = window.sessionStorage.getItem("afs_session");
                    session_data = JSON.parse(session_data);
                    
                    session_data.lower_bound = lower_bound;
                    session_data.upper_bound = upper_bound;

                    window.sessionStorage.setItem("afs_session", JSON.stringify(session_data));

                    let form = document.createElement('form');
                    form.setAttribute('method', 'POST');
                    form.setAttribute('action', '/height');
                    form.innerHTML +=`
                    <input id="selection_list" name="selection_list" type="hidden" value=${JSON.stringify(_this.selection_list)}>
                    `;
                    _this.selection_cards.appendChild(form);

                    _this.selection_cards.querySelector('form').submit();
                }
            }
        );
    }

    draw(){
        /* Display selection cards */
        // draw buttons correctly
        if( this.state == -1 ) {
            // back btn
            this.back_btn.setAttribute("href", "/");
        }
        this.continue_btn.parentElement.parentElement.setAttribute("style", "display: none;");

        // draw cards
        //// title
        this.selection_cards.innerHTML += `<h2 style="white-space:pre-wrap;">${this.current_branch["title"]}</h2>`;
        //// hr
        this.selection_cards.innerHTML += `
            <div class="sqs-block horizontalrule-block sqs-block-horizontalrule" data-block-type="47">
                <div class="sqs-block-content">
                    <hr>
                </div>
            </div>`;
        //// cards itself
        let card_keys = Object.keys(this.current_branch["values"]);
        let card_names = Object.keys(this.current_branch["values"]);
        for (let i = 0; i < card_keys.length; i++) {
            if ('name' in this.current_branch["values"][card_keys[i]]) {
                card_names[i] = this.current_branch["values"][card_keys[i]]['name'];
            }
        }
        let cards_per_row = 2;
        let small_card_class = "selection-card-small";
        let cards_num = card_keys.length;
        if (cards_num > 4) {
            cards_per_row = 4;
            small_card_class = "selection-card-small";
        }
        let num_rows = Math.floor(cards_num / cards_per_row) + Boolean(cards_num % cards_per_row);
        for (let r = 0; r < num_rows; r++) {
            let row = document.createElement("div");
            row.setAttribute("class", "row sqs-row");
            for (let c = r * cards_per_row; c < Math.min((r + 1) * cards_per_row, cards_num); c++) {
                let card_class = "selection-card";
                row.innerHTML += `
                <div class="col sqs-col-${Math.round(8 / cards_per_row)} span-${Math.round(8 / cards_per_row)}" data-alignment="center">
                    <div class="sqs-block-content ${card_class} ${small_card_class}" id="${card_keys[c]}">
                        ${card_names[c].replace('_', ' ').capitalize()}
                    </div>
                </div>`;
            }
            this.selection_cards.appendChild(row);
        }
        // select one of the cards if history is available
        if (this.selection_list.length != 0 && this.selection_list.length > this.state+1) {
            document.querySelector(`#${this.selection_list[this.state+1]}`).classList.add("selection-card-selected");
            this.continue_btn.parentElement.parentElement.removeAttribute("style");
            this.continue_btn.setAttribute("href", this.current_path + `/${this.selection_list[this.state+1]}`);
        }
        //// hr
        this.selection_cards.innerHTML += `
            <div class="sqs-block horizontalrule-block sqs-block-horizontalrule" data-block-type="47">
                <div class="sqs-block-content">
                    <hr>
                </div>
            </div>`;
        
        // draw filters
        //// title
        this.filters.innerHTML += '<h1 style="white-space:pre-wrap; margin-left: 20px;">Your selecion</h1>';
        //// filters itself
        let curr_branch = this.tree;
        for (let i = 0; i < this.state+1; i++) {
            this.filters.innerHTML += `
                <div class="row sqs-row cell-selected" id="${curr_branch["filter_name"]}">
                    <div class="col sqs-col-2 span-2 filter-title-selected" data-alignment="center">${curr_branch["filter_name"].replace('_', ' ').capitalize()}</div>
                    <div class="col sqs-col-2 span-2 filter-value-selected" data-alignment="center">${this.selection_list[i].replace('_', ' ').capitalize()}</div>
                </div>
            `;
            curr_branch = curr_branch["values"][this.selection_list[i]];
        }
        if (this.selection_list.length != 0 && this.selection_list.length > this.state+1) {
            this.filters.innerHTML += `
                <div class="row sqs-row cell-active" id="${curr_branch["filter_name"]}">
                    <div class="col sqs-col-2 span-2 filter-title" data-alignment="center">${curr_branch["filter_name"].replace('_', ' ').capitalize()}</div>
                    <div class="col sqs-col-2 span-2 filter-value" data-alignment="center">${this.selection_list[this.state+1].replace('_', ' ').capitalize()}</div>
                </div>
            `;
        } else {
            this.filters.innerHTML += `
                <div class="row sqs-row cell-active" id="${curr_branch["filter_name"]}">
                    <div class="col sqs-col-2 span-2 filter-title" data-alignment="center">${curr_branch["filter_name"].replace('_', ' ').capitalize()}</div>
                    <div class="col sqs-col-2 span-2 filter-value" data-alignment="center">All</div>
                </div>
            `;
        }
        
        // draw help
        for (let value in this.current_branch["values"]) {
            this.help_content.innerHTML += `
                <div>
                    <div style="border-bottom: 1px solid black;">
                        <b>${value.replace('_', ' ').capitalize()}</b>
                    </div>
                </div>
                <p>${this.current_branch["values"][value]["help"]}</p>
            `;
        }
    }
}