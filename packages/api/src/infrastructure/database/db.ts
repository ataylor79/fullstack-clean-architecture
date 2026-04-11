import knex from "knex";
import config from "./dbConfig";

const env = (process.env.NODE_ENV as keyof typeof config) ?? "development";

export const db = knex(config[env]);
