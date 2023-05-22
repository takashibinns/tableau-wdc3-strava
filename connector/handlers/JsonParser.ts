import { DataType, DataTable, ColumnHeader, ColumnRole } from '@tableau/taco-toolkit/handlers'

const allowDatetime = true;

interface DynamicObject {
   [key: string]: any
}

/***********************************/
/*  Export Function                */
/***********************************/

const JsonParser = (jsonData:any, defaultTableName="data") => {

   //  Ensure a consistent structure, whether the data comes in as an array (single table) or a dictionary (multiple tables)
   let tables = [];
   let results:any[] = [];
   let data: DynamicObject = {};
   if (Array.isArray(jsonData)) {
      tables.push(defaultTableName);
      data[defaultTableName] = jsonData;
   } else {
      tables = Object.keys(jsonData);
      data = jsonData;
   }

   /******************************************************/
   /* Step 1: Loop through each result set               */
   /*  There is usually only one result set per query,   */
   /*  but just in case the query returns multipler      */
   /******************************************************/
 
   //  Loop through each "key" in the data results
   tables.forEach((tableName) => {

      //  Fetch an array of data for the key
      let originalData = data[tableName];
      //log(`Parsing data for table: ${tableName}`);

      /******************************************************/
      /* Step 2: Flatten the JSON object                    */
      /*  Since JSON is unstructured, we need to conver it  */
      /*  to a flat array of data (rows)                    */
      /******************************************************/

      //  Flatten the data into key-value pairs
      let flattenedData = Object.fromEntries(
            Object.entries(originalData).map(([key, value]) => {
               const generatedKeyValuePairs: any[] = [];
               generateNestedKeyNameAndValue(value, "", generatedKeyValuePairs);
               return [key, Object.fromEntries(generatedKeyValuePairs)];
            })
      );

      /******************************************************/
      /* Step 3: Handle nested arrays                       */
      /*  Each "row" may have properties with nested arrays */
      /*  Need to check for this an expand the dataset      */
      /******************************************************/

      // Loop through each "row" of data and expand any rows with nested arrays
      let tableDataArrays:any[] = []
      for (let rowNumber in Object.keys(flattenedData)){
         tableDataArrays.push(rowSplitter(flattenedData[rowNumber]));
      }

      // That left us with an array of arrays (some w/ 1 row, others with N rows).  Need to flatten once more
      let tableData = tableDataArrays.flat();

      /******************************************************/
      /* Step 4: Derive the table's metadata                */
      /*  Loop through each row, & check each field's value */
      /*  Determine which Tableau DataType is applicable    */
      /******************************************************/

      // Loop over each row in tableData
      //log(`Parsing metadata for table: ${tableName}`);
      let columnsDictionary:DynamicObject = {};
      tableData.forEach( row => {
            // Loop over every field in each row (not every row will have the same fields)
            Object.entries(row).map(([fieldname, value]) => {
            // Have we already determined this fields datatype? and does it have a defined dataType? if the datatype is numeric, what if later values are string?
            if (!columnsDictionary[fieldname] || !columnsDictionary[fieldname].dataType || columnsDictionary[fieldname].dataType === DataType.Unknown || columnsDictionary[fieldname].dataType === DataType.Int || columnsDictionary[fieldname].dataType === DataType.Float){
                  // This is a new field, record it's data type
                  columnsDictionary[fieldname] = getTableauDatatype(fieldname, value);
            }
            })
      })

      // Loop through all the columns
      let columns:any[] = [];
      Object.entries(columnsDictionary).map(([columnname, column]) => {
            // Since it's possible that some fields we all null, we need to double check and assign them a default value (string)
            column.dataType = column.dataType ? column.dataType : DataType.String; 
            // Push to the columns array
            columns.push(column);
      })

      /************************************************************/
      /* Step 5: Make sure each row has a reference to each field */
      /*  Each row should have the same list of properties        */
      /*  If they don't exist, they should just be null           */
      /************************************************************/
      tableData.map( row => {
         //  Figure out what keys are already existing in the row
         let rowFields = Object.keys(row);
         //  Are any columns missing?
         if (rowFields.length !== columns.length){
            columns.map( column => {
            if (!(column.id in row)){
               if (column.dataType === DataType.Datetime){
                  //log('missing datetime value')
                  //row[column.id] = convertDatetimeString(null);
               } else {
                  row[column.id] = null;
               }
            }
            })
         }
      })

      //  Save a reference to
      const newDataTable: DataTable = {
         id: tableName,
         name: tableName,
         rows: tableData,
         columns: columns,
         properties: {}
      }
      //results[tableName] = newDataTable;
      results.push(newDataTable);

      //log(`Parsing complete for table: ${tableName}`);
   })

    //  Return all tables, using containerBuilder
    //log(`Parsing complete for all tables (${tables.length})`);
    return results;
}

/***********************************/
/*  Helper Functions               */
/***********************************/

// Helper function that flattens the JSON input into an array
const generateNestedKeyNameAndValue = (input:any, nestedKeyName:string, keyValueArr:any[]) => {
   // Check the input type
   if (typeof input === "object" && !(input === null) ) {
      // Must be an array or object - iterate over them
      const quoteString = Array.isArray(input) ? "" : "'";
      Object.entries(input).forEach(([key, value]:[string,any]) => {
         // Exception: Is this a lat/lng field? 
         if (isLatLngField(key)) {
            // Conver this array into 2 fields within the same row, assuming structure: [lat, lng]
            let latFieldname:string = key.replace("latlng","lat")
            generateNestedKeyNameAndValue(value[0], `${nestedKeyName}[${quoteString}${latFieldname}${quoteString}]`,keyValueArr);
            let lngFieldname:string = key.replace("latlng","lon")
            generateNestedKeyNameAndValue(value[1], `${nestedKeyName}[${quoteString}${lngFieldname}${quoteString}]`,keyValueArr);
         } else {
             // Recursively call this function, and extend the key name 
            generateNestedKeyNameAndValue(value, `${nestedKeyName}[${quoteString}${key}${quoteString}]`,keyValueArr);
         }
      });
  } else {
     // string or number (end value)
     keyValueArr.push([nestedKeyName, input]);
  }
};

