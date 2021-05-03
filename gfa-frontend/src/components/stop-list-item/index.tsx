import { h, FunctionalComponent } from 'preact';
import { route } from 'preact-router';
import { Stop } from '../../types/Stop';
import * as style from './style.css';

interface StopListItemProps {
  stop: Stop;
}

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const StopListItem: FunctionalComponent<StopListItemProps> = ({
  stop
}) => {
  return (
    <div
      className={style.stop}
      onClick={() => route(`/details/${stop.location_id}`)}
    >
      <div className={style.primary}>
        <h1>{stop.street}</h1>
        <p>{stop.description && capitalizeFirstLetter(stop.description)}</p>
      </div>
      <div className={style.meta}>
        <div>{stop.district}</div>
      </div>
    </div>
  );
};
