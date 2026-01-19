/* ===========================
   ✅ Fine Settings
=========================== */
const FINE_PER_DAY = 2;
const GRACE_DAYS = 0;

/* ===========================
   ✅ Data (LocalStorage)
=========================== */
let books = JSON.parse(localStorage.getItem("books")) || [];
let users = JSON.parse(localStorage.getItem("users")) || [];
let loans = JSON.parse(localStorage.getItem("loans")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

/* ===========================
   ✅ Date Helpers (DD/MM/YYYY)
=========================== */
function formatDDMMYYYY(dateObj) {
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDDMMYYYY_FromISO(isoString) {
  if (!isoString || isoString === "-") return "-";
  return formatDDMMYYYY(new Date(isoString));
}

function parseDDMMYYYY_ToDate(ddmmyyyy) {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) return null;

  const dd = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);

  if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return null;
  if (dd < 1 || dd > 31) return null;
  if (mm < 1 || mm > 12) return null;
  if (yyyy < 1900 || yyyy > 2100) return null;

  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== (mm - 1) || d.getDate() !== dd) return null;

  return d;
}

function ddmmyyyyToISODate(ddmmyyyy) {
  const d = parseDDMMYYYY_ToDate(ddmmyyyy);
  if (!d) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // ISO date
}

function formatDDMMYYYY_FromISODateString(isoDateStr) {
  if (!isoDateStr) return "-";
  return formatDDMMYYYY(new Date(isoDateStr));
}

/* ===========================
   ✅ Auto "/" while typing + Calendar sync
=========================== */
function autoSlashDateInput(inputEl) {
  let v = inputEl.value.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);

  if (v.length >= 5) {
    inputEl.value = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  } else if (v.length >= 3) {
    inputEl.value = `${v.slice(0, 2)}/${v.slice(2)}`;
  } else {
    inputEl.value = v;
  }
}

function openCalendar() {
  const picker = document.getElementById("dueDatePicker");
  if (!picker) return;
  picker.showPicker ? picker.showPicker() : picker.click();
}

function syncPickerToText() {
  const picker = document.getElementById("dueDatePicker");
  const text = document.getElementById("dueDateText");
  if (!picker || !text) return;
  if (!picker.value) return;
  text.value = formatDDMMYYYY(new Date(picker.value));
}

function syncTextToPicker() {
  const picker = document.getElementById("dueDatePicker");
  const text = document.getElementById("dueDateText");
  if (!picker || !text) return;

  const iso = ddmmyyyyToISODate(text.value);
  if (iso) picker.value = iso;
}

/* ===========================
   ✅ Storage
=========================== */
function saveData() {
  localStorage.setItem("books", JSON.stringify(books));
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("loans", JSON.stringify(loans));
  localStorage.setItem("history", JSON.stringify(history));
}

