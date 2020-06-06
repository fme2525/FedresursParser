class FedresursParser {
  constructor(guid) {
    this.guid = guid;
    this.limit = 5000; // сколько записей подгружать
    this.delay = 2000; // задержка между запросами на карточки. Нужен во избежание бана

    return this;
  }

  // @method Получаем список комментариев
  loadItems() {
    if (!this.guid) {
      alert('guid обязателен!');
      return;
    }
    this.tableOfContents = [];
    this.stop = false;
    this.processedRecords = 0;
    this.totalRecords = 0;
    let requestParams = {
      "guid": this.guid, 
      "pageSize": this.limit, 
      "startRowIndex":0, 
      "startDate":null, 
      "endDate":null, 
      "messageNumber":null, 
      "bankruptMessageType":null, 
      "bankruptMessageTypeGroupId":null, 
      "legalCaseId":null, 
      "searchAmReport":true, 
      "searchFirmBankruptMessage":true, 
      "searchFirmBankruptMessageWithoutLegalCase":false, 
      "searchSfactsMessage":true, 
      "searchSroAmMessage":true, 
      "searchTradeOrgMessage":true, 
      "sfactMessageType":null, 
      "sfactsMessageTypeGroupId":null
    };

    let request = new XMLHttpRequest();
    let self = this;
    request.open('POST', "https://fedresurs.ru/backend/companies/publications");
    request.setRequestHeader('Content-Type', "application/json");
    request.setRequestHeader('Accept', "application/json, text/plain, */*");
    request.onload = function() {
      let content = JSON.parse(this.response)['pageData'];
      self.content = content;
      self.totalRecords = content.length;
      self.loadDetails();
      console.warn(`Записей для загрузки: ${content.length}`);
    };

    request.send(JSON.stringify(requestParams));
  }

  isFinished(){
    return this.totalRecords == this.processedRecords;
  }

  // @method Подгружаем детали записи для сохранения
  loadDetails() {
    if (this.stop || this.isFinished()) { 
      this.processedRecords += 1;
      if (this.isFinished()) {
        this.exportToCSV();
      }

      return; 
    }
    let guid = this.content[this.processedRecords].guid;
    let self = this;
    var request = new XMLHttpRequest();
    request.open('GET', `https://fedresurs.ru/backend/sfactmessages/${guid}`);
    request.setRequestHeader('Content-Type', "application/json");
    request.setRequestHeader('Accept', "application/json, text/plain, */*");
    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        let element = JSON.parse(this.response);
        self.tableOfContents.push(element);
        self.processedRecords += 1;
        console.warn(`Получена ${self.processedRecords} запись`);
        if (self.isFinished()) {
          self.exportToCSV();
          return true;
        }
        
        setTimeout(() => {
           self.loadDetails();
         }, self.delay);
      } else {
        self.stop = true;
        console.error(`Доигрались ${this}`);
        return;
      }
    };

    request.send();
  }

  exportToCSV() {
    if (this.tableOfContents.length === 0) {
      alert('Нет данных для сохранения');
      return;
    }

    let headers = [
      'datePublish', 'content.contractDate', 'content.contractNumber', 'number', 
      'typeName', "publisher.ogrn", "publisher.inn", "publisher.address", 
      "publisher.type", "publisher.name", 'content.lessorsCompanies', 
      'content.lesseesCompanies', 
      'content.lessorsIndividualEntrepreneurs', 'content.lesseesIndividualEntrepreneurs',
       'content.lessorsPersons', 'content.lesseesPersons', 'content.lessorsNonResidentCompanies', 
       'content.lesseesNonResidentCompanies', 'content.subjects'
    ].reduce(function(acc, cur, i) {
      acc[cur] = cur;
      return acc;
    }, {});
    let instanse = new ExportData(headers, `fedresurs_${this.guid}`);
    instanse.save(this.tableOfContents);
  }
}

let parser = new FedresursParser('bf9f0e1c-84a1-48e6-a400-04743df76ad7');
parser.loadItems();


