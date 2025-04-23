import React, { useState, useEffect } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import hotelImage from '../assets/hotel-exterior.jpeg';
import '../styles/theme.css';

interface Interface1Props {
  isActive: boolean;
}

const Interface1: React.FC<Interface1Props> = ({ isActive }) => {
  const { startCall, activeOrders } = useAssistant();
  
  // Track current time for countdown calculations
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className={`absolute w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-10`} 
      id="interface1"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 244, 227, 0.95), rgba(248, 244, 227, 0.95)), url(${hotelImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto h-full flex flex-col items-center justify-start text-gray-800 p-5 pt-10 md:pt-16 overflow-y-auto">
        {/* Active orders status panels */}
        {activeOrders.map((o) => {
          const deadline = new Date(o.requestedAt.getTime() + 60 * 60 * 1000);
          const diffSec = Math.max(Math.ceil((deadline.getTime() - now.getTime()) / 1000), 0);
          if (diffSec <= 0) return null;
          const mins = Math.floor(diffSec / 60).toString().padStart(2, '0');
          const secs = (diffSec % 60).toString().padStart(2, '0');
          return (
            <div key={o.reference} className="card-elegant mb-4 text-gray-800 max-w-sm w-full">
              <p className="text-sm mb-1"><strong>Request Ref:</strong> {o.reference}</p>
              <p className="text-sm mb-1"><strong>Requested At:</strong> {o.requestedAt.toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
              <p className="text-sm mb-1"><strong>Estimated Completion:</strong> {o.estimatedTime}</p>
              <p className="text-sm"><strong>Time Remaining:</strong> {`${mins}:${secs}`}</p>
            </div>
          );
        })}

        <h2 className="text-heading font-bold text-3xl md:text-4xl text-accent mb-2 text-center">Mi Nhon Hotel Mui Ne</h2>
        <p className="text-body text-lg md:text-xl text-center max-w-lg mb-8">Your Personal Digital Butler</p>
        
        {/* Main Call Button */}
        <div className="relative mb-12">
          {/* Ripple Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-interactive animate-[ripple_1.5s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-4 border-interactive/70 animate-[ripple_2s_linear_infinite]"></div>
          
          {/* Main Button */}
          <button 
            id="vapiButton" 
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-interactive text-primary-dark text-body font-bold flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-interactive/30" 
            onClick={startCall}
          >
            <span className="material-icons text-4xl md:text-5xl mb-1">mic</span>
            <span className="text-sm md:text-base font-medium">Press to Call</span>
          </button>
        </div>

        {/* Services Section */}
        <div className="text-center w-full max-w-5xl">
          <div className="flex flex-row flex-wrap justify-center gap-3 text-left mx-auto">
            {/* Accommodations & Comfort */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md w-64">
              <h4 className="font-heading font-medium text-accent border-b border-accent/30 pb-1 mb-2">Accommodations & Comfort</h4>
              <ul className="space-y-1 text-sm text-body">
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Check-in/check-out</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Room extension</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Room information</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Hotel policies</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Wi-Fi & FAQ</span></li>
              </ul>
            </div>

            {/* In-Room Experiences */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md w-64">
              <h4 className="font-heading font-medium text-accent border-b border-accent/30 pb-1 mb-2">In-Room Experiences</h4>
              <ul className="space-y-1 text-sm text-body">
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Dining & Refreshments</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Premium Mini Bar</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Housekeeping Service</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Wake-up Call Service</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Additional amenities</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Technical assistance</span></li>
              </ul>
            </div>

            {/* Reservations & Amenities */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md w-64">
              <h4 className="font-heading font-medium text-accent border-b border-accent/30 pb-1 mb-2">Reservations & Amenities</h4>
              <ul className="space-y-1 text-sm text-body">
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Restaurant reservations</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Spa/massage appointments</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Swimming Pool Access</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Transportation</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Medical Assistance</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Bespoke Assistance</span></li>
              </ul>
            </div>

            {/* Local Discoveries */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md w-64">
              <h4 className="font-heading font-medium text-accent border-b border-accent/30 pb-1 mb-2">Local Discoveries</h4>
              <ul className="space-y-1 text-sm text-body">
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Nearby attractions</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Local restaurants</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Public transportation</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Car rental</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Weather & Events</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Shopping</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Tours</span></li>
              </ul>
            </div>

            {/* Guest Assistance */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md w-64">
              <h4 className="font-heading font-medium text-accent border-b border-accent/30 pb-1 mb-2">Guest Assistance</h4>
              <ul className="space-y-1 text-sm text-body">
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Language assistance</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Feedback & Reviews</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Emergency support</span></li>
                <li className="flex items-start"><span className="material-icons text-interactive mr-1 mt-0.5 text-base">arrow_forward</span><span>Luggage service</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface1;
