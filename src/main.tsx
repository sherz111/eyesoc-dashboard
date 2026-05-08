import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import App from "./App";
import DarkWeb from "./pages/DarkWeb";
import CVE from "./pages/CVE";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<App />} />
          <Route path="/darkweb" element={<DarkWeb />} />
          <Route path="/cve" element={<CVE />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