/* ===========================
   ✅ Fine Logic
=========================== */
function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDueDateToMidnight(isoDueDateStr) {
  const d = new Date(isoDueDateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateOverdueAndFine(isoDueDateStr) {
  const today = getTodayMidnight();
  const due = parseDueDateToMidnight(isoDueDateStr);

  const diffMs = today - due;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const overdueDays = Math.max(0, diffDays);
  const fineDays = Math.max(0, overdueDays - GRACE_DAYS);
  const fine = fineDays * FINE_PER_DAY;

  return { overdueDays, fine };
}

/* ===========================
   ✅ Security
=========================== */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ===========================
   ✅ Multi Page Feeling
=========================== */
function showPage(pageId, clickedBtn) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active-page");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  if (clickedBtn) clickedBtn.classList.add("active");

  localStorage.setItem("activePage", pageId);
}

/* ===========================
   ✅ Dashboard (Advanced)
=========================== */
function updateDashboard() {
  const totalTitles = books.length;
  const totalQty = books.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  let overdueCount = 0;
  let pendingFineTotal = 0;

  loans.forEach(l => {
    const { overdueDays, fine } = calculateOverdueAndFine(l.dueDateISO);
    if (overdueDays > 0) overdueCount++;
    pendingFineTotal += fine;
  });

  const outOfStockCount = books.filter(b => (Number(b.quantity) || 0) === 0).length;
  const lowStockCount = books.filter(b => (Number(b.quantity) || 0) > 0 && (Number(b.quantity) || 0) <= 2).length;

  const fineCollectedTotal = history.reduce((sum, h) => sum + (Number(h.fine) || 0), 0);

  const today = formatDDMMYYYY(new Date());

  const todayIssuedCount = history.filter(h =>
    h.action === "Allotted" && formatDDMMYYYY_FromISO(h.issuedAt) === today
  ).length;

  const todayReturnedCount = history.filter(h =>
    String(h.action).toLowerCase().includes("returned") &&
    formatDDMMYYYY_FromISO(h.returnedAt) === today
  ).length;

  const todayFineCollected = history
    .filter(h =>
      String(h.action).toLowerCase().includes("returned") &&
      formatDDMMYYYY_FromISO(h.returnedAt) === today
    )
    .reduce((sum, x) => sum + (Number(x.fine) || 0), 0);

  const borrowMap = {};
  history.forEach(h => {
    if (h.action === "Allotted") {
      borrowMap[h.book] = (borrowMap[h.book] || 0) + 1;
    }
  });

  let mostBorrowedBook = "-";
  let maxBorrow = 0;
  Object.keys(borrowMap).forEach(bookName => {
    if (borrowMap[bookName] > maxBorrow) {
      maxBorrow = borrowMap[bookName];
      mostBorrowedBook = `${bookName} (${maxBorrow} times)`;
    }
  });

  const fineUserMap = {};
  history.forEach(h => {
    if (String(h.action).toLowerCase().includes("returned")) {
      fineUserMap[h.user] = (fineUserMap[h.user] || 0) + (Number(h.fine) || 0);
    }
  });

  let highestFineUser = "-";
  let maxFine = 0;
  Object.keys(fineUserMap).forEach(userName => {
    if (fineUserMap[userName] > maxFine) {
      maxFine = fineUserMap[userName];
      highestFineUser = `${userName} (₹${maxFine})`;
    }
  });

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText("totalTitles", totalTitles);
  setText("totalBooks", totalQty);
  setText("totalUsers", users.length);
  setText("activeLoans", loans.length);

  setText("overdueLoans", overdueCount);
  setText("pendingFine", `₹${pendingFineTotal}`);
  setText("fineCollected", `₹${fineCollectedTotal}`);

  setText("outOfStock", outOfStockCount);
  setText("lowStock", lowStockCount);

  setText("todayIssued", todayIssuedCount);
  setText("todayReturned", todayReturnedCount);
  setText("todayFine", `₹${todayFineCollected}`);

  setText("mostBorrowedBook", mostBorrowedBook);
  setText("highestFineUser", highestFineUser);

  // Top overdue list (Top 5)
  const overdueList = loans
    .map(l => {
      const user = users.find(u => u.id === l.userId);
      const book = books.find(b => b.isbn === l.bookIsbn);
      const { overdueDays, fine } = calculateOverdueAndFine(l.dueDateISO);

      return {
        user: user ? user.name : "Unknown",
        book: book ? book.title : "Unknown",
        due: formatDDMMYYYY_FromISODateString(l.dueDateISO),
        overdueDays,
        fine
      };
    })
    .filter(x => x.overdueDays > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays)
    .slice(0, 5);

  const overdueBody = document.querySelector("#topOverdueTable tbody");
  if (overdueBody) {
    overdueBody.innerHTML = "";
    if (overdueList.length === 0) {
      overdueBody.innerHTML = `<tr><td colspan="5">No overdue loans ✅</td></tr>`;
    } else {
      overdueList.forEach(x => {
        overdueBody.innerHTML += `
          <tr>
            <td>${escapeHtml(x.user)}</td>
            <td>${escapeHtml(x.book)}</td>
            <td>${x.due}</td>
            <td>${x.overdueDays}</td>
            <td>₹${x.fine}</td>
          </tr>
        `;
      });
    }
  }

  // Low stock list (Top 5)
  const lowStockBooks = books
    .filter(b => (Number(b.quantity) || 0) <= 2)
    .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
    .slice(0, 5);

  const lowStockBody = document.querySelector("#lowStockTable tbody");
  if (lowStockBody) {
    lowStockBody.innerHTML = "";
    if (lowStockBooks.length === 0) {
      lowStockBody.innerHTML = `<tr><td colspan="3">All books have good stock ✅</td></tr>`;
    } else {
      lowStockBooks.forEach(b => {
        lowStockBody.innerHTML += `
          <tr>
            <td>${escapeHtml(b.title)}</td>
            <td>${escapeHtml(b.isbn)}</td>
            <td>${b.quantity}</td>
          </tr>
        `;
      });
    }
  }

  // Recent activity (Top 10)
  const recent = [...history].reverse().slice(0, 10);
  const activityBody = document.querySelector("#recentActivityTable tbody");
  if (activityBody) {
    activityBody.innerHTML = "";
    if (recent.length === 0) {
      activityBody.innerHTML = `<tr><td colspan="4">No history yet.</td></tr>`;
    } else {
      recent.forEach(h => {
        const dateText = h.action === "Allotted"
          ? formatDDMMYYYY_FromISO(h.issuedAt)
          : (String(h.action).toLowerCase().includes("returned")
            ? formatDDMMYYYY_FromISO(h.returnedAt)
            : "-");

        activityBody.innerHTML += `
          <tr>
            <td>${escapeHtml(h.user)}</td>
            <td>${escapeHtml(h.book)}</td>
            <td>${escapeHtml(h.action)}</td>
            <td>${dateText}</td>
          </tr>
        `;
      });
    }
  }
}

/* ===========================
   ✅ Books
=========================== */
function renderBooks() {
  const tbody = document.querySelector("#booksTable tbody");
  tbody.innerHTML = "";

  books.forEach((book, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>${escapeHtml(book.isbn)}</td>
        <td>${book.quantity}</td>
        <td>
          <button class="edit" onclick="editBook(${index})"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete" onclick="deleteBook(${index})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `;
  });

  updateAllotBookOptions();
}

function addBook() {
  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const isbn = document.getElementById("bookISBN").value.trim();
  const quantity = parseInt(document.getElementById("bookQuantity").value);

  if (!title || !author || !isbn || isNaN(quantity) || quantity <= 0) {
    alert("Please fill valid book details.");
    return;
  }

  if (books.some((b) => b.isbn === isbn)) {
    alert("ISBN already exists!");
    return;
  }

  books.push({ title, author, isbn, quantity });
  saveData();
  renderBooks();
  updateDashboard();

  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookISBN").value = "";
  document.getElementById("bookQuantity").value = "";

  animateSuccess();
}

function editBook(index) {
  const book = books[index];
  if (!book) return;

  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookISBN").value = book.isbn;
  document.getElementById("bookQuantity").value = book.quantity;

  books.splice(index, 1);
  saveData();
  renderBooks();
  updateDashboard();
}

function deleteBook(index) {
  books.splice(index, 1);
  saveData();
  renderBooks();
  updateDashboard();
}

function filterBooks() {
  const query = document.getElementById("searchBook").value.toLowerCase();
  const tbody = document.querySelector("#booksTable tbody");
  tbody.innerHTML = "";

  books.forEach((book, index) => {
    const match =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query);

    if (match) {
      tbody.innerHTML += `
        <tr>
          <td>${escapeHtml(book.title)}</td>
          <td>${escapeHtml(book.author)}</td>
          <td>${escapeHtml(book.isbn)}</td>
          <td>${book.quantity}</td>
          <td>
            <button class="edit" onclick="editBook(${index})"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete" onclick="deleteBook(${index})"><i class="fas fa-trash"></i> Delete</button>
          </td>
        </tr>
      `;
    }
  });
}

/* ===========================
   ✅ Users
=========================== */
function renderUsers() {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  users.forEach((user, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.id)}</td>
        <td>${escapeHtml(user.type)}</td>
        <td>
          <button class="details" onclick="showUserDetails(${index})">
            <i class="fas fa-info-circle"></i> USER DETAILS
          </button>
          <button class="delete" onclick="deleteUser(${index})">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  });

  updateAllotUserOptions();
}

function addUser() {
  const name = document.getElementById("userName").value.trim();
  const id = document.getElementById("userID").value.trim();
  const type = document.getElementById("userType").value;

  if (!name || !id) {
    alert("Please fill valid user details.");
    return;
  }

  if (users.some((u) => u.id === id)) {
    alert("User ID already exists!");
    return;
  }

  users.push({ name, id, type });
  saveData();
  renderUsers();
  updateDashboard();

  document.getElementById("userName").value = "";
  document.getElementById("userID").value = "";

  animateSuccess();
}

function deleteUser(index) {
  const userId = users[index]?.id;
  users.splice(index, 1);
  loans = loans.filter((l) => l.userId !== userId);

  saveData();
  renderUsers();
  renderLoans();
  updateDashboard();
}

function filterUsers() {
  const query = document.getElementById("searchUser").value.toLowerCase();
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  users.forEach((user, index) => {
    const match =
      user.name.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.type.toLowerCase().includes(query);

    if (match) {
      tbody.innerHTML += `
        <tr>
          <td>${escapeHtml(user.name)}</td>
          <td>${escapeHtml(user.id)}</td>
          <td>${escapeHtml(user.type)}</td>
          <td>
            <button class="details" onclick="showUserDetails(${index})">
              <i class="fas fa-info-circle"></i> USER DETAILS
            </button>
            <button class="delete" onclick="deleteUser(${index})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }
  });
}

/* ===========================
   ✅ Dropdowns
=========================== */
function updateAllotUserOptions() {
  const select = document.getElementById("allotUser");
  select.innerHTML = '<option>Select User</option>';

  users.forEach((user) => {
    select.innerHTML += `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.id)})</option>`;
  });
}

function updateAllotBookOptions() {
  const select = document.getElementById("allotBook");
  select.innerHTML = '<option>Select Book</option>';

  books.forEach((book) => {
    select.innerHTML += `<option value="${escapeHtml(book.isbn)}">${escapeHtml(book.title)} (${escapeHtml(book.isbn)})</option>`;
  });
}

/* ===========================
   ✅ Loans
=========================== */
function allotBook() {
  const userId = document.getElementById("allotUser").value;
  const bookIsbn = document.getElementById("allotBook").value;

  const dueDateText = document.getElementById("dueDateText").value.trim();
  const dueDateISO = ddmmyyyyToISODate(dueDateText);

  if (userId === "Select User" || bookIsbn === "Select Book" || !dueDateISO) {
    alert("Please select valid user, book and enter due date in DD/MM/YYYY format.");
    return;
  }

  const user = users.find((u) => u.id === userId);
  const book = books.find((b) => b.isbn === bookIsbn);

  if (!user || !book) {
    alert("Invalid selection.");
    return;
  }

  if (book.quantity <= 0) {
    alert("Book not available.");
    return;
  }

  const alreadyLoaned = loans.some((l) => l.userId === userId && l.bookIsbn === bookIsbn);
  if (alreadyLoaned) {
    alert("This user already has this book allotted.");
    return;
  }

  const issuedAt = new Date().toISOString();

  loans.push({
    userId,
    bookIsbn,
    dueDateISO,
    issuedAt
  });

  book.quantity--;

  history.push({
    user: user.name,
    book: book.title,
    action: "Allotted",
    issuedAt,
    dueDateISO,
    returnedAt: "-",
    fine: 0
  });

  document.getElementById("dueDateText").value = "";
  document.getElementById("dueDatePicker").value = "";

  saveData();
  renderLoans();
  renderBooks();
  renderHistory();
  updateDashboard();
  animateSuccess();
}

function renderLoans() {
  const tbody = document.querySelector("#loansTable tbody");
  tbody.innerHTML = "";

  loans.forEach((loan, index) => {
    const user = users.find((u) => u.id === loan.userId);
    const book = books.find((b) => b.isbn === loan.bookIsbn);
    if (!user || !book) return;

    const { overdueDays, fine } = calculateOverdueAndFine(loan.dueDateISO);

    const fineBadge =
      fine === 0
        ? `<span class="badge-ok">₹0</span>`
        : `<span class="badge-warning">₹${fine}</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(book.title)}</td>
        <td>${formatDDMMYYYY_FromISO(loan.issuedAt)}</td>
        <td>${formatDDMMYYYY_FromISODateString(loan.dueDateISO)}</td>
        <td>${overdueDays}</td>
        <td>${fineBadge}</td>
        <td>
          <button class="return-btn" onclick="returnBook(${index})">
            <i class="fas fa-undo"></i> Return
          </button>
        </td>
      </tr>
    `;
  });
}

function returnBook(index) {
  const loan = loans[index];
  if (!loan) return;

  const book = books.find((b) => b.isbn === loan.bookIsbn);
  const user = users.find((u) => u.id === loan.userId);

  if (!book || !user) return;

  const returnedAt = new Date().toISOString();
  const { fine } = calculateOverdueAndFine(loan.dueDateISO);

  book.quantity++;
  loans.splice(index, 1);

  history.push({
    user: user.name,
    book: book.title,
    action: fine > 0 ? `Returned (Fine ₹${fine})` : "Returned",
    issuedAt: loan.issuedAt,
    dueDateISO: loan.dueDateISO,
    returnedAt,
    fine
  });

  saveData();
  renderLoans();
  renderBooks();
  renderHistory();
  updateDashboard();
  animateSuccess();
}

function filterLoans() {
  const query = document.getElementById("searchLoan").value.toLowerCase();
  const tbody = document.querySelector("#loansTable tbody");
  tbody.innerHTML = "";

  loans.forEach((loan, index) => {
    const user = users.find((u) => u.id === loan.userId);
    const book = books.find((b) => b.isbn === loan.bookIsbn);
    if (!user || !book) return;

    const match =
      user.name.toLowerCase().includes(query) ||
      book.title.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query);

    if (!match) return;

    const { overdueDays, fine } = calculateOverdueAndFine(loan.dueDateISO);

    const fineBadge =
      fine === 0
        ? `<span class="badge-ok">₹0</span>`
        : `<span class="badge-warning">₹${fine}</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(book.title)}</td>
        <td>${formatDDMMYYYY_FromISO(loan.issuedAt)}</td>
        <td>${formatDDMMYYYY_FromISODateString(loan.dueDateISO)}</td>
        <td>${overdueDays}</td>
        <td>${fineBadge}</td>
        <td>
          <button class="return-btn" onclick="returnBook(${index})">
            <i class="fas fa-undo"></i> Return
          </button>
        </td>
      </tr>
    `;
  });
}

