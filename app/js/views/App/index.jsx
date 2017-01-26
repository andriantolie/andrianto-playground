import React, { Component } from 'react';

class App extends Component {
  render() {
    const { children } = this.props;
    return (
      <div className='App'>
        <div>HEADER</div>
        <div>------------------------</div>
        { children }
        <div>------------------------</div>
        <div>FOOTER</div>
      </div>
    );
  }
}

export default App;
