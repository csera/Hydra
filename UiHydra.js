webix.ready(function(){
   //webix.ui.fullScreen(); //for fullscreen on mobile devices

var uploadControls = 
   {header:"Import Compounds", maxWidth:250, gravity:2, collapsed:false, body:
      {rows:[ //removed view:'form' to make this take up the whole width
         {
            id:'process', view:'button', value:'Process Docking Ouput', type:'form',
            labelWidth:120, click:function(){$$('processorWin').show();},
         },
         { //Uploader element
            id:"hydraUploader", view:"uploader",
            value:"Upload Files",
            multiple:true, autosend:false,
            //upload:"parser.php"
         },
         { //Table showing uploaded files
            id:"uploadTable", view:"datatable",
            select:true, multiselect:true, //ctrl+click & shift+click work
            drag:true, //NEED TO MAKE THIS SYNC WITH COMPOUND LIST
            editable:true, editaction:"dblclick",
            minHeight:160,
            leftSplit:2, //so left 2 col's won't scroll horizontally
            columns:[
               {id:"col", header:"Col", width:40, editor:"text"},
               {id:"oCol", header:"origCol", hidden:true},
               {id:"row", header:"Row", width:45, editor:"text"},
               {id:"oRow", header:"origRow", hidden:true},
               {id:"fileName", header:"File Name", width:200},
               {id:"fileData", header:"Data", hidden:true},
            ],
         },
         {
            cols:[
               {
                  view:"button",id:"load_click",value:"Update Data",type:"form",
                  click:load_fxn
               },
               {
                  view:"button",id:"clear_click",value:"Delete Data",type:"danger",
                  click:clear_fxn
               }
            ]
         }
      ]}
   };
   
var gridControls =
   {header:"Grid Size", maxWidth:250, gravity:1, collapsed:false, body:
      {view:"form", id:"grid_dim", elements:[
         //{view:"text",value:"blarg",label:"test",name:"mg"},
         {
            view:"text",value:"1",label:"Columns:",name:"numCol",//specifies cols count
         },
         {
            view:"text",value:"1",label:"Rows:",name:"numRow",//specifies rows count
         },
         {
            view:"button",id:"update_grid",value:"Update Grid",inputWidth:"150",align:"center",
            on:{
               'onItemClick': updategridfxn
            }
         }
      ]}
   };

//Note that the following compound controls pass in an index into each display-setting fxn
//0 = main compound; 1 = ligand
var mainControls =
   {header:"Main Compound", maxWidth:250, collapsed:false, body:
      {rows:[
         //Hidden element which keeps track of the active viewer. Avoids making global var
         {id:'activeCoord', view:'text', hidden:true},
         {id:'mStructType', view:'richselect', label:'Display as', options:[
            {id:'structCartoon', value:'Cartoon'},
            {id:'structSphere', value:'Sphere'},
            {id:'structStick', value:'Stick'},
            {id:'structLine', value:'Line'},
            {id:'structCross', value:'Cross'},
            ],
            on:{
               'onChange': function(){
                  var coord = $$('activeCoord').getValue();
                  
                  if (coord) {
                     console.log('repainting structure');
                     setStruct(coord,this,0);
                  }
               }
            }
         },
         {id:'mSurfType', view:'richselect', label:'Surface', options:[
            {id:'surfNone', value:'None'},
            {id:'surfVDW', value:'Van der Waals'},
            {id:'surfMS', value:'Molecular'},
            {id:'surfSAS', value:'Solvent Accessible'},
            {id:'surfSES', value:'Solvent Excluded'},
            ],
            value:'surfNone',
            on:{
               onChange: function(){
                  var coord = $$('activeCoord').getValue();
                  var surfID = this.getValue();
                  
                  if (coord && surfID!=$$('viewer'+coord).getWindow().surfType[0]){
                     var opacSet = $$('mSurfOpacity').getValue()/100;
                     console.log('change in surf type detected');
                     setSurface(coord,surfID,0,opacSet);
                  }
               }
            }
         },
         
         //if time permits: add color setting option for surface and for actual model
         //https://github.com/dkoes/3Dmol.js/issues/88 &
         //https://github.com/dkoes/3Dmol.js/commit/2973a4eebf4ee32972fc13a19d9c0188a89e9efc
         /*{id:'mSurfColor', view:'richselect', label:'Surface Color', options:[
            {id:'mSElement', value:'By Element'},
            {id:'mSCharge', value:'By Charge'}
         ]},*/
         
         {id:'mSurfOpacity', view:'slider', level:'Opacity', label:'Opacity',
            value:'50', min:0, max:100,
            //Gives opacity in percentage
            //3Dmol requires decimal -> use this.getValue()/100
            on:{
               onChange: function(){
                  var coord = $$('activeCoord').getValue();
                  var itemVal = this.getValue();
                  
                  if (coord && itemVal!=$$('viewer'+coord).getWindow().surfOpacity[0]) {
                     var opacSet = itemVal/100;
                     console.log('change detected in surfOpac');
                     setSurface(coord,$$('mSurfType').getValue(),0,opacSet);
                  }
               }
            }
         },
         
         {} //Blank view needed to fix a related resizing issue
         //Webix thread: http://forum.webix.com/discussion/comment/4771
      ]}
   };

var ligandControls =
   {header:'Ligand', maxWidth:250, collapsed:false, body:
      {rows:[
         {id:'lStructType', view:'richselect', label:'Display as', options:[
            //Note: 'cartoon 'isn't meant to be used like this, but it does hide HETATMS
            {id:'structCartoon', value:'Hide'},
            {id:'structSphere', value:'Sphere'},
            {id:'structStick', value:'Stick'},
            {id:'structLine', value:'Line'},
            {id:'structCross', value:'Cross'},
            ],
            on:{
               'onChange': function(){
                  var coord = $$('activeCoord').getValue();
                  
                  if (coord) {
                     setStruct(coord,this,1);
                  }
               }
            }
         
         },
         {id:'lSurfType', view:'richselect', label:'Surface', options:[
            {id:'surfNone', value:'None'},
            {id:'surfVDW', value:'Van der Waals'},
            {id:'surfMS', value:'Molecular'},
            {id:'surfSAS', value:'Solvent Accessible'},
            {id:'surfSES', value:'Solvent Excluded'},
            ],
            value:'surfNone',
            on:{
               onChange: function(){
                  var coord = $$('activeCoord').getValue();
                  var surfID = this.getValue();
                  
                  if (coord && surfID!=$$('viewer'+coord).getWindow().surfType[1]){
                     var opacSet = $$('lSurfOpacity').getValue()/100;
                     
                     setSurface(coord,surfID,1,opacSet);
                  }
               }
            }
         },
         
         //again, add color settings if time permits
         
         {id:'lSurfOpacity', view:'slider', level:'Opacity', label:'Opacity',
            value:'50', min:0, max:100,
            //Gives opacity in percentage
            //3Dmol requires decimal -> use this.getValue()/100
            on:{
               onChange: function(){
                  var coord = $$('activeCoord').getValue();
                  var itemVal = this.getValue();
                  
                  if (coord && itemVal!=$$('viewer'+coord).getWindow().surfOpacity[1]) {
                     var opacSet = itemVal/100;
                     
                     setSurface(coord,$$('lSurfType').getValue(),1,opacSet);
                  }
               }
            }
         },
         
         {} //Blank view needed to fix a related resizing 
      ]}
   };

hydraUI = webix.ui({
   container:"masterarea",
   type:"line",
   responsive:"true",
   
    rows:[
      // first row is a title header for app, maybe put more stuff here later?
      {template:"html->titlebar", height:1 },
      
      // second row, main content of app goes here
      {cols:[{id:'leftCol',
         // left column has control panel, upload manager as accordioned components
         cells:[
            {id:'files&grid', view:"scrollview",
               scroll:"y",
               body:
               {rows:[
                  
                  // Upload compound list / DOCK data
                  uploadControls,
                  {view:'resizer'},
                  
                  //Webix bug: section below resizer expands when resizer moved up
                  //TEMP FIX: Need to nest the below sections in one row
                  {rows:[
                  // "Grid Controls" - controls for resizing the grid
                     gridControls,
                     {}
                  ]},
                  
                  {
                     view:"button", id:"toVC", type:"next", label:'To Compound Controls',
                     click:function(){$$('compoundCtrls').show();}
                  }
               ]}
            },
            {id:'compoundCtrls', view:'scrollview', scroll:'y', body:
               {rows:[
                  mainControls,
                  ligandControls,
                  {},
                  //checkbox for setting whether or not to sync compound rotation across viewers
                  //unchecked -> 0; checked -> 1
                  //Want label on right side of box but can't get that to work...
                  {
                     id:'syncMove', view:'checkbox', label:'Sync Movements',
                     labelWidth:120, value:0
                  },
                  {
                     id:"toF&G",  view:"button", type:"prev", label:'To File & Grid Controls',
                     click:function(){$$('files&grid').show();}
                  },
               ]}
            }
         ]
      },
      
      // middle column contains central workspace with all of the visualization object
      {id:"workspace", view:"scrollview", container:"central_workspace",type:"clean",
         scroll:"xy", //Enables horizontal (x) and vertical (y) scrolling
      
         //Framework for a resizable grid of GLmol instances
         //Viewers start at index of 1 with coordinates (x,y)
         //Eg "viewer2,1" is in the first row, second column from the left
         body:{id:"workLayout", type:'clean', borderless:true, rows:[{
            id:"workRow"+"1", type:'clean', borderless:true, css:'inactiveViewer', cols:[{
               view:"iframe",
               id:"viewer"+"1"+","+"1",
               src:"3Dmol frame.html",
               minWidth:250,minHeight:250,
               on:{
                  'onAfterLoad':function(){
                     this.getWindow().setGridCoordinates('1,1');
                  }
               }
            }]
         }]}
      },
      
      // right column has compounds list, details are accordioned components
      {view:"scrollview",scroll:"y",body:
      {
         multi:true, view:"accordion", type:"line", 
         rows:[
         
         // Compound list showing cat,name from uploaded file
         {header:"Compound List", height:300, collapsed:false, body:
            {
               id:"comp_table",
               view:"datatable",
               select:true, 
               columns:[
                  // { id:"idNum", header:"ID", width:50}, 
                  { id:"compound", header:"Compound Name", width:135 },
                  { id:"category", header:"Category", fillspace:1},
               ], 
               data:'',
               minWidth:250,
               
            on:{
               onBeforeLoad:function(){
                  this.showOverlay("Loading...");
               },
               onAfterLoad:function(){
                  this.hideOverlay();
               }
            },
               //datatype:"json",
               //url:'compounds.json'
            }
         },
         {view:"resizer"},
         // Details of selected compound not shown in list, such as scores
         {rows:[
            {header:"Compound Details", collapsed:false, body:
               {view:"form", id:"comp_det", maxWidth:250, rows:[
                  { view:"text",name:"category",label:"Category" },
                  { view:"text",name:"compound",label:"Compound" },
                  { view:"text",name:"res",label:"# Residues" },
                  { view:"text",name:"bond",label:"# Bonds" },
               ]}
            },
            
            {view:"resizer",
               container:"vendorDiv",
               scroll: 'xy',
               id:"all_vendors"},
               
            // Details of selected compound not shown in list, such as scores
            {header:"Vendor List", collapsed:false, body:
               { view:"datatable", 
               id:"vendors",
               select:true, 
               multiselect:true, // want to make double click do an alert
               drag:true, 
               maxWidth:250, 
               columns:[
                  {  template: "#compound# #vendor#",
                     header:"Zinc ID : Vendor", 
                     width:250, 
                     height: 350,
                     editor:"text",
                  }
               ],
               data:'',
               on:{
                  onItemClick:function(){ 
                     console.log(vendorCollect[0].website)
                     alert(
   
                        "Compound: " + vendorCollect[5].compound + "\n" +
                        "Website: " + vendorCollect[5].website + "\n" +
                        "Phone #: " + vendorCollect[5].phone + "\n" +
                        "Fax #: " + vendorCollect[5].fax + "\n" +
                        "Contact Email: " + vendorCollect[5].email + "\n" +
                        "Directly order: " + vendorCollect[5].orderurl + "\n"
   
                        );
                  }
               }
               },
            },
         ]},
         //For debugging: Textarea to display contents of files
         /*{header:"File Value", collapsed:false, body:
            {view:"textarea", id:"file_dump", maxWidth:300}
         },*/
         
      ]},	
      },
      ]}
   ]
});

/* Called after a file is added to the view:uploader. Called successively for each file
 * if multiple files are sent at once.
 * Takes data from the first file in "hydraUploader" and puts it in the "uploadTable"
 * view:datatable.  Object is then removed so more items may be read successfully.
 */
$$("hydraUploader").attachEvent("onAfterFileAdd",function(){
   
   var reader = new FileReader();
   
   var fID, fName, fData;
   
   fID = $$('hydraUploader').files.getFirstId();
   
   fName = $$("hydraUploader").files.getItem(fID).name;
   fData = $$("hydraUploader").files.getItem(fID).file;
   
   reader.onload = function(e) {
      //CHANGE THIS SO THAT THE FILES GET ADDED TO THE PROCESSOR WINDOW IF PROCESS == 1
      $$('uploadTable').add({col:0, oCol:0, row:0, oRow:0,
                            fileName:fName, fileData:reader.result});
      //Add the parsed file data to 'uploadTable" w/ default coordinates 0,0
      //Added as a string rather than an actual file object
      
      parseForZinc(reader.result);
   };
   reader.onerror = function(e) {
      console.error("File could not be read. Code: "+e.target.error.code);
      alert("error");
   };
   
   reader.readAsText(fData);
   
   $$('hydraUploader').files.remove(fID);
});

// binds selected compound detail panel with selection in compounds list, default selection is first
$$('comp_det').bind($$('comp_table'));
$$("comp_table").select(1);

});

//Resizes GUI dynamically with the window size
webix.event(window,"resize", function(){hydraUI.adjust();});