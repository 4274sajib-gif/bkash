/* ================================================
   APPS SCRIPT URL
================================================ */

const API_URL =
  'https://script.google.com/macros/s/AKfycbwjo8vQO3GmnVKTJLJKmoAgHKQequvOtzuO9ySlLSqCAABvGuPvb3X_PeDDMSVu6Fb0Tg/exec';


let currentUser = null;


/* ================================================
   API
================================================ */

function api(action, params = {}) {

  return new Promise(
    function(resolve, reject) {

      const callbackName =
        'apiCallback_' +
        Date.now() +
        '_' +
        Math.floor(
          Math.random() * 100000
        );

      const script =
        document.createElement(
          'script'
        );

      const query =
        new URLSearchParams();

      query.set(
        'action',
        action
      );

      query.set(
        'callback',
        callbackName
      );

      Object.keys(params).forEach(
        function(key) {

          if (
            params[key] !== undefined &&
            params[key] !== null
          ) {

            query.set(
              key,
              params[key]
            );

          }

        }
      );


      const timeout =
        setTimeout(
          function() {

            cleanup();

            reject(
              new Error(
                'Server request timed out.'
              )
            );

          },
          15000
        );


      function cleanup() {

        clearTimeout(timeout);

        if (script.parentNode) {

          script.parentNode
            .removeChild(
              script
            );

        }

        try {

          delete window[
            callbackName
          ];

        } catch (e) {}

      }


      window[callbackName] =
        function(result) {

          cleanup();

          resolve(result);

        };


      script.onerror =
        function() {

          cleanup();

          reject(
            new Error(
              'Unable to connect to server.'
            )
          );

        };


      script.src =
        API_URL +
        '?' +
        query.toString();


      document.head.appendChild(
        script
      );

    }
  );
}


/* ================================================
   PAGE
================================================ */

function showPage(pageId) {

  document
    .querySelectorAll('.page')
    .forEach(
      function(page) {

        page.classList.remove(
          'active'
        );

      }
    );


  const page =
    document.getElementById(
      pageId
    );


  if (page) {

    page.classList.add(
      'active'
    );

  }

}


/* ================================================
   LOADING
================================================ */

function showLoading() {

  document
    .getElementById('loading')
    .classList.remove(
      'hidden'
    );

}


function hideLoading() {

  document
    .getElementById('loading')
    .classList.add(
      'hidden'
    );

}


/* ================================================
   PASSWORD
================================================ */

function togglePassword() {

  const input =
    document.getElementById(
      'password'
    );

  input.type =
    input.type === 'password'
      ? 'text'
      : 'password';

}


/* ================================================
   LOGIN
================================================ */

async function loginUser() {

  const username =
    document
      .getElementById(
        'username'
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        'password'
      )
      .value
      .trim();


  const message =
    document.getElementById(
      'loginMessage'
    );


  message.textContent = '';


  if (
    !username ||
    !password
  ) {

    message.textContent =
      'Username and password required.';

    return;
  }


  showLoading();


  try {

    const result =
      await api(
        'login',
        {
          username:
            username,

          password:
            password
        }
      );


    hideLoading();


    if (
      !result ||
      !result.success
    ) {

      message.textContent =
        result &&
        result.message
          ? result.message
          : 'Login failed.';

      return;
    }


    currentUser =
      result;


    localStorage.setItem(
      'transactionUser',
      JSON.stringify(
        currentUser
      )
    );


    if (
      String(result.role)
        .toLowerCase()
        === 'admin'
    ) {

      document
        .getElementById(
          'adminWelcome'
        )
        .textContent =
        'Welcome, ' +
        (
          result.name ||
          'Admin'
        );


      showPage(
        'adminPage'
      );

      return;
    }


    if (
      String(result.role)
        .toLowerCase()
        === 'viewer'
    ) {

      document
        .getElementById(
          'viewerWelcome'
        )
        .textContent =
        'Welcome, ' +
        result.name;


      setupMonthSelect(
        'viewerMonth'
      );


      showPage(
        'viewerPage'
      );


      loadViewerDetails();

      return;
    }


    message.textContent =
      'Unknown account type.';

  }


  catch (error) {

    hideLoading();

    message.textContent =
      error.message ||
      'Something went wrong.';

  }

}


/* ================================================
   LOGOUT
================================================ */

