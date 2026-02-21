const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "viva.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const initDb = async () => {
  await run(
    `CREATE TABLE IF NOT EXISTS flights (
      id INTEGER PRIMARY KEY,
      origin TEXT,
      destination TEXT,
      number TEXT,
      departure_date TEXT,
      departure_time TEXT,
      return_date TEXT,
      return_time TEXT
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS passengers (
      id INTEGER PRIMARY KEY,
      name TEXT
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY,
      reference TEXT,
      base_fare INTEGER,
      taxes INTEGER,
      flight_id INTEGER,
      passenger_id INTEGER,
      FOREIGN KEY (flight_id) REFERENCES flights(id),
      FOREIGN KEY (passenger_id) REFERENCES passengers(id)
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS addons (
      id INTEGER PRIMARY KEY,
      name TEXT,
      description TEXT,
      price INTEGER,
      is_featured INTEGER DEFAULT 0
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS booking_addons (
      booking_id INTEGER,
      addon_id INTEGER,
      PRIMARY KEY (booking_id, addon_id)
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS promos (
      id INTEGER PRIMARY KEY,
      code TEXT,
      discount INTEGER,
      active INTEGER DEFAULT 1
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY,
      booking_id INTEGER,
      total INTEGER,
      created_at TEXT
    )`
  );

  const flightCount = await get("SELECT COUNT(*) as count FROM flights");
  if (flightCount.count === 0) {
    await run(
      `INSERT INTO flights (origin, destination, number, departure_date, departure_time, return_date, return_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
      , ["MTY", "CDMX", "VB1021", "15 FEB 2026", "08:35", "18 FEB 2026", "20:10"]
    );

    await run(`INSERT INTO passengers (name) VALUES (?)`, ["Andrea Pérez"]);

    await run(
      `INSERT INTO bookings (reference, base_fare, taxes, flight_id, passenger_id)
       VALUES (?, ?, ?, 1, 1)`
      , ["VX8K29", 1990, 520]
    );

    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`
      , ["Transporte VivaExpress", "Ciudad ↔ Aeropuerto ↔ Ciudad · salidas cada 30 min", 320, 1]
    );
    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`
      , ["Maleta documentada", "1 pieza 25kg", 450, 0]
    );
    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`
      , ["Asiento VivaPlus", "Fila preferente", 280, 0]
    );
    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`
      , ["Equipaje de mano extra", "+5kg", 190, 0]
    );

    await run(`INSERT INTO promos (code, discount, active) VALUES (?, ?, 1)`, ["VIVA2026", 250]);
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/booking", async (req, res) => {
  const booking = await get(
    `SELECT b.id, b.reference, b.base_fare, b.taxes, f.origin, f.destination, f.number,
            f.departure_date, f.departure_time, f.return_date, f.return_time, p.name as passenger_name
     FROM bookings b
     JOIN flights f ON b.flight_id = f.id
     JOIN passengers p ON b.passenger_id = p.id
     WHERE b.id = 1`
  );

  const addons = await all(`SELECT id, name, description, price, is_featured FROM addons`);
  const selectedAddons = await all(`SELECT addon_id FROM booking_addons WHERE booking_id = 1`);

  res.json({
    booking: {
      id: booking.id,
      reference: booking.reference,
      baseFare: booking.base_fare,
      taxes: booking.taxes,
    },
    passenger: {
      name: booking.passenger_name,
    },
    flight: {
      origin: booking.origin,
      destination: booking.destination,
      number: booking.number,
      departureDate: booking.departure_date,
      departureTime: booking.departure_time,
      returnDate: booking.return_date,
      returnTime: booking.return_time,
    },
    addons: addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      description: addon.description,
      price: addon.price,
      isFeatured: addon.is_featured === 1,
    })),
    selectedAddons: selectedAddons.map((item) => item.addon_id),
  });
});

app.post("/api/promo", async (req, res) => {
  const code = String(req.body.code || "").toUpperCase();
  if (!code) {
    res.json({ applied: false, message: "Ingresa un código promocional." });
    return;
  }

  const promo = await get(`SELECT discount, active FROM promos WHERE code = ?`, [code]);
  if (!promo || promo.active === 0) {
    res.json({ applied: false, message: "Código inválido. Intenta con VIVA2026." });
    return;
  }

  res.json({ applied: true, discount: promo.discount, message: `Código aplicado: descuento de $${promo.discount} MXN.` });
});

app.post("/api/pay", async (req, res) => {
  const bookingId = Number(req.body.bookingId || 1);
  const addonIds = Array.isArray(req.body.addons) ? req.body.addons : [];
  const promoCode = req.body.promoCode ? String(req.body.promoCode).toUpperCase() : null;

  const booking = await get(`SELECT base_fare, taxes FROM bookings WHERE id = ?`, [bookingId]);
  const addons = addonIds.length
    ? await all(
        `SELECT price FROM addons WHERE id IN (${addonIds.map(() => "?").join(",")})`,
        addonIds
      )
    : [];

  const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  let discount = 0;
  if (promoCode) {
    const promo = await get(`SELECT discount FROM promos WHERE code = ?`, [promoCode]);
    discount = promo ? promo.discount : 0;
  }

  const total = Math.max(booking.base_fare + booking.taxes + addonTotal - discount, 0);
  const now = new Date().toISOString();
  await run(`INSERT INTO payments (booking_id, total, created_at) VALUES (?, ?, ?)`, [bookingId, total, now]);

  res.json({
    status: "ok",
    message: "Pago simulado exitoso. Se envió el itinerario al correo registrado.",
    total,
  });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
});
