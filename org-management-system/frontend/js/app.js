// REGISTRATION LOGIC
async function register() {
  const fullName = document.getElementById('register-fullname').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const phone = document.getElementById('register-phone').value;

  if (!fullName || !email || !password) {
    alert('Full name, email, and password are required.');
    return;
  }

  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password, phone })
  });
  const data = await res.json();
  if (res.status === 201) {
    alert('Registration successful! Please login.');
    // Optionally clear form fields
    document.getElementById('register-fullname').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-phone').value = '';
  } else {
    alert(data.message || 'Registration failed.');
  }
}
window.register = register;

// LOGIN/LOGOUT LOGIC
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('isAdmin', data.user.isAdmin);
    alert('Logged in!');
    location.reload();
  } else {
    alert(data.message || 'Login failed');
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

// FETCH PAYMENT HISTORY AND TOTALS
async function fetchPaymentHistoryAndTotals() {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  if (!userId || !token) return;
  const historyResponse = await fetch(`http://localhost:5000/api/payments/history/${userId}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const history = await historyResponse.json();

  const totalsResponse = await fetch(`http://localhost:5000/api/payments/totals/${userId}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const totals = await totalsResponse.json();

  document.getElementById('totals').innerHTML = `
    <b>Total Monthly Contributions:</b> GHC ${totals.totalMonthlyContributions || 0} <br>
    <b>Total Occasion Contributions:</b> GHC ${totals.totalOccasionContributions || 0}
  `;

  const tableBody = document.getElementById('history-table').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';
  history.forEach(p => {
    let row = tableBody.insertRow();
    row.insertCell(0).innerText = p.type;
    row.insertCell(1).innerText = p.amount;
    row.insertCell(2).innerText = p.eventType || '-';
    row.insertCell(3).innerText = new Date(p.date).toLocaleString();
  });
}

// FETCH AND DISPLAY EVENTS/ANNOUNCEMENTS
async function fetchAndDisplayEvents() {
  const res = await fetch('http://localhost:5000/api/events');
  const events = await res.json();
  const list = document.getElementById('events-list');
  list.innerHTML = '';
  if (!events.length) {
    list.innerHTML = '<li>No announcements or events yet.</li>';
    return;
  }
  events.forEach(e => {
    const dateStr = new Date(e.date).toLocaleString();
    list.innerHTML += `<li><b>${e.title}</b> (${e.eventType.replace('_', ' ')}) - <i>${dateStr}</i><br>${e.description || ''}</li>`;
  });
}

// ADMIN: CREATE EVENT
async function createEvent() {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin');
  if (!token || isAdmin !== "true") {
    alert('Only admins can create events.');
    return;
  }
  const title = document.getElementById('event-title').value;
  const description = document.getElementById('event-description').value;
  const eventType = document.getElementById('event-type').value;
  const date = document.getElementById('event-date').value;
  if (!title || !date) {
    alert('Title and date are required.');
    return;
  }
  const res = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, description, eventType, date })
  });
  const data = await res.json();
  if (res.status === 201) {
    alert('Event created!');
    fetchAndDisplayEvents();
    // Optionally clear form fields
    document.getElementById('event-title').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-type').value = 'naming';
    document.getElementById('event-date').value = '';
  } else {
    alert(data.message || 'Failed to create event.');
  }
}
window.createEvent = createEvent;

// INITIATE PAYMENT (PAYSTACK)
async function initiatePayment(type, amount, eventType = null) {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  if (!userId || !token) {
    alert('You must log in to make a payment.');
    return;
  }
  const payload = { userId, type, amount };
  if (eventType) payload.eventType = eventType;

  const response = await fetch('http://localhost:5000/api/payments/initiate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (data.authorization_url) {
    window.location.href = data.authorization_url;
  } else {
    alert('Failed to initiate payment. Please try again.');
  }
}

function payMonthly() {
  initiatePayment('monthly', 20);
}

function payOccasion() {
  const eventType = document.getElementById('occasion-type').value;
  initiatePayment('occasion', 50, eventType);
}

// --- Make functions available to HTML ---
window.login = login;
window.logout = logout;
window.payMonthly = payMonthly;
window.payOccasion = payOccasion;

// --- PAGE LOAD: CHECK LOGIN, ADMIN & SHOW DATA ---
window.onload = function() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const isAdmin = localStorage.getItem('isAdmin');
  if (token && userId) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'inline-block';
    fetchPaymentHistoryAndTotals();
    fetchAndDisplayEvents();
    // Show admin event creation form if user is admin
    if (isAdmin === "true") {
      document.getElementById('admin-event-section').style.display = 'block';
    } else {
      document.getElementById('admin-event-section').style.display = 'none';
    }
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('admin-event-section').style.display = 'none';
  }
};
