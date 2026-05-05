import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { stationService } from '../services/stationService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

const AddStation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: null,
    connectors: [{ type: 'Type2', powerKw: 22, count: 1 }],
    availability: {
      totalSlots: 4,
      availableSlots: 2,
    },
    pricePerKwh: 8.0,
    tags: [],
  });
  const [images, setImages] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pricePerKwh' || name === 'totalSlots' || name === 'availableSlots') {
      setFormData((prev) => ({
        ...prev,
        [name === 'pricePerKwh' ? 'pricePerKwh' : 'availability']:
          name === 'pricePerKwh'
            ? parseFloat(value)
            : {
                ...prev.availability,
                [name === 'totalSlots' ? 'totalSlots' : 'availableSlots']: parseInt(value),
              },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleConnectorChange = (index, field, value) => {
    setFormData((prev) => {
      const newConnectors = [...prev.connectors];
      newConnectors[index] = {
        ...newConnectors[index],
        [field]: field === 'count' || field === 'powerKw' ? parseFloat(value) : value,
      };
      return { ...prev, connectors: newConnectors };
    });
  };

  const addConnector = () => {
    setFormData((prev) => ({
      ...prev,
      connectors: [...prev.connectors, { type: 'Type2', powerKw: 22, count: 1 }],
    }));
  };

  const removeConnector = (index) => {
    setFormData((prev) => ({
      ...prev,
      connectors: prev.connectors.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleLocationInput = (e) => {
    const value = e.target.value;
    const parts = value.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [lat, lng] = parts;
      setFormData((prev) => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      }));
      setMapCenter([lat, lng]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.location) {
      setErrors({ location: 'Please select a location on the map or enter coordinates' });
      return;
    }

    if (formData.connectors.length === 0) {
      setErrors({ connectors: 'At least one connector is required' });
      return;
    }

    try {
      setSubmitting(true);
      await stationService.createStation(formData, images);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert('Failed to create station');
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Station</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Station Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block mb-2 font-medium">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Location *</h2>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Coordinates (lat, lng)</label>
            <input
              type="text"
              placeholder="e.g., 18.5204, 73.8567"
              onChange={handleLocationInput}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Or click on the map below to set location
            </p>
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>
          <div className="h-64 rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker
                position={
                  formData.location
                    ? [formData.location.coordinates[1], formData.location.coordinates[0]]
                    : null
                }
                setPosition={(pos) => {
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      type: 'Point',
                      coordinates: [pos[1], pos[0]],
                    },
                  }));
                }}
              />
            </MapContainer>
          </div>
        </div>

        {/* Connectors */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Connectors *</h2>
          {formData.connectors.map((connector, index) => (
            <div key={index} className="flex gap-4 mb-4 items-end">
              <div className="flex-1">
                <label className="block mb-2 font-medium">Type</label>
                <select
                  value={connector.type}
                  onChange={(e) => handleConnectorChange(index, 'type', e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="Type2">Type2</option>
                  <option value="CCS">CCS</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="Tesla">Tesla</option>
                  <option value="Bharat AC">Bharat AC</option>
                  <option value="Bharat DC">Bharat DC</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-medium">Power (kW)</label>
                <input
                  type="number"
                  value={connector.powerKw}
                  onChange={(e) => handleConnectorChange(index, 'powerKw', e.target.value)}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-medium">Count</label>
                <input
                  type="number"
                  value={connector.count}
                  onChange={(e) => handleConnectorChange(index, 'count', e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border rounded-md"
                />
              </div>
              <button
                type="button"
                onClick={() => removeConnector(index)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addConnector}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Add Connector
          </button>
          {errors.connectors && (
            <p className="text-red-500 text-sm mt-2">{errors.connectors}</p>
          )}
        </div>

        {/* Availability & Price */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Availability & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-medium">Total Slots *</label>
              <input
                type="number"
                name="totalSlots"
                value={formData.availability.totalSlots}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Available Slots *</label>
              <input
                type="number"
                name="availableSlots"
                value={formData.availability.availableSlots}
                onChange={handleInputChange}
                min="0"
                required
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Price per kWh (₹) *</label>
              <input
                type="number"
                name="pricePerKwh"
                value={formData.pricePerKwh}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                required
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border rounded-md"
          />
          <p className="text-sm text-gray-500 mt-2">You can upload multiple images</p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Station'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStation;











