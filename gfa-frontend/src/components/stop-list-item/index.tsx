import { h, FunctionalComponent } from 'preact';
import { route } from 'preact-router';
import { Stop } from '../../types/Stop';
import * as style from './style.css';

interface StopListItemProps {
  stop: Stop;
}

export const StopListItem: FunctionalComponent<StopListItemProps> = ({
  stop
}) => {
  return (
    <div className={style.stop}>
      <div className={style.title}>
        <span
          onClick={() => {
            route(`/stop/${stop.location_id}`);
          }}
        >
          {stop.street}
        </span>
      </div>
      <div className={style.subtitle}>{stop.district}</div>
    </div>
  );
};
