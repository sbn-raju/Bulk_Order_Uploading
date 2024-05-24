const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const pkg = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const uploads = multer({ dest: "uploads/" });

// Database stuff
const { Pool } = pkg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

app.post("/bulk/order", uploads.single("file"), (req, res) => {
  console.log(req.file + "line 26");
  const filepath = path.join(__dirname, "uploads", req.file.filename);
  console.log(filepath);
  const csvData = [];

  fs.createReadStream(filepath)
    .pipe(csv())
    .on("data", (data) => csvData.push(data))
    .on("end", async () => {
      try {
        const query =
          "INSERT INTO bulkorder (dbn,schoolname,number_of_test_takers,critical_reading_mean,mathematics_mean,writing_mean) VALUES ($1,$2,$3,$4,$5,$6)";
        for (const row of csvData) {
          const res = await pool.query(query, [
            row.dbn,
            row.schoolname,
            row.number_of_test_takers,
            row.critical_reading_mean,
            row.mathematics_mean,
            row.writing_mean,
          ]);
        }
        res.send("File uploaded and data inserted successfully");
      } catch (error) {
        console.error(error);
        res.status(500).send("Error inserting data");
      } finally {
        fs.unlinkSync(filepath); // Remove the file after processing
      }
    });
});

//App init
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App is listening at the port ${port}`);
});
