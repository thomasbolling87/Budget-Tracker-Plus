let db;
let budgetVersion;

// Create a new database request 
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
    console.log('An upgrade is needed in the IndexDB');

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    console.log(`Database updated from previous version ${oldVersion} to latest ${newVersion}`);

    db = e.target.result;

    // Store new name in the budget store array
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore ('BudgetStore', { autoIncrement: true });
    }
};

// If an error occurs this will display the correct error code
request.onerror = function (e) {
    console.log(`There seems to be an issue ${e.target.errorCode}`);
};

// Function to observe the database
function checkDatabase() {
    console.log('check database has be started');

    // Open a new transaction to the budget store database
    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    // This allows user to access the budget store
    const store = transaction.objectStore('BudgetStore');

    // Get all items from budget store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        // This will add items to the sotre if the user needs to bulk add multiple items
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            })
            .then((response) => response.json())
            .then((res) => {
                if (res.length !== 0) {
                    // If the returned response is not empty open another transaction to the BudgetStore with read & write permissions
                    transaction = db.transaction(['BudgetStore'], 'readwrite');

                    // Assign the current store to a variable
                    const currentStore = transaction.objectStore('BudgetStore');

                    currentStore.clear();
                }
            });
        }
    };
};

request.onsuccess = function (event) {
    console.log('success');
    db = event.target.result;
  
    // Check if app is online before reading from db
    if (navigator.onLine) {
      console.log('Backend is operational and online');
      checkDatabase();
    }
  };
  
  const saveRecord = (record) => {
    console.log('Save record invoked');
    // Create a transaction on the BudgetStore db with readwrite access
    const transaction = db.transaction(['BudgetStore'], 'readwrite');
  
    // Access your BudgetStore object store
    const store = transaction.objectStore('BudgetStore');
  
    // Add record to your store with add method.
    store.add(record);
  };
  
  // Listen for app coming back online
  window.addEventListener('online', checkDatabase);
  