async function logout() {

  if (currentUser) {

    try {

      await api(
        'logout',
        {
          token:
            currentUser.token
        }
      );

    } catch (e) {}

  }


  currentUser = null;


  localStorage.removeItem(
    'transactionUser'
  );


  document
    .getElementById(
      'username'
    )
    .value = '';


  document
    .getElementById(
      'password'
    )
    .value = '';


  showPage(
    'loginPage'
  );

}


/* ================================================
   ADD TRANSACTION
================================================ */

async function openAddTransaction() {

  showPage(
    'addTransactionPage'
  );


  setToday();


  await loadNames();


  await loadOptions();


  selectType(
    'বিক্রয়'
  );

}


/* ================================================
   CHECK DETAILS
================================================ */

async function openCheckDetails() {

  showPage(
    'checkDetailsPage'
  );


  setupMonthSelect(
    'monthSelect'
  );


  await loadDetailNames();

}


/* ================================================
   TODAY
================================================ */

function setToday() {

  const input =
    document.getElementById(
      'transactionDate'
    );


  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    );


  input.value =
    year +
    '-' +
    month +
    '-' +
    day;

}


/* ================================================
   LOAD NAMES
================================================ */

async function loadNames() {

  try {

    const result =
      await api(
        'getNames',
        {
          token:
            currentUser.token
        }
      );


    if (
      !result.success
    ) {

      return;
    }


    const select =
      document.getElementById(
        'transactionName'
      );


    select.innerHTML =
      '<option value="">Select Name</option>';


    result.names.forEach(
      function(name) {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          name;

        option.textContent =
          name;


        select.appendChild(
          option
        );

      }
    );

  }


  catch (error) {

    console.error(error);

  }

}


/* ================================================
   LOAD DETAIL NAMES
================================================ */

async function loadDetailNames() {

  try {

    const result =
      await api(
        'getNames',
        {
          token:
            currentUser.token
        }
      );


    if (
      !result.success
    ) {

      return;
    }


    const select =
      document.getElementById(
        'detailsName'
      );


    select.innerHTML =
      '<option value="">Select Name</option>';


    result.names.forEach(
      function(name) {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          name;

        option.textContent =
          name;


        select.appendChild(
          option
        );

      }
    );

  }


  catch (error) {

    console.error(error);

  }

}


/* ================================================
   LOAD SETTINGS OPTIONS
================================================ */

let salesOptions = [];
let paymentOptions = [];


async function loadOptions() {

  try {

    const result =
      await api(
        'getOptions',
        {
          token:
            currentUser.token
        }
      );


    if (
      !result.success
    ) {

      return;
    }


    salesOptions =
      result.sales || [];


    paymentOptions =
      result.payments || [];


  }


  catch (error) {

    console.error(error);

  }

}


/* ================================================
   TYPE SELECT
================================================ */

function selectType(type) {

  document
    .getElementById(
      'transactionType'
    )
    .value =
    type;


  document
    .getElementById(
      'saleBtn'
    )
    .classList.remove(
      'active'
    );


  document
    .getElementById(
      'paymentBtn'
    )
    .classList.remove(
      'active'
    );


  const select =
    document.getElementById(
      'transactionMethod'
    );


  const label =
    document.getElementById(
      'methodLabel'
    );


  select.innerHTML =
    '<option value="">Select</option>';


  let options = [];


  if (
    type === 'বিক্রয়'
  ) {

    document
      .getElementById(
        'saleBtn'
      )
      .classList.add(
        'active'
      );


    label.textContent =
      'বিক্রয়ের ধরন';


    options =
      salesOptions;

  }


  else {

    document
      .getElementById(
        'paymentBtn'
      )
      .classList.add(
        'active'
      );


    label.textContent =
      'পেমেন্টের ধরন';


    options =
      paymentOptions;

  }


  options.forEach(
    function(item) {

      const option =
        document.createElement(
          'option'
        );


      option.value =
        item;

      option.textContent =
        item;


      select.appendChild(
        option
      );

    }
  );

}


/* ================================================
   SAVE
================================================ */

