import { charts } from "@shared/schema";
import type { Chart, InsertChart } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { desc, eq } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
sqlite.exec(`CREATE TABLE IF NOT EXISTS charts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'unspecified',
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  place TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  ayanamsa TEXT NOT NULL DEFAULT 'lahiri',
  node_type TEXT NOT NULL DEFAULT 'mean',
  notes TEXT NOT NULL DEFAULT ''
)`);

export const db = drizzle(sqlite);

export interface IStorage {
  listCharts(): Promise<Chart[]>;
  getChart(id: number): Promise<Chart | undefined>;
  createChart(chart: InsertChart): Promise<Chart>;
  updateChart(id: number, chart: Partial<InsertChart>): Promise<Chart | undefined>;
  deleteChart(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async listCharts(): Promise<Chart[]> {
    return db.select().from(charts).orderBy(desc(charts.id)).all();
  }
  async getChart(id: number): Promise<Chart | undefined> {
    return db.select().from(charts).where(eq(charts.id, id)).get();
  }
  async createChart(chart: InsertChart): Promise<Chart> {
    return db.insert(charts).values(chart).returning().get();
  }
  async updateChart(id: number, chart: Partial<InsertChart>): Promise<Chart | undefined> {
    return db.update(charts).set(chart).where(eq(charts.id, id)).returning().get();
  }
  async deleteChart(id: number): Promise<boolean> {
    return db.delete(charts).where(eq(charts.id, id)).run().changes > 0;
  }
}

export const storage = new DatabaseStorage();
