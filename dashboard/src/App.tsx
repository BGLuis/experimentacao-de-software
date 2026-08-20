import { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Beaker, Menu, X, Star } from 'lucide-react';
import { DataProvider } from './context/DataContext';
import { Filters } from './components/Filters';

const Home = lazy(() => import('./pages/Home'));
const RQ01 = lazy(() => import('./pages/RQ01'));
const RQ02 = lazy(() => import('./pages/RQ02'));
const RQ03 = lazy(() => import('./pages/RQ03'));
const RQ04 = lazy(() => import('./pages/RQ04'));
const RQ05 = lazy(() => import('./pages/RQ05'));
const RQ06 = lazy(() => import('./pages/RQ06'));
const RQ07 = lazy(() => import('./pages/RQ07'));
const Bonus01 = lazy(() => import('./pages/Bonus01'));
const Bonus02 = lazy(() => import('./pages/Bonus02'));
const Bonus03 = lazy(() => import('./pages/Bonus03'));
const Bonus04 = lazy(() => import('./pages/Bonus04'));

const navItems = [
  { path: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { path: '/rq01', label: 'RQ 01', icon: Beaker },
  { path: '/rq02', label: 'RQ 02', icon: Beaker },
  { path: '/rq03', label: 'RQ 03', icon: Beaker },
  { path: '/rq04', label: 'RQ 04', icon: Beaker },
  { path: '/rq05', label: 'RQ 05', icon: Beaker },
  { path: '/rq06', label: 'RQ 06', icon: Beaker },
  { path: '/rq07', label: 'RQ 07', icon: Beaker },
  { path: '/bonus01', label: 'Bônus 01: Wiki & Tamanho', icon: Star },
  { path: '/bonus02', label: 'Bônus 02: Fenômeno IA', icon: Star },
  { path: '/bonus03', label: 'Bônus 03: Licenças', icon: Star },
  { path: '/bonus04', label: 'Bônus 04: Tags & Engaj.', icon: Star },
];

function NavigationContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();

  return (
    <>
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <LayoutDashboard className="text-blue-400" />
        Lab Dashboard
      </h1>
      <nav className="flex flex-col gap-1 overflow-y-auto max-h-[85vh] custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <LayoutDashboard className="text-blue-400" size={20} />
          <span>Lab Dashboard</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-800 focus:outline-none text-gray-300 hover:text-white"
          aria-label="Abrir Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Backdrop & Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative bg-gray-900 w-72 max-w-[80vw] h-full p-5 text-white flex flex-col justify-between shadow-2xl z-10">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <span className="font-semibold text-gray-400 text-sm uppercase tracking-wider">Navegação</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <NavigationContent onItemClick={() => setIsOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-gray-900 text-white p-5 min-h-screen shrink-0 border-r border-gray-800">
        <NavigationContent />
      </aside>
    </>
  );
}

function App() {
  return (
    <DataProvider>
      <HashRouter>
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto md:h-screen w-full min-w-0">
            <Filters />
            <Suspense fallback={<div className="p-4 flex h-full items-center justify-center text-gray-500">Carregando visualização...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rq01" element={<RQ01 />} />
                <Route path="/rq02" element={<RQ02 />} />
                <Route path="/rq03" element={<RQ03 />} />
                <Route path="/rq04" element={<RQ04 />} />
                <Route path="/rq05" element={<RQ05 />} />
                <Route path="/rq06" element={<RQ06 />} />
                <Route path="/rq07" element={<RQ07 />} />
                <Route path="/bonus01" element={<Bonus01 />} />
                <Route path="/bonus02" element={<Bonus02 />} />
                <Route path="/bonus03" element={<Bonus03 />} />
                <Route path="/bonus04" element={<Bonus04 />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </HashRouter>
    </DataProvider>
  );
}

export default App;