/* ===========================
   ✅ History
=========================== */
function renderHistory() {
  const tbody = document.querySelector("#historyTable tbody");
  tbody.innerHTML = "";

  history.forEach((entry) => {
    const issuedText = formatDDMMYYYY_FromISO(entry.issuedAt);
    const returnedText = formatDDMMYYYY_FromISO(entry.returnedAt);

    const dueISO = entry.dueDateISO;
    const dueText = dueISO ? formatDDMMYYYY_FromISODateString(dueISO) : "-";

    const fineText = entry.fine ? `₹${entry.fine}` : "₹0";

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(entry.user)}</td>
        <td>${escapeHtml(entry.book)}</td>
        <td>${escapeHtml(entry.action)}</td>
        <td>${issuedText}</td>
        <td>${dueText}</td>
        <td>${returnedText}</td>
        <td>${fineText}</td>
      </tr>
    `;
  });
}

function filterHistory() {
  const query = document.getElementById("searchHistory").value.toLowerCase();
  const tbody = document.querySelector("#historyTable tbody");
  tbody.innerHTML = "";

  history.forEach((entry) => {
    const fullText = `${entry.user} ${entry.book} ${entry.action}`.toLowerCase();
    if (!fullText.includes(query)) return;

    const issuedText = formatDDMMYYYY_FromISO(entry.issuedAt);
    const returnedText = formatDDMMYYYY_FromISO(entry.returnedAt);

    const dueISO = entry.dueDateISO;
    const dueText = dueISO ? formatDDMMYYYY_FromISODateString(dueISO) : "-";

    const fineText = entry.fine ? `₹${entry.fine}` : "₹0";

    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(entry.user)}</td>
        <td>${escapeHtml(entry.book)}</td>
        <td>${escapeHtml(entry.action)}</td>
        <td>${issuedText}</td>
        <td>${dueText}</td>
        <td>${returnedText}</td>
        <td>${fineText}</td>
      </tr>
    `;
  });
}

