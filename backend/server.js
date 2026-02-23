const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const createFlightsRoutes = require("./routes/flights");
const createCartRoutes = require("./routes/cart");
const createBookingRoutes = require("./routes/booking");

const app = express();
const PORT = process.env.PORT || 3000;

const frontendDir = path.join(__dirname, "..", "frontend");
const dbDir = path.join(__dirname, "db");
const dbPath = path.join(dbDir, "flights.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
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
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["MTY", "CDMX", "VB1021", "15 FEB 2026", "08:35", "18 FEB 2026", "20:10"]
    );

    await run(`INSERT INTO passengers (name) VALUES (?)`, ["Andrea Pérez"]);

    await run(
      `INSERT INTO bookings (reference, base_fare, taxes, flight_id, passenger_id)
       VALUES (?, ?, ?, 1, 1)`,
      ["VX8K29", 1990, 520]
    );

    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`,
      ["Transporte VivaExpress", "Ciudad ↔ Aeropuerto ↔ Ciudad · salidas cada 30 min", 320, 1]
    );
    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`,
      ["Maleta documentada", "1 pieza 25kg", 450, 0]
    );
    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`,
      ["Asiento VivaPlus", "Fila preferente", 280, 0]
    );
    await run(
      `INSERT INTO addons (name, description, price, is_featured)
       VALUES (?, ?, ?, ?)`,
      ["Equipaje de mano extra", "+5kg", 190, 0]
    );

    await run(`INSERT INTO promos (code, discount, active) VALUES (?, ?, 1)`, ["VIVA2026", 250]);
  }
};

app.use(express.json());
app.use(express.static(frontendDir));

app.use("/api", createFlightsRoutes({ all }));
app.use("/api", createCartRoutes({ get, all }));
app.use("/api", createBookingRoutes({ get, all, run }));

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
});
