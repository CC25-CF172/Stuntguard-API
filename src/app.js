const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const apiRoutes = require("./routes/apiRoutes");
require("dotenv").config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
  });

  await server.register(Inert);
  apiRoutes.forEach((route) => server.route(route));

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

init();
