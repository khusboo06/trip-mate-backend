
const express = require("express");
const axios = require("axios");
const router = express.Router();

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY || process.env.VITE_OPENWEATHER_KEY;


router.get("/", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude required" });
  }

  if (!OPENWEATHER_KEY) {
    console.error("❌ Missing OpenWeather API key.");
    return res.status(500).json({ error: "Missing OpenWeather API key" });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    const response = await axios.get(url);
    const data = response.data;

    return res.json({
      name: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
      coord: data.coord,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    });
  } catch (err) {
    console.error("🔥 Weather API (lat/lon) error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch weather by location" });
  }
});


router.get("/quick", async (req, res) => {
  const { location } = req.query;

  if (!location) {
    return res.status(400).json({ error: "Location required" });
  }

  if (!OPENWEATHER_KEY) {
    return res.status(500).json({ error: "Missing OpenWeather API key" });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      location
    )}&appid=${OPENWEATHER_KEY}&units=metric`;

    const response = await axios.get(url);
    const data = response.data;

    
    return res.json({
      name: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
      coord: data.coord,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    });
  } catch (err) {
    console.error("🔥 Weather API (city) error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch weather by city" });
  }
});

module.exports = router;
