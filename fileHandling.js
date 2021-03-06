/* Gets ZINC ID from file data and adds it as a new property to an object
 * in the datatable
 * @author Shelby Matlock & csera
 * @param {String} fileText Parsed file contents to scan
 * @param {String} objId ID of the object in the relevant datatable to modify
 */
function parseForZinc(fileText, objId){
   //Note: THIS WILL NOT WORK WITH FILES CONTAINING MULTIPLE ZINC IDs
   var regex = /ZINC/i; //Matches to first case-insensitive (i) instance of "ZINC"
   var zincLoc = fileText.search(regex);
   
   //12 is length of ZINC ID
   var zId = fileText.slice(zincLoc, zincLoc+12);
   
   //Set the ZINC ID as a new property for the object
   dataObjs.getItem(objId).zincId = zId;
}

/* Searches file text for information from a .mol2 file and adds it to
 * the relevant object placed in the main interface. Info can be read
 * natively from a .mol2 or from an object created by the file processor.
 * @param {String} fileText Plain text of the processed file
 */
function parseLigInfo(fileText){
   var ligInfo = new Object();
   
   //use String.indexOf() for string args bc faster
   //String.search() converts to regex -> slower
   var zincRmkLoc = fileText.indexOf("REMARK   11\nREMARK   11 ZINC")
      //fileText.search(/REMARK   11 ZINC/i);
   var endInfoLoc = fileText.indexOf("REMARK   20 END LIGAND INFO");
   
   //For custom format from file processor   
   /* Format used by file processor:
    *    REMARK   11
    *    REMARK   11 ZINC_ID
    *    REMARK   12
    *    REMARK   12 num_atoms [num_bonds] [num_subst] [num_feat] [num_sets]
    *    [REMARK   15
    *    REMARK   15 COMPOUND_NAME]
    *    REMARK   20
    *    REMARK   20 END LIGAND INFO
    */
   if (zincRmkLoc!=-1 && endInfoLoc!=-1) {
      //27 is length of the final line of the end block
      //Split this identified block into an array by lines
      var infoLines = fileText.substr(zincRmkLoc,endInfoLoc+27).split(/\r?\n/);
      
      for(x=0; x<infoLines.length; x++){
         infoLines[x] = infoLines[x].replace(/^\s+/,""); //Remove any leading spaces
         
         //Note: modular regex's could be used to remove "REMARK" stuff too, but this
         //would not be necessary for every line and would reduce code readability
         
         if (infoLines[x] == 'REMARK   11') {
            //Remove "REMARK   11" then any spaces after remark #
            var zLine = infoLines[x+1];
            zLine = zLine.replace("REMARK   11","").replace(/^\s+/,"");
            
            ligInfo.zincId = zLine;
         }
         else if (infoLines[x] == 'REMARK   12') {
            infoLines[x+1] = infoLines[x+1].replace("REMARK   12","").replace(/^\s+/,"");
            
            //Replace any multi-spaces with a single space then split
            var numLineInfo = infoLines[x+1].replace(/\s+/g," ").split(" ");
            
            ligInfo.numAtoms = parseInt(numLineInfo[0]); //Make String -> int
            ligInfo.numBonds = parseInt(numLineInfo[1]);
         }
         else if (infoLines[x] == 'REMARK   15') {
            //Trim infoLines[x+1] of the remark and space
            //Set the $$('comp_table')'s item's techName to this
            
            infoLines[x+1] = infoLines[x+1].replace("REMARK   15","").replace(/^\s+/,"");
            
            ligInfo.name = infoLines[x+1];
         }
         //Add above properties to 
         if (infoLines[x] == 'REMARK   20') {
            var ligObj = matchZincInCollection(ligInfo.zincId, dataObjs);
            
            ligObj.zincId = ligInfo.zincId;
            ligObj.numAtoms = ligInfo.numAtoms;
            ligObj.numBonds = ligInfo.numBonds;
            ligObj.techName = ligInfo.name;
            
            return;
         }
      }
   }
   
   //for .mol2 format
   /* Format used in the @<TRIPOS>MOLECULE info section
    *    mol_name/ZINC_ID
    *    num_atoms [num_bonds] [num_subst] [num_feat] [num_sets]
    *    mol_type - types: SMALL, BIOPOLYMER, PROTEIN, NUCLEIC_ACID, SACCHARIDE
    *    charge_type - type of charge assoc w/ mol: NO_CHARGES, DEL_RE, HUCKEL, USER_CHARGES, ETC
    *    [status_bits - SYBYL status bits. NEVER set by user.
    *    [mol_comment]] - user comment
    * Only uses lines 1, 2, 5
    */
   var molHeadLoc = fileText.search('@<TRIPOS>MOLECULE');
   if(molHeadLoc != -1){
      var atmHeadLoc = fileText.search('@<TRIPOS>ATOM');
      var infoLines;
      
      if (atmHeadLoc!=-1 && atmHeadLoc>molHeadLoc) { //atom tag after molecule tag
         //'@<TRIPOS>MOLECULE' is 17 chars long + 1 for newline char
         //Read from end of this to start of next section-1 so that newline char not included
         infoLines = fileText.substring(molHeadLoc+18,atmHeadLoc-1).split(/\r?\n/);
         console.log(infoLines);
         //get info from infoLines
      }
      else if (atmHeadLoc!=-1 && atmHeadLoc<molHeadLoc) { //atom tag before molecule tag
         //'@<TRIPOS>ATOM' is 13 chars long + 1 for newline char
         //Read from end of this to start of next section
         infoLines = fileText.substring(atmHeadLoc+14,molHeadLoc-1).split(/\r?\n/);
         console.log(infoLines);
         //get info from infoLines
      }
      
      ligInfo.zincId = infoLines[0];
      ligInfo.name = infoLines[4];
      
      //Remove leading spaces, replace any multi-spaces with a single space, then split at spaces
      var numLineInfo = infoLines[1].replace(/^\s+/,"").replace(/\s+/g," ").split(" ");
      ligInfo.numAtoms = parseInt(numLineInfo[0]); //Make String -> int
      ligInfo.numBonds = parseInt(numLineInfo[1]);
      
      //Add info to the actual obj in the main program
      var ligObj = matchZincInCollection(ligInfo.zincId, dataObjs);
      ligObj.zincId = ligInfo.zincId;
      ligObj.numAtoms = ligInfo.numAtoms;
      ligObj.numBonds = ligInfo.numBonds;
      ligObj.techName = ligInfo.name;
   }
}

