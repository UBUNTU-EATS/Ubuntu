import React, { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "400px" };
const origin = { lat: -26.2041, lng: 28.0473 };  // Supermarket
const destination = { lat: -26.2100, lng: 28.0400 }; // NGO

const MapWithDistance = () => {
  const [distance, setDistance] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDQ9fs_fzZaPY74GoAEe12vAxJmITjXzUE",
    libraries: ["places"],
  });

  const onLoad = (map) => {
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      { origins: [origin], destinations: [destination], travelMode: window.google.maps.TravelMode.DRIVING },
      (response, status) => {
        if (status === "OK") {
          const element = response.rows[0].elements[0];
          setDistance(element.distance.text);
        } else {
          console.error("DistanceMatrix error:", status);
        }
      }
    );
  };

  return isLoaded ? (
    <div>
      <h3>Distance: {distance || "Calculating..."}</h3>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={origin}
        zoom={13}
        onLoad={onLoad}
      >
        <Marker position={origin} title="Supermarket" />
        <Marker position={destination} title="NGO" />
      </GoogleMap>
    </div>
  ) : (
    <p>Loading Map...</p>
  );
};

export default MapWithDistance;
