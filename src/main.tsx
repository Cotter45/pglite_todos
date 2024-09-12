/* eslint-disable @typescript-eslint/no-explicit-any */
import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { live } from "@electric-sql/pglite/live";
import { vector } from "@electric-sql/pglite/vector";
import { IdbFs, PGlite, PGliteInterfaceExtensions } from "@electric-sql/pglite";
import { PGliteProvider } from "@electric-sql/pglite-react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import App from "./App.tsx";
import { Home } from "./app/Home.tsx";

import "./index.css";

// Loading screen component
function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div role="status">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-emerald-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export function Main() {
  const [db, setDb] = useState<
    PGlite &
      PGliteInterfaceExtensions<{
        live: typeof live;
        vector: typeof vector;
      }>
  >();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeDb() {
      const db = await PGlite.create({
        fs: new IdbFs("pglite"),
        extensions: { live, vector },
      });

      await db.exec(
        `
        CREATE TABLE IF NOT EXISTS lists (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          avatar TEXT NOT NULL DEFAULT 'https://cdn-icons-png.flaticon.com/512/8161/8161879.png'
        );
        `
      );

      // Check if the ENUM type exists before creating it
      const typeExists = await db.query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'status'
        )`
      );

      if (typeExists && !typeExists.rows[0].exists) {
        await db.exec(`
          CREATE TYPE status AS ENUM ('todo', 'done');
        `);
      }

      await db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
          status status NOT NULL DEFAULT 'todo',
          search_vector tsvector
        );
      `);

      await db.exec(`
        DROP TRIGGER IF EXISTS tsvector_update ON todos;
      `);

      // Create the trigger function
      await db.exec(`
        CREATE OR REPLACE FUNCTION update_tsvector() RETURNS TRIGGER AS $$
        BEGIN
          NEW.search_vector := to_tsvector('english', NEW.text);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create the trigger
      await db.exec(`
        CREATE TRIGGER tsvector_update
        BEFORE INSERT OR UPDATE ON todos
        FOR EACH ROW EXECUTE FUNCTION update_tsvector();
      `);

      setDb(db);
      setLoading(false);
    }

    initializeDb();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<App />}>
        <Route path="" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Route>
    )
  );

  if (!db) {
    return null;
  }

  return (
    <PGliteProvider db={db}>
      <RouterProvider router={router} />
    </PGliteProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
