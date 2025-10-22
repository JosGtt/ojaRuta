import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AppRoutes from '../routes/AppRoutes';
import ToastNotifications from './ToastNotifications';

const AppLayout = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <ToastNotifications />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default AppLayout;