/* Javascript for modifying the grid size.
 * Methods based on Yuan Zhao's original gridupdater.js for this project.
 * Updated to work with a Webix based central workspace table of viewers
 */

function updategridfxn() {
   //var addingView = {view:'iframe',src:'viewer.html',minWidth:250,minHeight:250};
   //addnumCols();
   //$$('workRows').addView(addingView);
   //deleteRows();deleteCols();
   //addnumRows();addnumCols();
   //console.log("original: "+$$('workRows').getChildViews().length);
   //$$('workLayout').addView({view:'iframe',src:'viewer.html',minWidth:250,minHeight:250});
   //$$('workCols0').addView({view:'iframe',src:'viewer.html',minWidth:250,minHeight:250});
   
   //console.log("new: "+$$('workRows').getChildViews().length);
   
   /*var newNumRows = $$('grid_dim').getValues().numRow,
      newNumCols = $$('grid_dim').getValues().numCol;
   var currentNumRows = $$('workLayout').getChildViews().length,
      currentNumCols = $$('workRow0').getChildViews().length;
   
   if(newNumRows < currentNumRowsRows)
      deleteRows();
   else if(newNumRows > currentNumRows)
      appendRows();
   if(newNumCols < currentNumCols)
      deleteCols();
   else if(newNumCols > currentNumCols)
      calculateColsCols();
   else
      return; //ie if the new dimensions are the same as the current grid size */
   
   appendRows();
   calculateCols();
}

function deleteRows(){
   
}

function deleteCols(){
   
}

function appendRows(){
	var numRowstoAdd = $$('grid_dim').getValues().numRow - $$('workLayout').getChildViews().length;
   
   //****THE CURRENT NAMING SYSTEM WON'T WORK AFTER THE FIRST USE OF THIS
   for(var y=0; y<numRowstoAdd; y++){
      $$('workLayout').addView({id:"workRow"+(y+1),cols:[{id:"viewer"+"0,"+(y+1),view:'iframe',
                                    src:'viewer.html', minWidth:250,minHeight:250}]});
      
      if($$('grid_dim').getValues().numCol > 1){
         var numColstoAdd = $$('grid_dim').getValues().numCol - $$('workRow'+y).getChildViews().length;
         appendCols(y, numColstoAdd);
      }
   }
}

function calculateCols(){
   var numRows = $$('workLayout').getChildViews().length;
	var numColstoAdd;
   
   //Go through each row and add columns to the end of each
   //****THE CURRENT NAMING SYSTEM WON'T WORK AFTER THE FIRST USE OF THIS
   for(var y=0; y<numRows; y++){
      numColstoAdd = $$('grid_dim').getValues().numCol - $$('workRow'+y).getChildViews().length;
      
      appendCols(y, numColstoAdd);
   }
}

function appendCols(y, numColstoAdd) {
   for (var x=0; x<numColstoAdd; x++){
         $$('workRow'+y).addView({id:"viewer"+(x+1)+","+(y+1),view:'iframe',src:'viewer.html',
                                  minWidth:250,minHeight:250});
   }
}