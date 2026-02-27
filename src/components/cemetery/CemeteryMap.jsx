import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Layers } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ center, zoom, selectedDefunto }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDefunto?.coordinate_lat && selectedDefunto?.coordinate_lng) {
      map.flyTo([selectedDefunto.coordinate_lat, selectedDefunto.coordinate_lng], 19, {
        duration: 1.5
      });
    }
  }, [selectedDefunto, map]);

  return null;
}

export default function CemeteryMap({ 
  geojsonData, 
  defunti = [],
  selectedDefunto,
  onFeatureClick,
  center = [41.9028, 12.4964],
  zoom = 18
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState('satellite');
  const mapRef = useRef(null);

  const tileLayers = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    },
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap'
    }
  };

  const getFeatureStyle = (feature) => {
    const isSelected = selectedDefunto?.geojson_id === feature.properties?.id;
    return {
      fillColor: isSelected ? '#f59e0b' : '#3b82f6',
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#d97706' : '#1e40af',
      fillOpacity: isSelected ? 0.6 : 0.3
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (onFeatureClick) {
          onFeatureClick(feature.properties);
        }
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          fillOpacity: 0.5,
          weight: 2
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(getFeatureStyle(feature));
      }
    });

    if (feature.properties?.nome || feature.properties?.label) {
      layer.bindTooltip(feature.properties.nome || feature.properties.label, {
        permanent: false,
        direction: 'center',
        className: 'bg-white px-2 py-1 rounded shadow-lg border-0 text-sm font-medium'
      });
    }
  };

  return (
    <Card className={`
      overflow-hidden border-0 shadow-lg transition-all duration-300
      ${isFullscreen ? 'fixed inset-4 z-50' : 'relative'}
    `}>
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setMapStyle(mapStyle === 'satellite' ? 'streets' : 'satellite')}
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-md"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-md"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        className={isFullscreen ? 'h-full w-full' : 'h-[400px] md:h-[500px] w-full'}
        style={{ background: '#1e293b' }}
      >
        <TileLayer
          url={tileLayers[mapStyle].url}
          attribution={tileLayers[mapStyle].attribution}
        />

        {geojsonData && (
          <GeoJSON
            key={JSON.stringify(selectedDefunto?.id)}
            data={geojsonData}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {selectedDefunto?.coordinate_lat && selectedDefunto?.coordinate_lng && (
          <Marker
            position={[selectedDefunto.coordinate_lat, selectedDefunto.coordinate_lng]}
            icon={selectedIcon}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-semibold">{selectedDefunto.cognome} {selectedDefunto.nome}</p>
                <p className="text-sm text-slate-500">
                  Sett. {selectedDefunto.settore} - Fila {selectedDefunto.fila} - N° {selectedDefunto.numero}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        <MapController center={center} zoom={zoom} selectedDefunto={selectedDefunto} />
      </MapContainer>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black/50 -z-10" onClick={() => setIsFullscreen(false)} />
      )}
    </Card>
  );
}