class FedresursParser {
  constructor(guid) {
    this.guid = guid;
    this.limit = 6000; // сколько записей подгружать
    this.delay = 4000; // задержка между запросами на карточки. Нужен во избежание бана

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
      self.totalRecords = content.length;
      content.forEach((element, i) => {
        if (self.stop === true) { 
          console.error('Что-то пошло не так. Загрузка остановлена'); 
          return; 
        }
        setTimeout(() => {
          self.loadDetails(element.guid);
        }, i * self.delay);
      });

      console.warn(`Записей для загрузки: ${content.length}`);
    };

    request.send(JSON.stringify(requestParams));
  }

  isFinished(){
    return this.totalRecords == this.processedRecords;
  }

  // @method Подгружаем детали записи для сохранения
  loadDetails(guid) {
    if (this.stop) { 
      this.processedRecords += 1;
      if (this.isFinished()) {
        this.exportToCSV();
      }

      return; 
    }

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
        }
      } else {
        self.stop = true;
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

let parser = new FedresursParser('a04ea2eb-298c-4882-af1b-ad9b8f4d5ca4');
parser.loadItems();


