// Custom Add to Home Screen prompt handling.
import { useEffect, useState } from 'react';

const InstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="install-banner">
      <div>
        <strong>Add to Home Screen</strong>
        <div>Install the app for faster access and offline support.</div>
      </div>
      <button onClick={handleInstall}>Install</button>
    </div>
  );
};

export default InstallPrompt;