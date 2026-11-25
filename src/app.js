const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const apiRoutes = require("./routes/apiRoutes");

require("dotenv").config();

const init = async () => {
  const productionFrontendOrigin =
    "https://stuntguard-fronend-production.up.railway.app";
  const frontendOrigin =
    process.env.FRONTEND_URL || productionFrontendOrigin;
  const allowedOrigins = [
    ...new Set([productionFrontendOrigin, new URL(frontendOrigin).origin]),
  ];

  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost",
    routes: {
      cors: {
        origin: allowedOrigins,
        headers: [
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
        ],
        exposedHeaders: ["WWW-Authenticate", "Server-Authorization"],
        maxAge: 60,
        credentials: true,
      },
    },
  });

  await server.register(Inert);
  apiRoutes.forEach((route) => server.route(route));

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

init();
