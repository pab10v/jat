/* tbl.js 
* Just Another Table script in Javascript for HTML apps
* 
* MIT License
* by Javier Valle artesanous@gmail.com
* 
*/
    "use strict";
    class jsgrid {

        options = {                                 //some options
            style: 'tblr',                 //basic, tbl, tblcontainer, simple, tblr
            customIndex: true,
            colIndex: 'project_id',
            resizeable: true,                       //provides resize-able columns
            selectClass: 'rowselected',             //class to highlight selected row
            sortedClass: 'sorted',                  //class to highlight sorted column
            behave: 'destructive',                  //destructive, aditive,

            /* table behaviour */
            gutter: { background: 'gray', opacity: 4 },
            livedrag: true,                         //only live available for now
            sortable: true,
            search: true,

            i18n: 'es',
            stylize: 'internal',                    //internal: elements created with 

            numberFormat: true,                     //format number
            numberLocal: 'en-US',
            wraptext: false,

            footer: true,                           //show footer
            stickyfooter: true,                     //fix footer to container :TODO

            //callBack functions
            onRowSelected: this.returnRow,
        }

        drag = {
            gutter: undefined,                      //resize gutter selected
            current: undefined,                     //current gutter clicked
            sibling: undefined,                     //next header
            currWidth: undefined,                   //width of current header
            nextWidth: undefined,                   //next header width 
            position: 0,                            //pointer position
            offset: 0,                              //offset movement
        }

        sort = {                                    //headers control when sorting
            field: undefined,                       //field sorted
            sort: undefined,                        //order sorted
            previousField: undefined,
        }
        //filter
        search = {
            field: undefined,
            type: 'string'
        }

        pager = {
            page: 1,                                //actual page
            pages: undefined,                       //number of pages
        }

        rowHighlighted = null;                      // row selected
        dome = null;                                //the object parent of 'this'

        constructor(dome, data, params) {
            this.init(dome, params)

            this.headers = data.headers;            //headers ={nane:'any', title:'any', style:{CSSRule:cssText}}
            this.rows = data.rows;                  //data provided

            this.populate();                        //populate rows
            this.toolbar();
            this.footTable();
            this.resizeable();                      //if 'resize' option is true (default: true)
            this.sortable();                        //if 'sortable' option is true (default: true)

            this.adjustColumns();

            window.addEventListener('resize', this.adjustTable.bind(this), true);
        }

        adjustTable(e) {
            //this.fixTableSize();
            this.adjustColumns();
            this.pagination();

        }

        init(dome, params) {
            this.setDom(dome);
            this.id = this.randomString();          //id of 'this'

            this.setOptions(params);
            this.createTableStructure();                        //create table + thead + tbody + tfoot
        }
        /*   createTableStructure(): 
        *       creates all objects needed in 'this':
        *         tblContainer->table[head, body, footer]
        */
        createTableStructure() {
            this.tblContainer = document.createElement("div");          //Everything goes here
            this.tblContainer.id = 'tblcontainer';

            this.stylize(this.tblContainer, { width: '99.8%', maxWidth: '99.9%', });

            this.table = document.createElement('table');               //table structure
            this.head = this.table.createTHead();
            this.body = this.table.createTBody();
            this.footer = this.table.createTFoot();

            this.table.id = "jsgrid-table";
            this.head.id = 'jsgrid-head';
            this.body.id = "jsgrid-body";
            this.footer.id = "jsgrid-footer";

            this.tblBox = this.table;
            this.tblContainer.appendChild(this.table);                  //attach table to container
            this.dome.appendChild(this.tblContainer);                   //attach container to dome

            this.tblContainer.classList.add(this.options.style);

            if (this.options.i18n) {
                this.lang = this.options.i18n;
                this.text = this.i18n[this.lang];
            }
        }
        setDom(dome) {
            this.dome = dome;                       //object caller
            this.stylize(this.dome, {
                height: '100% !important',
                width: '100% !important',
                position: 'relative'
            });

            if (this.options.behave === 'destructive') {
                this.dome.textContent = '';
            }
        }
        /* addHeaders():
          parse the parameter 'data.headers' and creates nodes 'th' in the 'thead' object
        */
        addHeaders() {
            const view = this.tblContainer.getBoundingClientRect();
            const tr = this.head.insertRow();

            this.headers.forEach(function (header) {
                let th = document.createElement('th');                  //identifying headers

                th.id = header.name;
                header.style.width = this.thWidth(header, view.width);

                this.stylize(th, { display: header.style.display, width: header.style.width, });

                th.appendChild(document.createTextNode(header.title));
                tr.appendChild(th);

            }, this);

        }
        /* populate(): populate the table with 'data.rows'
        *
        */
        populate() {
            var viewport = window.visualViewport;
            this.addHeaders();

            let isSmallScreen = this.viewCategory(viewport.width) == 'small';

            this.rows.forEach(function (row, rowIndex, arr) {           //parse row/data
                const tr = this.body.insertRow();                       //create each row

                tr.id = this.options.customIndex ? row[this.options.colIndex] : rowIndex;
                tr.setAttribute('internal', this.randomString());

                this.headers.forEach(function (header) {                    //parse cells
                    let td = tr.insertCell();
                    td.id = header.name;

                    let data = row[header.name];
                    td.title = data;
                    this.stylize(td, header.style);

                    td.appendChild(document.createTextNode(data));

                    if (this.options['wraptext'] || isSmallScreen) {
                        this.stylize(td, this.styles['tdwrap']);
                    }

                    if (this.isAnNumber(data)) {
                        td.style.textAlign = 'right';
                        td.innerHTML = this.formatData(td.innerHTML);
                    }

                }, this);

                if (rowIndex === 0) {
                    this.setSelectedRow(tr);
                }

                tr.classList.add((rowIndex % 2) === 0 ? 'even' : 'odd');
                tr.addEventListener("click", this.clickOnRow.bind(this), false);

            }, this)


        }//populate ends



        fixTableSize() {
            var viewport = window.visualViewport;
            const dom = this.dome.clientHeight;

            const footer = this.pager.statusbar ? this.pager.statusbar.clientHeight : 40;
            const offset = 80;
            let tools = this.getMaxSizeInChildren(this.tools, 'clientHeight') || 0;
            const tblContainerSize = `${100 * ((dom - tools) / dom)}%`;
            const tblSize = `${100 * ((dom - tools) - (footer + offset)) / (dom - tools)}%`;

            this.stylize(this.tblContainer, {
                width: '99.5% !important',
                height: `${tblContainerSize}`,
                margin: '0.5em auto 0.5em',
            });

            this.stylize(this.tblBox, {
                width: '98.5% !important',
                height: `${tblSize}`,
                margin: '0 auto 0',
            });


        }
        /*
         * return an array of value in object.field
         */
        getMaxSizeInChildren(obj, property) {
            if (!obj || !obj.hasChildNodes())
                return false;

            let valuesArray = Array.prototype.map.call(obj.children, function (el) { return el[property] });
            return Math.max(...valuesArray);
        }
        /****************************************************************
         * footer:
         * add the footer to the table
         */
        footTable = function () {

            if (this.options.footer) {

                if (this.options.stickyfooter) {
                    //this.tblContainer.appendChild(this.addFixPagerBar());
                    this.table.after(this.addFixPagerBar());
                } else {
                    this.footer.appendChild(this.addPagerBar());
                }

                this.pagination();
            }
        }

        /*
         *
        */
        addPagerBar() {
            let trpager = document.createElement('tr');        //create te row in the footer
            let tdPager = trpager.insertCell();

            this.setElement(trpager, { name: 'trpager', id: 'trpager', className: 'trpager' });
            this.setElement(tdPager, { name: 'tdpager', id: 'tdpager', className: 'tdpager' });

            this.stylize(trpager, this.styles['trpager']);
            this.stylize(tdPager, this.styles['tdpager']);

            tdPager.setAttribute('colspan', this.headers.length);

            this.pager.statusbar = document.createElement('div');
            this.pager.statusbar.id = 'paginationStatus';
            tdPager.appendChild(this.pager.statusbar);

            this.pager.statusbar.appendChild(this.addPagerMessages(''));
            this.pager.statusbar.appendChild(this.addButtons());

            return trpager;
        }

        addFixPagerBar() {
            this.pager.statusbar = document.createElement('div');

            this.setElement(this.pager.statusbar, { id: 'paginationStatus' });
            this.stylize(this.pager.statusbar, this.styles['statusbar']);

            this.pager.statusbar.appendChild(this.addPagerMessages(''));
            this.pager.statusbar.appendChild(this.addButtons());

            return this.pager.statusbar;
        }

        /**
         * 
         */
        addButtons() {
            let buttonSpan = document.createElement('span');
            buttonSpan.id = 'pager-buttons';

            let butttonPrevious = this.addButton('prev', 'previous');
            let butttonNext = this.addButton('next', 'next');

            buttonSpan.appendChild(butttonPrevious);
            buttonSpan.appendChild(butttonNext);

            butttonPrevious.style.display = 'none';
            butttonNext.style.display = this.pager.pages == 1 ? 'none' : '';

            this.pager.prev = butttonPrevious;
            this.pager.next = butttonNext;

            return buttonSpan;
        }
        /** 
         * 
        */
        addButton = function (textbtn, dir) {
            let btn = document.createElement("BUTTON");
            this.stylize(btn, this.styles['pagerbotton']);

            this.setElement(btn, { name: dir, id: dir, className: dir });
            btn.addEventListener('click', this.movePages.bind(this), false);

            let t = document.createTextNode(this.msg(textbtn));

            btn.appendChild(t);

            return btn;
        }
        /**
         * 
         * **/
        addPagerMessages = function (pagerText) {
            let pagerMessages = document.createElement('span');
            pagerMessages.innerHTML = pagerText || '';

            this.setElement(pagerMessages, { name: 'pager-message', id: 'pager-message', className: 'pager-message' });
            this.stylize(pagerMessages, this.styles['pagermessage']);

            this.pager.messages = pagerMessages; //pointer to messages

            return pagerMessages;
        }
        /**
         * filter pages and show the first 1
         * @returns 
         */
        pagination = function () {
            let rowHeight = this.body.firstChild.offsetHeight ? this.body.firstChild.offsetHeight : 32;
            let pages = 1;

            let containerHead = this.getMaxSizeInChildren(this.tools, 'clientHeight');
            let pageView = this.tblContainer.clientHeight - containerHead;

            this.pager.rowsPerPage = Math.floor(pageView / rowHeight) - 1;
            this.pager.totalRows = this.body.rows.length;

            this.pager.pages = Math.ceil(this.pager.totalRows / this.pager.rowsPerPage);

            if (this.pager.pages == 1)
                return;

            var filtered = Array.prototype.map.call(this.body.rows, function (tr, idx) {

                tr.style.display = (pages !== 1 ? 'none' : '');    //show first page

                this.removeClassByPrefix(tr, 'page_');             //depagination: remove any class starting with 'page_'
                this.addClass(tr, `page_${pages}`);                //pagination: add class with page number

                if (((idx + 1) % this.pager.rowsPerPage) == 0) {
                    pages++;
                }
                //add zebra class
                tr.classList.add((idx % 2) === 0 ? 'even' : 'odd');

            }, this);

            this.pager.pages = pages;
            this.pager.page = 1;
            this.pager.showing = 1;

            this.updatePagerMessage();

        }

        /**
         * movePages when clicked
         * @param {*} event 
         */
        movePages = function (event) {
            let target = event.currentTarget;

            this.pager.page = target.id === 'previous' ? this.prevPage() : this.nextPage();
            this.updatePagerMessage();

            if (this.inRange(this.pager.page, 1, this.pager.pages)) {
                this.hideActivePage();
                this.showSelectedPage();
            }

        }

        /* addPagerMessage()
        *
        */
        updatePagerMessage() {

            /* update buttons */
            this.pager.prev.style.display = this.pager.page <= 1 ? 'none' : '';
            this.pager.next.style.display = this.pager.page >= this.pager.pages ? 'none' : '';

            /* update counter of pages visited */
            let msg = `${this.msg('page')} ${this.pager.page} ${this.msg('of')} ${this.pager.pages}`;
            this.pager.messages.innerHTML = msg;

        }

        /***/
        /*  just a filter to: hide the actual page in the table
        */
        hideActivePage() {
            var filtered = Array.prototype.map.call(this.body.rows, function (tr) {
                if (tr.classList.contains(`page_${this.pager.showing}`)) {
                    tr.style.display = 'none';
                }
            }, this);
        }

        /* just a filter to: show the selected page
         *
         **/
        showSelectedPage() {
            var filtered = Array.prototype.map.call(this.body.rows, function (tr) {
                if (tr.classList.contains(`page_${this.pager.page}`)) {
                    tr.style.display = '';
                }
            }, this);

            this.pager.showing = this.pager.page;
        }
        /**
         * 
         * @returns 
         */
        nextPage = function () {
            return (this.pager.page + 1) > this.pager.pages ? this.pager.pages : this.pager.page + 1;
        }
        /*
         * 
         ***/
        prevPage() {
            return (this.pager.page - 1) < 1 ? 1 : this.pager.page - 1;
        }
        /**
         * 
         * ***/
        selectClass = function () {             //Selected class can be defined in external css file
            return (Object.hasOwn(this.options, 'selectClass') ? this.options.selectClass : 'selected');
        }

        setSelectedRow = function (tr) {
            this.rowHighlighted = tr;

            tr.classList.toggle(this.options.selectClass);
            tr.setAttribute('selected', 'selected');
        }//ssr end

        setUnselectedRow = function (tr) {
            tr.classList.toggle(this.options.selectClass);          //toggle 'selected' attribute
            tr.setAttribute('selected', '');
        }

        /*onRowClick over TR */
        clickOnRow = function (e) {
            e.preventDefault();

            let cellClicked = (e.target || e.srcElement);                           //event triggerer
            let rowClicked = e.currentTarget;                                       //event owner

            let rowData = rowClicked.cells;                                        //data in the row selected    
            let colValue = rowData[cellClicked.cellIndex].innerText;               //cell value

            /* ON ROW SELECTED  */
            this.options.onRowSelected(this.getRowByindex(rowData));                //return json data
            /*************************************************************/

            this.setUnselectedRow(this.rowHighlighted);
            this.setSelectedRow(rowClicked);

            return false;
        }
        /** returnRow = this.options.onRowSelected
         * @returns arr
         */
        returnRow(rowData) {
            console.log(rowData);
        }
        /**
         * 
         * @param {*} rowData 
         * @param {*} dataType 
         * @returns json array
         */
        getRowByindex(rowData, dataType = 'json') {
            var arr = [];

            Object.entries(rowData).forEach(function (elem, idx) {
                let [key, td] = elem;
                arr.push({ [td.id]: td.innerText });
            }, this);

            //JSON.parse(JSON.stringify(arr)
            //return (dataType == 'json') ? JSON.stringify(arr) : arr;
            return arr;

        }
        /*
        *
        */
        adjustColumns() {
            const view = this.dome.clientWidth;
            const viewport = window.visualViewport;

            const headers = this.head.firstElementChild;

            let thWidths = Array.prototype
                .reduce.call(headers.children, (acc, th) => acc + th.clientWidth, 0);

            let showInPx = false;
            let liveHeaders = Array.prototype
                .map.call(headers.children, (th) => {
                    let pcWidth = (th.clientWidth / thWidths) * view;
                    let pxWidth = (th.clientWidth / thWidths) * 100;

                    th.style.width = showInPx ? `${pxWidth}px` : `${pcWidth}px`;

                });

        }

        thWidth = function (elem, viewWidth, defaultWidth = '20px') {
            let width = elem.style.width || defaultWidth;

            width = elem.display == 'none' ? 0 : width;

            return width.indexOf('%') >= 0
                ? `${(parseInt(width) / 100) * parseInt(viewWidth)}px`
                : width;

        }

        setOptions = function (userArgs) {
            this.options = Object.assign(this.options, userArgs); //override options
            //this.options = { ...this.options, ...args };

            this.options.customIndex = Object.hasOwn(this.options, 'colIndex');

            if (this.sets('selectClass') == null) {
                this.options.selectClass = 'selected';
            }
        }
        /******************************************************************
         * Tool box
         * 
         ********************************************************************/
        toolbar = function () {
            //create tool bar 
            this.tools = document.createElement('div');
            this.tools.appendChild(this.leftTools());

            this.setElement(this.tools, { name: 'tools', id: 'tools', className: 'tools' });
            this.setIconTool();

            if (this.options.search) {                  //options.search is true
                this.search.box = this.searchInput(this);
                this.tools.appendChild(this.search.box);
            }

            this.dome.prepend(this.tools);              //put the toos over the grid

        }

        setIconTool = function () {
            const icons = {
                'filter': { icon: this.images['filter'], style: this.styles['icontools'], title: this.msg('toolsfilter') },
                'fields': { icon: this.images['fields'], style: this.styles['icontools'], title: this.msg('toolsfields') },
            };

            if (this.tools.hasChildNodes()) {
                let bar = this.tools.children.namedItem('tabletools');

                Object.entries(icons).forEach(icon => {
                    const [key, img] = icon;
                    let box = document.createElement('div');

                    this.setElement(box, { id: key, name: key, className: key, title: img.title, });
                    box.innerHTML = this.images[key];

                    box.addEventListener('click', this.iconExe.bind(this));

                    this.stylize(box, this.styles['icontools']);
                    bar.appendChild(box);
                });
            }
        }

        iconExe = function (event) {
            const target = event.currentTarget;
            let toolsbar = this.tools.children.namedItem('tabletools');

            switch (target.id) {

                case 'filter':
                    let search = this.search.box;
                    search.style.display = search.style.display == 'none' ? '' : 'none';
                    break;

                case 'fields':
                    this.fieldList(target);
                    break;

            }

        }
        /********************************************************************
        * field list
        */
        fieldList = function (element) {
            let toggler = this.dome.children.namedItem('boxlist');

            if (!toggler) {

                let box = document.createElement('div');                //outer box
                let close = document.createElement('span');             //title box

                this.setElement(box, { name: 'boxlist', id: 'boxlist', className: 'boxlist', });
                this.setElement(close, { id: 'close', className: 'close', });

                close.innerHTML = this.images['hide'];                  //close buton
                close.addEventListener('click', this.fieldsCloseEvent.bind(this));

                box.addEventListener('mouseout', this.fieldsMouseOut.bind(this));

                this.stylize(close, { width: '16px', float: 'right', });
                box.appendChild(close);                                 //close 

                let boxTitle = document.createElement('div');           //title
                boxTitle.innerHTML = this.msg('boxtitle');              //'Toggle fields'

                this.stylize(boxTitle, { borderBottom: 'solid 1px #0000001a', marginTop: '-12px', });
                box.appendChild(boxTitle);

                const ul = document.createElement('ul');                //create list of fields

                this.headers.forEach(function (header, index, list) {   //parse array of headers
                    ul.appendChild(this.fieldBox(header, index, this));
                }, this);

                this.stylize(ul, this.styles['checkboxes']);
                let bar = this.tools.children.namedItem('tabletools'); //calculate position
                this.stylize(box, {
                    left: this.valToPx(bar.offsetWidth + bar.offsetLeft),
                    top: this.valToPx(bar.offsetHeight + bar.offsetTop)
                });

                box.appendChild(ul);
                this.dome.appendChild(box);
                box.style.width = this.valToPx(box.offsetWidth * 1.2);

            } else {
                toggler.style.display = 'block';
            }
            //trigger this event once, when box-selector has been activated
            document.addEventListener('keydown', this.keyPressed.bind(this), { passive: true, once: true, });
        }

        /*******************************************************************************
         * fieldBox: create the box and the field for the field selector
         * 
        **/
        fieldBox = function (header, colIndex, jst) {
            const li = document.createElement("li");
            const checkbox = document.createElement('input');
            const label = document.createElement('label');

            checkbox.type = "checkbox";
            checkbox.name = header.name;
            checkbox.value = colIndex;
            checkbox.id = header.name;
            checkbox.checked = header.style.display !== 'none' ? true : false;
            checkbox.addEventListener("click", this.fieldSelector.bind(jst));

            label.htmlFor = header.name;
            label.appendChild(document.createTextNode(header.name));
            label.style.paddingLeft = '5px';

            li.appendChild(checkbox);
            li.appendChild(label);
            return li;
        }
        /*******************************************************************************
         * fieldBox: create the box and the field for the field selector
         * 
        **/
        fieldSelector = function (event) {
            event.stopPropagation();
            const target = event.currentTarget;
            const colIndex = parseInt(target.value);                        //column index
            const clientHeader = this.headers[colIndex];                    //cell object
            const headersOnTable = this.getNamedHeaderById(target.name);

            /* hide headers */
            clientHeader.style.display = !target.checked ? 'none' : '';      //update on headers list
            headersOnTable.style.display = !target.checked ? 'none' : '';    //hide header

            const width = this.safeParseInt(clientHeader.style.width);      //header width

            if (target.checked && !width) {         //update headers width on array
                clientHeader.style.width = !width ? '20px' : this.valToPx(width);
                headersOnTable.style.width = !width ? '20px' : this.valToPx(width);
            }

            let rows = this.body.children;

            var filtered = Array.prototype.map.call(rows, function (tr, index) {
                tr.cells.namedItem(target.name).style.display = clientHeader.style.display;
            }, this);

        }
        /* ****************************************************************************
         * Clicked close box of fields/columns 
        */
        fieldsMouseOut = function (e) {
            const target = e.currentTarget;
            //const closest = target.closest('boxlist');
            const b = target.getBoundingClientRect();       //boundries
            const pX = e.clientX;
            const pY = e.clientY;

            if (!this.inRange(pX, b.left + 1, b.right - 1) || !this.inRange(pY, b.top - 1, b.bottom - 1)) {
                e.currentTarget.style.display = 'none';
            }

        }
        /* inRange: a value is in a range
        */
        inRange = function (val, min, max) {
            return ((parseFloat(val) - parseFloat(min)) * (parseFloat(val) - parseFloat(max)) <= 0);
        }

        fieldsCloseEvent = function (event) {
            const target = event.currentTarget;

            if (target.id == 'close')
                target.parentNode.style.display = 'none';

            if (target.id == 'boxlist')
                target.currentTarget.style.display = 'none';

        }

        /*******************************************************************************
        * getNamedHeader: get object of a table Header given its Id
        * 
        * */
        getNamedHeaderById = function (headerId) {
            return this.head.firstChild.cells.namedItem(headerId);
        }

        getIdHeaderByName = function (fieldName) {
            let index = 0;
            Object.keys(this.headers).forEach(function (key, idx) {
                if (key == fieldName) return idx;
                //index++;
            });

            return null;
        }

        toggle(checked) {
            var elm = document.getElementById('checkbox');
            if (checked != elm.checked) {
                elm.click();
            }
        }

        /**************************************************
         * searchFieldOnKeyUpEvent 
         * filter table 
        */
        searchFieldOnKeyUpEvent = function (event) {
            let keyPressed = event.code;
            let input = event.currentTarget.value;
            let data = this.rows;

            if (keyPressed == 'Escape') { //clean input if ESC pressed
                input = '';
                event.currentTarget.value = input;
            }

            this.filterBody(input);

            if (this.options.footer) {
                this.pager.statusbar.style.display = input ? 'none' : ''; //hide pagination

                if (!input) {
                    this.pagination();
                }

            }

        }
        /** Filter rows in the table for pagination
         * 
         * 
         */
        filterBody = function (filterValue) {
            const op = this.search.oper;

            let data = this.rows;
            let operation = this.compare[op];

            return this.sort.filtered = data.filter(function (row, index) {
                let selected = false;
                let a = row[this.search.field], b = filterValue;

                switch (this.search.type) {
                    case 'date':
                        //a = new Date(this.getDateFromString(a)); //todo: pending
                        //b = new Date(this.getDateFromString(b));
                        break;

                    case 'string':
                        a = a.toLowerCase();
                        b = b.toLowerCase();

                        break;

                    case 'number':
                        a = parseFloat(a);
                        b = parseFloat(b);

                        break;

                    default:

                }

                selected = operation(a, b);
                this.body.rows[index].style.display = !selected ? 'none' : '';  //just hide the row not selected

                return !selected;        /* keep record of hidden rows */
            }, this);

        }

        /**
         * arrayFromTable:
         * @tBodyContainer is tbody
         * @return an 2d array
         */
        arrayFromTable = function (tBodyContainer) {
            //container.replaceChildren(...arrayOfNewChildren);
            //let table = document.getElementById('tbody').children;
            return Array.prototype.map.call(tBodyContainer, function (tr) {
                return Array.prototype.map.call(tr.children, function (td) {
                    return td.innerHTML;
                });
            });
        }
        /**
         * @param {*} arr 
         * @param {*} headers 
         * @returns {tbody} body
         */
        populateTBody = function (arr, tbody, sortedColumn, useCustomClass = true) {
            let rows = this.body.children;
            let bgEven = '';

            Array.prototype.map.call(rows, function (tr, idx) {
                const row = arr[idx];

                this.removeClassByPrefix(tr, 'page_');      //remove pages
                tr.classList.remove('odd', 'even');         //remove zebra
                tr.style.display = '';                      //make all rows visibles

                Array.prototype.map.call(this.headers, function (header, jdx) {
                    let cell = tr.cells.namedItem(header.name);

                    cell.innerHTML = row[header.name];
                    cell.classList.remove(useCustomClass ? this.options.sortedClass : 'sorted');

                    if (sortedColumn === header.name) {
                        cell.classList.add(useCustomClass ? this.options.sortedClass : 'sorted');
                    }

                }, this)

            }, this)

            return tbody;
        }
        /****************************************************************
         * test data types for: date, string, number
         * work in progress
         ****/
        getTypeOf = function (str) {
            return this.getDateFromString(str) !== null
                ? 'date'
                : (this.isAnNumber(str) ? 'number' : 'string');
        }
        /*****************************************************************
         * 
         * **************************************************************/
        leftTools = function () {
            let leftDiv = document.createElement('div');

            leftDiv.classList.add('tabletools');
            leftDiv.id = 'tabletools';
            this.stylize(leftDiv, this.styles['tabletools']);

            return leftDiv;
        }

        /******************************************************************
         * searchInput:
         *  create input to search in table...
         *  & onkeyup event calls the function to filter the table
        */
        searchInput = function () {
            let divSearch = document.createElement('div');      //create input search
            let searchInput = document.createElement('input');

            //stylize element
            this.setElement(divSearch, { name: 'search', id: 'search', className: 'search' });
            this.setElement(searchInput, {
                id: 'searchinput',
                title: this.msg('searchinput'),
                placeholder: this.msg('searchinput'),
                type: "text",
                className: "searchinput",
            });

            this.stylize(searchInput, this.styles['searchinput']);

            searchInput.addEventListener('keyup', this.searchFieldOnKeyUpEvent.bind(this));

            divSearch.appendChild(this.fieldsSelector());       //fields
            divSearch.appendChild(this.operToFilter());         //operators
            divSearch.appendChild(searchInput);                 //filter
            divSearch.appendChild(this.addClearField());

            return divSearch;
        }
        /**
         * create little box with clear icon on it
         * @returns 
         */
        addClearField() {
            let clr = document.createElement('div');      //create little box
            clr.innerHTML = this.images['clear'];
            clr.title = this.msg('clearinput');

            this.stylize(clr, this.styles['clearsearch']);

            clr.addEventListener('click', this.clearSearchInput.bind(this));

            return clr;
        }
        /**
         * 
         */
        clearSearchInput() {
            let input = this.search.box.children.namedItem('searchinput');
            this.pager.statusbar.style.display = '';

            if (input.value) {
                input.value = '';
                this.pagination();
            }

        }

        /**********************************************
         * operTpFilter:
         * create this selector to filter data
        */
        operToFilter = function () {
            this.search.ops = this.compare;
            const opSelector = document.createElement("select");
            opSelector.id = "opselector";

            Object.entries(this.search.ops)
                .forEach(function (operation, index) {

                    const [key, op] = operation;
                    var option = document.createElement("option");

                    option.value = key;
                    option.id = key;
                    option.text = key;
                    option.selected = index === 0;

                    opSelector.appendChild(option);
                })

            this.search.oper = opSelector.value;              //default-selected 

            this.stylize(opSelector, this.styles['opselector']);
            opSelector.addEventListener('change', this.onChangeOperEvent.bind(this));

            return opSelector;
        }
        /*************************************
         * 
         * 
         ***/
        onChangeOperEvent = function (e) {
            const target = e.currentTarget;
            this.search.oper = target.value;

            let input = this.search.box.children.namedItem('searchinput').value;

            if (input) {
                this.filterBody(input);
            }

        }
        /****************************************************
         * fieldselector:
         * create a list selector for the Search box
         * allowing the filter by field
         */
        fieldsSelector = function (e) {
            const selectList = document.createElement("select");
            selectList.id = "fieldselector";

            selectList.classList.add('fieldselector');
            this.stylize(selectList, this.styles['fieldselector']);

            this.headers.forEach(function (header, index) {
                if (header.style.display !== 'none') {
                    var option = document.createElement("option");
                    option.value = header.name;
                    option.id = header.name;
                    option.text = header.title;
                    option.selected = index === 0;
                    selectList.appendChild(option);
                }
            }, this);

            const firstTableRow = this.rows[0];     //first row in the table (todo: add validations)

            this.search.field = selectList.value;   //option selected
            this.search.type = this.getTypeOf(firstTableRow[this.search.field]); //data type

            selectList.addEventListener('change', this.onChangeFieldSelectorEvent.bind(this));

            return selectList;
        }
        /**
         * onChangeFieldSelectorEvent
         * Set the filter-search on the field selected
         * @param {*} event 
         */
        onChangeFieldSelectorEvent = function (event) {
            const target = event.currentTarget;
            let box = this.search.box.children;

            this.search.field = target.value;
            const firstRow = this.rows[0];

            this.search.type = this.getTypeOf(firstRow[this.search.field]);
            let input = box.namedItem('searchinput').value;
            //let selectors = box.namedItem('opselector').children;

            if (input) {
                this.filterBody(input);
            }

        }
        /********************************************************************************
        ** make this table resizeable
        *******************************************************************************/
        resizeable = function () {

            if (!this.sets('resizeable') || !this.head.firstElementChild.hasChildNodes())
                return;

            let tableHeaders = this.head.firstElementChild.cells;           //get live headers
            this.table.overflow = 'hidden';

            this.headers.forEach(function (column, colIndex) {              //parse all headers

                let th = tableHeaders.namedItem(column.name);               //get cell object
                let gutter = this.gutterDiv(column.name);                   //create gutter/separator

                gutter.addEventListener('mousedown', this.gutterMouseDownEvent.bind(this), false);
                gutter.addEventListener('mouseover', this.gutterMouseOverEvent.bind(this), false);
                gutter.addEventListener('mouseout', this.gutterMouseOutEvent.bind(this), false);

                th.addEventListener('mouseup', this.gutterMouseUpEvent.bind(this), false);
                th.addEventListener('mousemove', this.gutterMouseMoveEvent.bind(this), false);

                th.style.position = 'relative';
                th.appendChild(gutter);

            }, this);
        }

        gutterDiv = function (headerName) {
            var gutter = document.createElement('div');

            gutter.id = headerName ? 'drag_' + headerName : this.randomString();
            gutter.classList.add('jsgutter');
            this.stylize(gutter, this.styles['gutter']);

            return gutter;
        }

        splitter = function () {
            let splitter = document.createElement('div');
            const splitterHeight = this.valToPx(this.tblContainer.clientHeight - this.head.offsetHeight);
            const splitterTop = this.valToPx(this.head.offsetHeight);

            this.stylize(splitter, { height: splitterHeight, top: splitterTop });
            this.stylize(splitter, this.styles['splitter']);
            splitter.classList.add('splitter');

            return splitter;
        }

        gutterMouseOverEvent = function (e) {
            const target = e.currentTarget;
            this.stylize(target, this.styles['gutterhover']);
        }

        gutterMouseOutEvent = function (e) {
            const target = e.currentTarget;
            this.stylize(target, this.styles['gutterout']);

            if (e.buttons == 1) { //left button pressed
                /*let evt = new MouseEvent("mouseup");
                target.dispatchEvent(evt);*/
            }
        }

        gutterMouseDownEvent = function (e) {
            const elementTouched = e.target;
            e.preventDefault();
            e.stopPropagation();

            if (!elementTouched.classList.contains('jsgutter')) {
                return false;
            }

            this.gutterOn(elementTouched);                        //enlight the selected div
            this.drag.current = elementTouched.parentElement;
            this.drag.sibling = this.drag.current.nextElementSibling;
            this.drag.position = e.pageX;

            this.drag.offset = this.paddingDiff(this.drag.current);
            this.drag.currWidth = this.drag.current.offsetWidth - this.drag.offset;

            if (this.drag.sibling) {
                this.drag.nextWidth = this.drag.sibling.offsetWidth - this.drag.offset;
            }

            this.drag.gutter = elementTouched;

            /*
                        this.head.addEventListener('mousemove', this.gutterMouseMoveEvent.bind(this), false);
                        this.head.addEventListener('mouseup', this.gutterMouseUpEvent.bind(this), false);
            */

            return false;
        }

        gutterMouseMoveEvent = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const target = e.currentTarget;

            if (this.drag.current && e.buttons) {
                this.drag.offset = e.pageX - this.drag.position;

                if (this.drag.sibling) {
                    this.drag.sibling.style.width = (this.drag.nextWidth - this.drag.offset) + 'px';
                }

                this.drag.current.style.width = (this.drag.currWidth + this.drag.offset) + 'px';

            } else if (e.buttons === 0 && this.drag.current) {
                this.cleanGutterSelected(this.drag.current);
            }

            return false;
        }

        gutterMouseUpEvent = function (event) {
            event.preventDefault();
            event.stopPropagation();

            //if (target.classList.contains('dragging')) {
            if (this.drag.current) {
                const target = this.drag.gutter;

                this.stylize(target, this.styles['gutterout']);
                target.innerHTML = '';
                target.classList.remove('dragging');
            }
            /*
                        this.head.removeEventListener('mouseup', this.gutterMouseUpEvent, false);
                        this.head.removeEventListener('mousemove', this.gutterMouseMoveEvent, false);
            */
            this.drag = { gutter: undefined, current: undefined, sibling: undefined, currWidth: undefined, nextWidth: undefined, position: 0, offset: 0, };

            return false;
        }

        cleanGutterSelected = function (element) {

            if (element.classList.contains('dragging')) {
                this.stylize(element, { backgroundColor: 'gray', opacity: 0.5 });
                element.innerHTML = '';
                element.classList.remove('dragging');
            }

            /*
                        this.head.removeEventListener('mouseup', this.gutterMouseUpEvent, false);
                        this.head.removeEventListener('mousemove', this.gutterMouseMoveEvent, false);
            */

            this.drag = { gutter: undefined, current: undefined, sibling: undefined, currWidth: undefined, nextWidth: undefined, position: 0, offset: 0, };
        }

        gutterOn = function (gutter, bg = '#4668ED', classOn = 'dragging') {
            this.addClass(gutter, classOn);             //add class: 'dragging'
            gutter.appendChild(this.splitter());        //add body-vertical-line
        }

        paddingDiff = function (col) {

            if (this.getStyleVal(col, 'box-sizing') == 'border-box') {
                return 0;
            }

            const padLeft = this.getStyleVal(col, 'padding-left');
            const padRight = this.getStyleVal(col, 'padding-right');

            return (parseInt(padLeft) + parseInt(padRight));
        }

        getStyleVal = function (elm, css) {
            //tableWidth = Number(window.getComputedStyle(t).width.replace(/px/, '')).valueOf();
            return (window.getComputedStyle(elm, null).getPropertyValue(css))
        }
        /********************************************************************************
        make this table resizeable
        *******************************************************************************/
        sortable = function () {

            if (this.sets('sortable')) {

                let tableHeaders = this.head.firstElementChild.cells;
                this.sort.sorters = [];     //headers icons 

                this.headers.forEach(function (column, colIndex) {

                    let header = tableHeaders.namedItem(column.name);
                    let sorter = this.sorterDiv(column.name);

                    header.appendChild(sorter);
                    this.setElement(header, {
                        'field': column.name, 'sorter': sorter.id, 'ariaSort': 'ascending',
                    });

                    header.classList.add('jssorter');

                    this.sort.sorters[column.name] = sorter;    //sorter-icons-in-headers array of objects

                    header.addEventListener('mouseover', this.headerMouseOverEvent.bind(this));
                    header.addEventListener('mouseout', this.headerMouseOutEvent.bind(this));

                    header.addEventListener("click", this.sortByField.bind(this), false);

                }, this)
            }
        }

        headerMouseOverEvent = function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            let target = e.currentTarget;
            this.showIcon(target.id);

            return false;
        }

        headerMouseOutEvent = function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            let target = e.currentTarget;
            let sorting = this.getSortingClass(target.id);

            if (!sorting) {
                this.hideSortIcon(target.id);
            }

            return false;
        }


        sorterDiv = function (field) {
            var sorter = document.createElement('div');

            this.setElement(sorter, {
                'id': `sorter_${field}`,
                'field': field,
                'title': 'Sort in descending order',
                'ariaSort': 'descending',
                'className': 'sorter',
                'sorting': false,
            });

            this.stylize(sorter, this.styles['sorter']);
            sorter.innerHTML = this.images['arrowdown'];

            return sorter;
        }

        /**********
         * 
         */
        sortByField = function (e) {
            const target = e.currentTarget;                     //click in icon search
            this.sort.field = target.id;                        //field to sort

            if (this.sort.previousField && (this.sort.previousField !== this.sort.field)) {
                this.hideSortIcon(this.sort.previousField);         //change previous header
                this.removeSortingClass(this.sort.previousField);   //remove marking class
            }

            this.setSortingClass(target.id);                        //marking class
            this.lightUpHeader();                                   //highlight title
            var sortedTable = this.sortIt(this.sort.field);         //sort
            let newTbody = this.populateTBody(sortedTable, this.body, this.sort.field);

            this.pagination();

            this.toggleIcon(this.sort.field);

            this.sort.previousField = this.sort.field;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            return false;
        }
        /**
         * 
         * @param {*} body 
         * @returns tbody
         */
        wipeRows = function (tbody) {
            while (tbody.hasChildNodes())
                tbody.removeChild(tbody.firstChild);

            return tbody
        }

        wipeChildren(element) {
            while (element.hasChildNodes()) {
                element.removeChild(element.firstChild);
            }
            return element
        }
        /**
         * 
         */
        lightUpHeader() {

            let current = this.getNamedHeaderById(this.sort.field);
            current.style.filter = 'brightness(190%)';

            if (this.sort.previousField) {
                let previous = this.getNamedHeaderById(this.sort.previousField);
                previous.style.filter = this.sort.previousField == this.sort.field ? 'brightness(190%)' : '';
            }
        }

        /*next sort order
         * 
         */
        nextOrder(sortOrder) {
            return sortOrder === 'ascending' ? 'descending' : 'ascending';
        }

        sortIt = function (fieldToSort) {
            const fieldType = this.dataType();                  //data typeof field selected

            if (this.sort.field !== this.sort.previousField) { //field !== previous

                this.sort.arrTable = this.rows;                     //array to sort

                this.sort.arrTable.sort((a, b) => {

                    let match1 = a[fieldToSort]; /* values to compare */
                    let match2 = b[fieldToSort];

                    if (fieldType == 'date') {
                        match1 = new Date(match1).getTime();
                        match2 = new Date(match2).getTime();
                    }

                    if (fieldType == 'string') {
                        match1 = match1.toLowerCase();
                        match2 = match2.toLowerCase();
                    }

                    return (fieldType == 'number')
                        ? match1.localeCompare(match2, undefined, { numeric: true })
                        : match1 === match2 ? 0 : (match1 < match2 ? -1 : 1);
                })
            } else {
                this.sort.arrTable.reverse();                   //same column ? then reverse
            }

            return this.sort.arrTable;

        }
        /**
         * 
         * @returns 
         */
        dataType = function () { /* CAMBIAR POR LA VERSION GENERICA */
            const colSelected = this.rows[0][this.sort.field];

            return this.getDateFromString(colSelected) !== null
                ? 'date'
                : this.isAnNumber(colSelected) ? 'number' : 'string';
        }

        hideSortIcon = function (sorterName, display = 'none') {
            this.sort.sorters[sorterName].style.display = display;
        }

        showIcon = function (sorterName, display = '') {
            this.sort.sorters[sorterName].style.display = display;
        }

        setSortingAttribute(field, val = false) {
            this.sort.sorters[field].setAttribute('sorting', val);
        }

        getSortingClass(header) {
            return this.sort.sorters[header].classList.contains('sorting');
        }

        setSortingClass(header) {
            this.addClass(this.sort.sorters[header], 'sorting');
        }

        removeSortingClass(header) {
            this.removeClass(this.sort.sorters[header], 'sorting');
        }

        toggleIcon = function (sorterField, display = '') {
            let sorter = this.sort.sorters[sorterField];
            let sortOrder = sorter.getAttribute('ariaSort');

            if (sortOrder === 'ascending') {
                sorter.innerHTML = this.images['arrowdown'];
                sorter.title = 'Sort in descending order';
                sorter.setAttribute('ariaSort', 'descending');
            } else {
                sorter.innerHTML = this.images['arrowup'];
                sorter.title = 'Sort in ascending order';
                sorter.setAttribute('ariaSort', 'ascending');
            }

            sorter.setAttribute('sorting', true);
            sorter.style.display = display;

        }

        keyPressed = function (e) {
            e.stopImmediatePropagation();

            if (e.key === "Escape") {
                let box = this.dome.children['boxlist'];
                box.style.display = 'none';
            }

            return false;
        }
        /******************************************************************************
         * Some tools
         ******************************************************************************/
        invertHex = function (hex) {
            return (Number(`0x1${hex} `) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
        }
        /* varToString
        *     varToString(var) => 'var'
        *     varToString(fooVar) => fooVar
        */
        varToString = varObj => Object.keys(varObj)[0]

        /*  setElement
         *      set some values in root of an object (as setAttributes)
        */
        setElement = function (element, attrs) {

            if (attrs.className) {
                this.addClass(element, attrs.className);
                this.stylize(element, this.styles[attrs.name]);
            }

            Object.keys(attrs).forEach(function (key) {
                element.setAttribute(key, attrs[key]);
            });

        }

        addClass = function (elm, className) {
            if (!className) return;

            const elements = Array.isArray(elm) ? elm : [elm];

            elements.forEach((element) => {
                if (element.classList) {
                    element.classList.add(className.split(' '));
                } else {
                    element.className += ` ${className} `;
                }
            });
        }

        removeClass = function (elm, className) {
            if (!className) return;

            const els = Array.isArray(elm) ? elm : [elm];

            els.forEach((el) => {
                if (el.classList) {
                    el.classList.remove(className.split(' '));
                } else {
                    el.className = el.className.replace(new RegExp(`(^|\\b)${className.split(' ').join('|')} (\\b | $)`, 'gi'), ' ');
                }
            });
        }
        /**
         * @param {*} elm 
         * @param {*} prefix 
         * @returns elm
         */
        removeClassByPrefix(elm, prefix) {
            var regx = new RegExp('\\b' + prefix + '.*?\\b', 'g');
            elm.className = elm.className.replace(regx, '');
            return elm;
        }

        /*******************************
         * stringToDate 
         * **/
        stringToDate = function (stringValue, ret = 'obj') {

            let [y, M, d, h, m, s] = stringValue.split(/[- :]/);
            let newDate = new Date(y, parseInt(M) - 1, d, h, parseInt(m), s);
            return (ret == 'obj' ? newDate : newDate.valueOf());
        }

        /******************************************************************
         * getDateFromString:
         * enter: dd/mm/yyyy06/06/2018 yyyy/mm/dd 2018/02/12 
         * result:  06/06/2018 2018/02/12
         * not a Date => null
         */
        getDateFromString = function (str) {
            return str.match(/(\d{1,4}([.\-/])\d{1,2}([.\-/])\d{1,4})/g)
        }

        /********************************************************************
         * isAnNumber: 
         * true or false
         * **/
        isAnNumber2 = function (str) {
            var pattern = /^\d+\.?\d*$/;
            return pattern.test(str);
        }

        isAnNumber(str) {
            if (typeof str != "string") return false // process strings!
            return !isNaN(str) && !isNaN(parseFloat(str));
        }

        isAlphaNumeric(str) {
            var code, i, len;

            for (i = 0, len = str.length; i < len; i++) {
                code = str.charCodeAt(i);
                if (!(code > 47 && code < 58) && // numeric (0-9)
                    !(code > 64 && code < 91) && // upper alpha (A-Z)
                    !(code > 96 && code < 123)) { // lower alpha (a-z)
                    return false;
                }
            }
            return true;
        }

        /* format data
        *  @data data to format
        * 
        */
        formatData = function (data) {
            let dataType = this.getTypeOf(data);

            switch (dataType) {
                case 'number':
                    let local = this.options.numberLocal;
                    data = Intl.NumberFormat(local).format(data);
                    break;
                case 'date':
                    break;
                case 'string':
                    break;
                default:
            }

            return data;
        }
        /* sets:
         * @value
         *    get a value from 'options' or null
        */
        sets = function (optIndex) {
            return (Object.hasOwn(this.options, optIndex) ? this.options[optIndex] : null);
        }
        randomString = () => {
            return Math.floor(Math.random() * Date.now()).toString(36);
        };
        valOrRandom = function (val) {
            return (val ? val : this.randomString());
        }
        valToPx = function (theVal) {
            return `${parseFloat(theVal)} px`;
        }

        safeParseInt = function (value) {
            var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var resultValue = parseFloat(value);

            if (isNaN(resultValue)) {
                return defaultValue;
            }

            return resultValue;
        }

        joinObj = function (obj1, obj2) {
            return Object.assign(obj1, obj2);
            //this.options.customIndex = Object.hasOwn(this.options, 'colIndex');
        }



        /********************************************************************************
        styles
        *******************************************************************************/
        stylize = function (element, style) {

            //in this point... many styles are not defined
            //or may the styles come from a css file
            if ((typeof style === "undefined") || (this.options['stylize'] !== 'internal'))
                return;

            if (typeof style === 'string') {            //styles defined in a class ?
                this.addClass(element, style);
                return;
            }

            if (Object.keys(style).length) {

                for (const property in style) {             //finally, use local styles in this.styles (if any)
                    element.style[property] = style[property];
                }

            }

        }

        addStyleRule = function (styles) {
            var css = document.createElement('style');
            css.type = 'text/css';

            if (css.styleSheet) {
                css.styleSheet.cssText = styles;
            } else {
                css.appendChild(document.createTextNode(styles));
            }

            document.getElementsByTagName("head")[0].appendChild(css);
        }
        /****************************************************************
         * msg:
         * basic intent of i18n
         */
        msg = function (idx) {
            return this.text[idx] || '';
        }

        styles = {
            clearsearch: {
                float: 'right',
                width: '16px',
                left: '18px',
                top: '4px',
                position: 'relative',
                cursor: 'pointer',
            },
            gutter: {
                backgroundColor: '#4668ED',
                opacity: 0.45,
                userSelect: 'none',
                top: 0,
                right: 0,
                width: '4px',
                height: '100%',
                cursor: 'col-resize',
                position: 'absolute',
                zIndex: 100,
            },
            splitter: {
                backgroundColor: '#4668ED',
                left: '4px',
                width: '1px',
                position: 'relative',
                zIndex: 100,
            },
            gutterhover: {
                opacity: 0.75,
                width: '4px',
                /*                cursor: 'col-resize',*/
            },
            gutterout: {
                opacity: 0.45,
                width: '4px',
            },
            sorter: {
                pointerEvents: 'none',
                width: '16px',
                /*height: '16px',*/
                top: '8px',
                float: "right",
                left: '2px',
                position: 'absolute',
                /*cursor: "pointer",
                opacity: 1.5,*/
                display: 'none',
            },
            sorterhover: {
                display: '',
                cursor: "pointer",
                backgroundColor: 'red',
            },
            tools: {
                position: 'sticky',
                top: 0,
                'z-index': 1,
                width: '95%',
            },
            tabletools: {
                float: 'left',
                backgroundColor: '#fff',
                overflow: 'hidden',
                margin: '2rem 20px 1rem',
                marginBottom: '12px',
                marginTop: '25px',
                borderRadius: '5px',
                overflow: 'hidden',
                padding: '0.8rem',
                border: 'solid 1px rgb(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            },
            fieldselector: {
                marginTop: '0.5rem',
                paddingBottom: '5px',
                marginLeft: '1rem',
                width: '24%',
            },
            opselector: {
                marginTop: '0.5rem',
                paddingBottom: '5px',
                marginLeft: '1rem',
            },
            searchinput: {
                backgroundRepeat: 'no-repeat',
                borderRadius: '4px 24px 24px 24px',
                border: '1px solid #ddd',
                padding: '12px 20px 12px 40px',
                marginBottom: '12px',
                marginTop: '0.3rem',
                marginRight: '5px',
                float: 'right',
                width: '40%',
                position: 'relative !important',
            },
            search: {
                border: '1px solid rgb(221, 221, 221)',
                marginRight: '5px',
                width: '60%',
                float: 'right',
                /*height: '4rem',*/
                marginTop: '1.2rem',
                marginBottom: '1rem',
            },
            boxlist: {
                display: 'block',
                position: 'absolute',
                padding: '20px',
                opacity: 1,
                overflow: 'auto',
                zIndex: 1,
                backgroundColor: 'whitesmoke',
                border: 'solid 1px rgb(0,0,0,0.1)',
            },
            checkboxes: {
                margin: '0',
                listStyle: 'none',
                float: 'left',
                paddingLeft: '5px',
            },
            icontools: {
                border: 'solid 1px rgb(0,0,0,0.08)',
                width: '32px',
                height: '32px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                marginRight: '5px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            },
            filter: {},
            fields: {},
            trpager: {
                backgroundColor: '#F0F0F0',
                lineHeight: '0.5rem',
                width: '100%',
                bottom: '0',
                position: 'sticky',
                textAlign: 'right',
            },
            tdpager: {
                paddingRight: '20px',
                height: '0.8rem',
                width: '100%',
                margin: '15px',
                padding: '5px',
                height: '32px',
            },
            pagerbotton: {
                borderRadius: '6px',
                border: 'none',
                background: '#d7d7d7',
                alignItems: 'center',
                padding: '6px 19px',
                fontFamily: '-apple-system, BlinkMacSystemFont, Roboto, sans-serif',
                marginLeft: '10px',
                marginRight: '10px',
                height: '28px',
            },
            arrowleft: {
                width: '33px',
                height: '33px',
                border: '2px solid #333',
                borderLeft: '0',
                borderTop: '0',
                transform: 'rotate(135deg)',
            },
            arrowright: {
                width: '33px',
                height: '33px',
                border: '2px solid #333',
                borderLeft: '0',
                borderTop: '0',
                transform: 'rotate(315deg)',
            },
            pagermessage: {
            },
            statusbar: {
                /*position: 'relative',*/
                position: 'absolute',
                bottom: '0px',

                width: '99%',
                padding: '5px',
                height: '40px',
                textAlign: 'right',
                fontSize: '0.875em',
                lineHeight: '0.5rem',
                backgroundColor: '#F0F0F0',
                border: '1px solid rgb(221, 221, 221)',
                borderRightStyle: 'outset',
                borderBottomStyle: 'outset',
                borderRightWidth: '1px',

                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
                clear: 'both',
            },
            tdwrap: {
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
            }

        };

        images = {
            close: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" fill="none" viewBox="0 0 24 24"><path fill="#BFBFBF" d="M1.25 7.25a6 6 0 0 1 6-6h9.5a6 6 0 0 1 6 6v9.5a6 6 0 0 1-6 6h-9.5a6 6 0 0 1-6-6v-9.5Z"/><path fill="#000" fill-rule="evenodd" d="M7.183 7.183a.625.625 0 0 1 .884 0l8.75 8.75a.625.625 0 1 1-.883.884l-8.751-8.75a.625.625 0 0 1 0-.884Z" clip-rule="evenodd"/><path fill="#000" fill-rule="evenodd" d="M16.817 7.183a.625.625 0 0 1 0 .884l-8.75 8.75a.625.625 0 1 1-.884-.883l8.75-8.751a.625.625 0 0 1 .884 0Z" clip-rule="evenodd"/></svg>',
            clear: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="m10 12.6.7.7 1.6-1.6 1.6 1.6.8-.7L13 11l1.7-1.6-.8-.8-1.6 1.7-1.6-1.7-.7.8 1.6 1.6-1.6 1.6zM1 4h14V3H1v1zm0 3h14V6H1v1zm8 2.5V9H1v1h8v-.5zM9 13v-1H1v1h8z"/></svg>',
            sortup: '<svg width="16" height="16" viewBox="0 0 24 24" data-name="Flat Color" xmlns="http://www.w3.org/2000/svg" class="icon flat-color"><path d="m19.71 6.29-3-3a1 1 0 0 0-1.42 0l-3 3a1 1 0 0 0 1.42 1.42L15 6.41V20a1 1 0 0 0 2 0V6.41l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42Z" style="fill:#66ff00"/><path d="M11.71 16.29a1 1 0 0 0-1.42 0L9 17.59V4a1 1 0 0 0-2 0v13.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3a1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42Z" style="fill:#fff"/></svg>',
            sortdown: '<svg width="16" height="16" viewBox="0 0 24 24" data-name="Flat Color" xmlns="http://www.w3.org/2000/svg" class="icon flat-color"><path d="m19.71 6.29-3-3a1 1 0 0 0-1.42 0l-3 3a1 1 0 0 0 1.42 1.42L15 6.41V20a1 1 0 0 0 2 0V6.41l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42Z" style="fill:#fff"/><path d="M11.71 16.29a1 1 0 0 0-1.42 0L9 17.59V4a1 1 0 0 0-2 0v13.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3a1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42Z" style="fill:#6f0"/></svg>',
            sortup2: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><path fill="none" stroke="#FF0" d="m10.5 12.5 4 4.107 4-4.107"/><path fill="none" stroke="#FFF" d="m10.5 8.5-4-4-4 3.997m4-3.997v12"/><path stroke="#FF0" d="M14.5 4.5v12"/></svg>',
            sortdown2: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><path fill="none" stroke="#FFF" d="m10.5 12.5 4 4.107 4-4.107"/><path fill="none" stroke="#FF0" d="m10.5 8.5-4-4-4 3.997m4-3.997v12"/><path stroke="#FFF" d="M14.5 4.5v12"/></svg>',
            rowup: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4 3 15h6v5h6v-5h6z" class="icon_svg-stroke icon_svg-fill" stroke-width="1.5" stroke="#666" fill="none" stroke-linejoin="round"></path></svg>',
            rowdown: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m12 20 9-11h-6V4H9v5H3z" class="icon_svg-stroke icon_svg-fill" stroke="#666" fill="none" stroke-width="1.5" stroke-linejoin="round"></path></svg>',
            filter: '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill="#444" d="M1 2h14v2L9 9v7l-2-2V9L1 4V2zm0-2h14v1H1V0z"/></svg>',
            fields: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M4 3v4h11V3zm0 10h7V9H4zm1-3h5v2H5zm-4 5h1.4V1H1z"/></svg>',
            hide: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512" xml:space="preserve"><path d="m375.808 143.28-11.504-11.12-108.128 111.984L148.032 132.16l-11.488 11.12 108.512 112.384-108.512 112.368 11.488 11.12 108.144-111.984 108.128 111.984 11.504-11.12-108.512-112.368z"/><path d="M0 0v512h512V0H0zm496.032 496.032H15.968V15.968h480.064v480.064z"/></svg>',
            arrowdown: '<svg viewBox="0 0 24 24"><path stroke="#FFF" d="m20 12-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>',
            arrowup: '<svg viewBox="0 0 24 24"><path stroke="#FFF" d="m4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>',
            timer: '<svg width="24" height="24" viewBox="0 0 0.72 0.72" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><path d="M.453.379.39.343V.21a.03.03 0 0 0-.06 0v.15a.03.03 0 0 0 .015.026l.078.045a.03.03 0 1 0 .03-.052ZM.36.06a.3.3 0 1 0 .3.3.3.3 0 0 0-.3-.3Zm0 .54A.24.24 0 1 1 .6.36.24.24 0 0 1 .36.6Z"/></svg>',
        }

        colors = {
            lemon: 'filter: invert(81%) sepia(61%) saturate(1686%) hue-rotate(64deg) brightness(93%) contrast(113%)',
            red: 'filter: invert(19%) sepia(96%) saturate(7491%) hue-rotate(360deg) brightness(103%) contrast(106%)',
            blue: 'filter: invert(8%) sepia(100%) saturate(7495%) hue-rotate(248deg) brightness(94%) contrast(143%)',
            white: 'filter: invert(100%) sepia(89%) saturate(2%) hue-rotate(70deg) brightness(112%) contrast(100%)',
            jsgutter: 'filter: invert(43%) sepia(15%) saturate(7274%) hue-rotate(194deg) brightness(100%) contrast(105%);',
        }


        i18n = {
            es: {
                boxtitle: '<p>' + 'Cambiar columnas',
                clearinput: 'Clear input field',
                sortasc: 'Ordenar ascendentemente',
                toolsfilter: 'Mostrar/Ocultar',
                toolsfields: 'Seleccione columnas',
                searchinput: 'Escriba su busqueda',
                page: 'pág',
                of: 'de',
                prev: '<',
                next: '>',
            }
        }
        /*************************************
         * Comparison Operators
         */
        compare = {
            'includes':
                function (a, b) { return a.includes(b) },
            '<': function (a, b) { return a < b },
            '>': function (a, b) { return a > b },
            '<=': function (a, b) { return a <= b },
            '>=': function (a, b) { return a >= b },
            '!=': function (a, b) { return a !== b },
            '=': function (a, b) { return a == b },
        };

        /*  Size class	Breakpoints	Window Sizes
            Small	    up to 640px	320x569, 360x640, 480x854
            Medium	    641 - 1007px	960x540
            Large	    1008px and up	1024x640, 1366x768, 1920x1080
        */
        viewCategory = function (sizeView) {
            let sizes = { small: '640', medium: '1007', large: '5000' };

            if (parseInt(sizeView) <= parseInt(sizes.small)) return 'small';
            if (parseInt(sizeView) <= parseInt(sizes.medium)) return 'medium';
            else return 'large';
        }

    }//class ends

