import React from "react";

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000); // auto close after 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-slide-in">
      {message}
    </div>
  );
};

export default Notification;