// Helper function to remove square brackets and single quotes from fieldnames
const fieldNameCleaner = (name:string):string => {
  const newName = name.replaceAll("[","").replaceAll("]","").replaceAll("'","");
  //  Sometimes the fieldname ends with a .
  if (newName.charAt(newName.length-1) === '.'){
   // Remove the trailing .
   return newName.slice(0,-1);
  } else {
   // Return the field name as is
   return newName;
  }
}

// Recursive function to split each row into multiple rows, if there are nested arrays
const rowSplitter = (row:any):any[] => {

  // Create a placeholder row object
  let newRow:any = {};
  let nestedArrayRows:any[] = [];

  // Loop through each field in the row
  for (const [fieldname, value] of Object.entries(row)) {
     // Is this field a regular property, or part of a nested array?
     let fieldnameParts = fieldname.split(/\[[0-9]+\](.*)/s);
     if (fieldnameParts.length > 1){
         // This field contains at least 1 nested array (multiple rows)
         let fieldMatch = fieldname.match(/\[[0-9]+\]/s);
         nestedArrayRows.push({
            "fieldname": fieldname,
            "fieldnameParts": fieldnameParts,
            "rowNum": parseInt(fieldNameCleaner(fieldMatch?.length ? fieldMatch[0] : fieldname)),
            "value": value
         });

     } else {
        // This field is just a single property (1 row)
        // But is it a datetime? those need to be formatted a certain way
        let newFieldname = fieldNameCleaner(fieldname);
        const valueString:string = value as string;
        newRow[newFieldname] = isDatetimeField(newFieldname) ? convertDatetimeString(valueString) : value;
     }
  }

  // Was this a simple object with no nested arrays?
  if (nestedArrayRows.length === 0) {
     // Yes, return an array w/ length 1 containing the new row
     return [newRow];
  } else {
     // No, there are nested arrays.  Need to send back an array with X rows (based off newRow)
     let newRows = [];
     
     // Group these nestedArray fields based on the rowNum
     let newRowDict:DynamicObject = {}
     nestedArrayRows.forEach( arrayRow => {
        // Make sure the obj for this row # exists
        if (!newRowDict[arrayRow.rowNum]) {
           newRowDict[arrayRow.rowNum] = {};
        }
        // Remove the index from the fieldname
        let newFieldname = `${arrayRow.fieldnameParts[0]}.${arrayRow.fieldnameParts[1]}`
        // Save the fieldname/value
        newRowDict[arrayRow.rowNum][newFieldname] = arrayRow.value;
     })

     // Loop through each additional row that needs to be generated
     for (const [fieldname, value] of Object.entries(newRowDict)){
        // Merge the simple properties & nested properties, pass to this function again (recursively)
        const newNestedRow = rowSplitter({...newRow, ...value});
        newRows.push(newNestedRow);
     }

     // Return multiple rows, expanded for all nested arrays
     return newRows.flat();
  }
}

//  Helper function to determine if the field is a Datetime, based on it's name
const isDatetimeField = (fieldname:string) => {
  // The list of all datetime fields in the Tableau metadata api
  const dateFields = [ 'createdAt', 'updatedAt', 'extractLastRefreshTime', 'extractLastIncrementalUpdateTime', 'extractLastUpdateTime', 'extractLastRefreshedAt','extractLastRefreshedAtWithin' ];
  // Loop through this list, and check the fieldname
  let isMatch = dateFields.filter( name => {
    return fieldname.includes(name);
  }).length>0;
  //  Return true/false
  return isMatch;
}

// Helper function to determine if the field is a lat/long, based on it's name
const isLatLngField = (fieldname:string) => {
   return fieldname.match(/\latlng/s)
}

//  Helper function to convert datetime strings from the Metadata API to a datestring that Tableau will recognize
const convertDatetimeString = (dt:string) => {
  //return dt ? new Date(dt) : new Date(1970,1,1);
  return dt ? new Date(dt) : null;
}

// Helper function to determine the Tableu datatype based on a value
const getTableauDatatype = (fieldname:string, value:any):ColumnHeader => {

  /* First check if the field is a DateTime */
  if (isDatetimeField(fieldname)) {
     return {
        id: fieldname, 
        dataType: allowDatetime ? DataType.Datetime : DataType.String
     }
  }

  /* Next, check if the field is a Lat/Lng  */
  if (isLatLngField(fieldname)){
   return {
      id: fieldname, 
      alias: (fieldname === 'lat') ? 'latitude' : 'longitude',
      columnRole: ColumnRole.Dimension,
      dataType: DataType.Float
   }
  }

  /* Next, check if the field is a boolean */
  if (typeof value == "boolean"){
     return {
        id: fieldname, 
        dataType: DataType.Bool 
     }
  }

  /* Next, check for numeric fields */
  if (typeof value == "number" || typeof value == "bigint"){
     // Is it an integer or float?
     return {
        id: fieldname,
        dataType: value.toString().includes(".") ? DataType.Float : DataType.Int
     }
  }

  /* Next, check for strings */
  if (typeof value == "string"){
     return {
        id: fieldname,
        dataType: DataType.String
     }
  }

  /* Couldn't determine a datatype */
  return {
     id: fieldname,
     dataType: DataType.Unknown
  }
}

//export default JsonParser;
module.exports = { JsonParser };