import { FunctionalComponent, h } from 'preact';
import * as style from './style.css';
import { useState } from 'preact/hooks';
import { Stop } from '../../types/Stop';
import { Modal } from '../../components/modal';

interface SubscribeModalProps {
  stop: Stop;
  onClose: () => void;
}
export const SubscribeModal: FunctionalComponent<SubscribeModalProps> = props => {
  const [email, setEmail] = useState<string | null>(null);
  if (!props.stop) {
    return <div></div>;
  }
  return (
    <Modal isOpen={true} onClickBackdrop={props.onClose}>
      <div className={style.modal}>
        <p>
          You&apos;re about to subscribe to e-mail notifications for{' '}
          <strong>{props.stop.street}</strong>.
        </p>
        <p>
          By subscribing you consent to that we will store your e-mail address
          and yada yada
        </p>
        <form className={style.form}>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="E.g. example@email.com"
            required
          />
          <button
            onClick={() => {
              console.log('Submit!');
            }}
          >
            Subscribe!
          </button>
        </form>
      </div>
    </Modal>
  );
};
