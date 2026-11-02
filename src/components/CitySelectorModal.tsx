import React, { useState } from 'react';
import { MapPin, Search, X, Check, Compass, Building2, AlertCircle, Loader2, ChevronRight, Layers } from 'lucide-react';
import { POPULAR_CITIES, REGIONAL_CITIES } from '../data/citiesData';
import { TrussetsLogo } from './TrussetsLogo';
import { detectUserLocation } from '../utils/geolocation';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const [detectError, setDetectError] = useState(false);
  
  // Extract currently active city base name
  const currentBaseCity = (selectedCity && selectedCity !== 'Select Location')
    ? (POPULAR_CITIES.find(c => selectedCity.toLowerCase().includes(c.name.toLowerCase()))?.name || POPULAR_CITIES[0].name)
    : POPULAR_CITIES[0].name;

  const [activeCityTab, setActiveCityTab] = useState<string>(currentBaseCity);
  const [accuracyInfo, setAccuracyInfo] = useState<{ accuracy: number; isApproximate: boolean } | null>(null);

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setDetectError(false);
    setAccuracyInfo(null);
    setDetectMessage('Accessing high-accuracy GPS coordinates & reverse geocoding...');

    try {
      const location = await detectUserLocation();
      setIsDetecting(false);
      
      const displayName = location.displayName || location.city;
      const resolvedCity = location.city && location.city !== 'Current Location' ? location.city : displayName;

      setAccuracyInfo({
        accuracy: Math.round(location.accuracy),
        isApproximate: location.isApproximate,
      });

      const matchedTab = POPULAR_CITIES.find(c => c.name.toLowerCase() === resolvedCity.toLowerCase());
      if (matchedTab) {
        setActiveCityTab(matchedTab.name);
      }

      if (location.isApproximate) {
        setDetectMessage(`Approximate location detected: ${displayName} (~${Math.round(location.accuracy)}m radius) • Showing properties in ${resolvedCity}.`);
      } else {
        setDetectMessage(`Exact location detected: ${displayName} (~${Math.round(location.accuracy)}m accuracy) • Showing properties in ${resolvedCity}.`);
      }

      onSelectCity(resolvedCity);
    } catch (err: any) {
      setIsDetecting(false);
      setDetectError(true);
      setDetectMessage(err.message || 'Location permission is required to detect your current location. You can also select your location manually.');
    }
  };

  // Find active city object for place-wise list
  const activeCityObj = POPULAR_CITIES.find(c => c.name.toLowerCase() === activeCityTab.toLowerCase()) || POPULAR_CITIES[0];

  // Search across cities and all places
  const allPlacesFlattened = POPULAR_CITIES.flatMap(city => 
    (city.places || []).map(place => ({
      place,
      cityName: city.name,
      state: city.state,
      combined: `${place}, ${city.name}`
    }))
  );

  const matchedPlaces = searchTerm.trim() 
    ? allPlacesFlattened.filter(p => 
        p.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cityName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredPopular = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.places || []).some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Flatten regional cities
  const allRegionalList = Object.entries(REGIONAL_CITIES).flatMap(([region, cities]) => 
    cities.map(cityName => ({ cityName, region }))
  );

  const filteredRegional = allRegionalList.filter((item) =>
    item.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPlace = (cityName: string, placeName?: string) => {
    if (placeName && placeName !== 'All Places') {
      onSelectCity(`${cityName} (${placeName})`);
    } else {
      onSelectCity(cityName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="city-selector-modal"
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#540B16] text-white">
          <div>
            <div className="mb-1.5">
              <TrussetsLogo size="sm" variant="white" />
            </div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300" />
              Select Location: City & Place-wise
            </h2>
            <p className="text-xs text-red-100/80 mt-0.5">
              Browse authentic direct-owner listings by micro-market, locality, or entire city
            </p>
          </div>
          <button
            id="close-city-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto Detect & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="auto-detect-gps-btn"
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-dashed border-[#77101F] hover:bg-red-50 text-[#77101F] font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isDetecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#77101F]" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-[#77101F]" />
              )}
              <span>{isDetecting ? 'Accessing High Accuracy GPS...' : 'Use Current Location'}</span>
            </button>

            {accuracyInfo?.isApproximate && (
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={isDetecting}
                className="px-3.5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                title="Re-query device GPS with high accuracy"
              >
                Improve Location Accuracy / Detect Again
              </button>
            )}
          </div>

          {detectMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-start justify-between gap-2 ${
              detectError ? 'bg-red-50 text-red-800 border border-red-200' : (accuracyInfo?.isApproximate ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200')
            }`}>
              <div className="flex items-start gap-2">
                {detectError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                ) : accuracyInfo?.isApproximate ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                ) : (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span className="leading-snug">{detectMessage}</span>
              </div>
              {!detectError && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 shrink-0 cursor-pointer shadow-2xs ml-2"
                >
                  Done
                </button>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by city, town, or place (e.g. Kokapet, Gachibowli, Whitefield, Bandra)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77101F]"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* If user is typing search query, prioritize matched places and cities */}
          {searchTerm.trim() ? (
            <div className="space-y-4">
              {matchedPlaces.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#77101F]" />
                    <span>Matching Localities & Places ({matchedPlaces.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedPlaces.slice(0, 10).map((item) => (
                      <button
                        key={`${item.cityName}-${item.place}`}
                        onClick={() => handleSelectPlace(item.cityName, item.place)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-[#77101F] hover:bg-red-50/60 text-left transition-all cursor-pointer"
                      >
                        <div>
                          <span className="block text-xs font-bold text-slate-900">{item.place}</span>
                          <span className="text-[11px] text-slate-500">{item.cityName}, {item.state}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredPopular.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Matching Cities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredPopular.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleSelectPlace(city.name)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-[#77101F] hover:bg-red-50/50 text-left text-xs transition-all cursor-pointer"
                      >
                        <span className="block font-bold text-slate-900">{city.name}</span>
                        <span className="text-[10px] text-slate-400">{city.state}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedPlaces.length === 0 && filteredPopular.length === 0 && filteredRegional.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No direct place or city found for "{searchTerm}". You can pick from the major hubs below.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* City Selection Pills */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#77101F]" />
                    <span>Select City</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Click a city to view place-wise localities</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((c) => {
                    const isTabActive = activeCityTab.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.name}
                        onClick={() => setActiveCityTab(c.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isTabActive
                            ? 'bg-[#77101F] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Place-wise Micro-Markets for Selected City */}
              {activeCityObj && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#77101F]" />
                        <span>Place-wise Localities in {activeCityObj.name}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose a specific micro-market or view the entire city
                      </p>
                    </div>

                    {/* Button for Entire City */}
                    <button
                      onClick={() => handleSelectPlace(activeCityObj.name)}
                      className="px-3 py-1.5 bg-white border border-[#77101F] hover:bg-red-50 text-[#77101F] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      All {activeCityObj.name}
                    </button>
                  </div>

                  {activeCityObj.places && activeCityObj.places.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {activeCityObj.places.map((place) => {
                        const isCurrentSelection = selectedCity.toLowerCase().includes(place.toLowerCase());
                        return (
                          <button
                            key={place}
                            onClick={() => handleSelectPlace(activeCityObj.name, place)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isCurrentSelection
                                ? 'bg-red-50 border-[#77101F] text-[#77101F] font-bold shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-800 font-medium'
                            }`}
                          >
                            <span className="truncate">{place}</span>
                            {isCurrentSelection && <Check className="w-3.5 h-3.5 text-[#77101F] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Regional Districts */}
              {filteredRegional.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Other Regional Districts & Towns
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {filteredRegional.slice(0, 20).map((item) => (
                      <button
                        key={`${item.region}-${item.cityName}`}
                        onClick={() => handleSelectPlace(item.cityName)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs text-slate-700 truncate cursor-pointer"
                      >
                        {item.cityName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Current Selection: <strong className="text-[#77101F]">{selectedCity}</strong>
          </div>
          <div className="flex items-center gap-3">
            {activeCityObj && (
              <button
                onClick={() => handleSelectPlace(activeCityObj.name)}
                className="text-[11px] text-slate-600 hover:text-[#77101F] font-semibold underline cursor-pointer"
              >
                All {activeCityObj.name}
              </button>
            )}
            <button
              onClick={() => {
                onSelectCity('All Cities');
                onClose();
              }}
              className="text-[11px] text-slate-500 hover:text-[#77101F] underline cursor-pointer"
            >
              Show All Cities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