async function saveTransaction() {

  const date =
    document
      .getElementById(
        'transactionDate'
      )
      .value;


  const amount =
    document
      .getElementById(
        'transactionAmount'
      )
      .value;


  const name =
    document
      .getElementById(
        'transactionName'
      )
      .value;


  const type =
    document
      .getElementById(
        'transactionType'
      )
      .value;


  const method =
    document
      .getElementById(
        'transactionMethod'
      )
      .value;


  const message =
    document.getElementById(
      'transactionMessage'
    );


  message.textContent = '';


  if (!date) {

    message.textContent =
      'Please select a date.';

    return;
  }


  if (
    !amount ||
    Number(amount) <= 0
  ) {

    message.textContent =
      'Please enter a valid amount.';

    return;
  }


  if (!name) {

    message.textContent =
      'Please select a name.';

    return;
  }


  if (!method) {

    message.textContent =
      'Please select an option.';

    return;
  }


  showLoading();


  try {

    const result =
      await api(
        'addTransaction',
        {

          token:
            currentUser.token,

          date:
            date,

          amount:
            amount,

          name:
            name,

          type:
            type,

          method:
            method

        }
      );


    hideLoading();


    message.textContent =
      result.message || '';


    if (
      result.success
    ) {

      document
        .getElementById(
          'transactionAmount'
        )
        .value = '';


      document
        .getElementById(
          'transactionName'
        )
        .value = '';


      document
        .getElementById(
          'transactionMethod'
        )
        .value = '';

    }

  }


  catch (error) {

    hideLoading();

    message.textContent =
      error.message ||
      'Failed to save transaction.';

  }

}


/* ================================================
   MONTH SELECT
   EMPTY = ALL MONTHS
================================================ */

function setupMonthSelect(
  elementId
) {

  const select =
    document.getElementById(
      elementId
    );


  if (!select) {
    return;
  }


  select.innerHTML =
    '<option value="">Select Month</option>';


  const now =
    new Date();


  const currentYear =
    now.getFullYear();


  const currentMonth =
    now.getMonth();


  for (
    let i = 0;
    i < 24;
    i++
  ) {

    const date =
      new Date(
        currentYear,
        currentMonth - i,
        1
      );


    const year =
      date.getFullYear();


    const month =
      date.getMonth() + 1;


    const monthName =
      date.toLocaleString(
        'en-US',
        {
          month:
            'long'
        }
      );


    const option =
      document.createElement(
        'option'
      );


    option.value =
      year +
      '-' +
      month;


    option.textContent =
      monthName +
      ' ' +
      year;


    select.appendChild(
      option
    );

  }

}


/* ================================================
   SELECTED MONTH
================================================ */

function getSelectedMonth(
  elementId
) {

  const value =
    document
      .getElementById(
        elementId
      )
      .value;


  if (!value) {

    return {
      year: '',
      month: ''
    };

  }


  const parts =
    value.split('-');


  return {

    year:
      Number(parts[0]),

    month:
      Number(parts[1])

  };

}


/* ================================================
   CUSTOMER DETAILS
================================================ */

async function loadCustomerDetails() {

  const name =
    document
      .getElementById(
        'detailsName'
      )
      .value;


  if (!name) {

    document
      .getElementById(
        'balanceCard'
      )
      .classList.add(
        'hidden'
      );


    document
      .getElementById(
        'monthlySection'
      )
      .classList.add(
        'hidden'
      );


    document
      .getElementById(
        'transactionsSection'
      )
      .classList.add(
        'hidden'
      );


    return;
  }


  const selected =
    getSelectedMonth(
      'monthSelect'
    );


  showLoading();


  try {

    const result =
      await api(
        'customerDetails',
        {

          token:
            currentUser.token,

          name:
            name,

          year:
            selected.year,

          month:
            selected.month

        }
      );


    hideLoading();


    if (
      !result.success
    ) {

      document
        .getElementById(
          'detailsMessage'
        )
        .textContent =
        result.message || '';

      return;
    }


    document
      .getElementById(
        'currentBalance'
      )
      .textContent =
      formatAmount(
        result.currentBalance
      );


    document
      .getElementById(
        'balanceCard'
      )
      .classList.remove(
        'hidden'
      );


    document
      .getElementById(
        'monthlySales'
      )
      .textContent =
      formatAmount(
        result.totalSales
      );


    document
      .getElementById(
        'monthlySection'
      )
      .classList.remove(
        'hidden'
      );


    renderTransactions(
      result.transactions,
      'transactionList'
    );


    document
      .getElementById(
        'transactionsSection'
      )
      .classList.remove(
        'hidden'
      );

  }


  catch (error) {

    hideLoading();

    document
      .getElementById(
        'detailsMessage'
      )
      .textContent =
      error.message ||
      'Failed to load details.';

  }

}


/* ================================================
   VIEWER DETAILS
================================================ */

