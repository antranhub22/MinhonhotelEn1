import React from 'react';
import { useAssistant } from '@/context/AssistantContext';
import hotelImage from '../assets/hotel-exterior.jpeg';

interface Interface1Props {
  isActive: boolean;
}

const Interface1: React.FC<Interface1Props> = ({ isActive }) => {
  const { startCall } = useAssistant();
  
  return (
    <div 
      className={`absolute w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-10`} 
      id="interface1"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url(${hotelImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto h-full flex flex-col items-center justify-start text-white p-5 pt-10 md:pt-16 overflow-y-auto">
        <h2 className="font-poppins font-bold text-3xl md:text-4xl text-amber-400 mb-2 text-center">Mi Nhon Hotel Mui Ne</h2>
        <p className="text-lg md:text-xl text-center max-w-lg mb-8">AI-powered Voice Assistant - Supporting All Your Needs</p>
        
        {/* Main Call Button */}
        <div className="relative mb-12">
          {/* Ripple Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-[ripple_1.5s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/70 animate-[ripple_2s_linear_infinite]"></div>
          
          {/* Main Button */}
          <button 
            id="vapiButton" 
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-primary-dark font-poppins font-bold flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300" 
            onClick={startCall}
          >
            <span className="material-icons text-4xl md:text-5xl mb-1">mic</span>
            <span className="text-sm md:text-base font-medium">Press to Call</span>
          </button>
        </div>
        
        <div className="text-center w-full max-w-5xl">
          <h3 className="font-poppins font-semibold text-xl mb-4">Available Services:</h3>
          
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm max-w-3xl mx-auto">
            <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-2 mb-4 text-lg">Available Services</h4>
            <div className="space-y-4 text-sm text-white">
              <div>
                <p className="font-semibold mb-1">Room & Stay</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check-in/check-out - Notification for room status</li>
                  <li>Room extension - Extend your stay duration</li>
                  <li>Room information - Details, amenities, and instructions</li>
                  <li>Hotel policies - Rules and guidelines</li>
                  <li>Wi-Fi & Technical support - Connection and troubleshooting</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Room Services</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Food & beverages - Menu and ordering</li>
                  <li>Mini bar service - Refills and billing</li>
                  <li>Housekeeping - Requests and scheduling</li>
                  <li>Laundry - Pricing and timing</li>
                  <li>Wake-up service - Set alarms</li>
                  <li>Additional amenities - Towels, toiletries...</li>
                  <li>Technical assistance - Repairs and support</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Bookings & Facilities</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Restaurant reservations - In and outside the hotel</li>
                  <li>Spa/massage appointments - Services and treatments outside the hotel</li>
                  <li>Gym facilities - Services outside the hotel</li>
                  <li>Swimming pool - Opening hours and regulations</li>
                  <li>Transportation - Taxi and airport shuttle services</li>
                  <li>Medical assistance - Doctor contacts and pharmaceuticals</li>
                  <li>Special assistance - Personalized requests</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Tourism & Exploration</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nearby attractions - Locations and reviews</li>
                  <li>Local restaurants - Recommendations and reservations</li>
                  <li>Public transportation - Schedules and tickets</li>
                  <li>Car rental - Bookings and suggestions</li>
                  <li>Weather & Events - Forecasts and event calendars</li>
                  <li>Shopping - Malls and specialty stores</li>
                  <li>Tours - Tour bookings and information</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Support</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Language assistance - Translation and support</li>
                  <li>Feedback & Reviews - Suggestions and comments</li>
                  <li>Emergency support - 24/7 contact</li>
                  <li>Luggage service - Storage and transport</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface1;
