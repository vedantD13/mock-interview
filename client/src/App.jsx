import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';

function App() {
  return (
    <BrowserRouter>
      {/* w-full ensures it grabs the full width fixed in Step 1 */}
      <div className="w-full min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview" element={<Interview />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;