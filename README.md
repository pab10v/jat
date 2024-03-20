# jat
## Just Another Table script for html apps --without dependencies.

<b>tbl.js</b> contains the javascript class jsgrid<br>
this class allows to use data in json format to create a table with

## Why?
<br>
I spent hours looking for a javascript without dependencies (neither jquery nor any other) to use in a small project, however, when my search was fruitless I rushed to make this small class in Javascript to
1- manage the data load (still pending),
2- the search,
3- sort by columns and
4- stretch the width of the columns.
<br>
I publish this test version, while I use it and repair any bugs that appear along the way
<br>

## How to

### html

<br>
this an example for html to create the table (a div tag):
<br>
<br>

```html

  <div id="wrapper" class="wrapper">
        <div id="tabula"></div>
  </div>

```

<br>
### order your data in the following structure:<br>
<b>Data format:</b> <br>

*note: i'm asembling my data using php to extract from sql-server (mariadb) then served by an API to a html client app.<br>
in the client-side data is recived as a JSON array*
<br>


```javascript

data = {
fields: [field names separated by comma], 
rows: [ {field:value, field2:valu2,... field-n, value-n}, {}, {}, ... {}] 
}
```

<br>
<b>for example:</b><br>
<p></p>

```javascript

 dataset = {
    fields: ["project_id","parent_id","creator_id","project_name","alias","description","start_date"],
    rows: [ 
          {project_id: 1,parent_id: "0", creator_id: "1",project_name: "Project 1",alias: "uno", description: "First project",start_date: "2013-12-08 15:01:20"},
          {project_id: 2,parent_id: "0", creator_id: "21",project_name: "Second Project",alias: "two", description: "Second test project",start_date: "2013-12-08 15:01:20"},
    ]
    }

```

### Headers
the headers are critical to process the table and each header name must coincide with fields <br>(In this version there is no validation to match headers or verify against their pair in 'fields')<br>
headers format is: <br>


```javascript

const headers = [
    { name: 'project_id', title: 'ID', 'style': { display: 'none' } },
    { name: 'parent_id', title: 'PID', 'style': { display: 'none' } },
    { name: 'project_name', title: 'Project', 'style': { width: '15%' } },
    { name: 'description', title: 'Description', 'style': { width: '15%' } },
    { name: 'start_date', title: 'Started', 'style': { width: '7%' } },
];

```

1. **style** follows the rules of css for DOM Styles<br>
2. **name**: is the field name and must be the same as in dataset.fields <br>
3. **title**: is the title in the TH<br>
<br>
The javascript code to create the table


```javascript
   var domElement = document.getElementById("tabula");

   new jsgrid( domElement, { 'rows': dataset.rows, 'headers': headers }, options);


```


### Compatibility
Tested in modern browser with ES7<br>

**more tests should be needed**



