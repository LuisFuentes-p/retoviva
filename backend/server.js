const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const createFlightsRoutes = require("./routes/flights");
const createCartRoutes = require("./routes/cart");
const createBookingRoutes = require("./routes/booking");
const createDebugRoutes = require("./routes/debug");
const createDestinationsRoutes = require("./routes/destinations");

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

const ensureColumn = async (tableName, columnName, columnSql) => {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`);
  }
};

const NATIONAL_DESTINATIONS = [
  { name: "Acapulco", popular: 1 },
  { name: "Aguascalientes", popular: 0 },
  { name: "Ciudad Obregón", popular: 0 },
  { name: "Ciudad Juárez", popular: 0 },
  { name: "Culiacán", popular: 1 },
  { name: "Cancún", popular: 1 },
  { name: "Chihuahua", popular: 0 },
  { name: "Chetumal", popular: 0 },
  { name: "Ciudad de México (AICM)", popular: 1 },
  { name: "Ciudad de México (AIFA)", popular: 1 },
  { name: "Cozumel", popular: 0 },
  { name: "Durango", popular: 0 },
  { name: "Guadalajara", popular: 1 },
  { name: "Hermosillo", popular: 0 },
  { name: "Huatulco", popular: 1 },
  { name: "Ixtapa–Zihuatanejo", popular: 0 },
  { name: "La Paz", popular: 0 },
  { name: "León", popular: 0 },
  { name: "Los Mochis", popular: 0 },
  { name: "Los Cabos", popular: 1 },
  { name: "Matamoros", popular: 0 },
  { name: "Mérida", popular: 1 },
  { name: "Morelia", popular: 0 },
  { name: "Monterrey", popular: 1 },
  { name: "Mexicali", popular: 0 },
  { name: "Mazatlán", popular: 1 },
  { name: "Nuevo Laredo", popular: 0 },
  { name: "Oaxaca", popular: 1 },
  { name: "Puebla", popular: 0 },
  { name: "Puerto Vallarta", popular: 1 },
  { name: "Puerto Escondido", popular: 1 },
  { name: "Querétaro", popular: 0 },
  { name: "Reynosa", popular: 0 },
  { name: "San Luis Potosí", popular: 0 },
  { name: "Tampico", popular: 0 },
  { name: "Tapachula", popular: 0 },
  { name: "Tepic", popular: 0 },
  { name: "Tuxtla Gutiérrez", popular: 0 },
  { name: "Tijuana", popular: 1 },
  { name: "Toluca", popular: 0 },
  { name: "Torreón", popular: 0 },
  { name: "Tulum", popular: 1 },
  { name: "Veracruz", popular: 0 },
  { name: "Villahermosa", popular: 0 },
  { name: "Zacatecas", popular: 0 },
];

const INTERNATIONAL_DESTINATIONS = [
  { name: "Austin", country: "EUA", popular: 1 },
  { name: "Camagüey", country: "Cuba", popular: 0 },
  { name: "Chicago", country: "EUA", popular: 1 },
  { name: "Cincinnati", country: "EUA", popular: 0 },
  { name: "Dallas", country: "EUA", popular: 0 },
  { name: "Denver", country: "EUA", popular: 1 },
  { name: "La Habana", country: "Cuba", popular: 1 },
  { name: "Houston", country: "EUA", popular: 1 },
  { name: "Las Vegas", country: "EUA", popular: 1 },
  { name: "Los Ángeles", country: "EUA", popular: 1 },
  { name: "Miami", country: "EUA", popular: 1 },
  { name: "Memphis", country: "EUA", popular: 0 },
  { name: "Nashville", country: "EUA", popular: 0 },
  { name: "Nueva York", country: "EUA", popular: 0 },
  { name: "Oakland", country: "EUA", popular: 1 },
  { name: "Orlando", country: "EUA", popular: 0 },
  { name: "San Antonio", country: "EUA", popular: 1 },
  { name: "San José", country: "Costa Rica", popular: 1 },
  { name: "Bogotá", country: "Colombia", popular: 1 },
];

const BUS_PROFITABLE_DESTINATIONS = [
  { name: "Pachuca", country: "México", type: "nacional", popular: 0, latitude: 20.1011, longitude: -98.7591, access_mode: "bus_only", is_bus_profitable: 1 },
  { name: "Cuernavaca", country: "México", type: "nacional", popular: 0, latitude: 18.9242, longitude: -99.2216, access_mode: "bus_only", is_bus_profitable: 1 },
  { name: "San Miguel de Allende", country: "México", type: "nacional", popular: 1, latitude: 20.9144, longitude: -100.7439, access_mode: "bus_only", is_bus_profitable: 1 },
  { name: "Playa del Carmen", country: "México", type: "nacional", popular: 1, latitude: 20.6296, longitude: -87.0739, access_mode: "bus_only", is_bus_profitable: 1 },
  { name: "Taxco", country: "México", type: "nacional", popular: 0, latitude: 18.5566, longitude: -99.6058, access_mode: "bus_only", is_bus_profitable: 1 },
  { name: "San Cristóbal de las Casas", country: "México", type: "nacional", popular: 0, latitude: 16.737, longitude: -92.6376, access_mode: "bus_only", is_bus_profitable: 1 },
];

const DESTINATION_GEO = {
  "Ciudad de México (AICM)": { latitude: 19.4361, longitude: -99.0719 },
  "Ciudad de México (AIFA)": { latitude: 19.7363, longitude: -99.0133 },
  "Cancún": { latitude: 21.0365, longitude: -86.8771 },
  "Monterrey": { latitude: 25.7785, longitude: -100.1069 },
  "Guadalajara": { latitude: 20.5218, longitude: -103.3112 },
  "Tijuana": { latitude: 32.5411, longitude: -116.9701 },
  "Mérida": { latitude: 20.937, longitude: -89.6577 },
  "Puerto Vallarta": { latitude: 20.6801, longitude: -105.2542 },
  "Querétaro": { latitude: 20.6173, longitude: -100.1857 },
  "Puebla": { latitude: 19.1581, longitude: -98.3714 },
  "León": { latitude: 21.0365, longitude: -101.4808 },
  "Toluca": { latitude: 19.3371, longitude: -99.566 },
  "Austin": { latitude: 30.1975, longitude: -97.6664 },
  "Chicago": { latitude: 41.9742, longitude: -87.9073 },
  "Houston": { latitude: 29.9902, longitude: -95.3368 },
  "Las Vegas": { latitude: 36.084, longitude: -115.1537 },
  "Los Ángeles": { latitude: 33.9416, longitude: -118.4085 },
  "Miami": { latitude: 25.7959, longitude: -80.287 },
  "San Antonio": { latitude: 29.5337, longitude: -98.4698 },
  "Bogotá": { latitude: 4.7016, longitude: -74.1469 },
};

const INTERMODAL_AIR_DESTINATIONS = new Set([
  "Ciudad de México (AICM)",
  "Ciudad de México (AIFA)",
  "Monterrey",
  "Guadalajara",
  "Cancún",
  "Querétaro",
  "Puebla",
  "León",
  "Toluca",
]);

const buildSeedDestinations = () => {
  const baseNational = NATIONAL_DESTINATIONS.map((destination) => {
    const geo = DESTINATION_GEO[destination.name] || { latitude: null, longitude: null };
    const isIntermodal = INTERMODAL_AIR_DESTINATIONS.has(destination.name);
    return {
      name: destination.name,
      country: "México",
      type: "nacional",
      is_popular: destination.popular,
      latitude: geo.latitude,
      longitude: geo.longitude,
      access_mode: isIntermodal ? "intermodal" : "air_only",
      is_bus_profitable: isIntermodal ? 1 : 0,
    };
  });

  const baseInternational = INTERNATIONAL_DESTINATIONS.map((destination) => {
    const geo = DESTINATION_GEO[destination.name] || { latitude: null, longitude: null };
    return {
      name: destination.name,
      country: destination.country,
      type: "internacional",
      is_popular: destination.popular,
      latitude: geo.latitude,
      longitude: geo.longitude,
      access_mode: "air_only",
      is_bus_profitable: 0,
    };
  });

  const busProfitableDestinations = BUS_PROFITABLE_DESTINATIONS.map((destination) => ({
    ...destination,
    is_popular: destination.popular ?? destination.is_popular ?? 0,
  }));

  return [...baseNational, ...baseInternational, ...busProfitableDestinations];
};

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

  await run(
    `CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      type TEXT NOT NULL,
      is_popular INTEGER NOT NULL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      access_mode TEXT NOT NULL DEFAULT 'air_only',
      is_bus_profitable INTEGER NOT NULL DEFAULT 0
    )`
  );

  await ensureColumn("destinations", "latitude", "latitude REAL");
  await ensureColumn("destinations", "longitude", "longitude REAL");
  await ensureColumn("destinations", "access_mode", "access_mode TEXT NOT NULL DEFAULT 'air_only'");
  await ensureColumn("destinations", "is_bus_profitable", "is_bus_profitable INTEGER NOT NULL DEFAULT 0");

  await run(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_unique
     ON destinations(name, country, type)`
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

  const seedRows = buildSeedDestinations();
  for (const destination of seedRows) {
    await run(
      `INSERT INTO destinations (name, country, type, is_popular, latitude, longitude, access_mode, is_bus_profitable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name, country, type)
       DO UPDATE SET
         is_popular = excluded.is_popular,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         access_mode = excluded.access_mode,
         is_bus_profitable = excluded.is_bus_profitable`,
      [
        destination.name,
        destination.country,
        destination.type,
        destination.is_popular ?? destination.popular ?? 0,
        destination.latitude,
        destination.longitude,
        destination.access_mode,
        destination.is_bus_profitable,
      ]
    );
  }
};

app.use(express.json());
app.get("/", (_req, res) => {
  res.redirect("/pantalla-principal");
});
app.use(express.static(frontendDir));

app.use("/api", createFlightsRoutes({ all }));
app.use("/api", createDestinationsRoutes({ all }));
app.use("/api", createCartRoutes({ get, all }));
app.use("/api", createBookingRoutes({ get, all, run }));
app.use("/api", createDebugRoutes({ all, get }));

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
});