/* ===========================
   ✅ Modal
=========================== */
function showUserDetails(index) {
  const user = users[index];
  if (!user) return;

  const userLoans = loans.filter((l) => l.userId === user.id);
  const userHistory = history.filter((h) => h.user === user.name);
  const totalFine = userHistory.reduce((sum, x) => sum + (x.fine || 0), 0);

  document.getElementById("userDetails").innerHTML = `
    <p><b>Name:</b> ${escapeHtml(user.name)}</p>
    <p><b>ID:</b> ${escapeHtml(user.id)}</p>
    <p><b>Type:</b> ${escapeHtml(user.type)}</p>
    <p><b>Current Loans:</b> ${userLoans.length}</p>
    <p><b>Total Fine:</b> ₹${totalFine}</p>
  `;
  document.getElementById("userModal").style.display = "block";
}

function closeModal() {
  document.getElementById("userModal").style.display = "none";
}

function closeModalOnOutside(event) {
  if (event.target.id === "userModal") closeModal();
}

/* ===========================
   ✅ Utility
=========================== */
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function animateSuccess() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const oldBg = topbar.style.background;
  topbar.style.background = "linear-gradient(135deg, #28a745 0%, #20c997 100%)";

  setTimeout(() => {
    topbar.style.background = oldBg || "";
  }, 450);
}

function updateDateTime() {
  const now = new Date();
  const el = document.getElementById("currentDateTime");
  if (el) el.textContent = formatDDMMYYYY(now);
}

/* ===========================
   ✅ Init
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fineRateUI").textContent = FINE_PER_DAY;
  document.getElementById("graceDaysUI").textContent = GRACE_DAYS;

  // ✅ Restore last opened page
  const savedPage = localStorage.getItem("activePage") || "dashboard";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  document.getElementById(savedPage)?.classList.add("active-page");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.getAttribute("onclick")?.includes(savedPage)) btn.classList.add("active");
  });

  // ✅ Due Date Input Sync (Auto Slash + Calendar)
  const dueText = document.getElementById("dueDateText");
  const duePicker = document.getElementById("dueDatePicker");

  if (dueText) {
    dueText.addEventListener("input", () => {
      autoSlashDateInput(dueText);
      syncTextToPicker();
    });
  }

  if (duePicker) {
    duePicker.addEventListener("change", () => {
      syncPickerToText();
    });
  }

  // ✅ Init renders
  renderBooks();
  renderUsers();
  renderLoans();
  renderHistory();
  updateDashboard();

  updateDateTime();
  setInterval(updateDateTime, 1000);
});
