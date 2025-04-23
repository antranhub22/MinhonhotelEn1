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
          
          <div className="flex flex-row flex-wrap justify-center gap-3 text-left mx-auto">
            {/* Comprehensive Hotel Services */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Room & Stay</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">login</span><span>Check-in/check-out - Notification for room status</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">update</span><span>Room extension - Extend your stay duration</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">info</span><span>Room information - Details, amenities, and instructions</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">policy</span><span>Hotel policies - Rules and guidelines</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">wifi</span><span>Wi-Fi & Technical support - Connection and troubleshooting</span></li>
              </ul>
            </div>
            {/* Room Services */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Room Services</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">restaurant</span><span>Food & beverages - Menu and ordering</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">local_bar</span><span>Mini bar service - Refills and billing</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">cleaning_services</span><span>Housekeeping - Requests and scheduling</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">laundry</span><span>Laundry - Pricing and timing</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">alarm</span><span>Wake-up service - Set alarms</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">towels</span><span>Additional amenities - Towels, toiletries...</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">support_agent</span><span>Technical assistance - Repairs and support</span></li>
              </ul>
            </div>
            {/* Bookings & Facilities */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Bookings & Facilities</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">restaurant</span><span>Restaurant reservations - In and outside the hotel</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">spa</span><span>Spa/massage appointments - Services and treatments outside the hotel</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">fitness_center</span><span>Gym facilities - Services outside the hotel</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">pool</span><span>Swimming pool - Opening hours and regulations</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">local_taxi</span><span>Transportation - Taxi and airport shuttle services</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">medical_services</span><span>Medical assistance - Doctor contacts and pharmaceuticals</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">emoji_people</span><span>Special assistance - Personalized requests</span></li>
              </ul>
            </div>
            {/* Tourism & Exploration */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Tourism & Exploration</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">explore</span><span>Nearby attractions - Locations and reviews</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">restaurant</span><span>Local restaurants - Recommendations and reservations</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">directions_bus</span><span>Public transportation - Schedules and tickets</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">directions_car</span><span>Car rental - Bookings and suggestions</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">cloud</span><span>Weather & Events - Forecasts and event calendars</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">shopping_bag</span><span>Shopping - Malls and specialty stores</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">tour</span><span>Tours - Tour bookings and information</span></li>
              </ul>
            </div>
            {/* Support */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Support</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">translate</span><span>Language assistance - Translation and support</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">feedback</span><span>Feedback & Reviews - Suggestions and comments</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">warning</span><span>Emergency support - 24/7 contact</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">luggage</span><span>Luggage service - Storage and transport</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface1;
