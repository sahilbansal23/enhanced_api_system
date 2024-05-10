const express = require("express");
require("dotenv").config();
const routerauth = require("./routes/user");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routerauth);

app.use("*", async (req, res) => {
  logger.error("Unknow URL coming endpoint");
  res.status(404).send(" ERROR 404 Page not found");
  // res.send(console.error(" ERROR 404 Page not found"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
