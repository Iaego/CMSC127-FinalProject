// list of hotel rooms
var roomList = [
    {
        id: "standard",
        name: "Pine Classic Room",
        price: 3200,
        capacity: 2,
        size: 24,
        bed: "1 Queen bed",
        totalRooms: 18,
        photo: "images/room-standard.jpg",
        description: "Cozy room with pine garden views, hot shower, wool blankets, and free Wi-Fi."
    },
    {
        id: "deluxe",
        name: "Deluxe Mountain View",
        price: 4800,
        capacity: 2,
        size: 32,
        bed: "1 King bed",
        totalRooms: 12,
        photo: "images/room-deluxe.jpg",
        description: "Private balcony facing the Cordillera mountains, plus breakfast for two."
    },
    {
        id: "family",
        name: "Family Highland Room",
        price: 6500,
        capacity: 4,
        size: 40,
        bed: "2 Double beds",
        totalRooms: 8,
        photo: "images/room-family.jpg",
        description: "Spacious room for families or barkadas overlooking Burnham Park, with breakfast for four."
    },
    {
        id: "suite",
        name: "Session Executive Suite",
        price: 9800,
        capacity: 3,
        size: 58,
        bed: "1 King + sofa bed",
        totalRooms: 4,
        photo: "images/room-suite.jpg",
        description: "Separate living room, electric fireplace, soaking tub, and Baguio night lights view."
    }
];

// optional booking add-ons
var addonPrices = {
    breakfast: { price: 450, mode: "guest-night" },
    shuttle: { price: 900, mode: "booking" },
    late: { price: 1000, mode: "room" },
    tour: { price: 1800, mode: "guest" }
};

// format number as Philippine peso
function formatPeso(amount) {
    return "₱" + Math.round(amount).toLocaleString("en-PH");
}