async function loadViewerDetails() {

  if (!currentUser) {
    return;
  }


  const selected =
    getSelectedMonth(
      'viewerMonth'
    );


  showLoading();


  try {

    const result =
      await api(
        'viewerDetails',
        {

          token:
            currentUser.token,

          year:
            selected.year,

          month:
            selected.month

        }
      );


    hideLoading();


    if (
      !result.success
    ) {

      document
        .getElementById(
          'viewerMessage'
        )
        .textContent =
        result.message || '';

      return;
    }


    document
      .getElementById(
        'viewerBalance'
      )
      .textContent =
      formatAmount(
        result.currentBalance
      );


    document
      .getElementById(
        'viewerMonthlySales'
      )
      .textContent =
      formatAmount(
        result.totalSales
      );


    renderTransactions(
      result.transactions,
      'viewerTransactionList'
    );

  }


  catch (error) {

    hideLoading();

    document
      .getElementById(
        'viewerMessage'
      )
      .textContent =
      error.message ||
      'Failed to load details.';

  }

}


/* ================================================
   RENDER TRANSACTIONS
================================================ */

function renderTransactions(
  transactions,
  elementId
) {

  const container =
    document.getElementById(
      elementId
    );


  container.innerHTML = '';


  if (
    !transactions ||
    transactions.length === 0
  ) {

    container.innerHTML =
      '<div class="message">No transactions found.</div>';

    return;
  }


  transactions.forEach(
    function(item) {

      const card =
        document.createElement(
          'div'
        );


      card.className =
        'transaction-card ' +
        (
          item.type === 'বিক্রয়'
            ? 'sale'
            : 'payment'
        );


      const info =
        document.createElement(
          'div'
        );


      info.className =
        'transaction-info';


      const date =
        document.createElement(
          'div'
        );


      date.className =
        'transaction-date';


      date.textContent =
        item.date;


      const type =
        document.createElement(
          'div'
        );


      type.className =
        'transaction-type';


      type.textContent =
        item.type === 'বিক্রয়'
          ? '🛒 বিক্রয়'
          : '💳 পেমেন্ট';


      const method =
        document.createElement(
          'div'
        );


      method.className =
        'transaction-method';


      method.textContent =
        item.method
          ? '• ' + item.method
          : '';


      info.appendChild(
        date
      );


      info.appendChild(
        type
      );


      info.appendChild(
        method
      );


      const amount =
        document.createElement(
          'div'
        );


      amount.className =
        'transaction-amount';


      amount.textContent =
        formatAmount(
          item.amount
        );


      card.appendChild(
        info
      );


      card.appendChild(
        amount
      );


      container.appendChild(
        card
      );

    }
  );

}


/* ================================================
   AMOUNT
================================================ */

function formatAmount(
  amount
) {

  const number =
    Number(amount) || 0;


  return (
    number.toLocaleString(
      'en-US'
    ) +
    ' Tk'
  );

}


/* ================================================
   RESTORE SESSION
================================================ */

function restoreSession() {

  try {

    const saved =
      localStorage.getItem(
        'transactionUser'
      );


    if (!saved) {

      showPage(
        'loginPage'
      );

      return;
    }


    const user =
      JSON.parse(
        saved
      );


    if (
      !user ||
      !user.token
    ) {

      localStorage.removeItem(
        'transactionUser'
      );

      showPage(
        'loginPage'
      );

      return;
    }


    currentUser =
      user;


    if (
      String(user.role)
        .toLowerCase()
        === 'admin'
    ) {

      document
        .getElementById(
          'adminWelcome'
        )
        .textContent =
        'Welcome, ' +
        (
          user.name ||
          'Admin'
        );


      showPage(
        'adminPage'
      );

    }


    else if (
      String(user.role)
        .toLowerCase()
        === 'viewer'
    ) {

      document
        .getElementById(
          'viewerWelcome'
        )
        .textContent =
        'Welcome, ' +
        user.name;


      setupMonthSelect(
        'viewerMonth'
      );


      showPage(
        'viewerPage'
      );


      loadViewerDetails();

    }


    else {

      logout();

    }

  }


  catch (error) {

    localStorage.removeItem(
      'transactionUser'
    );

    showPage(
      'loginPage'
    );

  }

}


/* ================================================
   START
================================================ */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    setToday();

    setupMonthSelect(
      'monthSelect'
    );

    setupMonthSelect(
      'viewerMonth'
    );

    restoreSession();

  }
);
