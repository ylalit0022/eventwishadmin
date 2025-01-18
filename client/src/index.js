import React from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BrowserRouter as Router, 
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  UNSAFE_NavigationContext,
  UNSAFE_LocationContext,
  UNSAFE_RouteContext 
} from 'react-router-dom';
import App from './App';
import 'antd/dist/reset.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router future={{ v7_startTransition: true }}>
      <App />
    </Router>
  </React.StrictMode>
);
