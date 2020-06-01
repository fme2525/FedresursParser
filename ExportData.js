class ExportData {
  constructor(headers, fileName) {
    this.fileName = fileName;
    this.headers= headers; 
  }

  save(itemsNotFormatted) {
    let itemsFormatted = [];

    itemsNotFormatted.forEach((item) => {
        let row = {};
        Object.keys(this.headers).forEach(function(headerKeyName) {
          let value = null;
          if (headerKeyName.indexOf('.') > -1) {
            let accessKeys = headerKeyName.split('.');
            let dataItem = item[accessKeys[0]][accessKeys[1]];
            if (typeof dataItem == 'object') {
              value = dataItem.map(function(keyContent) {
                let labels = []
                for (let [key, value] of Object.entries(keyContent)) {
                    labels.push(`${key}: ${value}`);
                }
                value = labels.join(' || ');
              }).join("\n");
            } else {
              value = dataItem || '';
            }
          } else {
            value = item[headerKeyName] || '';
          }
          row[headerKeyName] = value.replace(/,/g, '');
        });

        itemsFormatted.push(row);
    });

    this.exportCSVFile(this.headers, itemsFormatted, this.fileName);
  }

  convertToCSV(objArray) {
      var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
      var str = '';

      for (var i = 0; i < array.length; i++) {
          var line = '';
          for (var index in array[i]) {
              if (line != '') line += ',';
              line += array[i][index];
          }
          str += line + '\r\n';
      }

      return str;
  }

  exportCSVFile(headers, items, fileTitle) {
      if (headers) {
          items.unshift(headers);
      }

      var jsonObject = JSON.stringify(items);
      var csv = this.convertToCSV(jsonObject);
      var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) {
          navigator.msSaveBlob(blob, exportedFilenmae);
      } else {
          var link = document.createElement("a");
          if (link.download !== undefined) {
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", exportedFilenmae);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      }
  }
}
