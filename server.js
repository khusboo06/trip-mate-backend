 require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { initSockets } = require('./sockets');

const app = express();
const server = http.createServer(app);

/* ---------------------- CORS SETUP ---------------------- */
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174","https://trip-mate-frontend-nine.vercel.app"];
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

/* ---------------------- STATIC FILES ---------------------- */
// Serve all uploaded files publicly (avatars, gallery, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------------- SOCKET.IO ---------------------- */
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket connections
initSockets(io);

/* ---------------------- ROUTE IMPORTS ---------------------- */
const uploadRoutes = require("./routes/upload");
const galleryRoutes = require("./routes/gallery");
const userRoutes = require("./routes/userRoutes"); // ✅ NEW for avatar upload

/* ---------------------- API ROUTES ---------------------- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trip'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/polls', require('./routes/polls'));
app.use("/api/messages", require("./routes/messages"));
app.use('/api/weather', require('./routes/weather'));
app.use("/api/upload", uploadRoutes);
app.use("/api/trips", galleryRoutes);
app.use("/api", require("./routes/gallery"));
app.use("/api/users", require("./routes/userRoutes")); // ✅ Added user avatar route
app.use("/uploads", express.static("uploads"));

/* ---------------------- HEALTH CHECK ---------------------- */
app.get('/', (req, res) => {
  res.send({ status: 'TripMate backend running 🚐' });
});

const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);


/* ---------------------- DATABASE & SERVER ---------------------- */
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch((err) =>
    console.error('❌ MongoDB connection failed:', err.message)
  );
  




















// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// const { initSockets } = require('./sockets');

// const app = express();
// const server = http.createServer(app);

// /* ---------------------- CORS SETUP ---------------------- */
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "https://trip-mate-frontend-nine.vercel.app" // ✅ your production frontend
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow Postman / curl (no origin)
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }

//       return callback(new Error("Not allowed by CORS"));
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
//   })
// );

// // allow OPTIONS preflight globally
// app.options("*", cors());

// app.use(express.json());

// /* ---------------------- STATIC FILES ---------------------- */
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// /* ---------------------- SOCKET.IO ---------------------- */
// const io = require("socket.io")(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// // Initialize socket connections
// initSockets(io);

// /* ---------------------- ROUTE IMPORTS ---------------------- */
// const uploadRoutes = require("./routes/upload");
// const galleryRoutes = require("./routes/gallery");
// const userRoutes = require("./routes/userRoutes");

// /* ---------------------- API ROUTES ---------------------- */
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/trips', require('./routes/trip'));
// app.use('/api/expenses', require('./routes/expenses'));
// app.use('/api/polls', require('./routes/polls'));
// app.use("/api/messages", require("./routes/messages"));
// app.use('/api/weather', require('./routes/weather'));
// app.use("/api/upload", uploadRoutes);
// app.use("/api/trips", galleryRoutes);
// app.use("/api", require("./routes/gallery"));
// app.use("/api/users", userRoutes);
// app.use("/uploads", express.static("uploads"));

// /* ---------------------- HEALTH CHECK ---------------------- */
// app.get('/', (req, res) => {
//   res.send({ status: 'TripMate backend running 🚐' });
// });

// const aiRoutes = require("./routes/ai");
// app.use("/api/ai", aiRoutes);

// /* ---------------------- DATABASE & SERVER ---------------------- */
// const PORT = process.env.PORT || 5000;

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     server.listen(PORT, () =>
//       console.log(`✅ Server running on port ${PORT}`)
//     );
//   })
//   .catch((err) =>
//     console.error('❌ MongoDB connection failed:', err.message)
//   );