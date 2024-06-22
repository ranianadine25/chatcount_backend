import { config } from "dotenv";

config();

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
export const MONGODB_URL = process.env.MONGODB_URL;
export const CEGID_KEY = 'CK7YH6QJCTUCF3A8B5TCH7UYH:LLcyaGYjXts1rLbDcFqCovRqW+e2B+QjQZTIf+Jzgtc=';
export const CEGID_SECRET = 'c4baaa46015e4afb9cc5dd8cdbf1637a';
export const API_BASE_URL = 'https://api.cegid.com/loop-api-publiques';
export const CEGID_PRIMARY_KEY = '795767745f854ec2a3b6ad0a9f5f22b5'; 
export const CEGID_SECONDARY_KEY = '3fe78b0b2b0e42359278cef136cafa17'; 
