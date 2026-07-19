import { BrowserRouter, Routes, Route } from "react-router-dom";
import Subcategories from "./pages/Subcategories";
import Listings from "./pages/Listings";
import PostForm from "./pages/PostForm";
// import Home from "./pages/Home"; // your existing homepage with HomeTiles

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/subcategories" element={<Subcategories />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/post" element={<PostForm />} />
      </Routes>
    </BrowserRouter>
  );
}
