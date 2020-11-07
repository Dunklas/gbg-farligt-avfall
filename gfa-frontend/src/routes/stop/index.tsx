import { FunctionalComponent, h } from 'preact';
import { useContext } from 'preact/hooks';
import { StopsContext } from '../../components/app';
import { Stop as StopType } from '../../types/Stop';

interface StopProps {
  id: string;
}

const Stop: FunctionalComponent<StopProps> = ({ id }) => {
  const stops = useContext(StopsContext);
  const stop = stops.filter(stop => stop.location_id === id)[0];
  return (
    <div>
      <div>{stop.street}</div>
      <div>{stop.district}</div>
    </div>
  );
};

export default Stop;
