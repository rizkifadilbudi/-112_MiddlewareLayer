import express from "express";
import pg from "pg";
import Joi from "joi";
import { stat } from "node:fs";
import { abort } from "node:process";

const app = express();
const port = 3000;
const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mahasiswa",
  password: "",
  port: 5432,
});

//MIDDLEWARE LOGGING
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration} ms`,
    });
  });
  next();
});

function successResponse(res, message, data, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
    error: null,
  });
}

function errorResponse(res, message, status, details = null) {
  return res.status(status).json({
    success: false,
    message,
    data: null,
    error: details,
  });
}

//Joi Validation SCHEMA

const biodataSchema = Joi.object({
  id: Joi.number().integer().positive(),
  nama: Joi.string().trim().min(2).max(100).required(),
  nim: Joi.string().trim().min(5).max(20).required(),
  kelas: Joi.string().trim().min(1).max(20).required(),
});

const idSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// middleware untuk validasi body
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      convert: true,
      allowUnknown: false,
    });

    if (error) {
      return errorResponse(
        res,
        "validasi input gagal",
        400,
        error.details.map((item) => ({
          field: item.path.join("."),
          message: item.message,
        })),
      );
    }

    req.body = value;
    next();
  };
}
