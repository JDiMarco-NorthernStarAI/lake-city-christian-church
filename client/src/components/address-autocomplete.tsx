import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface AddressComponents {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: AddressComponents;
  onChange: (components: AddressComponents) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
}

let googleScriptLoaded = false;
let googleScriptLoading = false;
let loadCallbacks: (() => void)[] = [];

function loadGooglePlaces(apiKey: string): Promise<void> {
  if (googleScriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    if (googleScriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    googleScriptLoading = true;
    loadCallbacks.push(resolve);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleScriptLoaded = true;
      googleScriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks = [];
    };
    script.onerror = () => {
      googleScriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks = [];
    };
    document.head.appendChild(script);
  });
}

function parsePlace(place: google.maps.places.PlaceResult): AddressComponents {
  const components = place.address_components || [];
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zip = "";

  for (const c of components) {
    const types = c.types;
    if (types.includes("street_number")) streetNumber = c.long_name;
    else if (types.includes("route")) route = c.long_name;
    else if (types.includes("locality")) city = c.long_name;
    else if (types.includes("sublocality_level_1") && !city) city = c.long_name;
    else if (types.includes("administrative_area_level_1")) state = c.short_name;
    else if (types.includes("postal_code")) zip = c.long_name;
  }

  return {
    address: [streetNumber, route].filter(Boolean).join(" "),
    city,
    state,
    zip,
  };
}

export default function AddressAutocomplete({ value, onChange, className = "", inputClassName = "", required = false }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/v1/auth/config")
      .then(r => r.json())
      .then(res => {
        if (res.data?.googlePlacesApiKey) {
          setApiKey(res.data.googlePlacesApiKey);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    loadGooglePlaces(apiKey).then(() => setLoaded(true));
  }, [apiKey]);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.address_components) {
      const parsed = parsePlace(place);
      onChange(parsed);
    }
  }, [onChange]);

  useEffect(() => {
    if (!loaded || !inputRef.current || !window.google) return;
    if (autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components"],
    });
    ac.addListener("place_changed", handlePlaceChanged);
    autocompleteRef.current = ac;
  }, [loaded, handlePlaceChanged]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Input
          ref={inputRef}
          placeholder="Start typing your address..."
          value={value.address}
          onChange={e => onChange({ ...value, address: e.target.value })}
          className={inputClassName}
          required={required}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          placeholder="City"
          value={value.city}
          onChange={e => onChange({ ...value, city: e.target.value })}
          className={inputClassName}
        />
        <Input
          placeholder="State"
          value={value.state}
          onChange={e => onChange({ ...value, state: e.target.value })}
          className={inputClassName}
        />
        <Input
          placeholder="ZIP"
          value={value.zip}
          onChange={e => onChange({ ...value, zip: e.target.value })}
          className={inputClassName}
        />
      </div>
    </div>
  );
}