/** Searches the data object collection and matches the passed zincId to
 * the object's zincId
 * @param {String} zincId The ZINC ID to match to
 * @param {Object} coll Collection of data objects to scan
 */
function matchZincInCollection(zincId,coll){
   var tableId, ligObj;
   
   //Go through each item in the ligOutTable until a match is found
   for(var ligIndex=0; ligIndex<coll.count(); ligIndex++)
   {
      tableId = coll.getIdByIndex(ligIndex);
      ligObj = coll.getItem(tableId);
      
      if (zincId == ligObj.zincId) {
         return ligObj;
      }
      else if (ligIndex == coll.count()-1) {
         return null;
      }
   }
}

//Loads parsed compounds into the set viewers
function load_fxn(){
   var fID, fData, fType, x, y, origX, origY;
   
   for(var index=0; index<$$('uploadTable').count(); index++){
      fID = $$('uploadTable').getIdByIndex(index);
      fData = $$('uploadTable').getItem(fID).fileData;
      x = $$('uploadTable').getItem(fID).col, y = $$('uploadTable').getItem(fID).row;
      origX=$$('uploadTable').getItem(fID).oCol, origY=$$('uploadTable').getItem(fID).oRow;
      
      //Only attempt load if the coordinates are valid AND the coordinates have been changed
      if (validCoordinates(x,y) && (x!=origX || y!=origY)){
         webix.message('New compound in viewer'+x+','+y);
         var viewer = $$('viewer'+x+','+y).getWindow();
         
         fType = getFileType(fID);
         console.log('Detected file type: '+fType);
         
         //Calls loading function for "viewer[x],[y]" defined in the iframe source html
         //REMOVE THE BELOW COMMAND IF YOU WANT TO DISPLAY MULTIPLE FILES AT ONCE
         viewer.glviewer.clear();
         viewer.toDefaultDisp(); //Resets the display tracking variables to the default
         setActiveViewer(x+','+y, viewer.getViewMode()); //Syncs controls w/ the new settings
         viewer.fileToViewer(fData,fType); //Sends file data for display
         
         //Clear old cell if the structure was loaded
         if (origX!=0 && origY!=0) {
            var oldViewer = $$('viewer'+origX+','+origY).getWindow();
            oldViewer.glviewer.clear();
            //set default display values in the old viewer
            oldViewer.toDefaultDisp();
         }
         
         $$('uploadTable').getItem(fID).oCol = x;
         $$('uploadTable').getItem(fID).oRow = y;
         
         console.log('Sent to '+$$('uploadTable').getItem(fID).oCol+
                     ','+$$('uploadTable').getItem(fID).oRow);
      }
      else if (x==origX || y==origY) {
         webix.message("Coordinates have not been changed for "+
                       $$('uploadTable').getItem(fID).fileName);
      }
      else{
         webix.message('NOT loading '+$$('uploadTable').getItem(fID).fileName+' to '+x+','+y);
      }
   }
}

/* Gets the file type from the full file name
 * @param {String} fID ID of the item/file in uploadTable
 */
function getFileType(fID) {
   var fName = $$('uploadTable').getItem(fID).fileName;
   var fType;
   
   //Split fName into an array with elements demarcated by a '.'
   var splitName = fName.split('.');
   
   //User may have included '.' in the name so only grab the last one
   fType = splitName[splitName.length-1];
   
   return fType;
}

//Removes selected compounds from the list and clears them from the relevant viewers
function clear_fxn(){
   //$$(...).getSelectedId returns an array of selected items (with param (true))
   var IDs = $$('uploadTable').getSelectedId(true);
   var x, y;
   
   //Go through each selected item and remove from viewer if it is loaded
   for(var a=0; a<IDs.length; a++){
      x = $$('uploadTable').getItem(IDs[a]).col;
      y = $$('uploadTable').getItem(IDs[a]).row;
      
      var fType = getFileType(IDs[a]);
      
      if (validCoordinates(x,y)){
         var viewer = $$('viewer'+x+','+y).getWindow();
         viewer.glviewer.clear();
         viewer.toDefaultDisp();
      }
   }
   
   $$('uploadTable').remove(IDs);
   $$('comp_table').remove(IDs);
}

/* Checks if the passed coordinates are defined.
 * @param {int} x The x (column) coordinate
 * @param {int} y The y (row) coordinate
 * @returns {boolean} True if the coordinates are valid.  False otherwise.
 */
function validCoordinates(x, y) {
   var numCols = $$('grid_dim').getValues().numCol,
      numRows = $$('grid_dim').getValues().numRow;
      
   if ((0<x && x<= numCols) && (0<y && y<=numRows)) {
      console.log('Valid Coordinates');
      return true;
   }
   else{
      console.warn('Invalid coordinates');
      return false;
   }
}