// escape html characters
function cleanText(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// convert Date object to YYYY-MM-DD
function formatDateInput(dateObj) {
    var year = dateObj.getFullYear();
    var month = String(dateObj.getMonth() + 1).padStart(2, "0");
    var day = String(dateObj.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

// add days to a Date object
function addDays(dateObj, days) {
    var result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
}

// find a room by id
function findRoom(roomId) {
    for (var i = 0; i < roomList.length; i++) {
        if (roomList[i].id === roomId) {
            return roomList[i];
        }
    }
    return null;
}

// read and save data in localStorage
function loadSavedData(key, defaultValue) {
    try {
        var raw = localStorage.getItem(key);
        if (raw === null) {
            return defaultValue;
        }
        return JSON.parse(raw);
    } catch (error) {
        return defaultValue;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// show alert banner on the page
function showMessage(message, alertType) {
    var alertBox = document.getElementById("pageAlert");
    if (!alertBox) {
        alert(message);
        return;
    }
    var style = alertType || "success";
    alertBox.innerHTML =
        '<div class="alert alert-' + style + ' alert-dismissible fade show" role="alert">' +
            message +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
        '</div>';
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// run setup when page finishes loading
document.addEventListener("DOMContentLoaded", function() {
    highlightActiveNav();
    setFooterYear();
    setupHomePage();
    setupRoomsPage();
    setupBookingPage();
    setupGalleryPage();
    setupReviewsPage();
    setupContactPage();
});

// highlight current page link in navbar
function highlightActiveNav() {
    var currentFile = window.location.pathname.split("/").pop();
    if (currentFile === "") {
        currentFile = "index.html";
    }
    var navLinks = document.querySelectorAll(".hotel-navbar .nav-link");
    for (var i = 0; i < navLinks.length; i++) {
        if (navLinks[i].getAttribute("href") === currentFile) {
            navLinks[i].classList.add("active");
        }
    }
}

// update year in footer
function setFooterYear() {
    var yearEl = document.getElementById("currentYear");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

// home page quick booking dates and custom pax input
function setupHomePage() {
    var checkIn = document.getElementById("homeCheckIn");
    var checkOut = document.getElementById("homeCheckOut");
    var guestSelect = document.getElementById("homeGuests");
    var customGuests = document.getElementById("customGuestCount");
    var searchForm = document.getElementById("homeSearchForm");

    if (!checkIn || !checkOut) {
        return;
    }

    var today = new Date();
    checkIn.min = formatDateInput(today);
    checkIn.value = formatDateInput(addDays(today, 1));
    checkOut.min = formatDateInput(addDays(today, 2));
    checkOut.value = formatDateInput(addDays(today, 3));

    checkIn.addEventListener("change", function() {
        if (checkOut.value <= checkIn.value) {
            var nextDay = addDays(new Date(checkIn.value + "T00:00"), 1);
            checkOut.value = formatDateInput(nextDay);
        }
    });

    // show custom pax input when "Other" is selected
    if (guestSelect && customGuests) {
        guestSelect.addEventListener("change", function() {
            if (guestSelect.value === "other") {
                customGuests.classList.remove("d-none");
                customGuests.required = true;
                customGuests.focus();
            } else {
                customGuests.classList.add("d-none");
                customGuests.required = false;
                customGuests.value = "";
            }
        });
    }

    // pass the custom pax number to booking.html on submit
    if (searchForm && guestSelect && customGuests) {
        searchForm.addEventListener("submit", function(event) {
            if (guestSelect.value === "other") {
                event.preventDefault();
                var pax = Number(customGuests.value);
                if (!pax || pax < 1) {
                    customGuests.focus();
                    return;
                }
                var url = "booking.html?checkin=" + encodeURIComponent(checkIn.value) +
                          "&checkout=" + encodeURIComponent(checkOut.value) +
                          "&guests=" + encodeURIComponent(pax);
                window.location.href = url;
            }
        });
    }
}

// rooms page filter and details modal
function setupRoomsPage() {
    var container = document.getElementById("roomsContainer");
    if (!container) {
        return;
    }

    var guestFilter = document.getElementById("guestFilter");
    var priceRange = document.getElementById("maxPriceRange");
    var priceText = document.getElementById("maxPriceText");
    var roomModal = new bootstrap.Modal(document.getElementById("roomDetailsModal"));

    function displayRooms() {
        var minGuests = Number(guestFilter.value);
        var maxPrice = Number(priceRange.value);
        priceText.textContent = formatPeso(maxPrice);

        var html = "";
        for (var i = 0; i < roomList.length; i++) {
            var room = roomList[i];
            if (room.capacity >= minGuests && room.price <= maxPrice) {
                html +=
                    '<div class="col-md-6 col-lg-3">' +
                        '<article class="card info-card h-100">' +
                            '<div class="position-relative">' +
                                '<img src="' + room.photo + '" alt="' + room.name + '" class="room-photo">' +
                                '<span class="price-tag">' + formatPeso(room.price) + '/night</span>' +
                            '</div>' +
                            '<div class="card-body d-flex flex-column">' +
                                '<h3 class="h5">' + room.name + '</h3>' +
                                '<p class="small text-muted mb-2"><i class="bi bi-people gold-text me-1"></i>Up to ' + room.capacity + ' · ' + room.size + ' m² · ' + room.bed + '</p>' +
                                '<p class="small flex-grow-1">' + room.description + '</p>' +
                                '<div class="d-flex gap-2">' +
                                    '<button type="button" class="btn btn-outline-navy btn-sm flex-fill" onclick="openRoomModal(\'' + room.id + '\')">Details</button>' +
                                    '<a href="booking.html?room=' + room.id + '" class="btn btn-gold btn-sm flex-fill">Book</a>' +
                                '</div>' +
                            '</div>' +
                        '</article>' +
                    '</div>';
            }
        }

        if (html === "") {
            html = '<div class="col-12 text-center py-5 text-muted">No rooms match your filter. Try increasing the max price.</div>';
        }
        container.innerHTML = html;
    }

    // open modal when clicking Details button
    window.openRoomModal = function(roomId) {
        var room = findRoom(roomId);
        if (!room) {
            return;
        }
        document.getElementById("modalRoomTitle").textContent = room.name;
        document.getElementById("modalRoomPhoto").src = room.photo;
        document.getElementById("modalRoomInfo").innerHTML =
            '<p class="fs-5 fw-bold navy-text mb-2">' + formatPeso(room.price) + ' <small class="text-muted fw-normal">/ night</small></p>' +
            '<p>' + room.description + '</p>' +
            '<ul class="small mb-0">' +
                '<li>Capacity: up to ' + room.capacity + ' guests (' + room.bed + ')</li>' +
                '<li>Size: ' + room.size + ' m² · Rooms in hotel: ' + room.totalRooms + '</li>' +
                '<li>Free Wi-Fi, hot shower, wool blankets, and 24/7 front desk</li>' +
            '</ul>';
        document.getElementById("modalBookLink").href = "booking.html?room=" + room.id;
        roomModal.show();
    };

    guestFilter.addEventListener("change", displayRooms);
    priceRange.addEventListener("input", displayRooms);
    displayRooms();
}

// booking page and front desk reservation manager
function setupBookingPage() {
    var bookingForm = document.getElementById("bookingForm");
    if (!bookingForm) {
        return;
    }

    var storageKey = "hotelReservations";
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // default bookings
    if (!localStorage.getItem(storageKey)) {
        var defaultBookings = [
            {
                ref: "VH-2601",
                name: "Clarissa Mendoza",
                email: "clarissa@email.com",
                phone: "09175551234",
                roomId: "deluxe",
                roomName: "Deluxe Mountain View",
                rooms: 1,
                guests: 2,
                checkIn: formatDateInput(today),
                checkOut: formatDateInput(addDays(today, 2)),
                total: 10560,
                status: "checked-in"
            },
            {
                ref: "VH-2602",
                name: "Rafael Soriano",
                email: "rafael@email.com",
                phone: "09184449876",
                roomId: "family",
                roomName: "Family Highland Room",
                rooms: 1,
                guests: 4,
                checkIn: formatDateInput(addDays(today, 1)),
                checkOut: formatDateInput(addDays(today, 3)),
                total: 14300,
                status: "confirmed"
            }
        ];
        saveData(storageKey, defaultBookings);
    }

    var checkInInput = document.getElementById("checkInDate");
    var checkOutInput = document.getElementById("checkOutDate");
    var guestInput = document.getElementById("guestCount");
    var roomCountInput = document.getElementById("roomCount");
    var roomSelect = document.getElementById("roomSelect");
    var searchInput = document.getElementById("searchBooking");
    var statusFilter = document.getElementById("statusFilter");

    // fill fields if coming from Home or Rooms page link
    var urlParams = new URLSearchParams(window.location.search);
    checkInInput.min = formatDateInput(today);
    checkInInput.value = urlParams.get("checkin") || formatDateInput(addDays(today, 1));
    checkOutInput.value = urlParams.get("checkout") || formatDateInput(addDays(new Date(checkInInput.value + "T00:00"), 2));

    if (urlParams.get("guests")) {
        guestInput.value = urlParams.get("guests");
    }
    if (urlParams.get("room")) {
        roomSelect.value = urlParams.get("room");
    }

    // calculate total booking cost
    function calculateBooking() {
        var startDate = new Date(checkInInput.value + "T00:00");
        var endDate = new Date(checkOutInput.value + "T00:00");
        var nights = Math.round((endDate - startDate) / 86400000);
        var room = findRoom(roomSelect.value);
        var numRooms = Number(roomCountInput.value);
        var numGuests = Number(guestInput.value);

        if (!room || isNaN(nights) || nights <= 0 || numRooms < 1 || numGuests < 1) {
            return null;
        }

        // count Friday and Saturday nights for 15% weekend surcharge
        var weekendNights = 0;
        for (var i = 0; i < nights; i++) {
            var dayOfWeek = addDays(startDate, i).getDay();
            if (dayOfWeek === 5 || dayOfWeek === 6) {
                weekendNights++;
            }
        }

        var roomTotal = room.price * nights * numRooms;
        var weekendFee = room.price * 0.15 * weekendNights * numRooms;

        // add checked add-ons
        var addonsTotal = 0;
        var checkedAddons = bookingForm.querySelectorAll('input[name="addon"]:checked');
        for (var j = 0; j < checkedAddons.length; j++) {
            var addon = addonPrices[checkedAddons[j].value];
            if (addon.mode === "guest-night") {
                addonsTotal += addon.price * numGuests * nights;
            } else if (addon.mode === "guest") {
                addonsTotal += addon.price * numGuests;
            } else if (addon.mode === "room") {
                addonsTotal += addon.price * numRooms;
            } else {
                addonsTotal += addon.price;
            }
        }

        var subtotal = roomTotal + weekendFee + addonsTotal;
        var serviceCharge = subtotal * 0.10;
        var grandTotal = subtotal + serviceCharge;

        return {
            room: room,
            nights: nights,
            weekendNights: weekendNights,
            numRooms: numRooms,
            numGuests: numGuests,
            roomTotal: roomTotal,
            weekendFee: weekendFee,
            addonsTotal: addonsTotal,
            serviceCharge: serviceCharge,
            grandTotal: grandTotal
        };
    }

    // update live summary box on the right
    function updateSummary() {
        if (checkOutInput.value <= checkInInput.value) {
            var nextDay = addDays(new Date(checkInInput.value + "T00:00"), 1);
            checkOutInput.value = formatDateInput(nextDay);
        }

        var summaryBox = document.getElementById("bookingSummary");
        var details = calculateBooking();
        if (!details) {
            summaryBox.innerHTML = '<p class="text-muted mb-0">Select valid dates to see the price.</p>';
            return;
        }

        var html =
            '<div class="fw-bold navy-text mb-2">' + details.room.name + ' (' + details.numRooms + ' room)</div>' +
            '<div class="d-flex justify-content-between small"><span>' + formatPeso(details.room.price) + ' × ' + details.nights + ' night(s)</span><span>' + formatPeso(details.roomTotal) + '</span></div>';

        if (details.weekendFee > 0) {
            html += '<div class="d-flex justify-content-between small"><span>Weekend surcharge (' + details.weekendNights + ' night)</span><span>' + formatPeso(details.weekendFee) + '</span></div>';
        }
        if (details.addonsTotal > 0) {
            html += '<div class="d-flex justify-content-between small"><span>Selected add-ons</span><span>' + formatPeso(details.addonsTotal) + '</span></div>';
        }

        html +=
            '<div class="d-flex justify-content-between small"><span>Service charge (10%)</span><span>' + formatPeso(details.serviceCharge) + '</span></div>' +
            '<hr class="my-2">' +
            '<div class="d-flex justify-content-between fs-5 fw-bold navy-text"><span>Total</span><span>' + formatPeso(details.grandTotal) + '</span></div>';

        if (details.room.capacity * details.numRooms < details.numGuests) {
            html += '<div class="alert alert-warning small py-2 mt-2 mb-0">This room fits ' + (details.room.capacity * details.numRooms) + ' guest(s). Add a room or pick Family Highland Room.</div>';
        }

        summaryBox.innerHTML = html;
    }

    // display reservations table and dashboard counts
    function displayReservations() {
        var allBookings = loadSavedData(storageKey, []);
        var totalHotelRooms = 42;
        var occupiedRooms = 0;
        var activeCount = 0;
        var checkedInGuests = 0;
        var activeRevenue = 0;

        for (var i = 0; i < allBookings.length; i++) {
            var item = allBookings[i];
            if (item.status === "confirmed" || item.status === "checked-in") {
                activeCount++;
                occupiedRooms += item.rooms;
                activeRevenue += item.total;
            }
            if (item.status === "checked-in") {
                checkedInGuests += item.guests;
            }
        }

        document.getElementById("availableRooms").textContent = Math.max(0, totalHotelRooms - occupiedRooms);
        document.getElementById("activeBookings").textContent = activeCount;
        document.getElementById("checkedInCount").textContent = checkedInGuests;
        document.getElementById("totalBookingAmount").textContent = formatPeso(activeRevenue);

        var searchWord = searchInput.value.trim().toLowerCase();
        var selectedStatus = statusFilter.value;
        var tableHtml = "";

        for (var j = 0; j < allBookings.length; j++) {
            var booking = allBookings[j];
            var matchStatus = (selectedStatus === "all" || booking.status === selectedStatus);
            var matchSearch = (searchWord === "" || booking.ref.toLowerCase().indexOf(searchWord) !== -1 || booking.name.toLowerCase().indexOf(searchWord) !== -1);

            if (matchStatus && matchSearch) {
                var actionButtons = "";
                if (booking.status === "confirmed") {
                    actionButtons += '<button type="button" class="btn btn-outline-success btn-sm me-1" onclick="changeBookingStatus(\'' + booking.ref + '\', \'checked-in\')" title="Check In"><i class="bi bi-box-arrow-in-right"></i></button>';
                    actionButtons += '<button type="button" class="btn btn-outline-danger btn-sm me-1" onclick="changeBookingStatus(\'' + booking.ref + '\', \'cancelled\')" title="Cancel"><i class="bi bi-x-lg"></i></button>';
                } else if (booking.status === "checked-in") {
                    actionButtons += '<button type="button" class="btn btn-outline-primary btn-sm me-1" onclick="changeBookingStatus(\'' + booking.ref + '\', \'completed\')" title="Check Out"><i class="bi bi-box-arrow-right"></i></button>';
                }
                actionButtons += '<button type="button" class="btn btn-outline-navy btn-sm" onclick="window.print()" title="Print Receipt"><i class="bi bi-printer"></i></button>';

                tableHtml +=
                    '<tr>' +
                        '<td class="fw-semibold">' + cleanText(booking.ref) + '</td>' +
                        '<td>' + cleanText(booking.name) + '<div class="small text-muted">' + booking.guests + ' guest(s)</div></td>' +
                        '<td>' + cleanText(booking.roomName) + ' ×' + booking.rooms + '</td>' +
                        '<td class="small">' + booking.checkIn + ' → ' + booking.checkOut + '</td>' +
                        '<td class="text-end fw-semibold">' + formatPeso(booking.total) + '</td>' +
                        '<td><span class="status-label status-' + booking.status + '">' + booking.status.replace("-", " ") + '</span></td>' +
                        '<td class="text-end text-nowrap">' + actionButtons + '</td>' +
                    '</tr>';
            }
        }

        if (tableHtml === "") {
            tableHtml = '<tr><td colspan="7" class="text-center text-muted py-4">No reservations found.</td></tr>';
        }
        document.getElementById("reservationTable").innerHTML = tableHtml;
    }

    // update booking status (check in, check out, cancel)
    window.changeBookingStatus = function(refCode, newStatus) {
        var allBookings = loadSavedData(storageKey, []);
        for (var i = 0; i < allBookings.length; i++) {
            if (allBookings[i].ref === refCode) {
                allBookings[i].status = newStatus;
                break;
            }
        }
        saveData(storageKey, allBookings);
        displayReservations();
        showMessage("Reservation <strong>" + refCode + "</strong> updated to <strong>" + newStatus.replace("-", " ") + "</strong>.", "info");
    };

    // booking lookup
    var lookupForm = document.getElementById("lookupForm");
    var lookupResult = document.getElementById("lookupResult");

    function showGuestBooking(refCode) {
        var allBookings = loadSavedData(storageKey, []);
        var found = null;
        for (var i = 0; i < allBookings.length; i++) {
            if (allBookings[i].ref.toUpperCase() === refCode.toUpperCase()) {
                found = allBookings[i];
                break;
            }
        }

        if (!found) {
            lookupResult.innerHTML = '<div class="alert alert-warning small mb-0">No reservation found for reference <strong>' + cleanText(refCode) + '</strong>.</div>';
            return;
        }

        var cancelBtn = "";
        if (found.status === "confirmed") {
            cancelBtn = '<button type="button" class="btn btn-outline-danger btn-sm" onclick="cancelMyBooking(\'' + found.ref + '\')">Cancel Booking</button>';
        }

        lookupResult.innerHTML =
            '<div class="border rounded-3 p-3 cream-bg">' +
                '<div class="d-flex justify-content-between align-items-center mb-2">' +
                    '<strong class="navy-text">Reference: ' + cleanText(found.ref) + '</strong>' +
                    '<span class="status-label status-' + found.status + '">' + found.status.replace("-", " ") + '</span>' +
                '</div>' +
                '<div class="small mb-1"><strong>Guest:</strong> ' + cleanText(found.name) + ' (' + found.guests + ' guest/s)</div>' +
                '<div class="small mb-1"><strong>Room:</strong> ' + cleanText(found.roomName) + ' × ' + found.rooms + '</div>' +
                '<div class="small mb-1"><strong>Stay:</strong> ' + found.checkIn + ' to ' + found.checkOut + '</div>' +
                '<div class="small mb-3"><strong>Total:</strong> ' + formatPeso(found.total) + '</div>' +
                '<div class="d-flex gap-2">' +
                    '<button type="button" class="btn btn-outline-navy btn-sm" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print Receipt</button>' +
                    cancelBtn +
                '</div>' +
            '</div>';
    }

    window.cancelMyBooking = function(refCode) {
        window.changeBookingStatus(refCode, "cancelled");
        showGuestBooking(refCode);
    };

    if (lookupForm) {
        lookupForm.addEventListener("submit", function(event) {
            event.preventDefault();
            var refInput = document.getElementById("lookupRef").value.trim();
            if (refInput !== "") {
                showGuestBooking(refInput);
            }
        });
    }

    // staff login
    var frontDeskSection = document.getElementById("frontDeskSection");
    var loginModalEl = document.getElementById("staffLoginModal");
    var loginModal = loginModalEl ? new bootstrap.Modal(loginModalEl) : null;
    var loginForm = document.getElementById("staffLoginForm");
    var loginError = document.getElementById("loginError");
    var staffLink = document.getElementById("openStaffLogin");
    var logoutBtn = document.getElementById("staffLogoutBtn");
    var toggleBtn = document.getElementById("toggleStaffPassword");

    function updateStaffView() {
        var isStaff = sessionStorage.getItem("staffLoggedIn") === "true";
        if (isStaff) {
            frontDeskSection.classList.remove("d-none");
            displayReservations();
        } else {
            frontDeskSection.classList.add("d-none");
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", function() {
            var passInput = document.getElementById("staffPassword");
            if (passInput.type === "password") {
                passInput.type = "text";
                toggleBtn.textContent = "Hide";
            } else {
                passInput.type = "password";
                toggleBtn.textContent = "Show";
            }
        });
    }

    if (staffLink && loginModal) {
        staffLink.addEventListener("click", function(event) {
            event.preventDefault();
            if (sessionStorage.getItem("staffLoggedIn") === "true") {
                frontDeskSection.scrollIntoView({ behavior: "smooth" });
            } else {
                loginError.classList.add("d-none");
                loginModal.show();
            }
        });
    }

    if (loginForm && loginModal) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            var username = document.getElementById("staffUsername").value.trim();
            var password = document.getElementById("staffPassword").value;

            if (username === "admin" && password === "password_admin") {
                sessionStorage.setItem("staffLoggedIn", "true");
                loginError.classList.add("d-none");
                loginForm.reset();
                loginModal.hide();
                updateStaffView();
                frontDeskSection.scrollIntoView({ behavior: "smooth" });
                showMessage("Logged in as Front Desk Staff.", "info");
            } else {
                loginError.textContent = "Invalid username or password.";
                loginError.classList.remove("d-none");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            sessionStorage.removeItem("staffLoggedIn");
            updateStaffView();
            showMessage("You have logged out.", "info");
        });
    }

    // open staff login if #staff-login is in url
    updateStaffView();
    if (window.location.hash === "#staff-login" && loginModal) {
        if (sessionStorage.getItem("staffLoggedIn") === "true") {
            frontDeskSection.scrollIntoView({ behavior: "smooth" });
        } else {
            loginModal.show();
        }
    }

    // submit new reservation
    bookingForm.addEventListener("submit", function(event) {
        event.preventDefault();
        var details = calculateBooking();

        if (!bookingForm.checkValidity() || !details || details.room.capacity * details.numRooms < details.numGuests) {
            bookingForm.classList.add("was-validated");
            showMessage("Please fill in all required fields and make sure the room fits your group.", "danger");
            return;
        }

        var refCode = "VH-" + Date.now().toString(36).toUpperCase().slice(-4);
        var newBooking = {
            ref: refCode,
            name: document.getElementById("guestName").value.trim(),
            email: document.getElementById("guestEmail").value.trim(),
            phone: document.getElementById("guestPhone").value.trim(),
            roomId: details.room.id,
            roomName: details.room.name,
            rooms: details.numRooms,
            guests: details.numGuests,
            checkIn: checkInInput.value,
            checkOut: checkOutInput.value,
            total: Math.round(details.grandTotal),
            status: "confirmed"
        };

        var allBookings = loadSavedData(storageKey, []);
        allBookings.unshift(newBooking);
        saveData(storageKey, allBookings);

        bookingForm.reset();
        bookingForm.classList.remove("was-validated");
        checkInInput.value = formatDateInput(addDays(today, 1));
        checkOutInput.value = formatDateInput(addDays(today, 3));
        updateSummary();
        displayReservations();
        showGuestBooking(refCode);
        showMessage("Booking confirmed! Save your reference number: <strong>" + refCode + "</strong>.");
    });

    bookingForm.addEventListener("change", updateSummary);
    bookingForm.addEventListener("input", updateSummary);
    searchInput.addEventListener("input", displayReservations);
    statusFilter.addEventListener("change", displayReservations);

    updateSummary();
    displayReservations();
}

// gallery page filter and photo popup
function setupGalleryPage() {
    var galleryItems = document.querySelectorAll(".gallery-item");
    if (galleryItems.length === 0) {
        return;
    }

    var lightboxModal = new bootstrap.Modal(document.getElementById("galleryModal"));
    var filterButtons = document.querySelectorAll(".filter-btn");

    for (var i = 0; i < filterButtons.length; i++) {
        filterButtons[i].addEventListener("click", function() {
            for (var j = 0; j < filterButtons.length; j++) {
                filterButtons[j].classList.remove("active");
            }
            this.classList.add("active");

            var chosenCategory = this.getAttribute("data-category");
            for (var k = 0; k < galleryItems.length; k++) {
                var itemCategory = galleryItems[k].getAttribute("data-category");
                if (chosenCategory === "all" || itemCategory === chosenCategory) {
                    galleryItems[k].classList.remove("d-none");
                } else {
                    galleryItems[k].classList.add("d-none");
                }
            }
        });
    }

    for (var m = 0; m < galleryItems.length; m++) {
        galleryItems[m].addEventListener("click", function() {
            var photo = this.querySelector("img");
            var label = this.querySelector(".gallery-label");
            document.getElementById("lightboxPhoto").src = photo.src;
            document.getElementById("lightboxText").textContent = label.textContent;
            lightboxModal.show();
        });
    }
}

// reviews page filter and review submission
function setupReviewsPage() {
    var container = document.getElementById("reviewsContainer");
    if (!container) {
        return;
    }

    var storageKey = "hotelReviews";
    if (!localStorage.getItem(storageKey)) {
        var defaultReviews = [
            {
                name: "Maria Reyes",
                type: "Couple · Quezon City",
                room: "Deluxe Mountain View",
                rating: 5,
                text: "Walking distance to Session Road and Burnham Park! The fireplace lounge made our Baguio evenings unforgettable."
            },
            {
                name: "Jun Dizon",
                type: "Family · Pampanga",
                room: "Family Highland Room",
                rating: 5,
                text: "Spacious room for the whole family, hot showers, and strawberry taho at breakfast. Will return for Panagbenga!"
            },
            {
                name: "Angela Tan",
                type: "Business · Makati",
                room: "Pine Classic Room",
                rating: 4,
                text: "Quiet room, reliable fiber Wi-Fi for work calls, and warm Cordilleran staff who remembered my coffee order."
            },
            {
                name: "Carlo Mendoza",
                type: "Couple · Laguna",
                room: "Session Executive Suite",
                rating: 5,
                text: "Panoramic city lights at night and spotless rooms. Best anniversary stay we have had up north."
            }
        ];
        saveData(storageKey, defaultReviews);
    }

    var ratingFilter = document.getElementById("ratingFilter");

    function displayReviews() {
        var allReviews = loadSavedData(storageKey, []);
        var sum = 0;
        for (var i = 0; i < allReviews.length; i++) {
            sum += allReviews[i].rating;
        }
        var average = (sum / allReviews.length).toFixed(1);
        document.getElementById("averageScore").textContent = average;
        document.getElementById("reviewCount").textContent = allReviews.length;

        var selectedRating = ratingFilter.value;
        var html = "";

        for (var j = 0; j < allReviews.length; j++) {
            var review = allReviews[j];
            if (selectedRating === "all" || review.rating === Number(selectedRating)) {
                var stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
                var initials = review.name.slice(0, 2).toUpperCase();
                html +=
                    '<div class="col-md-6">' +
                        '<article class="card info-card h-100 p-4">' +
                            '<div class="d-flex justify-content-between align-items-center mb-2">' +
                                '<div class="d-flex align-items-center gap-2">' +
                                    '<span class="guest-avatar">' + cleanText(initials) + '</span>' +
                                    '<div><strong>' + cleanText(review.name) + '</strong><div class="small text-muted">' + cleanText(review.type) + '</div></div>' +
                                '</div>' +
                                '<div class="star-rating">' + stars + '</div>' +
                            '</div>' +
                            '<p class="small text-muted mb-2">"' + cleanText(review.text) + '"</p>' +
                            '<span class="small navy-text fw-semibold"><i class="bi bi-door-open gold-text me-1"></i>' + cleanText(review.room) + '</span>' +
                        '</article>' +
                    '</div>';
            }
        }
        container.innerHTML = html;
    }

    var reviewForm = document.getElementById("reviewForm");
    reviewForm.addEventListener("submit", function(event) {
        event.preventDefault();
        if (!reviewForm.checkValidity()) {
            reviewForm.classList.add("was-validated");
            return;
        }

        var newReview = {
            name: document.getElementById("reviewerName").value.trim(),
            type: document.getElementById("travelerType").value,
            room: document.getElementById("roomStayed").value,
            rating: Number(document.getElementById("starRating").value),
            text: document.getElementById("reviewMessage").value.trim()
        };

        var allReviews = loadSavedData(storageKey, []);
        allReviews.unshift(newReview);
        saveData(storageKey, allReviews);

        reviewForm.reset();
        reviewForm.classList.remove("was-validated");
        ratingFilter.value = "all";
        displayReviews();
        showMessage("Salamat! Your guest review has been published.");
    });

    ratingFilter.addEventListener("change", displayReviews);
    displayReviews();
}

// contact page local clock and inquiry form
function setupContactPage() {
    var contactForm = document.getElementById("contactForm");
    if (!contactForm) {
        return;
    }

    var clockText = document.getElementById("localTimeText");
    if (clockText) {
        var now = new Date();
        var currentHour = now.getHours();
        var formattedTime = now.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
        clockText.innerHTML = '<i class="bi bi-clock gold-text me-1"></i>Local time: <strong>' + formattedTime + '</strong>';

        var scheduleRows = document.querySelectorAll(".schedule-row");
        for (var i = 0; i < scheduleRows.length; i++) {
            var openHour = Number(scheduleRows[i].getAttribute("data-open"));
            var closeHour = Number(scheduleRows[i].getAttribute("data-close"));
            var statusCell = scheduleRows[i].querySelector(".open-status");

            if (currentHour >= openHour && currentHour < closeHour) {
                statusCell.innerHTML = '<span class="badge text-bg-success">Open</span>';
            } else {
                statusCell.innerHTML = '<span class="badge text-bg-secondary">Closed</span>';
            }
        }
    }

    contactForm.addEventListener("submit", function(event) {
        event.preventDefault();
        if (!contactForm.checkValidity()) {
            contactForm.classList.add("was-validated");
            return;
        }
        var sender = document.getElementById("senderName").value.trim();
        contactForm.reset();
        contactForm.classList.remove("was-validated");
        showMessage("Thank you, <strong>" + cleanText(sender) + "</strong>! Your inquiry has been sent to our Baguio front desk.");
    });
}
