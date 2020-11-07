import { FunctionalComponent, h } from 'preact';
import { Route, Router } from 'preact-router';
import List from '../routes/list';
import Stop from '../routes/stop';

const App: FunctionalComponent<{}> = () => {
  return (
    <div id="app">
      <Router>
        <Route path="/stop/:id" component={Stop} />
        <Route path="/" default component={List} />
      </Router>
    </div>
  );
};

export default App;
