import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import App from './views/App';
import Welcome from './views/Welcome';
import Main from './views/Main';

ReactDOM.render(
  <Router history={ browserHistory }>
    <Route path='/' component={ App }>
      <IndexRoute component={ Welcome } />
      <Route path='main' component={ Main } />
    </Route>
  </Router>,
  document.getElementById('app')
);
