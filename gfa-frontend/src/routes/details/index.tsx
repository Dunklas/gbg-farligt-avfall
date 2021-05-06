import { FunctionalComponent, h } from 'preact';
import { StopsContext } from '../../components/app';
import { useContext } from 'preact/hooks';
import * as style from './style.css';

interface DetailsProps {
  locationId: string;
}

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const Details: FunctionalComponent<DetailsProps> = props => {
  const { locationId } = props;
  const stops = useContext(StopsContext);
  const stop = stops.find(stop => stop.location_id === locationId);
  return (
    <div className={style.main}>
      <div className={style.top}>{stop?.street}</div>
      <div className={style.details}>
        {stop?.description && <p>{capitalizeFirstLetter(stop.description)}.</p>}
      </div>
      <div className={style.instructions}>
        <p>
          To subscribe to e-mail notifications sent when the Göteborg Farligt
          Avfall truck will arrive to this street, enter your e-mail address
          below and hit subscribe.
        </p>
      </div>
      <form>
        <input id="email" type="email" placeholder="someone@somewhere.com" />
        <button>Subscribe!</button>
      </form>
    </div>
  );
};

export default Details;
