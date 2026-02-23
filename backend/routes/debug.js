const express = require("express");

module.exports = ({ all, get }) => {
  const router = express.Router();

  router.get("/debug/db", async (req, res) => {
    try {
      const tables = [
        "flights",
        "passengers",
        "bookings",
        "addons",
        "booking_addons",
        "promos",
        "payments",
      ];

      const data = {};

      for (const tableName of tables) {
        const rows = await all(`SELECT * FROM ${tableName}`);
        const count = await get(`SELECT COUNT(*) as count FROM ${tableName}`);

        data[tableName] = {
          count: count?.count || 0,
          rows,
        };
      }

      res.json({
        status: "ok",
        generatedAt: new Date().toISOString(),
        tables: data,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "No fue posible leer la base de datos.",
      });
    }
  });

  return router;
};
