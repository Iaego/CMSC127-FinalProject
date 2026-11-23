# Database Notes — Vicentenium Hotel

The site is a hotel website (Vicentenium Hotel, Baguio City) with pages for rooms & rates, booking, gallery, reviews, and contact. Right now all data lives in the browser's `localStorage`, and the staff login is hardcoded as `admin` / `password_admin` (`js/script.js`). These notes describe the tables needed to move that data into a real database and to support the staff dashboard.

## Core Tables (Booking Flow)

### 1. `room_type`
The 4 room categories: Pine Classic, Deluxe Mountain View, Family Highland, Session Executive Suite.

| Column | Type | Notes |
|---|---|---|
| room_type_id | PK | |
| code | VARCHAR, UNIQUE | `standard`, `deluxe`, `family`, `suite` (used in `booking.html?room=`) |
| name | VARCHAR | |
| base_rate | DECIMAL | ₱3,200 / ₱4,800 / ₱6,500 / ₱9,800 |
| max_capacity | INT | |
| size_sqm | INT | |
| bed_config | VARCHAR | e.g. "1 King + sofa bed" |
| description | TEXT | |
| photo_path | VARCHAR | |
| breakfast_included | BOOLEAN | Deluxe and Family include it |

### 2. `room`
The 42 physical rooms (18 standard + 12 deluxe + 8 family + 4 suite).

| Column | Type | Notes |
|---|---|---|
| room_id | PK | |
| room_number | VARCHAR, UNIQUE | |
| room_type_id | FK → room_type | |
| floor | INT | |
| status | ENUM | `available`, `occupied`, `maintenance` |

Needed so the front desk can assign a real room at check-in and so availability is counted from rooms, not typed in by hand.

### 3. `guest`

| Column | Type | Notes |
|---|---|---|
| guest_id | PK | |
| full_name | VARCHAR | |
| email | VARCHAR | |
| mobile_number | VARCHAR | |
| created_at | DATETIME | |

### 4. `booking`
One reservation.

| Column | Type | Notes |
|---|---|---|
| booking_id | PK | |
| reference_no | VARCHAR, UNIQUE | `VH-XXXX` |
| guest_id | FK → guest | |
| room_type_id | FK → room_type | the booking form picks one room type |
| check_in_date | DATE | |
| check_out_date | DATE | CHECK (check_out_date > check_in_date) |
| num_guests | INT | |
| num_rooms | INT | |
| status | ENUM | `confirmed`, `checked-in`, `completed`, `cancelled` |
| room_subtotal | DECIMAL | snapshot at booking time |
| weekend_surcharge | DECIMAL | 15% on Fri/Sat nights |
| addons_total | DECIMAL | |
| service_charge | DECIMAL | 10% |
| total_amount | DECIMAL | |
| created_at | DATETIME | |
| cancelled_at | DATETIME, NULL | for the 72-hour free-cancellation rule |
| handled_by | FK → staff, NULL | optional |

### 5. `booking_room`
Links a booking to the physical rooms assigned at check-in (M:N).

| Column | Type | Notes |
|---|---|---|
| booking_id | FK → booking | |
| room_id | FK → room | |
| | | PK (booking_id, room_id) |

### 6. `addon`
Breakfast Buffet, Terminal Shuttle, Late Check-out, City Tour, Hilot Massage, Function Hall.

| Column | Type | Notes |
|---|---|---|
| addon_id | PK | |
| code | VARCHAR, UNIQUE | `breakfast`, `shuttle`, `late`, `tour`, … |
| name | VARCHAR | |
| description | VARCHAR | |
| price | DECIMAL | |
| pricing_mode | ENUM | `per_guest_night`, `per_booking`, `per_room`, `per_guest` |

### 7. `booking_addon`
Add-ons chosen for a booking (M:N).

| Column | Type | Notes |
|---|---|---|
| booking_id | FK → booking | |
| addon_id | FK → addon | |
| quantity | INT | |
| unit_price_at_booking | DECIMAL | snapshot |
| line_total | DECIMAL | |
| | | PK (booking_id, addon_id) |

## Supporting Tables

### 8. `staff`
Replaces the hardcoded login and holds the leadership team shown on the About page.

| Column | Type | Notes |
|---|---|---|
| staff_id | PK | |
| username | VARCHAR, UNIQUE | |
| password_hash | VARCHAR | never store plain passwords |
| full_name | VARCHAR | |
| role | ENUM | `admin`, `front_desk`, `housekeeping`, … |
| is_active | BOOLEAN | |

### 9. `review`

| Column | Type | Notes |
|---|---|---|
| review_id | PK | |
| reviewer_name | VARCHAR | |
| traveler_type | ENUM | Couple, Family, Solo, Business, Barkada |
| room_type_id | FK → room_type | |
| rating | INT | CHECK (rating BETWEEN 1 AND 5) |
| message | TEXT | |
| created_at | DATETIME | |
| is_published | BOOLEAN | |
| booking_id | FK → booking, NULL | optional, if only verified stays may review |

### 10. `inquiry`
From the Contact form.

| Column | Type | Notes |
|---|---|---|
| inquiry_id | PK | |
| sender_name | VARCHAR | |
| email | VARCHAR | |
| topic | ENUM | Room reservation, Group / event booking, Shuttle & city tour, Other |
| message | TEXT | |
| status | ENUM | `new`, `replied`, `closed` |
| created_at | DATETIME | |
| handled_by | FK → staff, NULL | |

## Optional Tables

- **`payment`**: payment_id, booking_id FK, amount, method (cash/GCash/card), paid_at. Splits billing out of booking.
- **`gallery_photo`**: photo_id, title, category (Rooms & Views / Dining / Explore Baguio / Festivals & Heritage), file_path, credit, license.
- **`rate_policy`**: stores the 15% weekend surcharge, 10% service charge, and 72-hour cancellation window as data instead of hardcoded constants.

## Relationships

```
guest     1 ─ N  booking  N ─ 1  room_type  1 ─ N  room
booking   1 ─ N  booking_addon  N ─ 1  addon
booking   1 ─ N  booking_room   N ─ 1  room
room_type 1 ─ N  review
staff     1 ─ N  booking  (handled_by)
staff     1 ─ N  inquiry  (handled_by)
```

## Dashboard Queries

The staff dashboard stats each map to a query:

- **Rooms Available**: rooms not in any `booking_room` for an active booking that overlaps today.
- **Active Bookings**: count of bookings with status in (`confirmed`, `checked-in`).
- **Checked-In Guests**: sum of `num_guests` where status = `checked-in`.
- **Active Booking Value**: sum of `total_amount` for active bookings.

## Design Notes

- **Availability for a date range** comes from an overlap check against existing bookings, not from a stored count:
  `check_in_date < :requested_out AND check_out_date > :requested_in`
- **Prices are stored on the booking and add-on rows** (snapshots), so changing a rate later doesn't change old receipts.
