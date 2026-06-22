// @ts-nocheck
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, readOnly }) {
  const map = useMapEvents({
    click(e) {
      if (
        !readOnly &&
        e.latlng &&
        e.latlng.lat !== undefined &&
        e.latlng.lng !== undefined
      ) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

const LocationPicker = ({
  onLocationSelect,
  initialPosition,
  readOnly = false,
}) => {
  const [position, setPosition] = useState(() => initialPosition || null);
  const [defaultCenter, setDefaultCenter] = useState([11.5564, 104.9282]); // Phnom Penh default

  useEffect(() => {
    if (initialPosition) {
      // Only update if different to avoid cascading renders
      if (
        !position ||
        position.lat !== initialPosition.lat ||
        position.lng !== initialPosition.lng
      ) {
        setPosition(initialPosition);
      }
      setDefaultCenter((prev) => {
        if (
          !prev ||
          prev[0] !== initialPosition.lat ||
          prev[1] !== initialPosition.lng
        ) {
          return [initialPosition.lat, initialPosition.lng];
        }
        return prev;
      });
    } else {
      // Try global geolocation
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setDefaultCenter([latitude, longitude]);
        },
        (err) => {
          console.warn("Geolocation access denied or failed", err);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition]);

  useEffect(() => {
    if (position) {
      onLocationSelect(position);
    }
  }, [position, onLocationSelect]);

  return (
    <div className="h-62.5 w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          setPosition={setPosition}
          readOnly={readOnly}
        />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;

