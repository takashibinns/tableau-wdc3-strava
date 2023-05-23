import { AsyncParser, DataContainer, ParseOptions,log } from '@tableau/taco-toolkit/handlers'
//import { JsonParser } from './JsonParser'
const testParser = require('./JsonParser');
//const debugging = require('./Debugging');

export default class OAuthParser extends AsyncParser {
  async parse(fetcherResults: any, { dataContainer }: ParseOptions): Promise<DataContainer> {

    //  Create the containerBuilder
    const containerBuilder = AsyncParser.createContainerBuilder(dataContainer)

    //  Parse the JSON (returns an array of DataTables)
    //debugging.log(`raw data: ${JSON.stringify(fetcherResults)}`)
    const dataTables = testParser.JsonParser(fetcherResults,"activities")
    //log(`parsed data: ${JSON.stringify(dataTables)}`)

    /*  Tried this approach to see if it would fix the join issue - it did not
    //  Loop through each datatable returned
    dataTables.forEach( (dataTable:any) => {

      //  Check to see if the table exists already
      const { isNew, tableBuilder } = containerBuilder.getTable(dataTable.name)
      if (isNew) {
        tableBuilder.setId(dataTable.id);
        tableBuilder.addColumnHeaders(dataTable.columns);
      }

      //  Either way, add the rows
      tableBuilder.addRows(dataTable.rows);
    })
    */

    //  Add the tables to ContainerBuilder
    containerBuilder.appendTables(dataTables);

    //  Return the DataContainer
    return containerBuilder.getDataContainer()
  }
}
