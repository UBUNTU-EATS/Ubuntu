// src/components/RouteMap.jsx
import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer, Polyline } from "@react-google-maps/api";

const RouteMap = ({
  origin,
  destination,
  originLabel = "Start",
  destinationLabel = "End",



  originIcon = "📍",
  destinationIcon = "🏪",
  mapContainerStyle = { width: "100%", height: "300px" },
  zoom = 14,
  showRouteInfo = true,
  autoShowRoute = false,
  apiKey = "AIzaSyDGsQG8-0j79bK3_fzM_gCyt90IpIOvmd8",
  onRouteCalculated = null,
  className = "",
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const [directions, setDirections] = useState(null);
  const [fallbackRoute, setFallbackRoute] = useState(null);
  const [showRoute, setShowRoute] = useState(autoShowRoute);
  const [routeInfo, setRouteInfo] = useState(null);
  const [error, setError] = useState(null);

  // Calculate straight-line distance
  const calculateDistance = (start, end) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  // Generate realistic road-following route approximation
  const generateRoadApproximation = (start, end) => {
    const path = [];
    const steps = 12; // More steps for smoother curves
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      
      let lat = start.lat + (end.lat - start.lat) * ratio;
      let lng = start.lng + (end.lng - start.lng) * ratio;
      
      // Add road-like deviations
      if (i > 0 && i < steps) {
        const deviation = 0.0008;
        // Create more realistic road curves
        lat += Math.sin(ratio * Math.PI * 4) * deviation * (0.5 + Math.random() * 0.5);
        lng += Math.cos(ratio * Math.PI * 3) * deviation * (0.5 + Math.random() * 0.5);
        
        // Add some grid-like movements to simulate city streets
        if (i % 3 === 0) {
          lat += Math.random() * 0.0005 - 0.00025;
          lng += Math.random() * 0.0005 - 0.00025;
        }
      }
      
      path.push({ lat, lng });
    }
    
    return path;
  };

  const calculateRoute = () => {
    if (!isLoaded || !origin || !destination) return;

    setError(null);
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'ZA',
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          
          // Extract route information
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const info = {
            distance: leg.distance.text,
            duration: leg.duration.text,
            isRealRoute: true
          };
          
          setRouteInfo(info);
          
          if (onRouteCalculated) {
            onRouteCalculated(info);
          }
          
          console.log('Real route calculated successfully');
        } else {
          console.error(`Directions request failed: ${status}`);
          setError(`Route calculation failed: ${status}`);
          
          // Generate fallback route
          const roadPath = generateRoadApproximation(origin, destination);
          setFallbackRoute(roadPath);
          
          const straightDistance = calculateDistance(origin, destination);
          const approxDrivingDistance = (parseFloat(straightDistance) * 1.3).toFixed(1); // Estimate 30% longer for roads
          
          const info = {
            distance: `~${approxDrivingDistance} km`,
            duration: `~${Math.ceil(approxDrivingDistance * 2)} min`,
            isRealRoute: false
          };
          
          setRouteInfo(info);
          
          if (onRouteCalculated) {
            onRouteCalculated(info);
          }
          
          console.log('Using fallback route approximation');
        }
      }
    );
  };

  useEffect(() => {
    calculateRoute();
  }, [isLoaded, origin, destination]);

  const toggleRouteVisibility = () => {
    setShowRoute(!showRoute);
  };

  const getMapCenter = () => {
    if (!origin || !destination) return origin || { lat: -26.2041, lng: 28.0473 };
    
    return {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    };
  };

  if (!isLoaded) {
    return <div className={`route-map-loading ${className}`}>Loading map...</div>;
  }

  if (!origin || !destination) {
    return <div className={`route-map-error ${className}`}>Invalid locations provided</div>;
  }

  return (
    <div className={`route-map-container ${className}`}>
      {showRouteInfo && routeInfo && (
        <div className="route-info" style={{
          backgroundColor: '#f3f4f6',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Distance:</strong> {routeInfo.distance} | 
              <strong> Duration:</strong> {routeInfo.duration}
              {!routeInfo.isRealRoute && (
                <span style={{ color: '#f59e0b', fontSize: '12px' }}> (Estimated)</span>
              )}
            </div>
            <button 
              onClick={toggleRouteVisibility}
              style={{
                backgroundColor: showRoute ? '#ef4444' : '#2563eb',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {showRoute ? 'Hide' : 'Show'} Route
            </button>
          </div>
        </div>
      )}
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getMapCenter()}
        zoom={zoom}
      >
        {/* Origin marker */}
        <Marker 
          position={origin} 
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="3"/>
                <text x="16" y="22" text-anchor="middle" fill="white" font-size="16">${originIcon}</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }}
          title={originLabel}
        />
        
        {/* Destination marker */}
        <Marker 
          position={destination} 
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="3"/>
                <text x="16" y="22" text-anchor="middle" fill="white" font-size="16">${destinationIcon}</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }}
          title={destinationLabel}
        />
        
        {/* Google Directions route */}
        {showRoute && directions && (
          <DirectionsRenderer 
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#2563EB",
                strokeWeight: 6,
                strokeOpacity: 0.8,
                geodesic: false,
              },
              preserveViewport: false,
            }}
          />
        )}
        
        {/* Fallback route */}
        {showRoute && !directions && fallbackRoute && (
          <Polyline 
            path={fallbackRoute}
            options={{
              strokeColor: "#F59E0B",
              strokeWeight: 5,
              strokeOpacity: 0.7,
              geodesic: false,
            }}
          />
        )}
      </GoogleMap>
      
      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '5px',
          fontStyle: 'italic'
        }}>
          {error} - Using approximate route
        </div>
      )}
    </div>
  );
};

export default RouteMap;