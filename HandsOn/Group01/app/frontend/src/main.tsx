import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
