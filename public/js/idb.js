// db connection variable

let db;

// make connection to indexedDB database 'budget-tracker', set it to version 1
const request = indexedDB.open('budget-tracker', 1);

//  if the database version changes (nonexistant to version 1, v1 to v2, etc.)

request.onupgradeneeded = function(event) {
    // save to the database
    const db = event.target.result;
    
    // create an objectStore  `new-budget`, set it to have an auto incrementing primary key 
    db.createObjectStore('new-budget', { autoIncrement: true });
}

request.onsuccess = function(event) {
    // when successful save to event
    db = event.target.result;

    // when app is online, uploadBudget() function sends all local db data to api
    if (navigator.onLine) {
        uploadBudget();
    }
};


request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// if no internet connection when submitting then:

function saveRecord(record) {
    // new transaction with the database with read and write permissions
    const transaction = db.transaction(['new-budget'], 'readwrite');

    // objectStore for `new-budget`
    const budgetObjectStore = transaction.objectStore('new-budget');

    // make a record to the ObjectStore
    budgetObjectStore.add(record);
}


function uploadBudget() {
    // open a transaction on your db
    const transaction = db.transaction(['new-budget'], 'readwrite');

    // Access ObjectStore
    const budgetObjectStore = transaction.objectStore('new-budget');

    // get records from objectStore and put into variable
    const getAll = budgetObjectStore.getAll();

    // if successful run function
    
    getAll.onsuccess = function() {
        // if there's data send to api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
              .then(response => response.json())
              .then(serverResponse => {
                  if (serverResponse.message) {
                      throw new Error(serverResponse);
                  }
                 
                  
                  // open transaction
                  const transaction = db.transaction(['new-budget'], 'readwrite');

                  // new budget objectStore
                  const budgetObjectStore = transaction.objectStore('new-budget');

                  // clear objectStore
                  budgetObjectStore.clear();

                  alert('All saved transactions have been submitted.');
              })
              .catch(err => {
                  console.log(err);
              });
        }
    };
}


window.addEventListener('online', uploadBudget);