import { config } from "dotenv";

config();

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
export const MONGODB_URL = process.env.MONGODB_URL;
export const CEGID_KEY = "CK7YH6QJCTUCF3A8B5TCH7UYH";
export const CEGID_SECRET = "LLcyaGYjXts1rLbDcFqCovRqW+e2B+QjQZTIf+Jzgtc=";
export const API_BASE_URL =
  "https://api.cegid.com/loop-api-publiques/EcritureComptable";
