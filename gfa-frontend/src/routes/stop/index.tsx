import { FunctionalComponent, h } from 'preact';

interface StopProps {
  id: string;
}

const Stop: FunctionalComponent<StopProps> = ({ id }) => {
  return <div>{id}</div>;
};

export default Stop;
