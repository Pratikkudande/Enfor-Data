import React from 'react';
import { Plus, Bell, Calendar, Home, Users, CreditCard } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';

const NotificationDemo: React.FC = () => {
  const { addNotification } = useNotifications();
  const { showToast } = useToast();

  const sampleNotifications = [
    {
      title: 'New Appointment Scheduled',
      message: 'Client Sarah Wilson has scheduled a property viewing for tomorrow at 3:00 PM.',
      type: 'appointment' as const,
      priority: 'high' as const,
      read: false,
      action_url: '/appointments',
      metadata: { client_id: 'client_123', appointment_id: 'apt_456' }
    },
    {
      title: 'Property Inquiry Received',
      message: 'New inquiry for 2BHK Apartment in Andheri East. Client is interested in immediate viewing.',
      type: 'property' as const,
      priority: 'medium' as const,
      read: false,
      action_url: '/properties',
      metadata: { property_id: 'prop_789' }
    },
    {
      title: 'Commission Payment Credited',
      message: 'Your commission of ₹15,000 for the Bandra property sale has been credited to your account.',
      type: 'payment' as const,
      priority: 'high' as const,
      read: false,
      metadata: { amount: 15000 }
    },
    {
      title: 'New Client Added',
      message: 'Rajesh Kumar has been added to your client list. He is looking for a 3BHK apartment in Powai.',
      type: 'client' as const,
      priority: 'medium' as const,
      read: false,
      action_url: '/clients',
      metadata: { client_id: 'client_999' }
    },
    {
      title: 'WhatsApp Campaign Results',
      message: 'Your recent WhatsApp campaign reached 200 clients with 52% open rate. Great engagement!',
      type: 'marketing' as const,
      priority: 'low' as const,
      read: false,
      action_url: '/whatsapp',
    }
  ];

  const addRandomNotification = () => {
    const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
    addNotification(randomNotification);
    
    showToast({
      type: 'success',
      title: 'Notification Added',
      message: 'A new notification has been added to test the system.'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Demo
          </h3>
          <p className="text-sm text-gray-600">Test the notification system with sample notifications</p>
        </div>
        <button
          onClick={addRandomNotification}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Test Notification
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleNotifications.map((notification, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              addNotification(notification);
              showToast({
                type: 'info',
                title: 'Notification Added',
                message: notification.title
              });
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {notification.type === 'appointment' && <Calendar className="w-4 h-4 text-blue-500" />}
                {notification.type === 'property' && <Home className="w-4 h-4 text-green-500" />}
                {notification.type === 'client' && <Users className="w-4 h-4 text-purple-500" />}
                {notification.type === 'payment' && <CreditCard className="w-4 h-4 text-yellow-500" />}
                {notification.type === 'marketing' && <Bell className="w-4 h-4 text-pink-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-xs text-gray-600" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                    notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {notification.priority}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {notification.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How to test:</strong> Click on any notification card above or use the "Add Test Notification" button 
          to add sample notifications. Then check the bell icon in the navbar to see the notification dropdown in action!
        </p>
      </div>
    </div>
  );
};

export default NotificationDemo;