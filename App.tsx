
import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  PlayerState, 
  RideOffer, 
  ShiftType, 
  GameLog 
} from './types';
import { 
  INITIAL_STATE, 
  CARS, 
  SHIFT_CONFIG, 
  FOOD_ENERGY,
  getPriorityLevel
} from './constants';
import { generatePassengerData } from './geminiService';
import { StatsPanel } from './components/StatsPanel';
import { Button } from './components/Button';
import { Minimap } from './components/Minimap';
import { 
  MapPin, 
  CarFront, 
  PlayCircle, 
  Clock,
  Navigation,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Zap,
  ArrowLeft,
  Moon,
  Sun,
  LogOut,
  Flame,
  ShieldAlert,
  Fuel,
  Gauge,
  BedDouble,
  CheckCircle2,
  Wallet,
  Sunrise,
  MoonStar,
  CloudSun
} from 'lucide-react';

export default function App() {
  // --- State ---
  const [player, setPlayer] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('taxi_save_yandex_v3');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [activeShift, setActiveShift] = useState<ShiftType | null>(null);
  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bonusOfferAvailable, setBonusOfferAvailable] = useState(false);
  
  // UI States
  const [activeSheet, setActiveSheet] = useState<'MENU' | 'SHIFT_SELECT' | 'SEARCHING' | 'OFFER' | 'DRIVING' | 'GARAGE' | 'RESULT' | 'RIDE_COMPLETE'>('MENU');
  const [activeShiftStats, setActiveShiftStats] = useState({ money: 0, rides: 0 });
  const [lastRideStats, setLastRideStats] = useState({ money: 0, rating: 0 });

  // Refs for async logic
  const activeSheetRef = useRef(activeSheet);

  // Yandex SDK State
  const [ysdk, setYsdk] = useState<any>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('taxi_save_yandex_v3', JSON.stringify(player));
  }, [player]);

  useEffect(() => {
    activeSheetRef.current = activeSheet;
  }, [activeSheet]);

  // Initialize Yandex SDK
  useEffect(() => {
    if (window.YaGames) {
      window.YaGames.init().then((sdk: any) => {
        console.log('Yandex SDK initialized');
        setYsdk(sdk);
        window.ysdk = sdk;
      });
    }
  }, []);

  // Auto-dismiss logs
  useEffect(() => {
    if (logs.length > 0) {
      const timer = setTimeout(() => {
        setLogs(prev => prev.slice(1));
      }, 2500); // Disappear after 2.5s
      return () => clearTimeout(timer);
    }
  }, [logs]);

  // --- Helpers ---
  const addLog = (message: string, type: GameLog['type'] = 'info') => {
    const id = Date.now().toString();
    setLogs(prev => [...prev.slice(-2), { id, message, type }]); // Keep max 3 logs
  };

  const getCar = (id: string) => CARS.find(c => c.id === id) || CARS[0];
  const currentCar = getCar(player.currentCarId);

  // --- Core Logic ---

  const handleStartDay = () => {
    if (player.energy <= 10) {
      addLog("Слишком устал! Поешь или закончи смену.", "warning");
      return;
    }
    setActiveSheet('SHIFT_SELECT');
  };

  const startShift = (type: ShiftType) => {
    setActiveShift(type);
    setActiveShiftStats({ money: 0, rides: 0 });
    setActiveSheet('SEARCHING');
    generateOffer(type);
  };

  const generateOffer = async (shiftType: ShiftType, isBonus: boolean = false) => {
    if (player.energy <= 5 && !isBonus) {
      endShift("Сил больше нет! Смена окончена.");
      return;
    }

    // Artificial delay for "Searching" realism
    if (!isBonus) await new Promise(r => setTimeout(r, 2000));

    // CRITICAL FIX: Check if we are still searching before showing offer
    // If user clicked Stop (moved to RESULT), abort.
    if (!isBonus && activeSheetRef.current !== 'SEARCHING') {
      return;
    }

    const config = SHIFT_CONFIG[shiftType];
    const baseDistance = 2 + Math.random() * 15;
    const distanceKm = parseFloat(baseDistance.toFixed(1));
    
    // --- Pricing Logic ---
    const priority = getPriorityLevel(player.totalRides);
    const priorityMult = priority.config.multiplier;
    const ratingMult = Math.max(0.5, 1 + (player.rating - 4.7) * 0.5);

    let basePrice = (50 + (distanceKm * 25)) * config.multiplier;
    
    // Bonus offer is always juicy
    if (isBonus) {
      basePrice *= 1.5;
    }

    const finalPrice = Math.floor(basePrice * priorityMult * ratingMult);

    let flavor = { name: 'Пассажир', story: 'Ждет такси', destination: 'Центр' };
    try {
      flavor = await generatePassengerData(config.label);
    } catch (e) {
      console.warn("AI skipped");
    }

    const offer: RideOffer = {
      id: Date.now().toString(),
      distanceKm,
      price: finalPrice,
      basePrice: Math.floor(basePrice),
      ratingReward: isBonus ? 0.1 : 0.05,
      commission: config.commission,
      passengerName: flavor.name,
      passengerStory: isBonus ? "🔥 Срочный заказ! Доплачу." : flavor.story,
      destination: flavor.destination,
      isHighDemand: isBonus || shiftType === ShiftType.MORNING || shiftType === ShiftType.EVENING
    };

    setCurrentOffer(offer);
    
    if (!isBonus) {
        setActiveSheet('OFFER');
    } else {
        setActiveSheet('OFFER');
    }
  };

  const acceptRide = () => {
    if (!currentOffer || !activeShift) return;
    
    setIsDriving(true);
    setActiveSheet('DRIVING');
    
    const durationMs = 2500; 
    
    setTimeout(() => {
      completeRide();
    }, durationMs);
  };

  const completeRide = () => {
    if (!currentOffer || !activeShift) return;

    const car = getCar(player.currentCarId);
    const fuelCost = currentOffer.distanceKm * (car.fuelConsumption / 10); 
    const grossEarnings = currentOffer.price;
    const platformFee = Math.floor(grossEarnings * currentOffer.commission);
    const netEarnings = grossEarnings - platformFee - Math.floor(fuelCost);
    const ratingChange = currentOffer.ratingReward;

    setPlayer(prev => ({
      ...prev,
      money: prev.money + netEarnings,
      rating: Math.min(5.0, prev.rating + ratingChange),
      energy: Math.max(0, prev.energy - Math.floor(fuelCost * 2)),
      totalRides: (prev.totalRides || 0) + 1
    }));

    setActiveShiftStats(prev => ({
      money: prev.money + netEarnings,
      rides: prev.rides + 1
    }));
    
    setLastRideStats({
        money: netEarnings,
        rating: ratingChange
    });

    setIsDriving(false);
    setCurrentOffer(null);

    // Go to "Completed" screen instead of jumping immediately
    setActiveSheet('RIDE_COMPLETE');
  };

  const handleRideCompleteNext = () => {
    // If this was a bonus offer, go back to result sheet logic
    if (bonusOfferAvailable) {
      setBonusOfferAvailable(false);
      setActiveSheet('RESULT');
    } else {
      // Normal flow
      setActiveSheet('SEARCHING');
      setTimeout(() => {
          if (activeShift) generateOffer(activeShift);
      }, 1000);
    }
  };

  const declineRide = () => {
    // If declining bonus offer, just go to result
    if (bonusOfferAvailable) {
      setBonusOfferAvailable(false);
      setActiveSheet('RESULT');
      return;
    }

    const penalty = 0.2; 
    setPlayer(prev => ({
      ...prev,
      rating: Math.max(1.0, prev.rating - penalty)
    }));
    addLog(`Рейтинг снижен (-${penalty})`, 'error');
    setCurrentOffer(null);
    setActiveSheet('SEARCHING');
    
    // Quick re-roll
    setTimeout(() => {
      if (activeShift) generateOffer(activeShift);
    }, 1000);
  };

  const endShift = (reason: string) => {
    // Chance for a bonus order!
    const hasEnergy = player.energy > 15;
    const roll = Math.random();
    
    if (hasEnergy && roll > 0.6) { // 40% chance
      setBonusOfferAvailable(true);
    } else {
      setBonusOfferAvailable(false);
    }

    setCurrentOffer(null);
    setActiveSheet('RESULT');
    addLog(reason, 'info');
  };

  const triggerBonusOffer = () => {
    if (activeShift) {
      // Stay in 'RESULT' visually until offer generates, then switching to OFFER
      generateOffer(activeShift, true);
    }
  };

  const sleep = () => {
    const car = getCar(player.currentCarId);
    let rentCost = 0;
    if (player.isRenting) {
      rentCost = car.rentPrice;
    }

    setPlayer(prev => ({
      ...prev,
      money: prev.money - rentCost,
      energy: 100,
      day: prev.day + 1
    }));
    
    setActiveShift(null);
    setActiveSheet('MENU');
    setBonusOfferAvailable(false);
    
    if (player.money - rentCost < 0) {
       addLog(`Долг за аренду! (-${rentCost}₽)`, 'error');
    } else {
       addLog(`Аренда списана: -${rentCost}₽`, 'info');
    }
  };

  const buyCar = (car: Car) => {
    if (player.money >= car.price) {
      setPlayer(prev => ({
        ...prev,
        money: prev.money - car.price,
        ownedCarIds: [...prev.ownedCarIds, car.id],
        currentCarId: car.id,
        isRenting: false
      }));
    }
  };

  const rentCar = (car: Car) => {
    setPlayer(prev => ({
      ...prev,
      currentCarId: car.id,
      isRenting: true
    }));
  };

  const handleWatchAd = () => {
    const reward = () => {
      setPlayer(p => ({...p, energy: Math.min(100, p.energy + 40)}));
      addLog("+40 Энергии", "success");
    };

    if (ysdk) {
      ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => console.log('Video ad open.'),
          onRewarded: () => {
            reward();
          },
          onClose: () => console.log('Video ad closed.'),
          onError: (e: any) => {
            console.log('Error while open video ad:', e);
            reward();
          }
        }
      });
    } else {
      reward();
    }
  };

  const SafeCarImage = ({ car, className }: { car: Car, className: string }) => {
    return (
        <img 
            src={car.image} 
            className={className} 
            alt={car.name}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
        />
    );
  };
  
  const CarPlaceholder = ({ car }: { car: Car }) => (
      <div className={`hidden absolute inset-0 flex items-center justify-center p-2 text-center text-xs font-bold uppercase tracking-widest opacity-80`} style={{ backgroundColor: car.color, color: car.textColor }}>
          {car.name}
      </div>
  );

  // --- Render Components ---

  const renderMapBackground = () => (
    <div className="absolute inset-0 z-0">
      <Minimap 
        distance={currentOffer?.distanceKm || 0} 
        isDriving={isDriving} 
        isNightMode={isNightMode}
        className="h-full w-full"
      />
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${isNightMode ? 'bg-indigo-950/60 mix-blend-multiply' : 'bg-transparent'}`}></div>
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b pointer-events-none ${isNightMode ? 'from-slate-900/90 to-transparent' : 'from-white/90 to-transparent'}`}></div>
    </div>
  );

  const renderMenuSheet = () => (
    <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] z-20 pb-safe-bottom animate-in slide-in-from-bottom duration-300 ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white text-black'}`}>
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-6"></div>
      
      <div className="absolute top-[-50px] right-4 flex gap-2">
         <button onClick={() => setIsNightMode(!isNightMode)} className={`p-2 rounded-full shadow-lg border transition-colors ${isNightMode ? 'bg-slate-800 border-slate-700 text-yellow-300' : 'bg-white border-gray-100 text-indigo-600'}`}>
            {isNightMode ? <Sun size={20} /> : <Moon size={20} />}
         </button>
      </div>
      
      <div className="px-5 pb-8 space-y-4">
        <div 
          onClick={() => setActiveSheet('GARAGE')}
          className={`flex items-center gap-4 p-4 rounded-2xl border active:opacity-90 transition-colors ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}
        >
          <div className="w-16 h-10 rounded-md overflow-hidden relative bg-gray-200">
             <SafeCarImage car={currentCar} className="w-full h-full object-cover" />
             <CarPlaceholder car={currentCar} />
          </div>
          <div className="flex-1">
             <div className="font-bold text-lg">{currentCar.name}</div>
             <div className={`text-xs ${isNightMode ? 'text-gray-400' : 'text-gray-500'}`}>{player.isRenting ? `Аренда ${currentCar.rentPrice}₽/день` : 'Ваш автомобиль'}</div>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>

        <Button variant="primary" fullWidth className="py-5 text-lg shadow-xl shadow-yellow-400/40 animate-breath" onClick={handleStartDay}>
          <div className="flex flex-col items-center leading-none">
            <span className="font-black text-2xl uppercase tracking-wide">На линию</span>
            <span className="text-[10px] opacity-70 font-medium mt-1">Заработать денег</span>
          </div>
        </Button>

        <Button variant="ad" onClick={handleWatchAd} className="py-4 flex items-center justify-center gap-3 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 border-b-4 border-violet-800">
              <div className="bg-white/20 p-2 rounded-full">
                <PlayCircle size={20} className="fill-white" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-base font-black text-white">+40 ЭНЕРГИИ</span>
                <span className="text-[10px] opacity-90 text-white/80 font-medium tracking-wide">БЕСПЛАТНО ЗА РЕКЛАМУ</span>
              </div>
        </Button>
      </div>
    </div>
  );

  const renderShiftSelectSheet = () => {
    // Styles configuration for each shift card
    const shiftStyles = {
      [ShiftType.MORNING]: {
        gradient: "from-orange-400 to-rose-500",
        icon: <Sunrise size={32} className="text-white drop-shadow-md"/>,
        bgIcon: <Sunrise size={120} className="text-white/10 absolute -right-6 -bottom-6" />,
        borderColor: "border-orange-200",
        ringColor: "group-hover:ring-orange-300"
      },
      [ShiftType.DAY]: {
        gradient: "from-sky-400 to-blue-500",
        icon: <CloudSun size={32} className="text-white drop-shadow-md"/>,
        bgIcon: <Sun size={120} className="text-white/10 absolute -right-6 -bottom-6" />,
        borderColor: "border-sky-200",
        ringColor: "group-hover:ring-sky-300"
      },
      [ShiftType.EVENING]: {
        gradient: "from-indigo-500 to-purple-600",
        icon: <MoonStar size={32} className="text-white drop-shadow-md"/>,
        bgIcon: <MoonStar size={120} className="text-white/10 absolute -right-6 -bottom-6" />,
        borderColor: "border-purple-200",
        ringColor: "group-hover:ring-purple-300"
      }
    };

    return (
      <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl z-30 pb-safe-bottom animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white'}`}>
        <div className={`sticky top-0 pt-3 pb-2 px-5 border-b z-10 flex justify-between items-center ${isNightMode ? 'bg-[#1e2030] border-slate-700' : 'bg-white border-gray-100'}`}>
          <h2 className="font-bold text-xl">Выбор тарифа</h2>
          <button onClick={() => setActiveSheet('MENU')} className={`p-2 rounded-full transition-colors ${isNightMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}><ArrowLeft size={20}/></button>
        </div>
        
        <div className="p-5 space-y-4">
           {Object.values(ShiftType).map((type) => {
              const config = SHIFT_CONFIG[type];
              const styles = shiftStyles[type];
              return (
                <div 
                  key={type} 
                  onClick={() => startShift(type)}
                  className={`group relative overflow-hidden rounded-2xl p-0.5 transition-all cursor-pointer active:scale-[0.98] hover:ring-4 ${styles.ringColor}`}
                >
                   {/* Gradient Border/Background */}
                   <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                   
                   <div className={`relative h-full rounded-[14px] p-5 flex flex-col justify-between overflow-hidden ${isNightMode ? 'bg-slate-900/90' : 'bg-white/95'}`}>
                      {/* Background Icon Decor */}
                      {styles.bgIcon}

                      <div className="flex justify-between items-start mb-3 relative z-10">
                         <div className={`p-3 rounded-xl bg-gradient-to-br ${styles.gradient} shadow-md`}>
                            {styles.icon}
                         </div>
                         <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md">
                           x{config.multiplier}
                         </div>
                      </div>

                      <div className="relative z-10">
                        <h3 className={`font-black text-2xl mb-1 ${isNightMode ? 'text-white' : 'text-slate-800'}`}>{config.label.split('(')[0]}</h3>
                        <div className={`text-sm font-medium opacity-60 mb-3 ${isNightMode ? 'text-gray-300' : 'text-slate-500'}`}>{config.label.split('(')[1]?.replace(')', '')}</div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                           <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider border ${isNightMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                             {config.traffic}
                           </span>
                           <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider border ${isNightMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                             Комиссия {Math.round(config.commission * 100)}%
                           </span>
                        </div>
                        
                        <p className={`text-sm leading-relaxed ${isNightMode ? 'text-gray-400' : 'text-slate-600'}`}>{config.desc}</p>
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      </div>
    );
  };

  const renderSearchingOverlay = () => (
    <div className="absolute bottom-10 left-4 right-4 z-20 animate-in fade-in zoom-in duration-300">
       <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-600 w-10 h-10 rounded-full flex items-center justify-center text-black shadow-lg">
                   <RotateCcw className="animate-spin" size={20} />
                </div>
             </div>
             <div>
                <div className="font-bold">Поиск заказа...</div>
                <div className="text-xs text-slate-400">Находимся в зоне спроса</div>
             </div>
          </div>
          <Button variant="secondary" className="bg-slate-800 text-white border-none py-2 px-4 text-xs h-auto hover:bg-slate-700" onClick={() => endShift("Смена прервана")}>
            Стоп
          </Button>
       </div>
    </div>
  );

  const renderOfferSheet = () => {
    if (!currentOffer) return null;
    const priority = getPriorityLevel(player.totalRides);
    const isHighDemand = currentOffer.isHighDemand;
    const timerKey = currentOffer.id; 

    return (
      <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-40 pb-safe-bottom animate-in slide-in-from-bottom duration-300 overflow-hidden ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white'}`}>
        
        <div className={`h-1.5 w-full ${isNightMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
           <div key={timerKey} className="h-full bg-yellow-500 animate-shrink origin-left"></div>
        </div>

        {isHighDemand && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-1 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1">
             <Flame size={12} className="fill-white" />
             {bonusOfferAvailable ? 'ГОРЯЩИЙ ЗАКАЗ' : 'ВЫСОКИЙ СПРОС'}
          </div>
        )}

        <div className={`flex items-center justify-between px-6 py-5 border-b ${isNightMode ? 'border-slate-700' : 'border-gray-100 bg-white'} ${isHighDemand && !isNightMode ? 'bg-purple-50' : ''}`}>
           <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isHighDemand ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-700'}`}>
                 <Navigation size={24} />
              </div>
              <div>
                 <div className={`text-xs font-medium uppercase ${isNightMode ? 'text-gray-400' : 'text-gray-400'}`}>Заказ</div>
                 <div className={`font-black text-3xl ${isHighDemand ? 'text-purple-500' : (isNightMode ? 'text-white' : 'text-black')}`}>
                   {currentOffer.price} ₽
                 </div>
              </div>
           </div>
           <div className="text-right">
              <div className={`font-bold text-lg ${isNightMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentOffer.distanceKm} км</div>
              <div className="text-xs text-gray-400">~{Math.ceil(currentOffer.distanceKm * 2)} мин</div>
           </div>
        </div>
        
        <div className="px-6 pt-3 flex flex-wrap gap-2">
            {player.rating < 4.7 && (
                <div className="text-[10px] bg-red-900/30 text-red-500 px-2 py-1 rounded-md border border-red-500/20 flex items-center gap-1">
                   <ShieldAlert size={10}/> Рейтинг снизил цену
                </div>
            )}
            {priority.level !== 'BRONZE' && (
                <div className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-md border border-yellow-500/20 flex items-center gap-1">
                   <Zap size={10}/> Бонус статуса "{priority.config.label}"
                </div>
            )}
        </div>

        <div className="px-6 py-4">
           <div className="flex items-start gap-4 mb-4">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${isNightMode ? 'bg-slate-700' : 'bg-gray-100'}`}>👤</div>
               <div>
                  <div className="font-bold text-lg">{currentOffer.passengerName}</div>
                  <div className="text-sm text-gray-500 italic leading-snug">"{currentOffer.passengerStory}"</div>
               </div>
           </div>
           
           <div className={`p-4 rounded-xl flex items-center gap-3 text-sm border mb-6 shadow-sm ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
              <MapPin size={18} className={isNightMode ? 'text-white' : 'text-black fill-black/10'} />
              <span className={`font-medium ${isNightMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentOffer.destination}</span>
           </div>

           <div className="flex gap-3">
              <Button variant="secondary" fullWidth className={`py-4 flex flex-col items-center justify-center gap-1 h-16 ${isNightMode ? 'bg-slate-800 text-white border-slate-700' : ''}`} onClick={declineRide}>
                 <span>Отмена</span>
              </Button>
              <Button 
                  variant="primary" 
                  fullWidth 
                  className={`py-4 shadow-lg flex flex-col items-center justify-center gap-1 h-16 animate-pop ${isHighDemand ? 'shadow-purple-400/40 from-purple-500 to-purple-600 border-purple-700 text-white' : 'shadow-yellow-400/40'}`} 
                  onClick={acceptRide}
              >
                 <span className="text-lg">Поехали</span>
                 <span className={`text-[10px] ${isHighDemand ? 'opacity-80' : 'opacity-60 text-black'}`}>+{currentOffer.ratingReward} Рейтинг</span>
              </Button>
           </div>
        </div>
      </div>
    );
  };

  const renderDrivingOverlay = () => (
    <div className={`absolute bottom-0 left-0 right-0 p-6 rounded-t-3xl shadow-2xl z-30 pb-safe-bottom ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white'}`}>
       <div className="flex items-center justify-between mb-4">
          <div>
             <div className="text-xs text-gray-400 uppercase font-bold mb-1">В пути</div>
             <div className={`font-black text-2xl ${isNightMode ? 'text-white' : 'text-slate-800'}`}>{currentOffer?.destination}</div>
          </div>
          <div className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-lg shadow-sm border-b-2 border-yellow-500">
             {currentOffer?.price} ₽
          </div>
       </div>
       
       <div className={`w-full h-3 rounded-full overflow-hidden shadow-inner ${isNightMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 w-full animate-[width_2.5s_ease-in-out] origin-left scale-x-0" style={{ transform: 'scaleX(1)', transition: 'transform 2.5s linear' }}></div>
       </div>
       <div className="text-center mt-3 text-xs text-gray-400 font-medium">Прибытие через несколько секунд...</div>
    </div>
  );

  const renderRideCompleteOverlay = () => (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300 ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white'}`}>
        <div className="bg-green-100 text-green-600 p-6 rounded-full mb-6 animate-pop">
            <CheckCircle2 size={64} />
        </div>
        <div className="text-center mb-8">
            <h2 className={`text-xl font-medium mb-1 ${isNightMode ? 'text-gray-300' : 'text-gray-500'}`}>Заказ завершён</h2>
            <div className={`text-5xl font-black mb-4 ${isNightMode ? 'text-white' : 'text-slate-900'}`}>
                +{lastRideStats.money} ₽
            </div>
            {lastRideStats.rating > 0 && (
                <div className="inline-flex items-center gap-1 bg-yellow-400/10 text-yellow-600 px-3 py-1 rounded-full font-bold text-sm">
                    <Zap size={14} className="fill-yellow-600"/>
                    +{lastRideStats.rating.toFixed(2)} Рейтинг
                </div>
            )}
        </div>
        
        <Button variant="primary" onClick={handleRideCompleteNext} className="w-full max-w-xs h-14 text-lg animate-breath shadow-lg shadow-yellow-400/20">
            Далее
        </Button>
    </div>
  );

  const renderResultSheet = () => (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300 ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white'}`}>
       
       <h2 className={`text-3xl font-black mb-2 ${isNightMode ? 'text-white' : 'text-slate-900'}`}>Смена завершена</h2>
       
       <div className={`w-full rounded-2xl p-6 mb-6 border shadow-xl ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Выполнено заказов</span>
            <span className="font-bold text-xl">{activeShiftStats.rides}</span>
            </div>
            <div className={`h-px w-full mb-4 ${isNightMode ? 'bg-slate-700' : 'bg-gray-100'}`}></div>
            <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Итоговый заработок</span>
            <span className="font-black text-3xl text-green-500">+{activeShiftStats.money} ₽</span>
            </div>
       </div>

       {bonusOfferAvailable && (
          <div className="w-full bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-4 mb-6 shadow-lg border border-purple-500/50 relative overflow-hidden flex items-center gap-4">
             <div className="bg-purple-800/50 p-3 rounded-full shrink-0 animate-pulse">
                <Flame className="text-purple-300" size={24} />
             </div>
             <div className="flex-1">
                <div className="font-bold text-white leading-tight">Горящий заказ!</div>
                <div className="text-xs text-purple-200">Есть срочный клиент поблизости.</div>
             </div>
             <button onClick={triggerBonusOffer} className="bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-lg border-b-2 border-purple-700 active:border-b-0 active:translate-y-0.5 transition-all">
                Взять
             </button>
             <button onClick={() => setBonusOfferAvailable(false)} className="absolute top-2 right-2 text-purple-400 hover:text-white p-1">
                 ✖
             </button>
          </div>
       )}
       
       <div className="grid grid-cols-2 gap-3 w-full mt-auto">
        <Button variant="secondary" onClick={() => setActiveSheet('MENU')} className={`h-16 flex flex-col items-center justify-center ${isNightMode ? 'bg-slate-800 text-white border-slate-700' : ''}`}>
            <LogOut size={20} className="mb-1 opacity-50"/>
            <span className="text-xs">В меню</span>
        </Button>
        <Button variant="primary" onClick={sleep} className="h-16 flex flex-col items-center justify-center shadow-lg shadow-yellow-400/20">
            <BedDouble size={20} className="mb-1"/>
            <span className="text-xs">Спать (След. день)</span>
        </Button>
       </div>
    </div>
  );

  const renderGarageSheet = () => {
     const getTypeName = (type: string) => {
        switch(type) {
           case 'ECONOMY': return 'Эконом';
           case 'COMFORT': return 'Комфорт';
           case 'BUSINESS': return 'Бизнес';
           case 'LUXURY': return 'Элитный';
           default: return type;
        }
     };

     return (
        <div className={`absolute inset-0 z-50 flex flex-col animate-in slide-in-from-right duration-300 ${isNightMode ? 'bg-[#1e2030] text-white' : 'bg-white text-black'}`}>
           <div className={`px-6 pt-12 pb-4 border-b flex items-center gap-4 sticky top-0 z-10 ${isNightMode ? 'bg-[#1e2030] border-slate-700' : 'bg-white border-gray-100'}`}>
              <button onClick={() => setActiveSheet('MENU')} className={`p-2 -ml-2 rounded-full ${isNightMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}><ArrowLeft /></button>
              <h2 className="text-xl font-bold">Гараж</h2>
              <div className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${isNightMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-100'}`}>{Math.floor(player.money)} ₽</div>
           </div>
           
           <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isNightMode ? 'bg-[#1a1b26]' : 'bg-gray-50'}`}>
              {CARS.map(car => {
                  const isOwned = player.ownedCarIds.includes(car.id) || car.id === 'car_1';
                  const isCurrent = player.currentCarId === car.id;
                  
                  return (
                     <div 
                        key={car.id} 
                        className={`p-4 rounded-2xl shadow-sm border-2 transition-all relative overflow-hidden`}
                        style={{
                           backgroundColor: isNightMode ? '#24283b' : 'white',
                           borderColor: isCurrent ? '#FACC15' : (isNightMode ? '#334155' : 'transparent'),
                        }}
                     >
                        <div 
                           className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none"
                           style={{ backgroundColor: car.color }}
                        ></div>

                        <div className="aspect-video w-full rounded-xl mb-4 overflow-hidden relative group shadow-inner bg-gray-200">
                           <SafeCarImage car={car} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           <CarPlaceholder car={car} />

                           {isCurrent && <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm">ВЫБРАНА</div>}
                           <div 
                              className="absolute bottom-2 left-2 backdrop-blur text-[10px] px-2 py-1 rounded font-bold shadow-sm"
                              style={{ backgroundColor: car.color, color: car.textColor }}
                           >
                              {getTypeName(car.type)}
                           </div>
                        </div>
                        
                        <div className="mb-4 relative">
                           <div className="font-bold text-lg mb-2">{car.name}</div>
                           
                           <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                 <Fuel size={12} className="text-gray-400"/>
                                 <div className="w-16 text-gray-500">Расход</div>
                                 <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isNightMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.max(10, 100 - (car.fuelConsumption * 4))}%` }}></div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                 <Gauge size={12} className="text-gray-400"/>
                                 <div className="w-16 text-gray-500">Скорость</div>
                                 <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isNightMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(car.speed / 2.5) * 100}%` }}></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                        
                        {isOwned ? (
                           <Button 
                              variant={isCurrent ? 'secondary' : 'primary'} 
                              fullWidth 
                              disabled={isCurrent}
                              onClick={() => setPlayer(p => ({...p, currentCarId: car.id, isRenting: false}))}
                              className={`py-3 text-sm ${isNightMode && isCurrent ? 'bg-slate-700 text-gray-400 border-slate-600' : ''}`}
                           >
                              {isCurrent ? 'Используется' : 'Выбрать'}
                           </Button>
                        ) : (
                           <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" className={`text-xs py-3 font-bold ${isNightMode ? 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700' : ''}`} disabled={player.money < car.price} onClick={() => buyCar(car)}>
                                 Купить {car.price}₽
                              </Button>
                              {car.rentPrice > 0 && (
                                 <Button variant="primary" className="text-xs py-3" onClick={() => rentCar(car)}>
                                    Аренда {car.rentPrice}₽
                                 </Button>
                              )}
                           </div>
                        )}
                     </div>
                  )
              })}
           </div>
        </div>
     );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 font-sans">
      <div className="w-full max-w-md h-[100dvh] flex flex-col overflow-hidden relative shadow-2xl bg-white">
        
        {renderMapBackground()}

        <StatsPanel player={player} currentCar={currentCar} />

        {activeSheet === 'MENU' && renderMenuSheet()}
        {activeSheet === 'SHIFT_SELECT' && renderShiftSelectSheet()}
        {activeSheet === 'SEARCHING' && renderSearchingOverlay()}
        {activeSheet === 'OFFER' && renderOfferSheet()}
        {activeSheet === 'DRIVING' && renderDrivingOverlay()}
        {activeSheet === 'RIDE_COMPLETE' && renderRideCompleteOverlay()}
        {activeSheet === 'GARAGE' && renderGarageSheet()}
        {activeSheet === 'RESULT' && renderResultSheet()}

        <div className="absolute top-24 left-4 right-4 z-50 pointer-events-none flex flex-col items-center gap-2">
           {logs.map(log => (
               <div key={log.id} className={`
                  text-white text-xs px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 font-bold flex items-center gap-2
                  ${log.type === 'error' ? 'bg-red-500' : log.type === 'success' ? 'bg-green-500' : 'bg-slate-800/90 backdrop-blur'}
               `}>
                   {log.type === 'error' && <ShieldAlert size={14}/>}
                   {log.type === 'success' && <Zap size={14}/>}
                   {log.message}
               </div>
           ))}
        </div>

      </div>
    </div>
  );
}
