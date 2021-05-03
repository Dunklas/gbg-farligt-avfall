import { FunctionalComponent, h } from 'preact';
import { StopsContext } from '../../components/app';
import { useContext } from 'preact/hooks';

interface DetailsProps {
  locationId: string;
}

const Details: FunctionalComponent<DetailsProps> = props => {
  const { locationId } = props;
  const stops = useContext(StopsContext);
  const stop = stops.find(stop => stop.location_id === locationId);
  return (
    <div>
      <h1>{stop?.street}</h1>
      <h2>{stop?.district}</h2>
      <h3>{stop?.description}</h3>
    </div>
  );
};

export default Details;
