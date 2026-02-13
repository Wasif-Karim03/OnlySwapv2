import React, { useState, useCallback } from 'react';
import { CustomAlert } from '@/components/CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

// Global alert state
let alertState: {
  showAlert: (options: AlertOptions) => void;
} | null = null;

// Alert Provider Component
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert({
      ...options,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  // Register global alert function
  React.useEffect(() => {
    alertState = { showAlert };
    return () => {
      alertState = null;
    };
  }, [showAlert]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    hideAlert();
  };

  return (
    <>
      {children}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons?.map((button) => ({
          ...button,
          onPress: () => handleButtonPress(button),
        })) || [{ text: 'OK', onPress: hideAlert }]}
        onDismiss={hideAlert}
        type={alert.type}
      />
    </>
  );
};

// Global alert function (similar to Alert.alert)
export const showAlert = (title: string, message?: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => {
  if (alertState) {
    alertState.showAlert({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type,
    });
  } else {
    // Fallback to console if AlertProvider is not mounted
    console.warn('Alert not available. Make sure AlertProvider is mounted.');
    console.log(`[${type?.toUpperCase() || 'INFO'}] ${title}: ${message || ''}`);
  }
};

// Convenience functions
export const showSuccess = (title: string, message?: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'success');
};

export const showError = (title: string, message?: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'error');
};

export const showWarning = (title: string, message?: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'warning');
};

export const showInfo = (title: string, message?: string, buttons?: AlertButton[]) => {
  showAlert(title, message, buttons, 'info');
};




