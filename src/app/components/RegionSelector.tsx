import { useState } from 'react';
import { ChevronDown, MapPin, X } from 'lucide-react';
import { regions, formatRegion } from '../data/regions';

interface RegionSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  placeholder?: string;
  /** 모달 안에서 열 때 fixed 레이어로 다른 z-index 위에 표시 */
  layout?: 'inline' | 'modal';
}

export function RegionSelector({
  selectedCity,
  selectedDistrict,
  onCityChange,
  onDistrictChange,
  placeholder = '지역을 선택해주세요',
  layout = 'inline',
}: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'city' | 'district'>('city');

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setStep('district');
  };

  const handleDistrictSelect = (district: string) => {
    onDistrictChange(district);
    setIsOpen(false);
    setStep('city');
  };

  const handleReset = () => {
    onCityChange('');
    onDistrictChange('');
    setStep('city');
  };

  const selectedRegion = regions.find(r => r.city === selectedCity);

  return (
    <div className="relative">
      {/* 선택된 지역 표시 또는 선택 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className={selectedCity && selectedDistrict ? 'text-gray-900' : 'text-gray-400'}>
            {selectedCity && selectedDistrict 
              ? formatRegion(selectedCity, selectedDistrict)
              : placeholder
            }
          </span>
        </div>
        {selectedCity && selectedDistrict ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <>
          <div
            className={
              layout === 'modal'
                ? 'fixed inset-0 z-[110] bg-black/25'
                : 'fixed inset-0 z-40'
            }
            onClick={() => {
              setIsOpen(false);
              setStep('city');
            }}
          />
          <div
            className={
              layout === 'modal'
                ? 'fixed bottom-6 left-1/2 z-[120] w-[min(100%-2rem,28rem)] max-h-[55vh] -translate-x-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl'
                : 'absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-white shadow-lg'
            }
          >
            {step === 'city' ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                  시/도 선택
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {regions.map((region) => (
                    <button
                      type="button"
                      key={region.city}
                      onClick={() => handleCitySelect(region.city)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedCity === region.city
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {region.city}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b">
                  <button
                    type="button"
                    onClick={() => setStep('city')}
                    className="text-sm text-orange-500 font-medium"
                  >
                    ← {selectedCity}
                  </button>
                  <span className="text-xs text-gray-500">구/군 선택</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRegion?.districts.map((district) => (
                    <button
                      type="button"
                      key={district}
                      onClick={() => handleDistrictSelect(district)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        selectedDistrict === district
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
