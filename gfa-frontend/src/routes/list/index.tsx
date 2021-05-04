import { FunctionalComponent, h } from 'preact';
import { StopListItem } from '../../components/stop-list-item';
import { StopsContext } from '../../components/app';
import * as style from './style.css';
import { useContext } from 'preact/hooks';

const List: FunctionalComponent<{}> = () => {
  const stops = useContext(StopsContext);

  return (
    <div className={style.main}>
      <div className={style.intro}>Some kind of menu here</div>
      <div className={style.list}>
        {stops.map(stop => (
          <StopListItem stop={stop} key={stop.location_id} />
        ))}
      </div>
    </div>
  );
};

export default List;
