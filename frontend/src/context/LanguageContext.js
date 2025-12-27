import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    alerts: 'Alerts',
    report: 'Report',
    myReports: 'My Reports',
    help: 'Help',
    manageReports: 'Reports',
    createAlert: 'Create Alert',
    analytics: 'Analytics',
    users: 'Users',
    logs: 'Logs',
    settings: 'Settings',
    
    // Common
    welcome: 'Welcome',
    back: 'Back',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    viewAll: 'View All',
    logout: 'Logout',
    profile: 'Profile',
    light: 'Light',
    dark: 'Dark',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    stayUpdated: 'Stay updated with the latest from Brgy Korokan',
    reportEmergency: 'Report Emergency',
    clickIfProblem: 'Click if there\'s a problem',
    askForHelp: 'Ask for Help',
    askBarangayBot: 'Ask BarangayBot',
    latestAlerts: 'Latest Alerts',
    noAlerts: 'No alerts yet',
    loadDemoData: 'Load Demo Data',
    myReportsDesc: 'View your submitted reports',
    dashboardOverview: 'Dashboard Overview',
    totalUsers: 'Total Users',
    pending: 'Pending',
    resolved: 'Resolved',
    
    // Reports
    submitReport: 'Submit a Report',
    reportProblem: 'Report a problem to barangay officials',
    whatProblem: 'What is the problem?',
    describeProblem: 'Describe the problem',
    writeDetails: 'Write the full details of the problem here...',
    addDetails: 'Add more details for faster response.',
    whereHappened: 'Where did it happen?',
    locationExample: 'e.g., Zone 3 near basketball court',
    sendReport: 'Send Report',
    sending: 'Sending...',
    reportSuccess: 'Report submitted successfully!',
    selectType: 'Please select a report type',
    enterDescription: 'Please enter a description',
    
    // Report Types
    emergency: 'Emergency',
    emergencyDesc: 'Fire, flood, accident',
    crime: 'Crime',
    crimeDesc: 'Theft, violence',
    infrastructure: 'Infrastructure',
    infrastructureDesc: 'Road damage, lights',
    health: 'Health',
    healthDesc: 'Disease, sanitation',
    flood: 'Flood',
    floodDesc: 'Flooded area',
    other: 'Other',
    otherDesc: 'Other problem',
    
    // Status
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusRejected: 'Rejected',
    
    // Chatbot
    barangayBot: 'BarangayBot',
    aiAssistant: 'AI Assistant',
    chatbotGreeting: "Hello! I'm BarangayBot, your AI assistant for Brgy Korokan. How can I help you?\n\nYou can ask me about:\n• Barangay office hours\n• How to submit emergency reports\n• Types of alerts\n• Barangay services",
    typeMessage: 'Type your message here...',
    officeHours: 'What are the office hours?',
    howToReport: 'How to report emergency?',
    alertTypes: 'What are the alert types?',
    
    // Settings
    settingsTitle: 'Settings',
    settingsDesc: 'Manage your preferences',
    language: 'Language',
    languageDesc: 'Select your preferred language',
    theme: 'Theme',
    themeDesc: 'Choose light or dark mode',
    notifications: 'Notifications',
    notificationsDesc: 'Manage notification preferences',
    enableNotifications: 'Enable notifications',
    
    // Auth
    loginTitle: 'Welcome Back!',
    loginDesc: 'Login to Brgy Korokan BarangayAlert',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    quickLogin: 'Click for quick login:',
    admin: 'Admin',
    official: 'Official',
    resident: 'Resident',
    
    // Alerts Page
    alertsTitle: 'Alerts & Announcements',
    alertsDesc: 'Stay updated with the latest from Brgy Korokan',
    all: 'All',
    advisory: 'Advisory',
    announcement: 'News',
    noAlertsType: 'No alerts',
    postedBy: 'Posted by',
    
    // Analytics
    analyticsTitle: 'Analytics Dashboard',
    analyticsDesc: 'View Brgy Korokan data',
    reportStatus: 'Report Status',
    reportTypes: 'Report Types',
    alertTypeChart: 'Alert Types',
    recentAlerts: 'Recent Alerts',
    usersByRole: 'Users by Role',
    userSummary: 'User Summary',
    residents: 'Residents',
    officials: 'Officials',
    admins: 'Admins',
    activeUsers: 'Active Users',
  },
  tl: {
    // Navigation
    dashboard: 'Dashboard',
    alerts: 'Mga Abiso',
    report: 'Mag-report',
    myReports: 'Aking Reports',
    help: 'Tulong',
    manageReports: 'Mga Report',
    createAlert: 'Gumawa ng Abiso',
    analytics: 'Analytics',
    users: 'Mga User',
    logs: 'System Logs',
    settings: 'Settings',
    
    // Common
    welcome: 'Maligayang pagdating',
    back: 'Bumalik',
    submit: 'Ipadala',
    cancel: 'Kanselahin',
    save: 'I-save',
    loading: 'Naglo-load...',
    viewAll: 'Tingnan Lahat',
    logout: 'Logout',
    profile: 'Profile',
    light: 'Maliwanag',
    dark: 'Madilim',
    
    // Dashboard
    welcomeBack: 'Maligayang pagbabalik',
    stayUpdated: 'Manatiling updated sa mga balita ng Brgy Korokan',
    reportEmergency: 'Mag-report ng Emergency',
    clickIfProblem: 'I-click kung may problema',
    askForHelp: 'Humingi ng Tulong',
    askBarangayBot: 'Magtanong sa BarangayBot',
    latestAlerts: 'Mga Pinakabagong Abiso',
    noAlerts: 'Wala pang mga abiso',
    loadDemoData: 'I-load ang Demo Data',
    myReportsDesc: 'Tingnan ang iyong mga na-submit',
    dashboardOverview: 'Dashboard Overview',
    totalUsers: 'Kabuuang Users',
    pending: 'Naghihintay',
    resolved: 'Tapos Na',
    
    // Reports
    submitReport: 'Mag-report ng Problema',
    reportProblem: 'I-report ang problema sa barangay officials',
    whatProblem: 'Ano ang problema?',
    describeProblem: 'Ilarawan ang problema',
    writeDetails: 'Isulat dito ang buong detalye ng problema...',
    addDetails: 'Maglagay ng maraming detalye para mas mabilis na matulungan ka.',
    whereHappened: 'Saan ito nangyari?',
    locationExample: 'Hal: Zone 3 malapit sa basketball court',
    sendReport: 'Ipadala ang Report',
    sending: 'Ipinapadala...',
    reportSuccess: 'Matagumpay na naipadala ang report!',
    selectType: 'Pumili ng uri ng report',
    enterDescription: 'Ilagay ang detalye ng problema',
    
    // Report Types
    emergency: 'Emergency',
    emergencyDesc: 'Sunog, baha, aksidente',
    crime: 'Krimen',
    crimeDesc: 'Nakawan, away',
    infrastructure: 'Imprastraktura',
    infrastructureDesc: 'Sirang kalsada, ilaw',
    health: 'Kalusugan',
    healthDesc: 'Sakit, sanitation',
    flood: 'Baha',
    floodDesc: 'Bumabahang lugar',
    other: 'Iba Pa',
    otherDesc: 'Ibang problema',
    
    // Status
    statusPending: 'Naghihintay',
    statusInProgress: 'Inaaksyunan',
    statusResolved: 'Tapos Na',
    statusRejected: 'Hindi Natanggap',
    
    // Chatbot
    barangayBot: 'BarangayBot',
    aiAssistant: 'AI Assistant',
    chatbotGreeting: "Magandang araw! Ako si BarangayBot, ang iyong AI assistant para sa Brgy Korokan. Paano kita matutulungan?\n\nMaaari mo akong tanungin tungkol sa:\n• Oras ng barangay office\n• Paano mag-submit ng emergency report\n• Mga uri ng alerts\n• Mga serbisyo ng barangay",
    typeMessage: 'I-type ang iyong tanong dito...',
    officeHours: 'Anong oras bukas ang office?',
    howToReport: 'Paano mag-report ng emergency?',
    alertTypes: 'Ano ang mga uri ng alerts?',
    
    // Settings
    settingsTitle: 'Settings',
    settingsDesc: 'I-manage ang iyong preferences',
    language: 'Wika',
    languageDesc: 'Piliin ang iyong gustong wika',
    theme: 'Theme',
    themeDesc: 'Piliin kung maliwanag o madilim',
    notifications: 'Notifications',
    notificationsDesc: 'I-manage ang notifications',
    enableNotifications: 'I-enable ang notifications',
    
    // Auth
    loginTitle: 'Maligayang Pagbabalik!',
    loginDesc: 'Mag-login sa Brgy Korokan BarangayAlert',
    email: 'Email',
    password: 'Password',
    login: 'Mag-login',
    loggingIn: 'Naglo-login...',
    noAccount: 'Wala ka pang account?',
    registerHere: 'Mag-register dito',
    quickLogin: 'I-click para mabilis na mag-login:',
    admin: 'Admin (Kapitan)',
    official: 'Official (Kagawad)',
    resident: 'Residente',
    
    // Alerts Page
    alertsTitle: 'Mga Abiso at Balita',
    alertsDesc: 'Manatiling updated sa mga balita ng Brgy Korokan',
    all: 'Lahat',
    advisory: 'Advisory',
    announcement: 'Balita',
    noAlertsType: 'Walang abiso',
    postedBy: 'Mula kay',
    
    // Analytics
    analyticsTitle: 'Analytics Dashboard',
    analyticsDesc: 'Tingnan ang mga datos ng Brgy Korokan',
    reportStatus: 'Status ng mga Report',
    reportTypes: 'Uri ng mga Report',
    alertTypeChart: 'Uri ng mga Abiso',
    recentAlerts: 'Mga Kamakailang Abiso',
    usersByRole: 'Mga User ayon sa Role',
    userSummary: 'Buod ng mga User',
    residents: 'Mga Residente',
    officials: 'Mga Opisyal',
    admins: 'Mga Admin',
    activeUsers: 'Active Users',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
