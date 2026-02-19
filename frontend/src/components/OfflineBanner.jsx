// Offline banner to communicate connectivity status.
import useOnlineStatus from '../hooks/useOnlineStatus';

const OfflineBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return <div className="offline">You are offline. Showing cached content.</div>;
};

export default OfflineBanner;