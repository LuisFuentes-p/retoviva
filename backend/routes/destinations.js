const express = require("express");

module.exports = ({ all }) => {
  const router = express.Router();

  router.get("/destinations", async (req, res) => {
    try {
      const whereClauses = [];
      const params = [];

      if (req.query.type === "nacional" || req.query.type === "internacional") {
        whereClauses.push("type = ?");
        params.push(req.query.type);
      }

      if (req.query.popular === "1" || req.query.popular === "true") {
        whereClauses.push("is_popular = 1");
      }

      if (req.query.accessMode === "air_only" || req.query.accessMode === "intermodal" || req.query.accessMode === "bus_only") {
        whereClauses.push("access_mode = ?");
        params.push(req.query.accessMode);
      }

      if (req.query.busProfitable === "1" || req.query.busProfitable === "true") {
        whereClauses.push("is_bus_profitable = 1");
      }

      const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const destinations = await all(
        `SELECT id, name, country, type, is_popular, latitude, longitude, access_mode, is_bus_profitable
         FROM destinations
         ${whereSql}
         ORDER BY is_popular DESC, name ASC`,
        params
      );

      res.json(
        destinations.map((destination) => ({
          id: destination.id,
          name: destination.name,
          country: destination.country,
          type: destination.type,
          popular: destination.is_popular === 1,
          latitude: destination.latitude,
          longitude: destination.longitude,
          accessMode: destination.access_mode,
          busProfitable: destination.is_bus_profitable === 1,
        }))
      );
    } catch (error) {
      res.status(500).json({ message: "No fue posible obtener destinos." });
    }
  });

  return router;
};
