import React, { useEffect, useState, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE = process.env.REACT_APP_API_BASE;
const SOCKET_URL = API_BASE;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Contexts
const DisasterContext = createContext();
const UserContext = createContext();

function useDisaster() { return useContext(DisasterContext); }
function useUser() { return useContext(UserContext); }

function App() {
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const [user, setUser] = useState({ id: 'netrunnerX', role: 'contributor' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('disaster_updated', (updatedDisaster) => {
      if (updatedDisaster._deleted) {
        setDisasters(ds => ds.filter(d => d.id !== updatedDisaster.id));
        if (selectedDisaster?.id === updatedDisaster.id) {
          setSelectedDisaster(null);
        }
        toast.info(`Disaster deleted`, { theme });
        return;
      }

      setDisasters(ds => ds.find(d => d.id === updatedDisaster.id)
        ? ds.map(d => d.id === updatedDisaster.id ? { ...d, ...updatedDisaster } : d)
        : [...ds, updatedDisaster]);

      if (selectedDisaster?.id === updatedDisaster.id) {
        setSelectedDisaster(d => ({ ...d, ...updatedDisaster }));
      }
      toast.info(`Disaster updated: ${updatedDisaster.title}`, { theme });
    });
    socket.on('disaster_created', (newDisaster) => {
      setDisasters(ds => [...ds, newDisaster]);
      toast.info(`Disaster created: ${newDisaster.title}`, { theme });
    });
    socket.on('disaster_deleted', (deletedDisaster) => {
      setDisasters(ds => ds.filter(d => d.id !== deletedDisaster.id));
      if (selectedDisaster?.id === deletedDisaster.id) {
        setSelectedDisaster(null);
      }
      toast.info(`Disaster deleted: ${deletedDisaster.title || deletedDisaster.id}`, { theme });
    });
    socket.on('disaster_updated', (updatedDisaster) => {
      setDisasters(ds => ds.map(d => d.id === updatedDisaster.id ? { ...d, ...updatedDisaster } : d));
      if (selectedDisaster?.id === updatedDisaster.id) {
        setSelectedDisaster(d => ({ ...d, ...updatedDisaster }));
      }
      toast.info(`Disaster updated: ${updatedDisaster.title}`, { theme });
    });
    socket.on('social_media_updated', (report) => {
      toast.info(`New report: ${report.content.slice(0, 30)}...`, { theme });
    });
    socket.on('resources_updated', (resource) => {
      toast.info(`New resource: ${resource.name}`, { theme });
    });
    return () => socket.disconnect();
  }, [selectedDisaster, theme]);

  useEffect(() => {
    fetch(`${API_BASE}/disasters`)
      .then(res => res.json())
      .then(data => {
        console.log('Raw disasters data:', data);
        setDisasters(data);
        console.log('Disasters state after set:', data);
      })
      .catch(err => toast.error(`Error fetching disasters: ${err.message}`, { theme }));
  }, [theme]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <DisasterContext.Provider value={{ disasters, setDisasters, selectedDisaster, setSelectedDisaster }}>
        <Router>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <NavBar theme={theme} setTheme={setTheme} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
            <div className="flex">
              <div className={`w-64 bg-white dark:bg-gray-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 fixed md:static h-full z-20`}>
                <Sidebar />
              </div>
              <main className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<LandingOrDetails />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/official-updates" element={<OfficialUpdates />} />
                  <Route path="/social-media" element={<SocialMediaUpdates />} />
                  <Route path="/image-verification" element={<ImageVerification />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme={theme} />
          </div>
        </Router>
      </DisasterContext.Provider>
    </UserContext.Provider>
  );
}

function NavBar({ theme, setTheme, setSidebarOpen, sidebarOpen }) {

  const { user, setUser } = useUser();

  const handleUserChange = (e) => {
    const [id, role] = e.target.value.split(':');
    setUser({ id, role });
  };

  return (
    <nav className="bg-blue-600 dark:bg-blue-800 text-white p-4 sticky top-0 z-30 shadow-lg flex justify-between items-center">
      <div className="flex items-center space-x-4 flex-1">
        <button
          className="md:hidden p-2 rounded hover:bg-blue-700"
          onClick={() => setSidebarOpen(s => !s)}
          aria-label={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex justify-center">
        <h1
          className="text-2xl md:text-3xl font-extrabold tracking-wide text-center cursor-pointer hover:underline"
          onClick={() => window.location.reload()}
          title="Refresh"
        >
          CrisisIQ
        </h1>
      </div>
      <div className="flex items-center space-x-4 flex-1 justify-end">
        {/* Navigation links are commented out as per new design */}
        <select
          value={`${user.id}:${user.role}`}
          onChange={handleUserChange}
          className="p-2 rounded bg-blue-700 text-white"
          aria-label="Select user"
        >
          <option value="netrunnerX:contributor">netrunnerX (Contributor)</option>
          <option value="reliefAdmin:admin">reliefAdmin (Admin)</option>
        </select>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded hover:bg-blue-700"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
}

function useActiveRoute(path) {
  const { pathname } = useLocation();
  return pathname === path;
}

function Sidebar() {
  const { disasters, selectedDisaster, setSelectedDisaster } = useDisaster();
  const { user } = useUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  const filteredDisasters = disasters.filter(d =>
    (d.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (d.location_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="p-4 h-full overflow-y-auto bg-white dark:bg-gray-800">
      <h2 className="text-lg font-bold mb-4">Disasters</h2>
      <input
        type="text"
        placeholder="Search disasters..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        aria-label="Search disasters"
      />
      {user.role === 'admin' && (
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`p-2 rounded ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Disaster List
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`p-2 rounded ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Create Disaster
          </button>
        </div>
      )}
      {activeTab === 'list' && (
        <ul className="space-y-2">
          {filteredDisasters.map(d => (
            <li
              key={d.id}
              onClick={() => { setSelectedDisaster(d); navigate('/'); }}
              className={`p-2 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 ${selectedDisaster?.id === d.id ? 'bg-blue-200 dark:bg-blue-800 font-bold' : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelectedDisaster(d)}
            >
              {d.title}
            </li>
          ))}
        </ul>
      )}
      {activeTab === 'create' && user.role === 'admin' && <AddDisasterForm />}
    </div>
  );
}

function AddDisasterForm() {
  const { setDisasters } = useDisaster();
  const { user } = useUser();
  const [form, setForm] = useState({ title: '', location_name: '', description: '', tags: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = {
      title: form.title,
      location_name: form.location_name,
      description: form.description,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      owner_id: user.id
    };
    try {
      const res = await fetch(`${API_BASE}/disasters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDisasters(ds => [...ds, data]);
      setForm({ title: '', location_name: '', description: '', tags: '' });
      toast.success('Disaster report created!', { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <h3 className="text-md font-semibold">Add Disaster Report</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <input
        name="location_name"
        placeholder="Location Name (e.g., Lower East Side, NYC)"
        value={form.location_name}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <textarea
        name="description"
        placeholder="Description (e.g., Flood in Manhattan)"
        value={form.description}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <input
        name="tags"
        placeholder="Tags (comma separated)"
        value={form.tags}
        onChange={handleChange}
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
      >
        {loading ? 'Submitting...' : 'Create Disaster'}
      </button>
    </form>
  );
}

function UpdateDisasterForm({ disaster, onClose }) {
  const { setDisasters, setSelectedDisaster } = useDisaster();
  const { user } = useUser();
  const [form, setForm] = useState({
    title: disaster.title,
    location_name: disaster.location_name || '',
    description: disaster.description,
    tags: (disaster.tags || []).join(', ')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = {
      title: form.title,
      location_name: form.location_name,
      description: form.description,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    try {
      const res = await fetch(`${API_BASE}/disasters/${disaster.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDisasters(ds => ds.map(d => d.id === data.id ? data : d));
      setSelectedDisaster(data);
      toast.success('Disaster updated!', { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-md font-semibold">Update Disaster</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <input
        name="location_name"
        placeholder="Location Name"
        value={form.location_name}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <input
        name="tags"
        placeholder="Tags (comma separated)"
        value={form.tags}
        onChange={handleChange}
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? 'Updating...' : 'Update Disaster'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function LandingOrDetails() {
  const { selectedDisaster } = useDisaster();
  return selectedDisaster ? <DisasterDetails /> : <LandingPage />;
}

function LandingPage() {
  return (
    <div className="text-center mt-8">
      <h1 className="text-3xl font-bold mb-4">Disaster Response Platform</h1>
      <p className="text-lg">Select a disaster from the sidebar or create a new report to get started.</p>
    </div>
  );
}

function DisasterDetails() {
  const { selectedDisaster, setDisasters, setSelectedDisaster } = useDisaster();
  const { user } = useUser();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  if (!selectedDisaster) return null;

  const position = selectedDisaster?.lat && selectedDisaster?.lon
    ? [selectedDisaster.lat, selectedDisaster.lon]
    : [40.7128, -74.0060];

  const zoomLevel = selectedDisaster?.lat && selectedDisaster?.lon ? 15 : 12;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this disaster?')) return;
    try {
      const res = await fetch(`${API_BASE}/disasters/${selectedDisaster.id}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': user.id },
      });
      if (!res.ok) throw new Error(await res.text());
      setDisasters(ds => ds.filter(d => d.id !== selectedDisaster.id));
      setSelectedDisaster(null);
      toast.success('Disaster deleted!', { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } catch (err) {
      toast.error(`Error: ${err.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'resources' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'social' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          onClick={() => setActiveTab('social')}
        >
          Social Media
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'updates' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          onClick={() => setActiveTab('updates')}
        >
          Official Updates
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <>
          <h2 className="text-2xl font-bold mb-4">{selectedDisaster.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Location:</strong> {selectedDisaster.location_name || 'Unknown'}</p>
              {selectedDisaster.lat && selectedDisaster.lon && (
                <p><strong>Coordinates:</strong> Latitude: {selectedDisaster.lat.toFixed(4)}, Longitude: {selectedDisaster.lon.toFixed(4)}</p>
              )}
              <p><strong>Description:</strong> {selectedDisaster.description}</p>
              <p><strong>Tags:</strong> {(selectedDisaster.tags || []).join(', ')}</p>
              <p><strong>Owner:</strong> {selectedDisaster.owner_id}</p>
              <h3 className="text-lg font-semibold mt-4">Audit Trail</h3>
              <ul className="list-disc pl-6">
                {(selectedDisaster.audit_trail || []).map((a, i) => (
                  <li key={i}>{a.action} by {a.user_id} at {new Date(a.timestamp).toLocaleString()}</li>
                ))}
              </ul>
              {user.role === 'admin' && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setShowUpdateForm(true)}
                    className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                  >
                    Update Disaster
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                  >
                    Delete Disaster
                  </button>
                </div>
              )}
            </div>
            <div className="h-64 rounded-lg overflow-hidden">
              <MapContainer 
                key={selectedDisaster.id} 
                center={position} 
                zoom={zoomLevel} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                  attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  tileSize={512}
                  zoomOffset={-1}
                  accessToken={MAPBOX_TOKEN}
                />
                {selectedDisaster.lat && selectedDisaster.lon && (
                  <Marker position={position}>
                    <Popup>
                      {selectedDisaster.title}<br />
                      Latitude: {selectedDisaster.lat.toFixed(4)}<br />
                      Longitude: {selectedDisaster.lon.toFixed(4)}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
          {showUpdateForm && user.role === 'admin' && (
            <UpdateDisasterForm disaster={selectedDisaster} onClose={() => setShowUpdateForm(false)} />
          )}
        </>
      )}
      {activeTab === 'reports' && <Reports />}
      {activeTab === 'resources' && <Resources />}
      {activeTab === 'social' && <SocialMediaUpdates />}
      {activeTab === 'updates' && <OfficialUpdates />}
    </div>
  );
}

function Resources() {
  const { selectedDisaster } = useDisaster();
  const { user } = useUser();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [showHospitals, setShowHospitals] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const socket = io(API_BASE);
    socket.on('resource_created', (resource) => {
      setResources(rs => [...rs, resource]);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    setMapKey(selectedDisaster?.id || 0);
  }, [selectedDisaster]);

  const getCoords = (coords, fallback = [40.7128, -74.0060]) => {
    if (Array.isArray(coords) && coords.length >= 2 &&
        typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords[1], coords[0]];
    }
    return fallback;
  };

  useEffect(() => {
    if (selectedDisaster) {
      setLoading(true);
      fetch(`${API_BASE}/disasters/${selectedDisaster.id}/resources`)
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error(`HTTP ${res.status}: ${text}`);
            });
          }
          return res.json();
        })
        .then(data => {
          setResources(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(e => {
          setError(e.message);
          setLoading(false);
          toast.error(`Error fetching resources: ${e.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
        });
      setNearbyHospitals([]);
      setShowHospitals(false);
    }
  }, [selectedDisaster]);

  const handleResourceAdded = (resource) => {
    setResources(rs => [...rs, resource]);
  };

  const fetchNearbyHospitals = () => {
    if (!selectedDisaster) return;
    fetch(`${API_BASE}/disasters/${selectedDisaster.id}/nearby-hospitals`)
      .then(res => res.json())
      .then(data => {
        console.log('Nearby hospitals response:', data);
        setNearbyHospitals(data.hospitals || []);
        setShowHospitals(true);
      })
      .catch(() => {
        setNearbyHospitals([]);
        setShowHospitals(true);
      });
  };

  if (!selectedDisaster) return <div className="text-center mt-4">Select a disaster to view resources.</div>;

  const center = selectedDisaster.lat && selectedDisaster.lon 
    ? [selectedDisaster.lat, selectedDisaster.lon]
    : [40.7128, -74.0060];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Resources for {selectedDisaster.title}</h2>
      {user.role === 'admin' && (
        <AddResourceForm disasterId={selectedDisaster.id} onResourceAdded={handleResourceAdded} />
      )}
      <button
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={fetchNearbyHospitals}
      >
        Show Nearby Hospitals
      </button>
      {loading && <div className="text-center py-4">Loading resources...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {resources.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No resources found for this disaster.
          {user.role === 'admin' && ' Add some resources using the form above.'}
        </div>
      ) : (
        <>
          <div className="h-96 rounded-lg overflow-hidden mb-6">
            <MapContainer
              key={mapKey}
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                tileSize={512}
                zoomOffset={-1}
                accessToken={MAPBOX_TOKEN}
              />
              {resources.map(r => {
                const markerCoords = getCoords(r.location?.coordinates, center);
                return (
                  <Marker key={r.id} position={markerCoords}>
                    <Popup>
                      <div>
                        <strong>{r.name}</strong><br />
                        Type: {r.type}<br />
                        Location: {r.location_name}<br />
                        {r.location?.coordinates && (
                          <>
                            Lat: {r.location.coordinates[1]?.toFixed(4)}<br />
                            Lon: {r.location.coordinates[0]?.toFixed(4)}
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              {showHospitals && nearbyHospitals.map(h => (
                <Marker key={`hospital-${h.id}`} position={[h.lat || h.center?.lat, h.lon || h.center?.lon]} icon={L.icon({
                  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
                  className: 'hospital-marker',
                })}>
                  <Popup>
                    <div>
                      <strong>{h.tags?.name || 'Unnamed Hospital'}</strong><br />
                      Type: Hospital<br />
                      Lat: {(h.lat || h.center?.lat)?.toFixed(4)}<br />
                      Lon: {(h.lon || h.center?.lon)?.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(r => (
              <div key={r.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{r.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">
                  <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-sm">
                    {r.type}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  📍 {r.location_name}
                </p>
                {r.location?.coordinates && (
                  <p className="text-xs text-gray-500">
                    Coordinates: {r.location.coordinates[1]?.toFixed(4)}, {r.location.coordinates[0]?.toFixed(4)}
                  </p>
                )}
              </div>
            ))}
          </div>
          {showHospitals && nearbyHospitals.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Nearby Hospitals (OpenStreetMap)</h3>
              <ul>
                {nearbyHospitals.map(h => (
                  <li key={h.id} className="mb-1">
                    {h.tags?.name || 'Unnamed Hospital'} ({(h.lat || h.center?.lat)?.toFixed(4)}, {(h.lon || h.center?.lon)?.toFixed(4)})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showHospitals && nearbyHospitals.length === 0 && (
            <div className="mt-4 text-gray-500">No hospitals found nearby.</div>
          )}
        </>
      )}
    </div>
  );
}

function Reports() {
  const { selectedDisaster } = useDisaster();
  const { user } = useUser();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ content: '', image_url: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedDisaster) {
      fetch(`${API_BASE}/disasters/${selectedDisaster.id}/reports`)
        .then(res => res.json())
        .then(data => setReports(Array.isArray(data) ? data : []))
        .catch(e => setError(e.message));
    }
  }, [selectedDisaster]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const body = {
      content: form.content,
      image_url: form.image_url || undefined,
    };

    // Debug: Log what we're sending
    console.log('JSON body being sent:');
    console.log(body);
    console.log('user.id:', user.id);
    console.log('disaster.id:', selectedDisaster.id);

    try {
      const res = await fetch(`${API_BASE}/disasters/${selectedDisaster.id}/reports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': user.id 
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReports(rs => [...rs, { ...data, content: form.content, image_url: form.image_url, user_id: user.id }]);
      setForm({ content: '', image_url: '' });
      toast.success('Report submitted!', { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDisaster) return <div className="text-center mt-4">Select a disaster to view reports.</div>;

  const isUrgent = content => /urgent|sos/i.test(content);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reports for {selectedDisaster.title}</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <textarea
          name="content"
          placeholder="Report content (e.g., Need food in Lower East Side)"
          value={form.content}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <input
          name="image_url"
          placeholder="Image URL (optional)"
          value={form.image_url}
          onChange={handleChange}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <ul className="space-y-2">
        {reports.map(r => (
          <li key={r.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex justify-between items-center">
            <div>
              <p>{r.content}</p>
              {r.image_url && (
                <img
                  src={r.image_url}
                  alt="Report"
                  className="my-2 max-h-40 rounded border"
                  style={{ maxWidth: '200px', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">By {r.user_id} - Status: {r.verification_status}</p>
            </div>
            {isUrgent(r.content) && <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">Urgent</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfficialUpdates() {
  const { selectedDisaster } = useDisaster();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedDisaster) {
      setLoading(true);
      fetch(`${API_BASE}/disasters/${selectedDisaster.id}/official-updates`)
        .then(res => res.json())
        .then(data => {
          setUpdates(data.updates || []);
          setLoading(false);
        })
        .catch(e => {
          setError(e.message);
          setLoading(false);
          toast.error(`Error fetching updates: ${e.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
        });
    }
  }, [selectedDisaster]);

  if (!selectedDisaster) return <div className="text-center mt-4">Select a disaster to view updates.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Official Updates for {selectedDisaster.title}</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-2">
        {updates.map((u, i) => (
          <li key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="font-bold">{u.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{u.source} - {u.date}</div>
            <p>{u.snippet}</p>
            <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Read More</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialMediaUpdates() {
  const { selectedDisaster } = useDisaster();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedDisaster) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/disasters/${selectedDisaster.id}/social-media`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedDisaster]);

  if (!selectedDisaster) return <div className="text-center mt-4">Select a disaster to view social media updates.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Social Media Updates for {selectedDisaster.title}</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-2">
        {posts.map((p, i) => (
          <li key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="font-bold">{p.user}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{p.indexedAt}</div>
            <p>{p.post}</p>
            {p.uri && (
              <a href={p.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Post</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageVerification() {
  const { selectedDisaster } = useDisaster();
  const { user } = useUser();
  const [form, setForm] = useState({ image_url: '', report_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/disasters/${selectedDisaster?.id || ''}/verify-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id
        },
        body: JSON.stringify({
          image_url: form.image_url,
          report_id: form.report_id
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setForm({ image_url: '', report_id: '' });
      toast.success('Image verification submitted!', { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDisaster) return <div className="text-center mt-4">Select a disaster to verify images.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Image Verification for {selectedDisaster.title}</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 mb-4">
        <input
          name="image_url"
          placeholder="Image URL"
          value={form.image_url}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <input
          name="report_id"
          placeholder="Report ID"
          value={form.report_id}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? 'Verifying...' : 'Verify Image'}
        </button>
      </form>
      {result && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p><strong>Result:</strong> {result.status || 'Verification completed'}</p>
          <p><strong>Image URL:</strong> <a href={result.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{result.image_url}</a></p>
          <p><strong>Report ID:</strong> {result.report_id}</p>
        </div>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center mt-8">
      <h1 className="text-3xl font-bold mb-4">404 - Not Found</h1>
      <p>Page does not exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
    </div>
  );
}

function AddResourceForm({ disasterId, onResourceAdded }) {
  const { user } = useUser();
  const [form, setForm] = useState({
    name: '',
    location_name: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = {
      name: form.name,
      location_name: form.location_name,
      type: form.type
    };
    try {
      const res = await fetch(`${API_BASE}/disasters/${disasterId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setForm({ name: '', location_name: '', type: '' });
      toast.success('Resource added!', { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
      if (onResourceAdded) onResourceAdded(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-4">
      <h3 className="text-md font-semibold">Add Resource</h3>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input
        name="name"
        placeholder="Resource Name (e.g., Relief Camp A)"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <input
        name="location_name"
        placeholder="Location Name (e.g., Central Park, NYC)"
        value={form.location_name}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <input
        name="type"
        placeholder="Type (e.g., Shelter, Medical, Food)"
        value={form.type}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
      >
        {loading ? 'Adding...' : 'Add Resource'}
      </button>
    </form>
  );
}

export default App;
